import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("Missing stripe-signature header");

    // Deno: raw body required for signature verification
    const rawBody = await req.text();

    const event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const consultationId = (session.metadata?.consultation_id || "") as string;

      if (consultationId) {
        logStep("checkout.session.completed", { consultationId, sessionId: session.id });

        // mark payment row paid
        await supabaseAdmin
          .from("consultation_payments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("consultation_id", consultationId);

        // atomically confirm booking + assign doctor
        const { error } = await supabaseAdmin.rpc("confirm_paid_consultation", {
          _consultation_id: consultationId,
        });

        if (error) {
          logStep("confirm_paid_consultation failed", { consultationId, error: error.message });
          // Keep webhook 200 to avoid Stripe retries storm; investigation via logs.
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
});
