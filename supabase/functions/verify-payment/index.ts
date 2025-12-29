import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { sessionId, bookingId } = await req.json();
    
    if (!sessionId || !bookingId) {
      throw new Error("Missing sessionId or bookingId");
    }

    logStep("Verifying payment", { sessionId, bookingId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    logStep("Session retrieved", { 
      paymentStatus: session.payment_status,
      status: session.status 
    });

    if (session.payment_status === "paid") {
      // Update booking status to booked
      const { error: updateError } = await supabaseClient
        .from("consultation_bookings")
        .update({
          status: "booked",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string
        })
        .eq("id", bookingId);

      if (updateError) {
        logStep("Error updating booking", { error: updateError.message });
        throw new Error(`Failed to update booking: ${updateError.message}`);
      }

      logStep("Booking updated to booked status");

      return new Response(JSON.stringify({ 
        success: true, 
        status: "paid",
        bookingId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      status: session.payment_status 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
