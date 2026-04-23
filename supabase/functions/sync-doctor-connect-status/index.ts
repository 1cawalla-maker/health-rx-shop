import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-DOCTOR-CONNECT-STATUS] ${step}${detailsStr}`);
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
    if (!user?.id) throw new Error("User not authenticated");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find doctor's row
    const { data: doctor, error: doctorErr } = await supabaseAdmin
      .from("doctors")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single();

    if (doctorErr || !doctor) throw new Error("Doctor not found");

    // Load connected account mapping
    const { data: mapping, error: mapErr } = await supabaseAdmin
      .from("doctor_stripe_accounts")
      .select("doctor_id, stripe_account_id")
      .eq("doctor_id", doctor.id)
      .maybeSingle();

    if (mapErr) throw new Error(mapErr.message);
    if (!mapping?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          stripe_account_id: null,
          details_submitted: false,
          charges_enabled: false,
          payouts_enabled: false,
          requirements: { currently_due: [] },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const acct = await stripe.accounts.retrieve(mapping.stripe_account_id);

    const detailsSubmitted = Boolean((acct as any).details_submitted);
    const chargesEnabled = Boolean((acct as any).charges_enabled);
    const payoutsEnabled = Boolean((acct as any).payouts_enabled);
    const currentlyDue = (((acct as any).requirements?.currently_due ?? []) as string[]);

    await supabaseAdmin
      .from("doctor_stripe_accounts")
      .update({
        onboarding_complete: detailsSubmitted,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("doctor_id", doctor.id);

    logStep("Synced", {
      doctorId: doctor.id,
      stripeAccountId: mapping.stripe_account_id,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      currentlyDueCount: currentlyDue.length,
    });

    return new Response(
      JSON.stringify({
        stripe_account_id: mapping.stripe_account_id,
        details_submitted: detailsSubmitted,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        requirements: { currently_due: currentlyDue },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
