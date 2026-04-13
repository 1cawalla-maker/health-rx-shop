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
};

async function shopifyStorefrontFetch<T>(query: string, variables: Record<string, unknown>) {
  const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
  const token = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");

  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  if (!token) throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set");

  const res = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
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

    // 2) Validate strength per variant via variant metafield nicopatch.strength_mg
    const variantStrengthQuery = `
      query VariantStrength($ids: [ID!]!) {
        nodes(ids: $ids) {
          __typename
          ... on ProductVariant {
            id
            metafield(namespace: "nicopatch", key: "strength_mg") { value }
          }
        }
      }
    `;

    const ids = lineItems.map((li) => li.merchandiseId);
    const strengthData = await shopifyStorefrontFetch<{ nodes: Array<any> }>(variantStrengthQuery, { ids });

    const strengthById = new Map<string, number>();
    for (const node of strengthData.nodes ?? []) {
      if (node?.__typename !== "ProductVariant" || !node?.id) continue;
      const mg = node?.metafield?.value ? Number(node.metafield.value) : NaN;
      strengthById.set(node.id, mg);
    }

    for (const li of lineItems) {
      const mg = strengthById.get(li.merchandiseId);
      if (!mg || !Number.isFinite(mg)) {
        throw new Error(
          `Missing/invalid nicopatch.strength_mg metafield for variant ${li.merchandiseId}. Ensure the metafield is set on every variant.`,
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
