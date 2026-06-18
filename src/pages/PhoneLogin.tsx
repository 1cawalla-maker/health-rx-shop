import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo from '@/components/seo/Seo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getDashboardPathForRole } from '@/lib/roleRoutes';

function normalizeAuMobile(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^4\d{8}$/.test(digits)) return `+61${digits}`;
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export default function PhoneLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intendedRole = searchParams.get('role');
  const [phone, setPhone] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);

  const title = useMemo(() => intendedRole === 'doctor' ? 'Doctor phone login' : intendedRole === 'admin' ? 'Admin phone login' : 'Phone login', [intendedRole]);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneE164 = normalizeAuMobile(phone);
    if (!phoneE164) {
      toast.error('Enter a valid Australian mobile number.');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneE164,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setPendingPhone(phoneE164);
      setStep('otp');
      toast.success('Verification code sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send verification code.');
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
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error('Login succeeded but no session was returned.');

      const { data: roleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role,status')
        .eq('user_id', userId)
        .maybeSingle();
      if (roleError) throw roleError;
      if (!roleRow || roleRow.status !== 'approved') throw new Error('This account is not approved yet.');
      if (intendedRole && roleRow.role !== intendedRole) throw new Error(`This mobile is not registered as a ${intendedRole}.`);

      const path = getDashboardPathForRole(roleRow.role) || '/';
      navigate(path, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not verify code.');
    } finally {
      setBusy(false);
    }
  };

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
                Use the mobile number registered with PouchCare. No shared passwords.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'phone' ? (
                <form onSubmit={sendCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" inputMode="tel" required />
                  </div>
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
                    Send code
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New patient? <Link className="underline" to="/start-consult">Start a consult</Link>
                  </p>
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
                    <p className="text-xs text-muted-foreground">Sent to {pendingPhone}</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Log in
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('phone')} disabled={busy}>
                    Change mobile
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
