import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SHOPIFY-PAID-WEBHOOK] ${step}${detailsStr}`);
};

async function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyShopifyHmac(rawBody: string, providedHmacBase64: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return timingSafeEqual(new TextEncoder().encode(computed), new TextEncoder().encode(providedHmacBase64));
}

function extractNoteAttribute(order: any, key: string): string | null {
  // Shopify order payloads commonly use note_attributes: [{name,value}] or [{key,value}]
  const attrs = order?.note_attributes;
  if (!Array.isArray(attrs)) return null;
  for (const a of attrs) {
    const k = a?.name ?? a?.key;
    if (k === key) return a?.value ?? null;
  }
  return null;
}

serve(async (req) => {
  // Shopify sends POST webhooks.
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
  if (!secret) return new Response("Missing SHOPIFY_WEBHOOK_SECRET", { status: 500 });

  const hmac = req.headers.get("x-shopify-hmac-sha256");
  if (!hmac) return new Response("Missing HMAC", { status: 401 });

  const rawBody = await req.text();
  const ok = await verifyShopifyHmac(rawBody, hmac, secret);
  if (!ok) return new Response("Invalid HMAC", { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const order = JSON.parse(rawBody);

    const supabaseUserId = extractNoteAttribute(order, "supabase_user_id");
    if (!supabaseUserId) {
      // We can't map the order — still 200 so Shopify doesn't spam retries.
      logStep("No supabase_user_id attribute found; ignoring", { orderId: order?.id, name: order?.name });
      return new Response("OK", { status: 200 });
    }

    const shopifyOrderId = Number(order?.id);
    if (!shopifyOrderId) throw new Error("Invalid Shopify order id");

    const financialStatus = order?.financial_status ?? null;

    logStep("Webhook received", { shopifyOrderId, financialStatus, supabaseUserId });

    // Upsert order
    const { data: upserted, error: upsertErr } = await supabase
      .from("shopify_orders")
      .upsert({
        user_id: supabaseUserId,
        shopify_order_id: shopifyOrderId,
        shopify_order_gid: order?.admin_graphql_api_id ?? null,
        order_name: order?.name ?? null,
        currency: order?.currency ?? null,
        total_price: order?.total_price ? Number(order.total_price) : null,
        subtotal_price: order?.subtotal_price ? Number(order.subtotal_price) : null,
        total_tax: order?.total_tax ? Number(order.total_tax) : null,
        financial_status: financialStatus,
        fulfillment_status: order?.fulfillment_status ?? null,
        processed_at: order?.processed_at ?? null,
        raw: order,
      }, { onConflict: "shopify_order_id" })
      .select("id")
      .single();

    if (upsertErr) throw new Error(`Failed to upsert shopify_orders: ${upsertErr.message}`);

    const internalOrderId = upserted.id;

    // Replace items (simple approach; order updates are rare for MVP)
    await supabase.from("shopify_order_items").delete().eq("shopify_order_id", internalOrderId);

    const lineItems = order?.line_items;
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      const rows = lineItems.map((li: any) => ({
        shopify_order_id: internalOrderId,
        shopify_variant_id: li?.variant_id ?? null,
        shopify_variant_gid: li?.admin_graphql_api_id ?? null,
        title: li?.title ?? null,
        variant_title: li?.variant_title ?? null,
        quantity: Number(li?.quantity ?? 0),
        strength_mg: null,
        raw: li,
      })).filter((r: any) => Number.isFinite(r.quantity) && r.quantity > 0);

      const { error: itemsErr } = await supabase.from("shopify_order_items").insert(rows);
      if (itemsErr) throw new Error(`Failed to insert shopify_order_items: ${itemsErr.message}`);
    }

    logStep("Order synced", { internalOrderId });

    // If paid, generate supplier/border pack-in prescription PDF (best-effort).
    if ((financialStatus || "").toLowerCase() === "paid") {
      try {
        const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-order-packin-prescription-pdf`;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ internalOrderId }),
        });
        const txt = await res.text();
        logStep("PDF generation triggered", { status: res.status, body: txt.slice(0, 500) });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logStep("PDF generation failed (non-fatal)", { msg });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });

    // For webhooks, returning 200 prevents retries loops for non-transient issues.
    return new Response("OK", { status: 200 });
  }
});
