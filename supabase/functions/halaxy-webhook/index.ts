/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-halaxy-webhook-secret",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[HALAXY-WEBHOOK] ${step}${detailsStr}`);
};

function firstNotificationEvent(payload: any): any | null {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    const events = entry?.resource?.notificationEvent;
    if (Array.isArray(events) && events.length > 0) return events[0];
  }
  return null;
}

function parseResourceId(reference?: string | null): string | null {
  if (!reference) return null;
  const parts = String(reference).split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
}

function parseResourceType(reference?: string | null): string | null {
  if (!reference) return null;
  const parts = String(reference).split('/').filter(Boolean);
  const idx = parts.findIndex((part) => /^[A-Z][A-Za-z]+$/.test(part));
  if (idx >= 0 && parts[idx + 1]) return parts[idx];
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

function normalizePhone(value?: string | null): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^4\d{8}$/.test(digits)) return `+61${digits}`;
  return digits ? `+${digits}` : null;
}

function extractPatientPhone(patient: any): string | null {
  const telecoms = Array.isArray(patient?.telecom) ? patient.telecom : [];
  const preferred = telecoms.find((t: any) => ["sms", "phone"].includes(String(t?.system || "").toLowerCase()) && t?.value)
    || telecoms.find((t: any) => t?.value);
  return normalizePhone(preferred?.value ?? null);
}

function findFirstDeep(value: any, keys: string[]): unknown {
  const seen = new Set<any>();
  const stack = [value];
  const wanted = new Set(keys.map((k) => k.toLowerCase()));

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }

    for (const [key, child] of Object.entries(current)) {
      if (wanted.has(key.toLowerCase()) && child != null) return child;
      if (child && typeof child === 'object') stack.push(child);
    }
  }

  return null;
}

function findAppointmentResource(payload: any): any | null {
  if (payload?.resourceType === 'Appointment') return payload;
  if (payload?.resource?.resourceType === 'Appointment') return payload.resource;

  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    if (entry?.resource?.resourceType === 'Appointment') return entry.resource;
    const nested = findAppointmentResource(entry?.resource);
    if (nested) return nested;
  }

  return null;
}

function participantDisplay(appointment: any, type: 'Practitioner' | 'Location'): { id: string | null; name: string | null } {
  const participants = Array.isArray(appointment?.participant) ? appointment.participant : [];
  for (const participant of participants) {
    const actor = participant?.actor;
    const reference = typeof actor?.reference === 'string' ? actor.reference : null;
    if (parseResourceType(reference) === type) {
      return {
        id: parseResourceId(reference),
        name: typeof actor?.display === 'string' ? actor.display : null,
      };
    }
  }
  return { id: null, name: null };
}

function patientIdFromAppointment(appointment: any): string | null {
  const participants = Array.isArray(appointment?.participant) ? appointment.participant : [];
  for (const participant of participants) {
    const reference = typeof participant?.actor?.reference === 'string' ? participant.actor.reference : null;
    if (parseResourceType(reference) === 'Patient') return parseResourceId(reference);
  }
  return null;
}

async function getHalaxyAccessToken(): Promise<string | null> {
  const baseUrl = (Deno.env.get("HALAXY_API_BASE_URL") || Deno.env.get("HALAXY_BASE_URL") || "").replace(/\/$/, "");
  const clientId = Deno.env.get("HALAXY_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("HALAXY_CLIENT_SECRET") || "";
  if (!baseUrl || !clientId || !clientSecret) return null;

  const tokenUrl = `${baseUrl}/oauth/token`;

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/fhir+json",
      "User-Agent": Deno.env.get("HALAXY_USER_AGENT") || "PouchCare Halaxy Webhook Sync",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.access_token) throw new Error(`Halaxy OAuth failed: ${res.status}`);
  return String(json.access_token);
}

