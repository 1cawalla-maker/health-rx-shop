import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-SHOPIFY-CART] ${step}${detailsStr}`);
};

function maybeRewriteCheckoutUrl(checkoutUrl: string) {
  const checkoutDomain = (Deno.env.get("SHOPIFY_CHECKOUT_DOMAIN") ?? "").trim();
  if (!checkoutDomain) return checkoutUrl;

  const url = new URL(checkoutUrl);
  url.hostname = checkoutDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return url.toString();
}

type LineItemInput = {
  /** Shopify Storefront GraphQL expects ProductVariant GID (gid://shopify/ProductVariant/...) */
  merchandiseId: string;
  quantity: number;
  /** Strength in mg (provided by frontend from local catalog / mapping) */
  strengthMg?: number;
};

async function shopifyStorefrontFetch<T>(query: string, variables: Record<string, unknown>) {
  const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
  const token = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");

  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");

  // Token is optional: Shopify Storefront API supports tokenless access for core features.
  // We only include the header when a token is provided.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["X-Shopify-Storefront-Access-Token"] = token;

  const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Shopify Storefront API HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json.errors?.length) {
    throw new Error(`Shopify Storefront API errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // We use service role for DB writes (order intent storage) and to avoid RLS headaches.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Verify user via Supabase auth
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const lineItems: LineItemInput[] = body?.lineItems;

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error("lineItems is required");
    }

    for (const li of lineItems) {
      if (!li?.merchandiseId || typeof li.merchandiseId !== "string") {
        throw new Error("Each lineItem must include merchandiseId (Shopify ProductVariant GID)");
      }
      if (!Number.isInteger(li.quantity) || li.quantity <= 0) {
        throw new Error("Each lineItem must include a positive integer quantity");
      }
    }

    // 1) Prescription gate: uploaded/OCR-created prescriptions are the shop entitlement source.
    // There is no usage-time expiry enforcement for MVP ordering; the doctor controls if/when
    // a new prescription/refill is issued. PouchCare only enforces the total cans allowed by
    // the prescription it has been given.
    const { data: uploadedPrescriptions, error: uploadedErr } = await supabase
      .from("prescriptions")
      .select("id, allowed_strength_max, max_units_per_order, max_units_per_month, total_units_allowed, status")
      .eq("patient_id", user.id)
      .eq("prescription_type", "uploaded")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (uploadedErr) throw new Error(`Failed to read prescriptions: ${uploadedErr.message}`);

    const activeUploaded = (uploadedPrescriptions ?? []).filter((r: any) => {
      const maxStrength = Number(r.allowed_strength_max ?? 0);
      const totalAllowed = Number(r.total_units_allowed ?? r.max_units_per_month ?? r.max_units_per_order ?? 0);
      return Number.isFinite(maxStrength) && maxStrength > 0 && Number.isFinite(totalAllowed) && totalAllowed > 0;
    });

    const entitlementSource = activeUploaded[0] ?? null;
    const allowedMaxStrength = entitlementSource ? Number(entitlementSource.allowed_strength_max ?? 0) : 0;
    const prescriptionId = entitlementSource ? String(entitlementSource.id) : null;
    const maxUnitsPerOrder = entitlementSource ? Number(entitlementSource.max_units_per_order ?? 0) : 0;
    const totalUnitsAllowed = entitlementSource ? Number(entitlementSource.total_units_allowed ?? 0) : 0;

    if (!Number.isFinite(allowedMaxStrength) || allowedMaxStrength <= 0) {
      return new Response(JSON.stringify({ error: "PRESCRIPTION_REQUIRED" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // 2) Validate strength per item.
    // Backend derives strength from Shopify variant data. The frontend may send
    // strengthMg for display/convenience, but it is not trusted for gating.
    const variantQuery = `
      query Variants($ids: [ID!]!) {
        nodes(ids: $ids) {
          __typename
          ... on ProductVariant {
            id
            title
            selectedOptions { name value }
          }
        }
      }
    `;

    const ids = lineItems.map((li) => li.merchandiseId);
    const variantData = await shopifyStorefrontFetch<{ nodes: Array<any> }>(variantQuery, { ids });
    const strengthById = new Map<string, number>();

    const nodes: any[] = variantData.nodes ?? [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const requestedId = ids[i];
      if (node?.__typename !== "ProductVariant" || !node?.id) continue;

      const rawOptions = (node?.selectedOptions ?? [])
        .map((o: any) => `${o?.name ?? ""}: ${o?.value ?? ""}`)
        .join(" | ");

      const raw = [
        rawOptions,
        node?.title,
      ].filter(Boolean).join(" | ");

      const parsed = Number(raw.match(/(\d+)\s*mg/i)?.[1] ?? NaN);

      if (Number.isFinite(parsed) && parsed > 0) {
        if (requestedId) strengthById.set(requestedId, parsed);
        strengthById.set(node.id, parsed);
      }
    }

    for (const li of lineItems) {
      const mg = strengthById.get(li.merchandiseId);

      if (!mg || !Number.isFinite(mg)) {
        throw new Error(
          `Unable to determine strength for variant ${li.merchandiseId}. Ensure Shopify variant option/title/metafield contains values like "3mg", "6mg", or "9mg".`,
        );
      }

      if (mg > allowedMaxStrength) {
        return new Response(JSON.stringify({
          error: "STRENGTH_NOT_ALLOWED",
          allowedMaxStrengthMg: allowedMaxStrength,
          requestedStrengthMg: mg,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    // 3) Quantity check from active entitlement.
    // Rule: total cans allowed is lifetime-per-prescription. No monthly, rolling,
    // calendar, refill-timing, or usage-time expiry logic is enforced by PouchCare.
    const requestedCans = lineItems.reduce((sum, li) => sum + li.quantity, 0);
    if (requestedCans <= 0) throw new Error("Requested quantity must be > 0");

    const prescriptionQuantityCap = Number.isFinite(totalUnitsAllowed) && totalUnitsAllowed > 0
      ? totalUnitsAllowed
      : (Number.isFinite(maxUnitsPerOrder) && maxUnitsPerOrder > 0 ? maxUnitsPerOrder : 0);

    if (prescriptionQuantityCap <= 0) {
      return new Response(JSON.stringify({ error: "PRESCRIPTION_QUANTITY_REQUIRED" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    let alreadyPurchasedForPrescription = 0;
    if (prescriptionId) {
      const { data: paidOrders, error: paidErr } = await supabase
        .from("shopify_orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("prescription_id", prescriptionId)
        .eq("financial_status", "paid");

      if (paidErr) throw new Error(`Failed to read shopify_orders: ${paidErr.message}`);

      const paidOrderIds = (paidOrders ?? []).map((o: any) => o.id);
      if (paidOrderIds.length > 0) {
        const { data: items, error: itemsErr } = await supabase
          .from("shopify_order_items")
          .select("quantity")
          .in("shopify_order_id", paidOrderIds);

        if (itemsErr) throw new Error(`Failed to read shopify_order_items: ${itemsErr.message}`);
        alreadyPurchasedForPrescription = (items ?? []).reduce((sum: number, it: any) => sum + Number(it.quantity ?? 0), 0);
      }
    }

    if (alreadyPurchasedForPrescription + requestedCans > prescriptionQuantityCap) {
      return new Response(JSON.stringify({
        error: "ALLOWANCE_EXCEEDED",
        prescriptionId,
        capCans: prescriptionQuantityCap,
        alreadyPurchasedCans: alreadyPurchasedForPrescription,
        requestedCans,
        remainingCans: Math.max(0, prescriptionQuantityCap - alreadyPurchasedForPrescription),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // 4) Create Shopify cart
    const cartCreateMutation = `
      mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors { field message }
        }
      }
    `;

    const cartInput = {
      lines: lineItems.map((li) => ({ merchandiseId: li.merchandiseId, quantity: li.quantity })),
      attributes: [
        { key: "supabase_user_id", value: user.id },
        ...(prescriptionId ? [{ key: "prescription_id", value: prescriptionId }] : []),
        { key: "created_by", value: "supabase_edge_function" },
      ],
    };

    const cartData = await shopifyStorefrontFetch<any>(cartCreateMutation, { input: cartInput });
    const userErrors = cartData?.cartCreate?.userErrors ?? [];
    if (userErrors.length) {
      throw new Error(`Shopify cartCreate userErrors: ${JSON.stringify(userErrors)}`);
    }

    const cart = cartData?.cartCreate?.cart;
    if (!cart?.id || !cart?.checkoutUrl) throw new Error("Shopify cartCreate did not return cart id/checkoutUrl");

    logStep("Cart created", { cartId: cart.id });

    return new Response(JSON.stringify({ checkoutUrl: maybeRewriteCheckoutUrl(cart.checkoutUrl), cartId: cart.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
