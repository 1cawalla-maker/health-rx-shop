/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[HALAXY-PREPARE-CONSULT] ${step}${detailsStr}`);
};


function withPouchCareReturnParams(bookingUrl: string | null, consultationId: string, returnToken: string | null): string | null {
  if (!bookingUrl) return null;
  try {
    const url = new URL(bookingUrl);
    url.searchParams.set('pouchcare_consultation_id', consultationId);
    if (returnToken) url.searchParams.set('booking_return_token', returnToken);
    return url.toString();
  } catch {
    return bookingUrl;
  }
}

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

    const bookingUrl = (Deno.env.get("HALAXY_BOOKING_EMBED_URL") || Deno.env.get("HALAXY_BOOKING_URL") || "").trim() || null;
    const liveConfigPresent = Boolean(
      Deno.env.get("HALAXY_CLIENT_ID") &&
      Deno.env.get("HALAXY_CLIENT_SECRET") &&
      Deno.env.get("HALAXY_API_BASE_URL")
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, phone, phone_verified_at, date_of_birth, shipping_address_line1, shipping_address_line2, shipping_suburb, shipping_state, shipping_postcode, shipping_country, halaxy_patient_id, age_attested_at, privacy_notice_accepted_at, pre_halaxy_acknowledged_at, pre_halaxy_acknowledgement_version, pre_halaxy_acknowledgements")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Patient profile not found");

    const hasMinimalIdentity = Boolean((profile as any).full_name && (profile as any).phone);
    if (!hasMinimalIdentity) throw new Error("Please enter your name and mobile number before booking.");
    if (!(profile as any).phone_verified_at) throw new Error("Please verify your mobile number before booking.");
    if (!(profile as any).age_attested_at) throw new Error("Please confirm you are 18 or over before booking.");
    if (!(profile as any).privacy_notice_accepted_at) throw new Error("Please accept the privacy and collection notice before booking.");
    if (!(profile as any).pre_halaxy_acknowledged_at) throw new Error("Please complete the PouchCare pre-Halaxy acknowledgements before booking.");

    const { data: latestQuiz, error: quizError } = await supabaseAdmin
      .from("eligibility_quiz_sessions")
      .select("id, completed_at, risk_flags")
      .eq("patient_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quizError) throw new Error(quizError.message);

    // Halaxy-ready pre-GP behaviour:
    // - Do not require a public Halaxy booking URL yet because no GP may be onboarded.
    // - Create/reuse a pending PouchCare consult request with Halaxy metadata slots.
    // - Once a GP profile/service is enabled in Halaxy, the same function can return
    //   HALAXY_BOOKING_URL/HALAXY_BOOKING_EMBED_URL and hand the patient to Halaxy.
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("consultations")
      .select("*")
      .eq("patient_id", user.id)
      .eq("booking_provider", "halaxy")
      .in("booking_status", ["sent_to_booking", "booking_in_progress", "webhook_pending", "manual_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    let consultation = existing;
    if (!consultation) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("consultations")
        .insert({
          patient_id: user.id,
          doctor_id: null,
          scheduled_at: null,
          consultation_type: "phone",
          status: "requested",
          timezone: "Australia/Brisbane",
          booking_provider: "halaxy",
          booking_status: bookingUrl ? "sent_to_booking" : "manual_review",
          halaxy_patient_id: (profile as any).halaxy_patient_id ?? null,
          halaxy_booking_url: bookingUrl,
          booking_return_token: crypto.randomUUID(),
          booking_metadata: {
            scaffold: true,
            minimal_halaxy_onboarding: true,
            gp_onboarding_pending: !bookingUrl,
            pre_halaxy_acknowledgement_version: (profile as any).pre_halaxy_acknowledgement_version ?? null,
            latest_quiz_session_id: (latestQuiz as any)?.id ?? null,
            live_halaxy_config_present: liveConfigPresent,
          },
        })
        .select("*")
        .single();

      if (insertError) throw new Error(insertError.message);
      consultation = inserted;
    }

    const consultationBookingUrl = withPouchCareReturnParams(
      (consultation as any).halaxy_booking_url ?? bookingUrl,
      (consultation as any).id,
      (consultation as any).booking_return_token ?? null,
    );

    if (consultationBookingUrl && consultationBookingUrl !== (consultation as any).halaxy_booking_url) {
      await supabaseAdmin
        .from("consultations")
        .update({ halaxy_booking_url: consultationBookingUrl })
        .eq("id", (consultation as any).id);
      (consultation as any).halaxy_booking_url = consultationBookingUrl;
    }

    logStep("Prepared scaffold consultation", {
      consultationId: (consultation as any).id,
      liveConfigPresent,
      hasBookingUrl: Boolean(consultationBookingUrl),
    });

    return new Response(JSON.stringify({
      consultation: {
        id: (consultation as any).id,
        patientId: (consultation as any).patient_id,
        bookingProvider: "halaxy",
        bookingStatus: (consultation as any).booking_status,
        scheduledAt: (consultation as any).scheduled_at ?? null,
        timezone: (consultation as any).timezone ?? null,
        halaxyPatientId: (consultation as any).halaxy_patient_id ?? null,
        halaxyAppointmentId: (consultation as any).halaxy_appointment_id ?? null,
        halaxyAppointmentStatus: (consultation as any).halaxy_appointment_status ?? null,
        halaxyBookingUrl: consultationBookingUrl,
        halaxyManageUrl: (consultation as any).halaxy_manage_url ?? null,
        practitionerName: (consultation as any).halaxy_practitioner_name ?? null,
        locationName: (consultation as any).halaxy_location_name ?? null,
        createdAt: (consultation as any).created_at,
        updatedAt: (consultation as any).updated_at,
      },
      bookingUrl: consultationBookingUrl,
      manageUrl: (consultation as any).halaxy_manage_url ?? null,
      bookingReturnToken: (consultation as any).booking_return_token ?? null,
      requiresLiveHalaxyConfig: !liveConfigPresent || !bookingUrl,
      message: liveConfigPresent && bookingUrl
        ? "Consult request prepared. Continue to Halaxy to choose an appointment."
        : "Consult request captured in PouchCare. GP onboarding and public Halaxy booking are still pending.",
    }), {
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
