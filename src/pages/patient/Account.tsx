import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userPreferencesService } from '@/services/userPreferencesService';
import { userProfileService } from '@/services/userProfileService';
import { AU_TIMEZONE_OPTIONS } from '@/lib/timezones';
import { validateDob, formatDobForStorage, parseDobFromStorage, validateAuPhone, stripAuPrefix } from '@/lib/validation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, User, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientAccount() {
  const { user } = useAuth();

  const [contactEmail, setContactEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [dobError, setDobError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [timezone, setTimezone] = useState('Australia/Brisbane');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const profile = userProfileService.getProfile(user.id);
    if (profile) {
      setContactEmail(profile.contactEmail || user.email || '');
      setFullName(profile.fullName || '');
      const dob = parseDobFromStorage(profile.dateOfBirth);
      setDobDay(dob.day);
      setDobMonth(dob.month);
      setDobYear(dob.year);
      setPhone(stripAuPrefix(profile.phoneE164));
      setTimezone(profile.timezone || 'Australia/Brisbane');
    } else {
      // Seed from auth + metadata on first visit
      setContactEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
    }

    const { timezone: tz, wasReset } = userPreferencesService.getTimezoneWithMeta(user.id);
    setTimezone(tz);
    if (wasReset) toast.info('Your timezone preference was reset to the default (Australia/Brisbane) because the stored value was invalid.');
  }, [user?.id]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setPhone(digits);
    setPhoneError('');
  };

  const handleSave = async () => {
    if (!user?.id) return;

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

    userProfileService.upsertProfile(user.id, {
      contactEmail,
      fullName,
      dateOfBirth,
      phoneE164,
      timezone,
    });

    userPreferencesService.setTimezone(user.id, timezone);

    setSaving(false);
    toast.success('Account settings saved');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Details
          </CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login Email (read-only) */}
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Login Email
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={user?.email || ''}
                readOnly
                className="bg-muted/30 w-full sm:flex-1 min-w-0"
              />
              <Badge variant="outline" className="w-fit self-start sm:self-auto">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              This is the email you use to sign in.
            </p>
          </div>

          {/* Contact Email (editable) */}
          <div className="space-y-1">
            <Label htmlFor="account-contact-email">Contact Email</Label>
            <Input
              id="account-contact-email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              Used for reminders and receipts. Changing this does not change your login email.
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="account-name">Full Name</Label>
            <Input
              id="account-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* DOB */}
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

          {/* Phone */}
          <div className="space-y-1">
            <Label>Phone Number</Label>
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

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Timezone
          </CardTitle>
          <CardDescription>All consultation and booking times are displayed in this timezone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AU_TIMEZONE_OPTIONS.map((opt, i) => (
                <SelectItem key={`${opt.value}-${i}`} value={opt.value}>{opt.label} ({opt.value})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Default: Australia/Brisbane. Only Australian timezones are supported.</p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
