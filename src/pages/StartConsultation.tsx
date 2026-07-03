/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { CheckCircle2, Loader2, ShieldCheck, Phone, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { halaxyConsultationService } from '@/services/halaxyConsultationService';
import { formatDobForStorage, parseDobFromStorage, validateDob } from '@/lib/validation';

const PRIVACY_POLICY_VERSION = '2026-06-18-minimal-halaxy-consult';
const COLLECTION_NOTICE_VERSION = '2026-06-18-minimal-halaxy-consult';
const AGE_ATTESTATION_VERSION = '2026-06-18-adult-only';
const PRE_HALAXY_ACKNOWLEDGEMENT_VERSION = '2026-07-03-website-pre-halaxy-gate-v1';

function normalizeAuMobile(local: string): string | null {
  const digits = local.replace(/\D/g, '');
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^4\d{8}$/.test(digits)) return `+61${digits}`;
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export default function StartConsultation() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [phone, setPhone] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [noGuaranteeAccepted, setNoGuaranteeAccepted] = useState(false);
  const [importComplianceAccepted, setImportComplianceAccepted] = useState(false);
  const [supplierTermsAccepted, setSupplierTermsAccepted] = useState(false);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setEmail(user.email || '');
    setFullName((user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || '');

    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('full_name, phone, date_of_birth, phone_verified_at, age_attested_at, privacy_notice_accepted_at, pre_halaxy_acknowledged_at, minimal_onboarding_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled || !data) return;
      if (data.full_name) setFullName(data.full_name);
      if (data.phone) setPhone(data.phone);
      const dob = parseDobFromStorage(data.date_of_birth);
      setDobDay(dob.day);
      setDobMonth(dob.month);
      setDobYear(dob.year);

      const hasCompletedConsultSetup = Boolean(
        data.full_name &&
        data.phone &&
        data.date_of_birth &&
        data.phone_verified_at &&
        data.age_attested_at &&
        data.privacy_notice_accepted_at &&
        data.pre_halaxy_acknowledged_at &&
        data.minimal_onboarding_completed_at
      );

      if (userRole?.role === 'patient' && hasCompletedConsultSetup) {
        navigate('/patient/book', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, user?.id, user?.email, user?.user_metadata, userRole?.role]);

  const validateDetails = () => {
    if (fullName.trim().length < 2) throw new Error('Please enter your full name.');
    const dob = validateDob(dobDay, dobMonth, dobYear);
    if (!dob.valid) throw new Error(dob.error || 'Please enter a valid date of birth.');
    const phoneE164 = normalizeAuMobile(phone);
    if (!phoneE164) throw new Error('Please enter a valid Australian mobile number.');
    if (!ageConfirmed) throw new Error('Please confirm you are 18 or over.');
    if (!privacyAccepted) throw new Error('Please accept the privacy and collection notice.');
    if (!noGuaranteeAccepted) throw new Error('Please acknowledge that treatment, prescription and supply are not guaranteed.');
    if (!importComplianceAccepted) throw new Error('Please acknowledge the import/compliance notice.');
    if (!supplierTermsAccepted) throw new Error('Please acknowledge the supplier, ordering, payment and delivery terms.');
    return { phoneE164, dateOfBirth: formatDobForStorage(dobDay, dobMonth, dobYear) };
  };

  const saveProfileAndRole = async (userId: string, phoneE164: string, dateOfBirth: string, verified: boolean) => {
    const now = new Date().toISOString();

    const { data: existingProfile } = await (supabase as any)
      .from('profiles')
      .select('phone, phone_verified_at')
      .eq('user_id', userId)
      .maybeSingle();

    const existingVerifiedSamePhone = existingProfile?.phone === phoneE164 && existingProfile?.phone_verified_at;
    const phoneVerifiedAt = verified ? now : existingVerifiedSamePhone || null;

    const { error: roleError } = await (supabase as any)
      .from('user_roles')
      .upsert({ user_id: userId, role: 'patient', status: 'approved' }, { onConflict: 'user_id,role' });
    if (roleError) throw roleError;

    await (supabase as any)
      .from('patient_profiles')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });

    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        phone: phoneE164,
        phone_verified_at: phoneVerifiedAt,
        phone_verification_method: verified ? 'supabase_sms_otp' : (phoneVerifiedAt ? 'supabase_sms_otp' : null),
        age_attested_at: now,
        age_attestation_version: AGE_ATTESTATION_VERSION,
        privacy_notice_accepted_at: now,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        collection_notice_version: COLLECTION_NOTICE_VERSION,
        pre_halaxy_acknowledged_at: now,
        pre_halaxy_acknowledgement_version: PRE_HALAXY_ACKNOWLEDGEMENT_VERSION,
        pre_halaxy_acknowledgements: {
          no_guaranteed_prescription_treatment_supply: true,
          import_compliance_and_legal_requirements: true,
          supplier_fulfilment_ordering_payment_delivery_terms: true,
          halaxy_clinical_intake_after_pouchcare_gate: true,
        },
        minimal_onboarding_completed_at: now,
      }, { onConflict: 'user_id' });

    if (profileError) throw profileError;
  };

  const continueToHalaxy = async (halaxyTab?: Window | null) => {
    const prepared = await halaxyConsultationService.prepareConsult();
    const bookingUrl = prepared.bookingUrl || prepared.consultation.halaxyBookingUrl;
    if (bookingUrl) {
      if (halaxyTab && !halaxyTab.closed) {
        halaxyTab.opener = null;
        halaxyTab.location.href = bookingUrl;
      } else {
        const opened = window.open(bookingUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          window.location.assign(bookingUrl);
          return;
        }
      }

      navigate(`/patient/booking/confirmation/${prepared.consultation.id}`);
      return;
    }
    if (halaxyTab && !halaxyTab.closed) halaxyTab.close();
    navigate(`/patient/booking/confirmation/${prepared.consultation.id}`);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    let halaxyTab: Window | null = null;
    try {
      const { phoneE164, dateOfBirth } = validateDetails();

      if (user?.id) {
        halaxyTab = window.open('', '_blank');
        await saveProfileAndRole(user.id, phoneE164, dateOfBirth, Boolean((user as any).phone === phoneE164));
        await continueToHalaxy(halaxyTab);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneE164,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setPendingPhone(phoneE164);
      setStep('otp');
      toast.success('Verification code sent by SMS.');
    } catch (error) {
      if (halaxyTab && !halaxyTab.closed) halaxyTab.close();
      toast.error(error instanceof Error ? error.message : 'Could not start consult booking.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\D/g, '').length !== 6) {
      toast.error('Please enter the 6-digit SMS code.');
      return;
    }

    setIsBusy(true);
    const halaxyTab = window.open('', '_blank');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: otp.replace(/\D/g, ''),
        type: 'sms',
      });
      if (error) throw error;
      const verifiedUserId = data.user?.id;
      if (!verifiedUserId) throw new Error('Verification succeeded but no user session was returned.');

      const { dateOfBirth } = validateDetails();
      await saveProfileAndRole(verifiedUserId, pendingPhone, dateOfBirth, true);
      toast.success('Mobile verified. Opening Halaxy booking.');
      await continueToHalaxy(halaxyTab);
    } catch (error) {
      if (halaxyTab && !halaxyTab.closed) halaxyTab.close();
      toast.error(error instanceof Error ? error.message : 'Could not verify mobile number.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleContinue = async () => {
    setIsBusy(true);
    try {
      sessionStorage.setItem('authReturnTo', '/start-consult');
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error) {
      setIsBusy(false);
      toast.error(error instanceof Error ? error.message : 'Could not continue with Google.');
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
                Complete PouchCare’s account, verification and pathway acknowledgements first. Halaxy then collects the clinical intake and booking details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'details' ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  {user ? (
                    <Alert className="border-primary/30 bg-primary/5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        Google account connected{email ? ` as ${email}` : ''}. Finish the remaining details below so we can match your Halaxy booking and prescription.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button type="button" variant="outline" className="w-full" onClick={handleGoogleContinue} disabled={isBusy}>
                      {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Continue with Google
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your legal name" required />
                  </div>

                  {user ? (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input id="email" value={email} readOnly className="bg-muted/30" />
                      <p className="text-xs text-muted-foreground">This is the Google account attached to your PouchCare account.</p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={dobDay} onChange={(e) => setDobDay(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="DD" inputMode="numeric" required />
                      <Input value={dobMonth} onChange={(e) => setDobMonth(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="MM" inputMode="numeric" required />
                      <Input value={dobYear} onChange={(e) => setDobYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="YYYY" inputMode="numeric" required />
                    </div>
                    <p className="text-xs text-muted-foreground">Used to confirm adult eligibility and match clinical records.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile number</Label>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">AU</span>
                      <Input id="mobile" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" inputMode="tel" required />
                    </div>
                    <p className="text-xs text-muted-foreground">We verify this by SMS and use it to match your Halaxy booking.</p>
                  </div>

                  <div className="space-y-3 rounded-lg border p-4">
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox checked={ageConfirmed} onCheckedChange={(v) => setAgeConfirmed(v === true)} />
                      <span>I confirm I am 18 years or older.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox checked={privacyAccepted} onCheckedChange={(v) => setPrivacyAccepted(v === true)} />
                      <span>
                        I agree to PouchCare collecting these details to create my account, link my Halaxy booking, and process prescriptions under the <Link className="underline" to="/privacy">Privacy Policy</Link> and <Link className="underline" to="/terms">Terms</Link>.
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3 rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Before continuing to Halaxy</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        These PouchCare acknowledgements sit outside the Halaxy clinical form so the practitioner only sees GP-relevant clinical questions.
                      </p>
                    </div>
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox checked={noGuaranteeAccepted} onCheckedChange={(v) => setNoGuaranteeAccepted(v === true)} />
                      <span>I understand that continuing does not guarantee treatment, a prescription, product supply, ordering access, importation approval, or delivery.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox checked={importComplianceAccepted} onCheckedChange={(v) => setImportComplianceAccepted(v === true)} />
                      <span>I understand that any prescription, supply, importation, and use must comply with applicable Australian laws and requirements.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox checked={supplierTermsAccepted} onCheckedChange={(v) => setSupplierTermsAccepted(v === true)} />
                      <span>I understand that supplier fulfilment, ordering, payment, delivery, prescription upload, and entitlement checks are handled through PouchCare where relevant, and are separate from the Halaxy clinical consultation.</span>
                    </label>
                  </div>

                  <Alert>
                    <Phone className="h-4 w-4" />
                    <AlertDescription>
                      Halaxy will collect the clinical and booking details needed for the consultation. PouchCare only uses this mobile number to match the booking and prescription back to you.
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" className="w-full gap-2" disabled={isBusy}>
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    {user ? 'Continue to Halaxy' : 'Send SMS code'}
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
                    <p className="text-xs text-muted-foreground">Sent to {pendingPhone}</p>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isBusy}>
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Verify and continue to Halaxy
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('details')} disabled={isBusy}>
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
