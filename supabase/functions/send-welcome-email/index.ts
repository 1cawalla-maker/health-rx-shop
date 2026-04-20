/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendTransactionalEmail } from "../_shared/email/index.ts";

const corsHeaders: Record<string, string> = {
  // Keep permissive for MVP; tighten later (origin allowlist).
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) return json({ error: "Server misconfig" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, 401);

  const toEmail = userRes.user.email;
  if (!toEmail) return json({ error: "User has no email" }, 400);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ok
  }

  const role = typeof body?.role === "string" ? body.role : "user";
  const name = (userRes.user.user_metadata as any)?.full_name || "";

  const subject = "Welcome to PouchCare";
  const text = [
    `Hi${name ? " " + name : ""},`,
    "",
    "Welcome to PouchCare.",
    role === "doctor"
      ? "Thanks for joining as a doctor. We’ll email you when you’re assigned a consultation."
      : "Thanks for signing up. You can book a consultation any time from your dashboard.",
    "",
    "— PouchCare",
  ].join("\n");

  console.log("send-welcome-email: sending", { toEmail, subject });
  const sendResult = await sendTransactionalEmail({ to: toEmail, subject, text });
  console.log("send-welcome-email: send result", sendResult);

  return json({ ok: true, sendResult });
});
