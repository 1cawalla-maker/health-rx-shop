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

    // 1) Prescription gate: must have at least one issued prescription
    const { data: issued, error: issuedErr } = await supabase
      .from("issued_prescriptions")
      .select("max_strength_mg")
      .eq("patient_id", user.id);

    if (issuedErr) throw new Error(`Failed to read issued_prescriptions: ${issuedErr.message}`);

    if (!issued || issued.length === 0) {
      return new Response(JSON.stringify({ error: "PRESCRIPTION_REQUIRED" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const allowedMaxStrength = Math.max(...issued.map((r: any) => r.max_strength_mg ?? 0));
    if (!Number.isFinite(allowedMaxStrength) || allowedMaxStrength <= 0) {
      throw new Error("Invalid allowed max strength derived from issued_prescriptions");
    }

    // 2) Validate strength per item.
    // Primary path: frontend supplies strengthMg (derived from our local catalog / variant mapping).
    // Fallback path (optional): if strengthMg is missing, attempt Shopify lookup.

    const needsShopifyLookup = lineItems.some((li) => !Number.isFinite(Number(li.strengthMg)));

    let strengthById: Map<string, number> | null = null;
    if (needsShopifyLookup) {
      // Best-case: read metafield nicopatch.strength_mg (requires token-based Storefront API access).
      // Fallback (tokenless): parse mg from the variant selected option value (e.g. "3mg").
      const variantQuery = `
        query Variants($ids: [ID!]!) {
          nodes(ids: $ids) {
            __typename
            ... on ProductVariant {
              id
              title
              selectedOptions { name value }
              metafield(namespace: "nicopatch", key: "strength_mg") { value }
            }
          }
        }
      `;

      const ids = lineItems.map((li) => li.merchandiseId);
      const variantData = await shopifyStorefrontFetch<{ nodes: Array<any> }>(variantQuery, { ids });

      strengthById = new Map<string, number>();

      // Note: Shopify Storefront GraphQL may return `node.id` in a different encoding than the input IDs.
      // To avoid mismatches, we store strength by BOTH the returned node.id and the requested id we sent.
      const nodes: any[] = variantData.nodes ?? [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const requestedId = ids[i];

        if (node?.__typename !== "ProductVariant" || !node?.id) continue;

        const setStrength = (mg: number) => {
          if (requestedId) strengthById!.set(requestedId, mg);
          strengthById!.set(node.id, mg);
        };

        // Prefer metafield if present
        const meta = node?.metafield?.value ? Number(node.metafield.value) : NaN;
        if (Number.isFinite(meta) && meta > 0) {
          setStrength(meta);
          continue;
        }

        // Fallback: find Strength option, else parse from title
        const strengthOpt = (node?.selectedOptions ?? []).find((o: any) =>
          String(o?.name ?? "").toLowerCase() === "strength"
        );
        const raw = String(strengthOpt?.value ?? node?.title ?? "");
        const m = raw.match(/(\d+)\s*mg/i);
        const parsed = m ? Number(m[1]) : NaN;
        setStrength(parsed);
      }
    }

    for (const li of lineItems) {
      const provided = Number(li.strengthMg);
      const mg = Number.isFinite(provided) ? provided : strengthById?.get(li.merchandiseId);

      if (!mg || !Number.isFinite(mg)) {
        throw new Error(
          `Unable to determine strength for variant ${li.merchandiseId}. Provide strengthMg or set nicopatch.strength_mg / Strength option values like "3mg".`,
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

    // 3) Allowance check: 60-can cap across PAID orders + current cart request
    const requestedCans = lineItems.reduce((sum, li) => sum + li.quantity, 0);
    if (requestedCans <= 0) throw new Error("Requested quantity must be > 0");

    const { data: paidOrders, error: paidErr } = await supabase
      .from("shopify_orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("financial_status", "paid");

    if (paidErr) throw new Error(`Failed to read shopify_orders: ${paidErr.message}`);

    const paidOrderIds = (paidOrders ?? []).map((o: any) => o.id);

    let alreadyPurchased = 0;
    if (paidOrderIds.length > 0) {
      const { data: items, error: itemsErr } = await supabase
        .from("shopify_order_items")
        .select("quantity")
        .in("shopify_order_id", paidOrderIds);

      if (itemsErr) throw new Error(`Failed to read shopify_order_items: ${itemsErr.message}`);
      alreadyPurchased = (items ?? []).reduce((sum: number, it: any) => sum + (it.quantity ?? 0), 0);
    }

    const cap = 60;
    if (alreadyPurchased + requestedCans > cap) {
      return new Response(JSON.stringify({
        error: "ALLOWANCE_EXCEEDED",
        capCans: cap,
        alreadyPurchasedCans: alreadyPurchased,
        requestedCans,
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

    return new Response(JSON.stringify({ checkoutUrl: cart.checkoutUrl, cartId: cart.id }), {
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
