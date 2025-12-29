import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body for booking details
    const { slotId, scheduledDate, timeWindowStart, timeWindowEnd, timezone } = await req.json();
    
    logStep("Booking details received", { slotId, scheduledDate, timeWindowStart, timeWindowEnd });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Create a pending booking in the database
    const { data: booking, error: bookingError } = await supabaseClient
      .from("consultation_bookings")
      .insert({
        patient_id: user.id,
        slot_id: slotId,
        scheduled_date: scheduledDate,
        time_window_start: timeWindowStart,
        time_window_end: timeWindowEnd,
        timezone: timezone || "Australia/Sydney",
        status: "pending_payment",
        amount_paid: 3900 // $39.00 in cents
      })
      .select()
      .single();

    if (bookingError) {
      logStep("Error creating booking", { error: bookingError.message });
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    logStep("Booking created", { bookingId: booking.id });

    // Create Stripe checkout session
    const origin = req.headers.get("origin") || "https://health-rx-shop.vercel.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1SjXUoQuZEJDjXpG638LwAdu", // $39 Quick Consultation
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/patient/intake/${booking.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/patient/book?cancelled=true`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update booking with Stripe session ID
    await supabaseClient
      .from("consultation_bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    return new Response(JSON.stringify({ url: session.url, bookingId: booking.id }), {
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
