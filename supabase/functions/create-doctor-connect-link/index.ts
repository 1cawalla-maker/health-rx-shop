import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-DOCTOR-CONNECT-LINK] ${step}${detailsStr}`);
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

    // Get existing stripe account mapping
    const { data: existing } = await supabaseAdmin
      .from("doctor_stripe_accounts")
      .select("doctor_id, stripe_account_id")
      .eq("doctor_id", doctor.id)
      .maybeSingle();

    let stripeAccountId = existing?.stripe_account_id;

    if (!stripeAccountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        country: "AU",
        email: user.email ?? undefined,
        business_type: "individual",
        metadata: { doctor_id: doctor.id, user_id: user.id },
      });
      stripeAccountId = acct.id;

      const { error: insertErr } = await supabaseAdmin
        .from("doctor_stripe_accounts")
        .insert({ doctor_id: doctor.id, stripe_account_id: stripeAccountId });

      if (insertErr) throw new Error(insertErr.message);
    }

    const origin = req.headers.get("origin") || Deno.env.get("APP_ORIGIN") || "https://health-rx-shop.vercel.app";
    const refreshUrl = `${origin}/doctor/account?connect=refresh`;
    const returnUrl = `${origin}/doctor/account?connect=return`;

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: link.url, stripeAccountId }), {
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
