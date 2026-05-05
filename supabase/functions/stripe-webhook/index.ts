import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendTransactionalEmail } from "../_shared/email/index.ts";

async function enqueueEmail(supabaseAdmin: any, args: { eventType: string; toEmail: string; scheduledFor?: string; payload?: any; idempotencyKey: string }) {
  const { eventType, toEmail, scheduledFor, payload, idempotencyKey } = args;
  const { error } = await supabaseAdmin.from("email_outbox").upsert(
    {
      event_type: eventType,
      to_email: toEmail,
      scheduled_for: scheduledFor ?? new Date().toISOString(),
      payload: payload ?? {},
      idempotency_key: idempotencyKey,
    },
    { onConflict: "idempotency_key" },
  );
  if (error) throw new Error(`enqueueEmail failed: ${error.message}`);
}

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
        } else {
          // Enqueue transactional emails (worker sends reliably)
          try {
            const appOrigin = Deno.env.get("APP_ORIGIN") ?? "";

            const { data: consultRow, error: consultErr } = await supabaseAdmin
              .from("consultations")
              .select("id, patient_id, doctor_id, scheduled_at")
              .eq("id", consultationId)
              .maybeSingle();

            if (consultErr || !consultRow?.patient_id) {
              logStep("enqueue skipped (consultation lookup failed)", {
                consultationId,
                error: consultErr?.message,
              });
            } else {
              const scheduledAt = (consultRow as any)?.scheduled_at as string | undefined;
              const manageUrl = appOrigin ? `${appOrigin}/patient/consultations` : undefined;
              const doctorUrl = appOrigin ? `${appOrigin}/doctor/consultations` : undefined;

              // Patient email
              const { data: patientRes, error: patientErr } = await supabaseAdmin.auth.admin.getUserById(
                consultRow.patient_id,
              );
              const patientEmail = patientRes?.user?.email;

              if (!patientErr && patientEmail) {
                await enqueueEmail(supabaseAdmin, {
                  eventType: "patient.consultation_confirmed",
                  toEmail: patientEmail,
                  payload: { consultation_id: consultationId, scheduled_at: scheduledAt, manage_url: manageUrl },
                  idempotencyKey: `patient.consultation_confirmed:${consultationId}`,
                });
              }

              // Doctor emails (immediate + 24h reminder)
              // consultRow.doctor_id is doctors.id (FK). We must map to doctors.user_id (auth user id) for email lookup.
              const doctorId = (consultRow as any)?.doctor_id as string | undefined;
              if (doctorId) {
                const { data: doctorRow, error: doctorRowErr } = await supabaseAdmin
                  .from("doctors")
                  .select("id,user_id")
                  .eq("id", doctorId)
                  .maybeSingle();

                const doctorUserId = (doctorRow as any)?.user_id as string | undefined;

                if (doctorRowErr || !doctorUserId) {
                  logStep("enqueue skipped (doctor lookup failed)", {
                    consultationId,
                    doctorId,
                    error: doctorRowErr?.message,
                  });
                } else {
                  const { data: doctorRes, error: doctorErr } = await supabaseAdmin.auth.admin.getUserById(doctorUserId);
                  const doctorEmail = doctorRes?.user?.email;

                  if (!doctorErr && doctorEmail) {
                    await enqueueEmail(supabaseAdmin, {
                      eventType: "doctor.consultation_assigned_immediate",
                      toEmail: doctorEmail,
                      payload: { consultation_id: consultationId, scheduled_at: scheduledAt, doctor_consultations_url: doctorUrl },
                      idempotencyKey: `doctor.consultation_assigned_immediate:${consultationId}:${doctorUserId}`,
                    });

                    if (scheduledAt) {
                      const d = new Date(scheduledAt);
                      d.setUTCHours(d.getUTCHours() - 24);
                      const scheduledFor = d.toISOString();
                      // Only schedule if in the future
                      if (d.getTime() > Date.now()) {
                        await enqueueEmail(supabaseAdmin, {
                          eventType: "doctor.consultation_upcoming_24h",
                          toEmail: doctorEmail,
                          scheduledFor,
                          payload: { consultation_id: consultationId, scheduled_at: scheduledAt, doctor_consultations_url: doctorUrl },
                          idempotencyKey: `doctor.consultation_upcoming_24h:${consultationId}:${doctorUserId}`,
                        });
                      }
                    }
                  }
                }
              }

              logStep("emails enqueued", { consultationId });
            }
          } catch (enqueueErr) {
            const msg = enqueueErr instanceof Error ? enqueueErr.message : String(enqueueErr);
            logStep("enqueue failed (non-fatal)", { consultationId, msg });
          }
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
