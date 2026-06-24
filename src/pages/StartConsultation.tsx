/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, Phone, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { halaxyConsultationService } from "@/services/halaxyConsultationService";
import { getDashboardPathForRole } from "@/lib/roleRoutes";
import { formatDobForStorage, validateDob } from "@/lib/validation";

const PRIVACY_POLICY_VERSION = "2026-06-18-minimal-halaxy-consult";
const COLLECTION_NOTICE_VERSION = "2026-06-18-minimal-halaxy-consult";
const AGE_ATTESTATION_VERSION = "2026-06-18-adult-only";

function normalizeAuMobile(local: string): string | null {
  const digits = local.replace(/\D/g, "");
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^4\d{8}$/.test(digits)) return `+61${digits}`;
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = 20000,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${label} timed out. Please try again.`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function StartConsultation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userRole, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [dobError, setDobError] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [step, setStep] = useState<"details" | "otp">("details");
  const [otp, setOtp] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [otpFlow, setOtpFlow] = useState<"sms" | "phone_change">("sms");
  const [isBusy, setIsBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const normalizeEmail = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
    return trimmed;
  };

  const startResendCooldown = () => setResendCooldown(30);

  const validateDetails = () => {
    if (fullName.trim().length < 2)
      throw new Error("Please enter your full name.");
    const phoneE164 = normalizeAuMobile(phone);
    if (!phoneE164)
      throw new Error("Please enter a valid Australian mobile number.");
    if (!normalizeEmail(email))
      throw new Error("Please enter a valid email address.");
    const dobResult = validateDob(dobDay, dobMonth, dobYear);
    if (!dobResult.valid) {
      setDobError(dobResult.error || "Please enter a valid date of birth.");
      throw new Error(dobResult.error || "Please enter a valid date of birth.");
    }
    setDobError("");
    if (!ageConfirmed) throw new Error("Please confirm you are 18 or over.");
    if (!privacyAccepted)
      throw new Error("Please accept the privacy and collection notice.");
    return phoneE164;
  };

  const saveProfileAndRole = async (
    userId: string,
    phoneE164: string,
    verified: boolean,
  ) => {
    const now = new Date().toISOString();

    const { data: existingProfile } = await withTimeout(
      (supabase as any)
        .from("profiles")
        .select("phone, phone_verified_at")
        .eq("user_id", userId)
        .maybeSingle(),
      "Loading your profile",
    );

    const existingVerifiedSamePhone =
      existingProfile?.phone === phoneE164 &&
      existingProfile?.phone_verified_at;
    const phoneVerifiedAt = verified ? now : existingVerifiedSamePhone || null;

    const { error: roleError } = await withTimeout(
      (supabase as any)
        .from("user_roles")
        .upsert(
          { user_id: userId, role: "patient", status: "approved" },
          { onConflict: "user_id,role" },
        ),
      "Creating your patient access",
    );
    if (roleError) throw roleError;

    await withTimeout(
      (supabase as any)
        .from("patient_profiles")
        .upsert({ user_id: userId }, { onConflict: "user_id" }),
      "Preparing your patient profile",
    );

    const { error: profileError } = await withTimeout(
      (supabase as any).from("profiles").upsert(
        {
          user_id: userId,
          full_name: fullName.trim(),
          date_of_birth: formatDobForStorage(dobDay, dobMonth, dobYear),
          email: normalizeEmail(email),
          email_verified_at: null,
          email_verification_method: null,
          phone: phoneE164,
          phone_verified_at: phoneVerifiedAt,
          phone_verification_method: verified
            ? "supabase_sms_otp"
            : phoneVerifiedAt
              ? "supabase_sms_otp"
              : null,
          age_attested_at: now,
          age_attestation_version: AGE_ATTESTATION_VERSION,
          privacy_notice_accepted_at: now,
          privacy_policy_version: PRIVACY_POLICY_VERSION,
          collection_notice_version: COLLECTION_NOTICE_VERSION,
          minimal_onboarding_completed_at: now,
        },
        { onConflict: "user_id" },
      ),
      "Saving your details",
    );

    if (profileError) throw profileError;
  };

  const continueToHalaxy = async () => {
    const prepared = await withTimeout(
      halaxyConsultationService.prepareConsult(),
      "Opening Halaxy booking",
      30000,
    );
    const bookingUrl =
      prepared.bookingUrl || prepared.consultation.halaxyBookingUrl;
    if (bookingUrl) {
      window.location.assign(bookingUrl);
      return;
    }
    navigate(`/patient/booking/confirmation/${prepared.consultation.id}`);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      const phoneE164 = validateDetails();

      if (user?.id) {
        if (userRole?.role && userRole.role !== "patient") {
          const dashboardPath = getDashboardPathForRole(userRole.role) || "/";
          toast.error(
            "You are logged in as a staff account. Please log out or use a separate patient account to start a consultation.",
          );
          navigate(dashboardPath, { replace: true });
          return;
        }

        const existingPhone =
          typeof (user as any).phone === "string" ? (user as any).phone : "";
        if (existingPhone === phoneE164) {
          await saveProfileAndRole(user.id, phoneE164, true);
          await continueToHalaxy();
          return;
        }

        const { error } = await withTimeout(
          (supabase.auth.updateUser as any)({ phone: phoneE164 }),
          "Sending SMS code",
        );
        if (error) throw error;
        setPendingPhone(phoneE164);
        setOtpFlow("phone_change");
        setStep("otp");
        startResendCooldown();
        toast.success("Verification code sent by SMS.");
        return;
      }

      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          phone: phoneE164,
          options: { shouldCreateUser: true },
        }),
        "Sending SMS code",
      );
      if (error) throw error;
      setPendingPhone(phoneE164);
      setOtpFlow("sms");
      setStep("otp");
      startResendCooldown();
      toast.success("Verification code sent by SMS.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not start consult booking.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const resendCode = async () => {
    if (!pendingPhone || resendCooldown > 0) return;
    setIsBusy(true);
    try {
      const { error } = await withTimeout(
        otpFlow === "phone_change"
          ? (supabase.auth.updateUser as any)({ phone: pendingPhone })
          : supabase.auth.signInWithOtp({
              phone: pendingPhone,
              options: { shouldCreateUser: true },
            }),
        "Resending SMS code",
      );
      if (error) throw error;
      setOtp("");
      startResendCooldown();
      toast.success("New verification code sent by SMS.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resend SMS code.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\D/g, "").length !== 6) {
      toast.error("Please enter the 6-digit SMS code.");
      return;
    }

    setIsBusy(true);
    try {
      const { data, error } = await withTimeout(
        (supabase.auth.verifyOtp as any)({
          phone: pendingPhone,
          token: otp.replace(/\D/g, ""),
          type: otpFlow === "phone_change" ? "phone_change" : "sms",
        }),
        "Verifying SMS code",
      );
      if (error) throw error;
      const verifiedUserId =
        otpFlow === "phone_change" ? user?.id : data.user?.id;
      if (!verifiedUserId)
        throw new Error(
          "Verification succeeded but no user session was returned.",
        );

      await saveProfileAndRole(verifiedUserId, pendingPhone, true);
      toast.success("Mobile verified. Opening Halaxy booking.");
      await continueToHalaxy();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not verify mobile number.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <PublicLayout>
      <Seo
        title="Book a GP Consultation"
        description="Start a PouchCare consultation request with minimal details, then book securely through Halaxy."
        canonicalPath="/start-consult"
        noIndex
      />
      <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
        <div className="container max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Book a GP consultation
              </CardTitle>
              <CardDescription>
                Enter only the details PouchCare needs to link your Halaxy
                booking and any prescription back to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "details" ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your legal name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for account access, receipts, and prescription
                      updates.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={dobDay}
                        onChange={(e) =>
                          setDobDay(
                            e.target.value.replace(/\D/g, "").slice(0, 2),
                          )
                        }
                        placeholder="DD"
                        inputMode="numeric"
                        autoComplete="bday-day"
                        required
                      />
                      <Input
                        value={dobMonth}
                        onChange={(e) =>
                          setDobMonth(
                            e.target.value.replace(/\D/g, "").slice(0, 2),
                          )
                        }
                        placeholder="MM"
                        inputMode="numeric"
                        autoComplete="bday-month"
                        required
                      />
                      <Input
                        value={dobYear}
                        onChange={(e) =>
                          setDobYear(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          )
                        }
                        placeholder="YYYY"
                        inputMode="numeric"
                        autoComplete="bday-year"
                        required
                      />
                    </div>
                    {dobError && (
                      <p className="text-xs text-destructive">{dobError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Used to confirm adult eligibility and match clinical
                      records.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile number</Label>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                        AU
                      </span>
                      <Input
                        id="mobile"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="04xx xxx xxx"
                        inputMode="tel"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We verify this by SMS and use it to match your Halaxy
                      booking.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-lg border p-4">
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={ageConfirmed}
                        onCheckedChange={(v) => setAgeConfirmed(v === true)}
                      />
                      <span>I confirm I am 18 years or older.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={privacyAccepted}
                        onCheckedChange={(v) => setPrivacyAccepted(v === true)}
                      />
                      <span>
                        I agree to PouchCare collecting these details to create
                        my account, link my Halaxy booking, and process
                        prescriptions under the{" "}
                        <Link className="underline" to="/privacy">
                          Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link className="underline" to="/terms">
                          Terms
                        </Link>
                        .
                      </span>
                    </label>
                  </div>

                  <Alert>
                    <Phone className="h-4 w-4" />
                    <AlertDescription>
                      Halaxy will collect the clinical and booking details
                      needed for the consultation. PouchCare only uses this
                      mobile number to match the booking and prescription back
                      to you.
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isBusy || authLoading}
                  >
                    {isBusy || authLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Verify mobile and continue
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Enter SMS code</Label>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-xs text-muted-foreground">
                      Sent to {pendingPhone}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={resendCode}
                    disabled={isBusy || resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend code"}
                  </Button>
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Verify and continue to Halaxy
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("details")}
                    disabled={isBusy}
                  >
                    Change details
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
