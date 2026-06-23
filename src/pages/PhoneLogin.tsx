import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo from '@/components/seo/Seo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getDashboardPathForRole } from '@/lib/roleRoutes';

const PRIVACY_POLICY_VERSION = '2026-06-18-existing-prescription-upload';
const COLLECTION_NOTICE_VERSION = '2026-06-18-existing-prescription-upload';
const AGE_ATTESTATION_VERSION = '2026-06-18-adult-only';

function normalizeAuMobile(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^4\d{8}$/.test(digits)) return `+61${digits}`;
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export default function PhoneLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intendedRole = searchParams.get('role') || 'patient';
  const nextPath = safeNextPath(searchParams.get('next'));
  const isPatient = intendedRole === 'patient';
  const isUploadPrescriptionFlow = nextPath === '/patient/upload-prescription';
  const createPatientAccount = isPatient && (isUploadPrescriptionFlow || searchParams.get('mode') === 'signup' || searchParams.get('create') === '1');
  const [phone, setPhone] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const title = useMemo(() => {
    if (intendedRole === 'doctor') return 'Doctor phone login';
    if (intendedRole === 'admin') return 'Admin phone login';
    if (createPatientAccount) return 'Create patient account';
    if (isPatient) return 'Log in to PouchCare';
    return 'Patient phone login';
  }, [createPatientAccount, intendedRole, isPatient]);

  const destinationDescription = nextPath === '/patient/upload-prescription'
    ? 'After verification, you will go straight to prescription upload.'
    : 'After verification, you will continue to your patient account.';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const normalizeEmail = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
    return trimmed;
  };

  const startResendCooldown = () => setResendCooldown(30);

  const otpDestination = authMethod === 'email' ? pendingEmail : pendingPhone;

  const preparePatientEmailLogin = async (emailAddress: string) => {
    const { data, error } = await supabase.functions.invoke('prepare-patient-email-login', {
      body: { email: emailAddress },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
  };

  const savePatientAccount = async (userId: string, phoneE164: string) => {
    const now = new Date().toISOString();

    const { error: roleError } = await (supabase as any)
      .from('user_roles')
      .upsert({ user_id: userId, role: 'patient', status: 'approved' }, { onConflict: 'user_id,role' });
    if (roleError) throw roleError;

    const { error: patientProfileError } = await (supabase as any)
      .from('patient_profiles')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });
    if (patientProfileError) throw patientProfileError;

    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: fullName.trim(),
        email: normalizeEmail(email),
        email_verified_at: null,
        email_verification_method: null,
        phone: phoneE164,
        phone_verified_at: now,
        phone_verification_method: 'supabase_sms_otp',
        age_attested_at: now,
        age_attestation_version: AGE_ATTESTATION_VERSION,
        privacy_notice_accepted_at: now,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        collection_notice_version: COLLECTION_NOTICE_VERSION,
        minimal_onboarding_completed_at: now,
      }, { onConflict: 'user_id' });
    if (profileError) throw profileError;
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneE164 = normalizeAuMobile(phone);
    if (!phoneE164) {
      toast.error('Enter a valid Australian mobile number.');
      return;
    }

    if (createPatientAccount) {
      if (!fullName.trim()) {
        toast.error('Enter your full name.');
        return;
      }
      if (!normalizeEmail(email)) {
        toast.error('Enter a valid email address.');
        return;
      }
      if (!ageConfirmed || !privacyAccepted) {
        toast.error('Please confirm the required patient account acknowledgements.');
        return;
      }
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneE164,
        options: { shouldCreateUser: createPatientAccount },
      });
      if (error) throw error;
      setPendingPhone(phoneE164);
      setStep('otp');
      startResendCooldown();
      toast.success('Verification code sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send verification code.');
    } finally {
      setBusy(false);
    }
  };


  const sendEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPatient || createPatientAccount) return;

    const emailAddress = normalizeEmail(email);
    if (!emailAddress) {
      toast.error('Enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      await preparePatientEmailLogin(emailAddress);
      const { error } = await supabase.auth.signInWithOtp({
        email: emailAddress,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setPendingEmail(emailAddress);
      setPendingPhone('');
      setAuthMethod('email');
      setStep('otp');
      startResendCooldown();
      toast.success('Verification code sent by email.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send email verification code.');
    } finally {
      setBusy(false);
    }
  };


  const resendCode = async () => {
    if (resendCooldown > 0) return;
    setBusy(true);
    try {
      if (authMethod === 'email') {
        if (!pendingEmail) return;
        await preparePatientEmailLogin(pendingEmail);
        const { error } = await supabase.auth.signInWithOtp({
          email: pendingEmail,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        toast.success('New email verification code sent.');
      } else {
        if (!pendingPhone) return;
        const { error } = await supabase.auth.signInWithOtp({
          phone: pendingPhone,
          options: { shouldCreateUser: createPatientAccount },
        });
        if (error) throw error;
        toast.success('New verification code sent.');
      }
      setOtp('');
      startResendCooldown();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not resend verification code.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.replace(/\D/g, '');
    if (token.length !== 6) {
      toast.error('Enter the 6-digit code.');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = authMethod === 'email'
        ? await supabase.auth.verifyOtp({ email: pendingEmail, token, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: pendingPhone, token, type: 'sms' });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error('Login succeeded but no session was returned.');

      if (createPatientAccount) {
        await savePatientAccount(userId, pendingPhone);
      }

      if (authMethod === 'email') {
        const { error: emailProfileError } = await (supabase as any)
          .from('profiles')
          .update({
            email_verified_at: new Date().toISOString(),
            email_verification_method: 'supabase_email_otp',
          })
          .eq('user_id', userId)
          .ilike('email', pendingEmail);
        if (emailProfileError) throw emailProfileError;
      }

      const { data: roleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role,status')
        .eq('user_id', userId)
        .maybeSingle();
      if (roleError) throw roleError;
      if (!roleRow || roleRow.status !== 'approved') throw new Error('This account is not approved yet.');
      if (intendedRole && roleRow.role !== intendedRole) throw new Error(`This mobile is not registered as a ${intendedRole}.`);

      const path = nextPath || getDashboardPathForRole(roleRow.role) || '/';
      navigate(path, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not verify code.');
    } finally {
      setBusy(false);
    }
  };

  const loginPath = nextPath && !isUploadPrescriptionFlow
    ? `/phone-login?role=patient&next=${encodeURIComponent(nextPath)}`
    : '/phone-login?role=patient';
  const uploadSignupPath = '/phone-login?role=patient&mode=signup&next=/patient/upload-prescription';

  return (
    <PublicLayout>
      <Seo title={title} description="Log in to PouchCare with a secure SMS code." canonicalPath="/phone-login" noIndex />
      <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
        <div className="container max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
                {title}
              </CardTitle>
              <CardDescription>
                {createPatientAccount
                  ? 'Create a patient account with SMS verification before uploading your prescription.'
                  : isPatient
                    ? 'Use mobile code or email code. Staff should use mobile code only.'
                    : 'Use the mobile number registered with PouchCare. No shared passwords.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'phone' ? (
                <form onSubmit={authMethod === 'email' ? sendEmailCode : sendCode} className="space-y-5">
                  {isPatient && !createPatientAccount && (
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                      <Button type="button" variant={authMethod === 'phone' ? 'default' : 'ghost'} onClick={() => setAuthMethod('phone')} className="gap-2">
                        <Phone className="h-4 w-4" /> Mobile code
                      </Button>
                      <Button type="button" variant={authMethod === 'email' ? 'default' : 'ghost'} onClick={() => setAuthMethod('email')} className="gap-2">
                        <Mail className="h-4 w-4" /> Email code
                      </Button>
                    </div>
                  )}
                  {createPatientAccount && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your legal name" required />
                    </div>
                  )}
                  {createPatientAccount && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" autoComplete="email" required />
                    </div>
                  )}
                  {authMethod === 'phone' ? (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile number</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" inputMode="tel" required />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="loginEmail">Email address</Label>
                      <Input id="loginEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" autoComplete="email" required />
                      <p className="text-xs text-muted-foreground">Email login only works for existing approved patient accounts. Staff must use mobile code.</p>
                    </div>
                  )}
                  {createPatientAccount && (
                    <div className="space-y-3 rounded-lg border p-3 text-sm">
                      <label className="flex items-start gap-3">
                        <Checkbox checked={ageConfirmed} onCheckedChange={(checked) => setAgeConfirmed(checked === true)} />
                        <span>I confirm I am 18 years or older.</span>
                      </label>
                      <label className="flex items-start gap-3">
                        <Checkbox checked={privacyAccepted} onCheckedChange={(checked) => setPrivacyAccepted(checked === true)} />
                        <span>I agree to PouchCare collecting and using my details to create my account and review prescription access.</span>
                      </label>
                      <p className="text-xs text-muted-foreground">{destinationDescription}</p>
                    </div>
                  )}
                  {(intendedRole === 'doctor' || intendedRole === 'admin') && (
                    <Alert>
                      <Phone className="h-4 w-4" />
                      <AlertDescription>
                        Admin and doctor accounts must already exist before phone login will work.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {authMethod === 'email' ? 'Send email code' : 'Send code'}
                  </Button>
                  {createPatientAccount ? (
                    <p className="text-center text-sm text-muted-foreground">
                      Already have a PouchCare account and not uploading now? <Link className="underline" to={loginPath}>Log in instead</Link>
                    </p>
                  ) : (
                    <div className="space-y-2 text-center text-sm text-muted-foreground">
                      <p>New patient with a prescription? <Link className="underline" to={uploadSignupPath}>Create an account to upload</Link></p>
                      <p>Need a prescription? <Link className="underline" to="/start-consult">Start a consult</Link></p>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={verifyCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Verification code</Label>
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
                    <p className="text-xs text-muted-foreground">Sent to {otpDestination}</p>
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={resendCode} disabled={busy || resendCooldown > 0}>
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : `Resend ${authMethod === 'email' ? 'email' : 'code'}`}
                  </Button>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {createPatientAccount ? 'Verify and continue' : 'Log in'}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('phone')} disabled={busy}>
                    {authMethod === 'email' ? 'Change email' : 'Change mobile'}
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
