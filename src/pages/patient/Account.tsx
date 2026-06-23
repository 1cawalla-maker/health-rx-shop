import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userProfileService } from '@/services/userProfileService';
import { supabase } from '@/integrations/supabase/client';
import { validateDob, formatDobForStorage, parseDobFromStorage, validateAuPhone, stripAuPrefix } from '@/lib/validation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Save } from 'lucide-react';
import { toast } from 'sonner';

function normalizeEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export default function PatientAccount() {
  const { user } = useAuth();

  const [contactEmail, setContactEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [fullName, setFullName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [dobError, setDobError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadProfile = async () => {
      const localProfile = userProfileService.getProfile(user.id);
      if (localProfile && !cancelled) {
        setContactEmail(localProfile.contactEmail || user.email || '');
        setFullName(localProfile.fullName || '');
        const dob = parseDobFromStorage(localProfile.dateOfBirth);
        setDobDay(dob.day);
        setDobMonth(dob.month);
        setDobYear(dob.year);
        setPhone(stripAuPrefix(localProfile.phoneE164));
      } else if (!cancelled) {
        setContactEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone, date_of_birth')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error('Failed to load profile from Supabase:', error);
        return;
      }

      if (data) {
        setContactEmail((data as any).email || user.email || '');
        setFullName((data as any).full_name || '');
        const dob = parseDobFromStorage((data as any).date_of_birth || null);
        setDobDay(dob.day);
        setDobMonth(dob.month);
        setDobYear(dob.year);
        setPhone(stripAuPrefix((data as any).phone || ''));
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email, user?.user_metadata?.full_name]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setPhone(digits);
    setPhoneError('');
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const normalizedEmail = normalizeEmail(contactEmail);
    if (!normalizedEmail) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError('');

    const pErr = validateAuPhone(phone);
    if (pErr) {
      setPhoneError(pErr);
      return;
    }
    setPhoneError('');

    if (dobDay || dobMonth || dobYear) {
      const dobResult = validateDob(dobDay, dobMonth, dobYear);
      if (!dobResult.valid) {
        setDobError(dobResult.error || 'Invalid date of birth');
        return;
      }
    }
    setDobError('');

    setSaving(true);

    const phoneE164 = `+61${phone}`;
    const dateOfBirth = (dobDay && dobMonth && dobYear) ? formatDobForStorage(dobDay, dobMonth, dobYear) : null;

    // Keep a local cache for UI responsiveness, but Supabase is the source of truth.
    userProfileService.upsertProfile(user.id, {
      contactEmail: normalizedEmail,
      fullName,
      dateOfBirth,
      phoneE164,
      timezone: 'Australia/Brisbane',
    });

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: fullName || null,
            email: normalizedEmail,
            phone: phoneE164 || null,
            date_of_birth: dateOfBirth,
          } as any,
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      toast.success('Account settings saved');
    } catch (err) {
      console.error('Failed to save profile to Supabase:', err);
      toast.error('Could not sync profile to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and login details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Details
          </CardTitle>
          <CardDescription>Update the details PouchCare uses for your patient account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Account email
            </Label>
            <Input
              id="account-contact-email"
              value={contactEmail}
              onChange={(e) => { setContactEmail(e.target.value); setEmailError(''); }}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
            />
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            <p className="text-xs text-muted-foreground">
              Used for account access, receipts, and prescription updates. Email-code login will be enabled after verification is configured.
            </p>
            {user?.email && user.email !== contactEmail && (
              <Badge variant="outline" className="w-fit">Auth email: {user.email}</Badge>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="account-name">Full Name</Label>
            <Input
              id="account-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="DD"
                maxLength={2}
                value={dobDay}
                onChange={(e) => { setDobDay(e.target.value.replace(/\D/g, '').slice(0, 2)); setDobError(''); }}
              />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={dobMonth}
                onChange={(e) => { setDobMonth(e.target.value.replace(/\D/g, '').slice(0, 2)); setDobError(''); }}
              />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="YYYY"
                maxLength={4}
                value={dobYear}
                onChange={(e) => { setDobYear(e.target.value.replace(/\D/g, '').slice(0, 4)); setDobError(''); }}
              />
            </div>
            {dobError && <p className="text-xs text-destructive">{dobError}</p>}
          </div>

          <div className="space-y-1">
            <Label>Mobile Number</Label>
            <div className="flex items-center gap-2">
              <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                +61
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="4xx xxx xxx"
                maxLength={9}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="flex-1"
              />
            </div>
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
