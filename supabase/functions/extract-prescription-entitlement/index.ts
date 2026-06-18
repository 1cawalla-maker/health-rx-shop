/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EXTRACT-PRESCRIPTION-ENTITLEMENT] ${step}${detailsStr}`);
};

type ExtractedEntitlement = {
  max_strength_mg: number | null;
  max_units_per_order: number | null;
  max_units_per_month: number | null;
  max_total_units: number | null;
  expires_at: string | null;
  issued_at: string | null;
  raw_text_summary: string | null;
  confidence: number | null;
  needs_review_reason: string | null;
};

function contentTypeFromPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function toDataUrl(bytes: ArrayBuffer, contentType: string) {
  const chunkSize = 0x8000;
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < uint8.length; i += chunkSize) {
    binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}

function parseJsonObject(text: string): ExtractedEntitlement {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as ExtractedEntitlement;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OCR response did not contain JSON");
    return JSON.parse(match[0]) as ExtractedEntitlement;
  }
}

function cleanNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    const body = await req.json().catch(() => ({}));
    const prescriptionId = body?.prescriptionId as string | undefined;
    if (!prescriptionId) throw new Error("prescriptionId is required");

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) throw new Error("OPENAI_API_KEY is not set");

    const { data: prescription, error: rxErr } = await supabase
      .from("prescriptions")
      .select("id, patient_id, consultation_id, file_url, status")
      .eq("id", prescriptionId)
      .single();

    if (rxErr || !prescription) throw new Error(`Prescription not found: ${rxErr?.message ?? "missing"}`);

    const isOwner = prescription.patient_id === user.id;
    // Admin checks differ across deployments; service role still updates, but auth user must either own the upload
    // or have an admin profile row.
    let isAdmin = false;
    if (!isOwner) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role,status")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .eq("status", "approved")
        .maybeSingle();
      isAdmin = Boolean(roleRow);
    }
    let isAssignedDoctor = false;
    if (!isOwner && !isAdmin && prescription.consultation_id) {
      const { data: doctorRow } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (doctorRow?.id) {
        const { data: consultRow } = await supabase
          .from("consultations")
          .select("id")
          .eq("id", prescription.consultation_id)
          .eq("patient_id", prescription.patient_id)
          .eq("doctor_id", doctorRow.id)
          .maybeSingle();
        isAssignedDoctor = Boolean(consultRow);
      }
    }
    if (!isOwner && !isAdmin && !isAssignedDoctor) throw new Error("Not allowed to extract this prescription");

    const storagePath = String(prescription.file_url ?? "");
    if (!storagePath) throw new Error("Prescription has no file_url");

    await supabase
      .from("prescriptions")
      .update({ ocr_status: "processing", ocr_error: null })
      .eq("id", prescriptionId);

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("prescriptions")
      .download(storagePath);

    if (downloadErr || !fileData) throw new Error(`Failed to download prescription: ${downloadErr?.message ?? "missing file"}`);

    const bytes = await fileData.arrayBuffer();
    const contentType = contentTypeFromPath(storagePath);
    const dataUrl = toDataUrl(bytes, contentType);

    const prompt = `You are extracting ordering limits from an Australian nicotine pouch prescription.
Return ONLY valid JSON with these keys:
{
  "max_strength_mg": number|null,
  "max_units_per_order": number|null,
  "max_units_per_month": number|null,
  "max_total_units": number|null,
  "expires_at": "YYYY-MM-DD"|null,
  "issued_at": "YYYY-MM-DD"|null,
  "raw_text_summary": string|null,
  "confidence": number|null,
  "needs_review_reason": string|null
}
Rules:
- Extract explicit values only. Do not infer clinical or regulatory meaning.
- max_strength_mg is the highest prescribed nicotine pouch strength in mg.
- max_total_units is the total number of cans/units allowed by this prescription when a total/dispense quantity is clearly stated.
- max_units_per_order is only populated if the prescription explicitly states a per-order limit.
- max_units_per_month is only populated if a monthly, 30-day, or clearly equivalent period allowance is explicitly stated.
- If a value is ambiguous or absent, use null and explain in needs_review_reason.
- confidence is 0 to 1.`;

    logStep("Calling OpenAI", { prescriptionId, contentType });

    const fileContentBlock = contentType.startsWith("image/")
      ? { type: "input_image", image_url: dataUrl }
      : { type: "input_file", filename: storagePath.split("/").pop() || "prescription", file_data: dataUrl };

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("PRESCRIPTION_OCR_MODEL") || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              fileContentBlock,
            ],
          },
        ],
      }),
    });

    const aiJson = await aiRes.json();
    if (!aiRes.ok) throw new Error(`OpenAI OCR failed: ${JSON.stringify(aiJson)}`);

    const outputText = aiJson.output_text ?? aiJson.output?.flatMap((o: any) => o.content ?? [])
      ?.map((c: any) => c.text ?? "")
      ?.join("\n") ?? "";

    const extracted = parseJsonObject(outputText);
    const maxStrength = cleanNumber(extracted.max_strength_mg);
    const maxPerOrder = cleanNumber(extracted.max_units_per_order);
    const maxPerMonth = cleanNumber(extracted.max_units_per_month);
    const maxTotalUnits = cleanNumber(extracted.max_total_units) ?? maxPerOrder ?? maxPerMonth;
    const confidence = extracted.confidence == null ? null : Math.max(0, Math.min(1, Number(extracted.confidence)));

    const hasEnoughToGate = Boolean(maxStrength && maxTotalUnits);
    const nextStatus = hasEnoughToGate ? "active" : "pending_review";
    const ocrStatus = hasEnoughToGate ? "completed" : "needs_review";
    const reviewReason = hasEnoughToGate
      ? null
      : extracted.needs_review_reason || "OCR did not find both max strength and a clear total quantity allowance.";

    const { error: updateErr } = await supabase
      .from("prescriptions")
      .update({
        status: nextStatus,
        allowed_strength_min: null,
        allowed_strength_max: maxStrength,
        max_units_per_order: maxPerOrder,
        max_units_per_month: maxPerMonth,
        total_units_allowed: maxTotalUnits,
        issued_at: extracted.issued_at,
        expires_at: extracted.expires_at,
        review_reason: reviewReason,
        ocr_status: ocrStatus,
        ocr_raw_text: extracted.raw_text_summary,
        ocr_extracted: extracted as any,
        ocr_confidence: confidence,
        ocr_error: null,
        ocr_processed_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId);

    if (updateErr) throw new Error(`Failed to update prescription: ${updateErr.message}`);

    return new Response(JSON.stringify({ prescriptionId, status: nextStatus, ocrStatus, extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });

    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
