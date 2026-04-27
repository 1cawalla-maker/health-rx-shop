import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAYOUT-WEEKLY-DOCTORS] ${step}${detailsStr}`);
};

type ResultRow = {
  consultation_id: string;
  amount_cents: number;
  currency: string;
  paid_at: string | null;
  consultations?: { doctor_id: string | null; status: string | null } | null;
};

// This function is intended to be called with SERVICE_ROLE (or via Supabase Scheduled Jobs)
// It pays doctors for consultations that are:
// - payment marked paid
// - consultation status in ('completed','no_answer')
// - not already paid in doctor_payouts
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Optional shared-secret auth (recommended when Verify JWT is OFF)
  const expectedSecret = Deno.env.get("PAYOUT_CRON_SECRET");
  if (expectedSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== expectedSecret) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const now = new Date();
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Optional override via body for backfills/testing.
    let body: any = null;
    try { body = await req.json(); } catch { body = null; }

    const windowStart = body?.windowStart ? new Date(body.windowStart) : start;
    const windowEnd = body?.windowEnd ? new Date(body.windowEnd) : now;

    logStep("Start", { windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString() });

    // Pull paid payments in the window, with embedded consultation doctor/status when relationship exists.
    const { data: payments, error: payErr } = await supabaseAdmin
      .from("consultation_payments")
      .select("consultation_id, amount_cents, currency, paid_at, consultations:consultation_id ( doctor_id, status )")
      .eq("status", "paid")
      .gte("paid_at", windowStart.toISOString())
      .lt("paid_at", windowEnd.toISOString());

    if (payErr) throw new Error(payErr.message);

    const rows = (payments ?? []) as ResultRow[];

    let attempted = 0;
    let paid = 0;
    let skipped = 0;
    let failed = 0;

    for (const r of rows) {
      const consultationId = r.consultation_id;
      const amountCents = r.amount_cents;
      const currency = (r.currency || "aud").toLowerCase();

      const consult = r.consultations;
      const doctorId = consult?.doctor_id ?? null;
      const status = consult?.status ?? null;

      // Defensive: only billable statuses
      const billable = status === "completed" || status === "no_answer";
      if (!doctorId || !billable) {
        skipped++;
        continue;
      }

      // Idempotency: already paid => skip
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("doctor_payouts")
        .select("id, status, stripe_transfer_id")
        .eq("consultation_id", consultationId)
        .maybeSingle();
      if (exErr) throw new Error(exErr.message);
      if (existing?.status === "paid") {
        skipped++;
        continue;
      }

      attempted++;

      // Connected account must exist
      const { data: acct, error: aErr } = await supabaseAdmin
        .from("doctor_stripe_accounts")
        .select("stripe_account_id, payouts_enabled")
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (aErr) throw new Error(aErr.message);
      if (!acct?.stripe_account_id || acct.payouts_enabled !== true) {
        // Ensure a payout row exists so it's visible for ops to fix.
        await supabaseAdmin
          .from("doctor_payouts")
          .upsert(
            {
              consultation_id: consultationId,
              doctor_id: doctorId,
              amount_cents: amountCents,
              currency,
              status: "failed",
            },
            { onConflict: "consultation_id" },
          );
        failed++;
        logStep("Skip/failed (no payouts-enabled Stripe account)", { consultationId, doctorId });
        continue;
      }

      // Upsert pending payout row (idempotent)
      const { data: payoutRow, error: pErr } = await supabaseAdmin
        .from("doctor_payouts")
        .upsert(
          {
            consultation_id: consultationId,
            doctor_id: doctorId,
            amount_cents: amountCents,
            currency,
            status: "pending",
          },
          { onConflict: "consultation_id" },
        )
        .select("id")
        .single();

      if (pErr) {
        failed++;
        logStep("Failed to upsert payout row", { consultationId, msg: pErr.message });
        continue;
      }

      try {
        const transfer = await stripe.transfers.create({
          amount: amountCents,
          currency,
          destination: acct.stripe_account_id,
          metadata: {
            consultation_id: consultationId,
            doctor_id: doctorId,
            doctor_payout_id: payoutRow.id,
            payout_window_start: windowStart.toISOString(),
            payout_window_end: windowEnd.toISOString(),
          },
        });

        await supabaseAdmin
          .from("doctor_payouts")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_transfer_id: transfer.id,
          })
          .eq("consultation_id", consultationId);

        paid++;
        logStep("Paid", { consultationId, transferId: transfer.id });
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabaseAdmin
          .from("doctor_payouts")
          .update({ status: "failed" })
          .eq("consultation_id", consultationId);

        failed++;
        logStep("Transfer failed", { consultationId, msg });
      }
    }

    const summary = { windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString(), attempted, paid, failed, skipped, totalPaidPayments: rows.length };
    logStep("Done", summary);

    return new Response(JSON.stringify({ success: true, summary }), {
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
