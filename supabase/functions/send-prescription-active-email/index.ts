/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendTransactionalEmail } from "../_shared/email/index.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Server misconfig" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAuthed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userRes, error: userErr } = await supabaseAuthed.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, 401);

  const callerUserId = userRes.user.id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const consultationId = typeof body?.consultationId === "string" ? body.consultationId : "";
  if (!consultationId) return json({ error: "Missing consultationId" }, 400);

  const admin = createClient(supabaseUrl, serviceKey);

  // Ensure caller is the assigned doctor for this consultation.
  const { data: doctorRow, error: doctorErr } = await admin
    .from("doctors")
    .select("id")
    .eq("user_id", callerUserId)
    .maybeSingle();

  if (doctorErr || !doctorRow?.id) return json({ error: "Caller is not a doctor" }, 403);

  const { data: consultRow, error: consultErr } = await admin
    .from("consultations")
    .select("id, patient_id, doctor_id")
    .eq("id", consultationId)
    .maybeSingle();

  if (consultErr || !consultRow) return json({ error: "Consultation not found" }, 404);

  if (consultRow.doctor_id !== doctorRow.id) return json({ error: "Forbidden" }, 403);

  const { data: patientUserRes, error: patientUserErr } = await admin.auth.admin.getUserById(
    consultRow.patient_id,
  );

  const toEmail = patientUserRes?.user?.email;
  if (patientUserErr || !toEmail) return json({ error: "Patient email not found" }, 400);

  const appOrigin = Deno.env.get("APP_ORIGIN") ?? "";
  const shopUrl = appOrigin ? `${appOrigin}/shop` : undefined;

  const text = [
    "Your prescription is now active.",
    shopUrl ? `You can now visit the shop: ${shopUrl}` : undefined,
    "",
    "— PouchCare",
  ].filter(Boolean).join("\n");

  const sendResult = await sendTransactionalEmail({
    to: toEmail,
    subject: "PouchCare — Your prescription is active",
    text,
  });

  return json({ ok: true, sendResult });
});
