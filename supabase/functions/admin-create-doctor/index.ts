import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeAuMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^4\d{8}$/.test(digits)) return `+61${digits}`;
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Missing bearer token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service env is not configured");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerRes, error: callerErr } = await admin.auth.getUser(jwt);
    if (callerErr || !callerRes?.user?.id) return json({ error: "Invalid session" }, 401);

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role,status")
      .eq("user_id", callerRes.user.id)
      .eq("role", "admin")
      .eq("status", "approved")
      .maybeSingle();
    if (roleErr || roleRow?.role !== "admin") return json({ error: "Admin role required" }, 403);

    const body = await req.json().catch(() => ({}));
    const fullName = String(body?.fullName || "").trim();
    const phone = normalizeAuMobile(String(body?.phone || ""));
    const emailRaw = String(body?.email || "").trim().toLowerCase();
    const email = emailRaw || undefined;
    const providerNumber = String(body?.providerNumber || "").trim() || null;
    const halaxyPractitionerId = String(body?.halaxyPractitionerId || "").trim() || null;

    if (fullName.length < 2) return json({ error: "Doctor full name is required" }, 400);
    if (!phone) return json({ error: "Valid Australian mobile number is required" }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      phone,
      email,
      phone_confirm: true,
      email_confirm: Boolean(email),
      user_metadata: { full_name: fullName, role: "doctor" },
      app_metadata: { role: "doctor", created_by_admin: callerRes.user.id },
    });

    if (createErr || !created?.user?.id) {
      const msg = createErr?.message || "Could not create doctor user";
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return json({ error: "A user with that phone/email already exists. Link existing-user flow is not enabled yet." }, 409);
      }
      throw new Error(msg);
    }

    const userId = created.user.id;
    const now = new Date().toISOString();

    const { error: profileErr } = await admin
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: fullName,
        phone,
        phone_verified_at: now,
        phone_verification_method: "admin_confirmed_phone_otp_login",
      }, { onConflict: "user_id" });
    if (profileErr) throw new Error(profileErr.message);

    const { error: roleUpsertErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "doctor", status: "approved" }, { onConflict: "user_id,role" });
    if (roleUpsertErr) throw new Error(roleUpsertErr.message);

    const { data: doctor, error: doctorErr } = await admin
      .from("doctors")
      .upsert({
        user_id: userId,
        provider_number: providerNumber,
        is_active: true,
        registration_complete: true,
        halaxy_practitioner_id: halaxyPractitionerId,
        onboarding_invited_at: now,
      }, { onConflict: "user_id" })
      .select("id,user_id,provider_number,is_active,halaxy_practitioner_id")
      .single();
    if (doctorErr) throw new Error(doctorErr.message);

    await admin.from("doctor_profiles").upsert({ user_id: userId }, { onConflict: "user_id" });

    return json({
      doctor,
      user: { id: userId, phone, email: email || null, fullName },
      loginUrl: `${Deno.env.get("APP_ORIGIN") || "https://www.pouchcare.com.au"}/phone-login?role=doctor`,
      message: "Doctor created. Share the login URL and their registered mobile number.",
    });
  } catch (error) {
    console.error("admin-create-doctor failed", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
