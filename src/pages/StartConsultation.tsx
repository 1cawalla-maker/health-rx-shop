/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
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
import { Loader2, ShieldCheck, Phone, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { halaxyConsultationService } from '@/services/halaxyConsultationService';

const PRIVACY_POLICY_VERSION = '2026-06-18-minimal-halaxy-consult';
const COLLECTION_NOTICE_VERSION = '2026-06-18-minimal-halaxy-consult';
const AGE_ATTESTATION_VERSION = '2026-06-18-adult-only';

function normalizeAuMobile(local: string): string | null {
  const digits = local.replace(/\D/g, '');
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^4\d{8}$/.test(digits)) return `+61${digits}`;
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export default function StartConsultation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const validateDetails = () => {
    if (fullName.trim().length < 2) throw new Error('Please enter your full name.');
    const phoneE164 = normalizeAuMobile(phone);
    if (!phoneE164) throw new Error('Please enter a valid Australian mobile number.');
    if (!ageConfirmed) throw new Error('Please confirm you are 18 or over.');
    if (!privacyAccepted) throw new Error('Please accept the privacy and collection notice.');
    return phoneE164;
  };

  const saveProfileAndRole = async (userId: string, phoneE164: string, verified: boolean) => {
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
        phone: phoneE164,
        phone_verified_at: phoneVerifiedAt,
        phone_verification_method: verified ? 'supabase_sms_otp' : (phoneVerifiedAt ? 'supabase_sms_otp' : null),
        age_attested_at: now,
        age_attestation_version: AGE_ATTESTATION_VERSION,
        privacy_notice_accepted_at: now,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        collection_notice_version: COLLECTION_NOTICE_VERSION,
        minimal_onboarding_completed_at: now,
      }, { onConflict: 'user_id' });

    if (profileError) throw profileError;
  };

  const continueToHalaxy = async () => {
    const prepared = await halaxyConsultationService.prepareConsult();
    const bookingUrl = prepared.bookingUrl || prepared.consultation.halaxyBookingUrl;
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
        await saveProfileAndRole(user.id, phoneE164, Boolean((user as any).phone === phoneE164));
        await continueToHalaxy();
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
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: otp.replace(/\D/g, ''),
        type: 'sms',
      });
      if (error) throw error;
      const verifiedUserId = data.user?.id;
      if (!verifiedUserId) throw new Error('Verification succeeded but no user session was returned.');

      await saveProfileAndRole(verifiedUserId, pendingPhone, true);
      toast.success('Mobile verified. Opening Halaxy booking.');
      await continueToHalaxy();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not verify mobile number.');
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
                Enter only the details PouchCare needs to link your Halaxy booking and any prescription back to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'details' ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your legal name" required />
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
