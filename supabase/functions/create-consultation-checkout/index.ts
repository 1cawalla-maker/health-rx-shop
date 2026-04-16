import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONSULTATION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabaseAnon = createClient(supabaseUrl, anonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id || !user.email) throw new Error("User not authenticated");

    const body = await req.json();
    const consultationId = body?.consultationId as string | undefined;
    const amountCents = body?.amountCents as number | undefined;

    if (!consultationId) throw new Error("Missing consultationId");
    if (!amountCents || amountCents <= 0 || amountCents > 100000) throw new Error("Invalid amountCents");

    // Ensure consultation exists + belongs to user
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from("consultations")
      .select("id, patient_id, status, scheduled_at")
      .eq("id", consultationId)
      .single();

    if (consultationError || !consultation) throw new Error("Consultation not found");
    if (consultation.patient_id !== user.id) throw new Error("Not allowed");

    // Ensure there is an active reservation that hasn't expired
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from("consultation_reservations")
      .select("id, expires_at, status")
      .eq("consultation_id", consultationId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reservationError) throw new Error(reservationError.message);
    if (!reservation) throw new Error("No active reservation for this consultation");
    if (new Date(reservation.expires_at).getTime() <= Date.now()) throw new Error("Reservation expired");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || Deno.env.get("APP_ORIGIN") || "https://health-rx-shop.vercel.app";

    // Create/Upsert payment ledger row
    const { data: paymentRow, error: upsertErr } = await supabaseAdmin
      .from("consultation_payments")
      .upsert(
        {
          consultation_id: consultationId,
          patient_id: user.id,
          amount_cents: amountCents,
          currency: "aud",
          status: "pending",
        },
        { onConflict: "consultation_id" },
      )
      .select("id")
      .single();

    if (upsertErr) throw new Error(upsertErr.message);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: { name: "5-minute phone consultation" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/patient/booking/payment/${consultationId}?stripeSuccess=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/patient/booking/payment/${consultationId}?stripeCancelled=1`,
      metadata: {
        consultation_id: consultationId,
        patient_id: user.id,
        payment_row_id: paymentRow.id,
      },
    });

    await supabaseAdmin
      .from("consultation_payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("consultation_id", consultationId);

    logStep("Checkout session created", { consultationId, sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
