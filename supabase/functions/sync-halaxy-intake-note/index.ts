/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { generateEligibilitySummaryHtml, type EligibilityAnswers } from "../_shared/eligibility-summary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-HALAXY-INTAKE-NOTE] ${step}${detailsStr}`);
};

function halaxyBaseUrl(): string {
  return (Deno.env.get("HALAXY_API_BASE_URL") || Deno.env.get("HALAXY_BASE_URL") || "").replace(/\/$/, "");
}

function reference(baseUrl: string, resourceType: string, id: string): string {
  return `${baseUrl}/main/${resourceType}/${id}`;
}

function extractDocumentReferenceId(value: any): string | null {
  if (!value) return null;
  if (typeof value?.id === "string") return value.id;
  if (typeof value?.resource?.id === "string") return value.resource.id;
  if (typeof value?.documentReferenceId === "string") return value.documentReferenceId;
  if (typeof value?.DocumentReference?.id === "string") return value.DocumentReference.id;
  return null;
}

async function getHalaxyAccessToken(): Promise<string> {
  const baseUrl = halaxyBaseUrl();
  const clientId = Deno.env.get("HALAXY_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("HALAXY_CLIENT_SECRET") || "";
  if (!baseUrl || !clientId || !clientSecret) throw new Error("Missing Halaxy API configuration");

  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/fhir+json",
      "User-Agent": Deno.env.get("HALAXY_USER_AGENT") || "PouchCare Intake Note Sync",
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

async function createDocumentReference(args: {
  token: string;
  halaxyPatientId: string;
  practitionerRoleId: string;
  html: string;
}) {
  const baseUrl = halaxyBaseUrl();
  const res = await fetch(`${baseUrl}/main/DocumentReference`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/fhir+json",
      "Authorization": `Bearer ${args.token}`,
      "User-Agent": Deno.env.get("HALAXY_USER_AGENT") || "PouchCare Intake Note Sync",
    },
    body: JSON.stringify({
      resourceType: "DocumentReference",
      status: "current",
      docStatus: "preliminary",
      description: "PouchCare intake summary",
      subject: {
        type: "Patient",
        reference: reference(baseUrl, "Patient", args.halaxyPatientId),
      },
      author: [
        {
          type: "PractitionerRole",
          reference: reference(baseUrl, "PractitionerRole", args.practitionerRoleId),
        },
      ],
      content: [
        {
          attachment: {
            contentType: "text/html",
            data: args.html,
          },
        },
      ],
    }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Halaxy DocumentReference create failed: ${res.status} ${text.slice(0, 500)}`);
  }

  return json;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  let consultationId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const suppliedBearer = authHeader.replace(/^Bearer\s+/i, "");
    if (!serviceKey || suppliedBearer !== serviceKey) throw new Error("Unauthorized");

    const body = await req.json().catch(() => ({}));
    consultationId = typeof body?.consultationId === "string" ? body.consultationId : null;
    const force = Boolean(body?.force);
    if (!consultationId) throw new Error("Missing consultationId");

    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from("consultations")
      .select("*")
      .eq("id", consultationId)
      .maybeSingle();

    if (consultationError) throw new Error(consultationError.message);
    if (!consultation) throw new Error("Consultation not found");

    if ((consultation as any).halaxy_document_reference_id && !force) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "already_synced", consultationId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const halaxyPatientId = (consultation as any).halaxy_patient_id || null;
    const practitionerRoleId =
      (consultation as any).halaxy_practitioner_role_id ||
      Deno.env.get("HALAXY_DEFAULT_PRACTITIONER_ROLE_ID") ||
      null;

    if (!halaxyPatientId) {
      await supabaseAdmin.from("consultations").update({ halaxy_intake_note_status: "pending", halaxy_intake_note_error: "Missing Halaxy patient ID" }).eq("id", consultationId);
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing_halaxy_patient_id", consultationId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!practitionerRoleId) {
      await supabaseAdmin.from("consultations").update({ halaxy_intake_note_status: "pending", halaxy_intake_note_error: "Missing Halaxy PractitionerRole ID" }).eq("id", consultationId);
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing_practitioner_role_id", consultationId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("eligibility_quiz_sessions")
      .select("id, answers, risk_flags, completed_at")
      .eq("patient_id", (consultation as any).patient_id)
      .eq("result", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quizError) throw new Error(quizError.message);
    if (!quiz) {
      await supabaseAdmin.from("consultations").update({ halaxy_intake_note_status: "pending", halaxy_intake_note_error: "No linked completed website intake found" }).eq("id", consultationId);
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing_quiz", consultationId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    await supabaseAdmin
      .from("consultations")
      .update({ halaxy_intake_note_status: "pending", halaxy_intake_note_error: null })
      .eq("id", consultationId);

    const html = generateEligibilitySummaryHtml({
      answers: (quiz as any).answers as EligibilityAnswers,
      riskFlags: ((quiz as any).risk_flags || []) as string[],
      completedAt: (quiz as any).completed_at || null,
      consultationId,
    });

    const token = await getHalaxyAccessToken();
    const response = await createDocumentReference({ token, halaxyPatientId, practitionerRoleId, html });
    const documentReferenceId = extractDocumentReferenceId(response);

    const bookingMetadata = {
      ...(((consultation as any).booking_metadata || {}) as Record<string, unknown>),
      halaxy_intake_note_response: response,
      halaxy_intake_note_quiz_session_id: (quiz as any).id,
    };

    const { error: updateError } = await supabaseAdmin
      .from("consultations")
      .update({
        halaxy_document_reference_id: documentReferenceId || (consultation as any).halaxy_document_reference_id || null,
        halaxy_intake_note_status: "synced",
        halaxy_intake_note_synced_at: new Date().toISOString(),
        halaxy_intake_note_error: null,
        booking_metadata: bookingMetadata,
      })
      .eq("id", consultationId);

    if (updateError) throw new Error(updateError.message);

    logStep("Synced intake note", { consultationId, documentReferenceId, quizSessionId: (quiz as any).id });

    return new Response(JSON.stringify({
      ok: true,
      consultationId,
      quizSessionId: (quiz as any).id,
      halaxyDocumentReferenceId: documentReferenceId,
      halaxyResponse: response,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { consultationId, message });

    if (consultationId) {
      await supabaseAdmin
        .from("consultations")
        .update({ halaxy_intake_note_status: "failed", halaxy_intake_note_error: message.slice(0, 1000) })
        .eq("id", consultationId);
    }

    return new Response(JSON.stringify({ error: message, consultationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
