import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAYOUT-CONSULTATION] ${step}${detailsStr}`);
};

// This function is intended to be called with SERVICE_ROLE (or via an internal admin UI)
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { consultationId, amountCents } = await req.json();
    if (!consultationId) throw new Error("Missing consultationId");
    if (!amountCents || amountCents <= 0 || amountCents > 100000) throw new Error("Invalid amountCents");

    // Load consultation -> doctor
    const { data: consultation, error: cErr } = await supabaseAdmin
      .from("consultations")
      .select("id, doctor_id, status")
      .eq("id", consultationId)
      .single();
    if (cErr || !consultation) throw new Error("Consultation not found");
    if (!consultation.doctor_id) throw new Error("Consultation has no assigned doctor");

    // Load doctor's connected account
    const { data: acct, error: aErr } = await supabaseAdmin
      .from("doctor_stripe_accounts")
      .select("stripe_account_id")
      .eq("doctor_id", consultation.doctor_id)
      .single();

    if (aErr || !acct?.stripe_account_id) throw new Error("Doctor Stripe account not found");

    // Create payout row (idempotent on consultation_id)
    const { data: payoutRow, error: pErr } = await supabaseAdmin
      .from("doctor_payouts")
      .upsert(
        {
          consultation_id: consultationId,
          doctor_id: consultation.doctor_id,
          amount_cents: amountCents,
          currency: "aud",
          status: "pending",
        },
        { onConflict: "consultation_id" },
      )
      .select("id")
      .single();

    if (pErr) throw new Error(pErr.message);

    // Transfer (platform balance -> connected account)
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: "aud",
      destination: acct.stripe_account_id,
      metadata: { consultation_id: consultationId, doctor_id: consultation.doctor_id, doctor_payout_id: payoutRow.id },
    });

    await supabaseAdmin
      .from("doctor_payouts")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id,
      })
      .eq("consultation_id", consultationId);

    logStep("Payout complete", { consultationId, transferId: transfer.id });

    return new Response(JSON.stringify({ success: true, transferId: transfer.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
