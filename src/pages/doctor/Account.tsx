import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { doctorOnboardingSupabaseService } from '@/services/doctorOnboardingSupabaseService';
import { doctorPayoutProfileService, type DoctorPayoutProfile } from '@/services/doctorPayoutProfileService';
import { doctorProfileService } from '@/services/doctorProfileService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { AU_TIMEZONE_OPTIONS } from '@/lib/timezones';
import { formatAbn } from '@/lib/abnValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, User, Landmark, Pencil, X, Save } from 'lucide-react';
import { toast } from 'sonner';

// Stripe Connect holds bank payout details; we no longer display/mask bank account numbers here.

export default function DoctorAccount() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('Australia/Brisbane');

  // Doctor identity fields (editable)
  const [fullName, setFullName] = useState('');
  const [ahpra, setAhpra] = useState('');
  const [providerNum, setProviderNum] = useState('');
  const [phone, setPhone] = useState('');
  const [practiceLocation, setPracticeLocation] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Payout profile
  const [payoutProfile, setPayoutProfile] = useState<DoctorPayoutProfile | null>(null);
  const [payoutEditing, setPayoutEditing] = useState(false);
  const [pAbn, setPAbn] = useState('');
  const [pEntityName, setPEntityName] = useState('');
  const [pGst, setPGst] = useState(false);
  const [pEmail, setPEmail] = useState('');
  const [payoutErrors, setPayoutErrors] = useState<Record<string, string>>({});

  const loadPayout = async (uid: string) => {
    try {
      const doctorId = await doctorOnboardingSupabaseService.getDoctorRowIdForUser(uid);
      const payout = await doctorOnboardingSupabaseService.getPayoutProfileForDoctor(doctorId);

      if (!payout) {
        setPayoutProfile(null);
        return;
      }

      const profile: DoctorPayoutProfile = {
        abn: payout.abn,
        entityName: payout.entity_name,
        gstRegistered: Boolean((payout as any).gst_registered),
        remittanceEmail: payout.remittance_email,
        createdAtUtc: payout.created_at,
        updatedAtUtc: payout.updated_at,
      };

      setPayoutProfile(profile);
      setPAbn(profile.abn);
      setPEntityName(profile.entityName);
      setPGst(profile.gstRegistered);
      setPEmail(profile.remittanceEmail);
      // Stripe Connect holds bank payout details
    } catch (e) {
      console.error('Failed to load payout profile:', e);
      setPayoutProfile(null);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;

      try {
        const doctorId = await doctorOnboardingSupabaseService.getDoctorRowIdForUser(user.id);
        const sigRow = await doctorOnboardingSupabaseService.getSignatureRowForDoctor(doctorId);
        if (sigRow?.storage_path) {
          const url = await doctorOnboardingSupabaseService.getSignatureSignedUrl(sigRow.storage_path);
          setSignature(url);
        } else {
          setSignature(null);
        }
      } catch (e) {
        console.error('Failed to load signature:', e);
        setSignature(null);
      }

      const { timezone: tz, wasReset } = userPreferencesService.getTimezoneWithMeta(user.id);
      setTimezone(tz);
      if (wasReset) toast.info('Your timezone preference was reset to the default (Australia/Brisbane) because the stored value was invalid.');

      await loadPayout(user.id);
    };

    void run();

    // Load identity from local service first
    const localProfile = doctorProfileService.getProfile(user.id);
    if (localProfile) {
      setFullName(localProfile.fullName);
      setAhpra(localProfile.ahpraNumber);
      setProviderNum(localProfile.providerNumber);
      setPhone(localProfile.phone);
      setPracticeLocation(localProfile.practiceLocation);
    } else {
      // One-time hydration from Supabase
      supabase
        .from('doctors')
        .select('ahpra_number, provider_number, phone, practice_location')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          const hydrated = {
            fullName: user.user_metadata?.full_name || '',
            ahpraNumber: data?.ahpra_number || '',
            providerNumber: data?.provider_number || '',
            phone: data?.phone || '',
            practiceLocation: data?.practice_location || '',
          };
          doctorProfileService.hydrateFromRemote(user.id, hydrated);
          setFullName(hydrated.fullName);
          setAhpra(hydrated.ahpraNumber);
          setProviderNum(hydrated.providerNumber);
          setPhone(hydrated.phone);
          setPracticeLocation(hydrated.practiceLocation);
        });
    }
  }, [user?.id]);

  const saveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);

    // Save locally for instant UX
    doctorProfileService.upsertProfile(user.id, {
      fullName,
      ahpraNumber: ahpra,
      providerNumber: providerNum,
      phone,
      practiceLocation,
    });

    // Persist to Supabase so it is available across devices and to other flows.
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          ahpra_number: ahpra || null,
          provider_number: providerNum || null,
          phone: phone || null,
          practice_location: practiceLocation || null,
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName || null,
        } as any, { onConflict: 'user_id' });

      if (profileErr) throw profileErr;

      toast.success('Profile details saved');
    } catch (err: any) {
      console.error('Failed to save doctor profile to Supabase:', err);
      toast.error(err?.message || 'Saved locally, but could not sync profile to server');
    } finally {
      setProfileSaving(false);
    }
  };

  const start = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setDrawing(true);
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827'; ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
  };
  const end = () => setDrawing(false);
  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
  };

  const saveSig = async () => {
    if (!user?.id) { toast.error('Please sign in'); return; }
    const canvas = canvasRef.current; if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    try {
      await doctorOnboardingSupabaseService.saveSignatureForCurrentDoctor({
        userId: user.id,
        signatureDataUrl: dataUrl,
      });
      const url = await doctorOnboardingSupabaseService.getSignatureSignedUrl(`${user.id}/signature.png`);
      setSignature(url);
      toast.success('Signature saved');
    } catch (e: any) {
      console.error('Failed to save signature:', e);
      toast.error(e?.message || 'Could not save signature');
    }
  };
  const removeSig = async () => {
    if (!user?.id) return;

    try {
      await doctorOnboardingSupabaseService.removeSignatureForCurrentDoctor({ userId: user.id });
      setSignature(null);
      clear();
      toast.success('Signature removed');
    } catch (e: any) {
      console.error('Failed to remove signature:', e);
      toast.error(e?.message || 'Could not remove signature');
    }
  };

  const saveTz = () => {
    if (!user?.id) return;
    userPreferencesService.setTimezone(user.id, timezone);
    toast.success('Timezone saved');
    toast.warning('Changing timezone may require reviewing your availability blocks to ensure times are still correct.', { duration: 6000 });
  };

  const startPayoutEdit = () => {
    if (payoutProfile) {
      setPAbn(payoutProfile.abn);
      setPEntityName(payoutProfile.entityName);
      setPGst(payoutProfile.gstRegistered);
      setPEmail(payoutProfile.remittanceEmail);
      // Stripe Connect holds bank payout details

    }
    setPayoutErrors({});
    setPayoutEditing(true);
  };

  const cancelPayoutEdit = () => { setPayoutEditing(false); setPayoutErrors({}); };

  const savePayoutEdit = async () => {
    if (!user?.id) return;
    const errors = doctorPayoutProfileService.validateProfile({
      abn: pAbn,
      entityName: pEntityName,
      gstRegistered: pGst,
      remittanceEmail: pEmail,
    });
    setPayoutErrors(errors);
    if (Object.keys(errors).length > 0) { toast.error('Please fix the errors'); return; }

    try {
      await doctorOnboardingSupabaseService.upsertPayoutProfileForCurrentDoctor({
        userId: user.id,
        abn: pAbn,
        entityName: pEntityName,
        gstRegistered: pGst,
        remittanceEmail: pEmail,
      });
      await loadPayout(user.id);
      setPayoutEditing(false);
      toast.success('Payout details updated');
    } catch (e: any) {
      console.error('Failed to save payout details:', e);
      toast.error(e?.message || 'Could not save payout details');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-1">Doctor profile and settings</p>
      </div>

      {/* Profile Info — Editable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Profile</CardTitle>
          <CardDescription>Your registered details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Legal Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full legal name" />
            </div>
            <div className="space-y-1">
              <Label>Login Email</Label>
              <Input value={user?.email || '—'} readOnly className="bg-muted/30" />
              <p className="text-xs text-muted-foreground">This is the email you use to sign in.</p>
            </div>
            <div className="space-y-1">
              <Label>AHPRA Number</Label>
              <Input value={ahpra} onChange={(e) => setAhpra(e.target.value)} placeholder="MED0001234567" />
            </div>
            <div className="space-y-1">
              <Label>Provider Number</Label>
              <Input value={providerNum} onChange={(e) => setProviderNum(e.target.value)} placeholder="1234567A" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 4xx xxx xxx" />
            </div>
            <div className="space-y-1">
              <Label>Practice Location</Label>
              <Input value={practiceLocation} onChange={(e) => setPracticeLocation(e.target.value)} placeholder="City, State" />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={profileSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Payout Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" />Payout Details</CardTitle>
            {!payoutEditing && (
              <Button variant="outline" size="sm" className="gap-1" onClick={startPayoutEdit}>
                <Pencil className="h-3 w-3" />Edit
              </Button>
            )}
          </div>
          <CardDescription>Business details for remittance/invoicing. Bank payout details are handled by Stripe.</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>ABN</Label>
                  <Input inputMode="numeric" maxLength={14} value={pAbn} onChange={(e) => setPAbn(e.target.value.replace(/[^\d\s]/g, ''))} />
                  {payoutErrors.abn && <p className="text-xs text-destructive">{payoutErrors.abn}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Entity / Business Name</Label>
                  <Input value={pEntityName} onChange={(e) => setPEntityName(e.target.value)} />
                  {payoutErrors.entityName && <p className="text-xs text-destructive">{payoutErrors.entityName}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2 flex items-center gap-3">
                  <Switch checked={pGst} onCheckedChange={setPGst} />
                  <Label>Registered for GST</Label>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Remittance Email</Label>
                  <Input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} />
                  {payoutErrors.remittanceEmail && <p className="text-xs text-destructive">{payoutErrors.remittanceEmail}</p>}
                </div>
                {/* Stripe Connect collects bank details during onboarding. */}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void savePayoutEdit()}>Save</Button>
                <Button variant="outline" onClick={cancelPayoutEdit} className="gap-1"><X className="h-3 w-3" />Cancel</Button>
              </div>
            </div>
          ) : payoutProfile ? (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">ABN:</span> <span className="font-medium">{formatAbn(payoutProfile.abn)}</span></div>
              <div><span className="text-muted-foreground">Entity:</span> <span className="font-medium">{payoutProfile.entityName}</span></div>
              <div><span className="text-muted-foreground">GST Registered:</span> <span className="font-medium">{payoutProfile.gstRegistered ? 'Yes' : 'No'}</span></div>
              <div><span className="text-muted-foreground">Remittance Email:</span> <span className="font-medium">{payoutProfile.remittanceEmail}</span></div>
              {/* Bank payout details are managed in Stripe Connect. */}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payout details saved yet. Click Edit to add your details.</p>
          )}
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timezone</CardTitle>
          <CardDescription>All consultation times are displayed in this timezone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AU_TIMEZONE_OPTIONS.map((opt, i) => (
                  <SelectItem key={`${opt.value}-${i}`} value={opt.value}>{opt.label} ({opt.value})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={saveTz}>Save</Button>
          </div>
          <p className="text-xs text-muted-foreground">Default: Australia/Brisbane. Only Australian timezones are supported.</p>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signature</CardTitle>
          <CardDescription>Draw your signature. It will be attached to issued prescriptions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} width={700} height={220} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} className="w-full h-[220px] touch-none" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={clear}>Clear</Button>
            <Button onClick={() => void saveSig()}>Save Signature</Button>
            <Button variant="outline" onClick={() => void removeSig()} className="gap-2"><Trash2 className="h-4 w-4" />Remove</Button>
          </div>
          {signature && (
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Saved signature preview</p>
              <img src={signature} alt="Saved signature" className="max-h-24" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={signature ? 'default' : 'outline'}>{signature ? 'On file' : 'Not saved'}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
