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

function normalizeEmail(value: unknown): string | null {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service env is not configured");

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    if (!email) return json({ error: "Enter a valid email address." }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profiles, error: profileErr } = await admin
      .from("profiles")
      .select("user_id,email")
      .ilike("email", email)
      .limit(2);
    if (profileErr) throw new Error(profileErr.message);

    if (!profiles || profiles.length === 0) {
      return json({ error: "No patient account was found for that email. Use mobile code or create an account first." }, 404);
    }
    if (profiles.length > 1) {
      return json({ error: "More than one account matches that email. Use mobile code or contact support." }, 409);
    }

    const profile = profiles[0] as { user_id: string; email: string | null };
    if (!profile.user_id) return json({ error: "Patient account is missing a user link. Contact support." }, 409);

    const { data: roles, error: roleErr } = await admin
      .from("user_roles")
      .select("role,status")
      .eq("user_id", profile.user_id);
    if (roleErr) throw new Error(roleErr.message);

    const approvedPatient = (roles || []).some((row: any) => row.role === "patient" && row.status === "approved");
    const staffRole = (roles || []).some((row: any) => ["admin", "doctor"].includes(row.role));
    if (staffRole) return json({ error: "Staff accounts must use mobile code login." }, 403);
    if (!approvedPatient) return json({ error: "This patient account is not approved for email login yet." }, 403);

    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(profile.user_id);
    if (userErr || !userRes?.user) throw new Error(userErr?.message || "Auth user not found");

    const authEmail = (userRes.user.email || "").trim().toLowerCase();
    if (authEmail && authEmail !== email) {
      return json({ error: "This account has a different auth email. Use mobile code or contact support." }, 409);
    }

    if (!authEmail) {
      const { error: updateErr } = await admin.auth.admin.updateUserById(profile.user_id, {
        email,
        email_confirm: true,
        user_metadata: {
          ...(userRes.user.user_metadata || {}),
          email_login_prepared_at: new Date().toISOString(),
        },
      });
      if (updateErr) {
        const msg = updateErr.message || "Could not prepare email login";
        if (/already|duplicate|exists/i.test(msg)) {
          return json({ error: "That email is already linked to another login. Use mobile code or contact support." }, 409);
        }
        throw new Error(msg);
      }
    }

    return json({ ok: true, email });
  } catch (error) {
    console.error("prepare-patient-email-login failed", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
