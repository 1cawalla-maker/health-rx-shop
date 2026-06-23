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

function dashboardPathForRole(role: string | null | undefined) {
  switch (role) {
    case "patient":
      return "/patient/dashboard";
    case "doctor":
      return "/doctor/halaxy-consults";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase service env is not configured");

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Missing authenticated Google session." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: currentUserErr } = await userClient.auth.getUser();
    if (currentUserErr || !userData?.user) {
      return json({ error: "Google sign-in did not return a valid session." }, 401);
    }

    const user = userData.user as any;
    const { data: adminUserData, error: adminUserErr } = await admin.auth.admin.getUserById(user.id);
    if (adminUserErr || !adminUserData?.user) throw new Error(adminUserErr?.message || "Auth user not found");

    const authUser = adminUserData.user as any;
    const identities = Array.isArray(authUser.identities) ? authUser.identities : [];
    const googleIdentity = identities.find((identity: any) => identity?.provider === "google");
    if (!googleIdentity) {
      return json({ error: "Google sign-in was not completed. Use mobile or email code." }, 403);
    }

    const identityData = googleIdentity.identity_data || {};
    const googleEmail = normalizeEmail(identityData.email || authUser.email || user.email);
    const googleProviderId = String(identityData.sub || googleIdentity.id || googleIdentity.identity_id || "").trim();
    if (!googleEmail || !googleProviderId) {
      return json({ error: "Google did not return a usable verified identity." }, 403);
    }

    const { data: profiles, error: profileErr } = await admin
      .from("profiles")
      .select("user_id,email,google_provider_id,google_email")
      .ilike("email", googleEmail)
      .limit(2);
    if (profileErr) throw new Error(profileErr.message);

    if (!profiles || profiles.length === 0) {
      return json({ error: "No approved patient account was found for that Google email. Use mobile code or create an account first." }, 404);
    }
    if (profiles.length > 1) {
      return json({ error: "More than one account matches that Google email. Use mobile code or contact support." }, 409);
    }

    const profile = profiles[0] as { user_id: string; email: string | null; google_provider_id: string | null; google_email: string | null };
    if (!profile.user_id) return json({ error: "Patient account is missing a user link. Contact support." }, 409);

    const { data: roles, error: roleErr } = await admin
      .from("user_roles")
      .select("role,status")
      .eq("user_id", profile.user_id);
    if (roleErr) throw new Error(roleErr.message);

    const approvedPatient = (roles || []).some((row: any) => row.role === "patient" && row.status === "approved");
    const staffRole = (roles || []).some((row: any) => ["admin", "doctor"].includes(row.role));
    if (staffRole) return json({ error: "Staff accounts use mobile code login." }, 403);
    if (!approvedPatient) return json({ error: "This patient account is not approved for Google login yet." }, 403);

    if (profile.user_id !== authUser.id) {
      return json({ error: "Google returned a separate login for this email. Use mobile code first or contact support to link Google safely." }, 409);
    }

    if (profile.google_provider_id && profile.google_provider_id !== googleProviderId) {
      return json({ error: "This patient account is already linked to a different Google login. Use mobile code or contact support." }, 409);
    }

    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        google_provider_id: googleProviderId,
        google_email: googleEmail,
        google_linked_at: new Date().toISOString(),
        email_verified_at: new Date().toISOString(),
        email_verification_method: "google_oauth",
      })
      .eq("user_id", authUser.id)
      .ilike("email", googleEmail);
    if (updateErr) throw new Error(updateErr.message);

    return json({ ok: true, role: "patient", path: dashboardPathForRole("patient") });
  } catch (error) {
    console.error("finalize-patient-google-login failed", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