async function halaxyGet(path: string, token: string): Promise<any> {
  const baseUrl = (Deno.env.get("HALAXY_API_BASE_URL") || Deno.env.get("HALAXY_BASE_URL") || "").replace(/\/$/, "");
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/fhir+json",
      "User-Agent": Deno.env.get("HALAXY_USER_AGENT") || "PouchCare Halaxy Webhook Sync",
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Halaxy GET ${path} failed: ${res.status}`);
  return json;
}

function extractAppointmentPatch(payload: any, halaxyResourceId: string | null) {
  const appointment = findAppointmentResource(payload);
  const practitioner = participantDisplay(appointment, 'Practitioner');
  const location = participantDisplay(appointment, 'Location');

  const appointmentId =
    halaxyResourceId ||
    (typeof appointment?.id === 'string' ? appointment.id : null) ||
    (typeof findFirstDeep(payload, ['appointmentId', 'appointment_id', 'halaxyAppointmentId', 'halaxy_appointment_id']) === 'string'
      ? String(findFirstDeep(payload, ['appointmentId', 'appointment_id', 'halaxyAppointmentId', 'halaxy_appointment_id']))
      : null);

  const scheduledAt =
    (typeof appointment?.start === 'string' ? appointment.start : null) ||
    (typeof findFirstDeep(payload, ['scheduledAt', 'scheduled_at', 'start', 'startTime', 'start_time']) === 'string'
      ? String(findFirstDeep(payload, ['scheduledAt', 'scheduled_at', 'start', 'startTime', 'start_time']))
      : null);

  const appointmentStatus =
    (typeof appointment?.status === 'string' ? appointment.status : null) ||
    (typeof findFirstDeep(payload, ['appointmentStatus', 'appointment_status', 'status']) === 'string'
      ? String(findFirstDeep(payload, ['appointmentStatus', 'appointment_status', 'status']))
      : null);

  const manageUrl = typeof findFirstDeep(payload, ['manageUrl', 'manage_url', 'halaxyManageUrl', 'halaxy_manage_url']) === 'string'
    ? String(findFirstDeep(payload, ['manageUrl', 'manage_url', 'halaxyManageUrl', 'halaxy_manage_url']))
    : null;

  const returnToken = typeof findFirstDeep(payload, ['bookingReturnToken', 'booking_return_token', 'returnToken', 'return_token']) === 'string'
    ? String(findFirstDeep(payload, ['bookingReturnToken', 'booking_return_token', 'returnToken', 'return_token']))
    : null;

  const consultationId = typeof findFirstDeep(payload, ['consultationId', 'consultation_id', 'pouchcareConsultationId', 'pouchcare_consultation_id']) === 'string'
    ? String(findFirstDeep(payload, ['consultationId', 'consultation_id', 'pouchcareConsultationId', 'pouchcare_consultation_id']))
    : null;

  return {
    appointmentId,
    scheduledAt,
    appointmentStatus,
    manageUrl,
    practitionerId: practitioner.id,
    practitionerName: practitioner.name,
    locationId: location.id,
    locationName: location.name,
    returnToken,
    consultationId,
  };
}

function bookingStatusFromAppointment(status: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'booked':
    case 'arrived':
    case 'fulfilled':
    case 'checked-in':
      return 'booked';
    case 'cancelled':
    case 'noshow':
    case 'entered-in-error':
      return 'cancelled';
    case 'proposed':
    case 'pending':
    case 'waitlist':
      return 'booking_in_progress';
    default:
      return 'webhook_pending';
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const configuredSecret = Deno.env.get("HALAXY_WEBHOOK_SECRET") || "";
    if (configuredSecret) {
      const suppliedSecret = req.headers.get("x-halaxy-webhook-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
      if (suppliedSecret !== configuredSecret) throw new Error("Invalid Halaxy webhook secret");
    }

    const payload = await req.json();
    const event = firstNotificationEvent(payload);
    const resourceType = event?.focus?.type ?? payload?.resourceType ?? null;
    const resourceReference = event?.focus?.reference ?? null;
    const halaxyResourceId = parseResourceId(resourceReference);
    const halaxyEventId = event?.id || payload?.id || crypto.randomUUID();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: insertedEvent, error: eventError } = await supabaseAdmin
      .from("halaxy_webhook_events")
      .upsert({
        halaxy_event_id: halaxyEventId,
        resource_type: resourceType,
        resource_reference: resourceReference,
        action: null,
        payload,
        processing_status: "received",
      }, { onConflict: "halaxy_event_id" })
      .select("id")
      .single();

    if (eventError) throw new Error(eventError.message);

    let appointmentPatch = extractAppointmentPatch(payload, halaxyResourceId);
    let halaxyPatientId: string | null = null;
    let halaxyPatientPhone: string | null = null;

    // Halaxy webhook payloads are intentionally thin Subscription notifications.
    // Fetch the Appointment/Patient resource so we can match a Halaxy booking back
    // to the verified PouchCare phone profile without relying on custom URL params.
    if (resourceType === "Appointment" && appointmentPatch.appointmentId) {
      const token = await getHalaxyAccessToken();
      if (token) {
        try {
          const appointment = await halaxyGet(`/Appointment/${appointmentPatch.appointmentId}`, token);
          const fetchedPatch = extractAppointmentPatch(appointment, appointmentPatch.appointmentId);
          appointmentPatch = {
            ...appointmentPatch,
            appointmentId: fetchedPatch.appointmentId || appointmentPatch.appointmentId,
            scheduledAt: fetchedPatch.scheduledAt || appointmentPatch.scheduledAt,
            appointmentStatus: fetchedPatch.appointmentStatus || appointmentPatch.appointmentStatus,
            manageUrl: fetchedPatch.manageUrl || appointmentPatch.manageUrl,
            practitionerId: fetchedPatch.practitionerId || appointmentPatch.practitionerId,
            practitionerName: fetchedPatch.practitionerName || appointmentPatch.practitionerName,
            locationId: fetchedPatch.locationId || appointmentPatch.locationId,
            locationName: fetchedPatch.locationName || appointmentPatch.locationName,
          };

          halaxyPatientId = patientIdFromAppointment(appointment);
          if (halaxyPatientId) {
            const patient = await halaxyGet(`/Patient/${halaxyPatientId}`, token);
            halaxyPatientPhone = extractPatientPhone(patient);
          }
        } catch (fetchError) {
          logStep("Halaxy API enrichment failed", { message: fetchError instanceof Error ? fetchError.message : String(fetchError) });
        }
      }
    }

    let consultationId: string | null = appointmentPatch.consultationId;

    if (!consultationId && appointmentPatch.returnToken) {
      const { data: byToken } = await supabaseAdmin
        .from("consultations")
        .select("id")
        .eq("booking_return_token", appointmentPatch.returnToken)
        .eq("booking_provider", "halaxy")
        .maybeSingle();
      consultationId = (byToken as any)?.id ?? null;
    }

    if (!consultationId && appointmentPatch.appointmentId) {
      const { data: byAppointment } = await supabaseAdmin
        .from("consultations")
        .select("id")
        .eq("halaxy_appointment_id", appointmentPatch.appointmentId)
        .eq("booking_provider", "halaxy")
        .maybeSingle();
      consultationId = (byAppointment as any)?.id ?? null;
    }

    if (!consultationId && halaxyPatientId) {
      const { data: byHalaxyPatient } = await supabaseAdmin
        .from("consultations")
        .select("id")
        .eq("halaxy_patient_id", halaxyPatientId)
        .eq("booking_provider", "halaxy")
        .in("booking_status", ["sent_to_booking", "booking_in_progress", "webhook_pending", "manual_review"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      consultationId = (byHalaxyPatient as any)?.id ?? null;
    }

    if (!consultationId && halaxyPatientPhone) {
      const { data: matchedProfile } = await supabaseAdmin
        .from("profiles")
        .select("user_id, halaxy_patient_id, pre_halaxy_acknowledged_at")
        .eq("phone", halaxyPatientPhone)
        .not("phone_verified_at", "is", null)
        .maybeSingle();

      const matchedUserId = (matchedProfile as any)?.user_id ?? null;
      const completedPouchCareGate = Boolean((matchedProfile as any)?.pre_halaxy_acknowledged_at);
      if (matchedUserId && completedPouchCareGate) {
        if (!(matchedProfile as any)?.halaxy_patient_id && halaxyPatientId) {
          await supabaseAdmin
            .from("profiles")
            .update({ halaxy_patient_id: halaxyPatientId, halaxy_patient_synced_at: new Date().toISOString() })
            .eq("user_id", matchedUserId);
        }

        const { data: pendingConsult } = await supabaseAdmin
          .from("consultations")
          .select("id")
          .eq("patient_id", matchedUserId)
          .eq("booking_provider", "halaxy")
          .in("booking_status", ["sent_to_booking", "booking_in_progress", "webhook_pending", "manual_review"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        consultationId = (pendingConsult as any)?.id ?? null;

        if (!consultationId) {
          const { data: insertedConsult, error: insertConsultError } = await supabaseAdmin
            .from("consultations")
            .insert({
              patient_id: matchedUserId,
              doctor_id: null,
              scheduled_at: appointmentPatch.scheduledAt,
              consultation_type: "phone",
              status: "requested",
              timezone: "Australia/Brisbane",
              booking_provider: "halaxy",
              booking_status: bookingStatusFromAppointment(appointmentPatch.appointmentStatus),
              halaxy_patient_id: halaxyPatientId,
              halaxy_appointment_id: appointmentPatch.appointmentId,
              halaxy_appointment_status: appointmentPatch.appointmentStatus,
              booking_metadata: { created_from_halaxy_webhook_phone_match: true },
            })
            .select("id")
            .single();
          if (insertConsultError) throw new Error(insertConsultError.message);
          consultationId = (insertedConsult as any)?.id ?? null;
        }
      } else if (matchedUserId && !completedPouchCareGate) {
        logStep("Matched verified phone but PouchCare pre-Halaxy gate was not completed", { matchedUserId, halaxyPatientId });
      }
    }

    if (consultationId) {
      let mappedDoctorId: string | null = null;
      if (appointmentPatch.practitionerId) {
        const { data: mappedDoctor, error: mappedDoctorError } = await supabaseAdmin
          .from("doctors")
          .select("id")
          .eq("halaxy_practitioner_id", appointmentPatch.practitionerId)
          .eq("is_active", true)
          .maybeSingle();

        if (mappedDoctorError) throw new Error(mappedDoctorError.message);
        mappedDoctorId = (mappedDoctor as any)?.id ?? null;
      }

      const update: Record<string, unknown> = {
        halaxy_last_webhook_at: new Date().toISOString(),
        booking_status: bookingStatusFromAppointment(appointmentPatch.appointmentStatus),
      };

      if (mappedDoctorId) update.doctor_id = mappedDoctorId;
      if (appointmentPatch.appointmentId) update.halaxy_appointment_id = appointmentPatch.appointmentId;
      if (appointmentPatch.scheduledAt) update.scheduled_at = appointmentPatch.scheduledAt;
      if (appointmentPatch.appointmentStatus) update.halaxy_appointment_status = appointmentPatch.appointmentStatus;
      if (appointmentPatch.manageUrl) update.halaxy_manage_url = appointmentPatch.manageUrl;
      if (halaxyPatientId) update.halaxy_patient_id = halaxyPatientId;
      if (appointmentPatch.practitionerId) update.halaxy_practitioner_id = appointmentPatch.practitionerId;
      if (appointmentPatch.practitionerName) update.halaxy_practitioner_name = appointmentPatch.practitionerName;
      if (appointmentPatch.locationId) update.halaxy_location_id = appointmentPatch.locationId;
      if (appointmentPatch.locationName) update.halaxy_location_name = appointmentPatch.locationName;

      await supabaseAdmin
        .from("consultations")
        .update(update)
        .eq("id", consultationId)
        .eq("booking_provider", "halaxy");

      await supabaseAdmin
        .from("halaxy_webhook_events")
        .update({ consultation_id: consultationId })
        .eq("id", (insertedEvent as any).id);
    }

    await supabaseAdmin
      .from("halaxy_webhook_events")
      .update({
        processing_status: consultationId ? "processed" : "manual_review",
        processed_at: new Date().toISOString(),
      })
      .eq("id", (insertedEvent as any).id);

    logStep("Webhook recorded", { halaxyEventId, resourceType, resourceReference, consultationId, appointmentId: appointmentPatch.appointmentId, halaxyPatientId, matchedByPhone: Boolean(halaxyPatientPhone && consultationId), practitionerId: appointmentPatch.practitionerId });

    return new Response(JSON.stringify({
      received: true,
      halaxyEventId,
      resourceType,
      resourceReference,
      consultationId,
      appointmentId: appointmentPatch.appointmentId,
      halaxyPatientId,
      bookingReconciled: Boolean(consultationId),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
