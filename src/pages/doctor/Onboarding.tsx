import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorOnboardingSupabaseService } from '@/services/doctorOnboardingSupabaseService';
import { doctorPayoutProfileService } from '@/services/doctorPayoutProfileService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, CheckCircle2, PenTool, Landmark, ArrowRight, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Signature state
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  // Business details (Stripe Connect holds bank/payout routing details)
  const [abn, setAbn] = useState('');
  const [entityName, setEntityName] = useState('');
  const [gstRegistered, setGstRegistered] = useState(false);
  const [remittanceEmail, setRemittanceEmail] = useState('');
  const [businessSaved, setBusinessSaved] = useState(false);
  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>({});

  // Stripe Connect status
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripePayoutsEnabled, setStripePayoutsEnabled] = useState(false);
  const [stripeChargesEnabled, setStripeChargesEnabled] = useState(false);
  const [stripeDetailsSubmitted, setStripeDetailsSubmitted] = useState(false);
  const [stripeCurrentlyDue, setStripeCurrentlyDue] = useState<string[]>([]);

  // Load existing data (Supabase)
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

        const payout = await doctorOnboardingSupabaseService.getPayoutProfileForDoctor(doctorId);
        if (payout) {
          setAbn(payout.abn);
          setEntityName(payout.entity_name);
          setGstRegistered(Boolean((payout as any).gst_registered));
          setRemittanceEmail(payout.remittance_email);
          setBusinessSaved(true);
        }

        // Always fetch latest Stripe Connect status
        // (this also keeps the UI correct after returning from Stripe onboarding)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        syncStripeStatus();

        const connect = new URLSearchParams(window.location.search).get('connect');
        if (connect === 'return') {
          toast.success('Returned from Stripe — checking payout status…');
        } else if (connect === 'refresh') {
          toast('Stripe setup needs more info — continue onboarding in Stripe.');
        }
      } catch (e) {
        console.error('Failed to load onboarding data:', e);
        setSignature(null);
        setBusinessSaved(false);
      }
    };

    void run();
  }, [user?.id]);

  // Canvas drawing — acquire ctx inline so it works on first stroke
  const start = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setDrawing(true);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.beginPath();
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
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    if (!user?.id) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    try {
      await doctorOnboardingSupabaseService.saveSignatureForCurrentDoctor({
        userId: user.id,
        signatureDataUrl: dataUrl,
      });

      // Show preview via signed URL (more realistic than keeping a data URL)
      const url = await doctorOnboardingSupabaseService.getSignatureSignedUrl(`${user.id}/signature.png`);
      setSignature(url);
      toast.success('Signature saved');
    } catch (e: any) {
      console.error('Failed to save signature:', e);
      toast.error(e?.message || 'Could not save signature');
    }
  };

  const removeSignature = async () => {
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

  // Business details save (Stripe Connect holds bank/payout routing)
  const saveBusinessDetails = async () => {
    if (!user?.id) return;

    const errors = doctorPayoutProfileService.validateProfile({
      abn,
      entityName,
      gstRegistered,
      remittanceEmail,
    });
    setBusinessErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors below');
      return;
    }

    try {
      await doctorOnboardingSupabaseService.upsertPayoutProfileForCurrentDoctor({
        userId: user.id,
        abn,
        entityName,
        gstRegistered,
        remittanceEmail,
      });
      setBusinessSaved(true);
      toast.success('Business details saved');
    } catch (e: any) {
      console.error('Failed to save business details:', e);
      toast.error(e?.message || 'Could not save business details');
    }
  };

  const clearBusinessError = (field: string) => {
    setBusinessErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
    setBusinessSaved(false);
  };

  const syncStripeStatus = async () => {
    if (!user?.id) return;
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-doctor-connect-status');
      if (error) throw error;

      setStripeAccountId((data as any)?.stripeAccountId ?? (data as any)?.stripe_account_id ?? null);
      setStripePayoutsEnabled(Boolean((data as any)?.payouts_enabled));
      setStripeChargesEnabled(Boolean((data as any)?.charges_enabled));
      setStripeDetailsSubmitted(Boolean((data as any)?.details_submitted));
      setStripeCurrentlyDue(((data as any)?.requirements?.currently_due ?? (data as any)?.currently_due ?? []) as string[]);
    } catch (e: any) {
      console.error('Failed to sync Stripe status:', e);
      toast.error(e?.message || 'Could not refresh Stripe status');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user?.id) return;
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-doctor-connect-link');
      if (error) throw error;
      const url = (data as any)?.url as string | undefined;
      if (!url) throw new Error('Stripe onboarding link was not returned');
      window.location.href = url;
    } catch (e: any) {
      console.error('Failed to create Stripe connect link:', e);
      toast.error(e?.message || 'Could not start Stripe Connect setup');
    } finally {
      setStripeLoading(false);
    }
  };

  const canComplete = signature !== null && businessSaved && stripePayoutsEnabled;

  const handleComplete = () => {
    if (!canComplete) return;
    toast.success('Onboarding complete!');
    navigate('/doctor/consultations');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome — Complete Your Setup</h1>
        <p className="text-muted-foreground mt-1">
          Before you can start seeing patients, we need your signature, business details, and Stripe payouts enabled.
        </p>
      </div>

      {/* Step 1: Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Step 1: Digital Signature
            {signature && <Badge variant="default" className="ml-2"><CheckCircle2 className="h-3 w-3 mr-1" />Saved</Badge>}
          </CardTitle>
          <CardDescription>Draw your signature. It will be attached to prescriptions you issue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={700}
              height={220}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="w-full h-[220px] touch-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={clear}>Clear</Button>
            <Button onClick={() => void saveSignature()}>Save Signature</Button>
            {signature && (
              <Button variant="outline" onClick={() => void removeSignature()} className="gap-2">
                <Trash2 className="h-4 w-4" />Remove
              </Button>
            )}
          </div>
          {signature && (
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Saved signature preview</p>
              <img src={signature} alt="Saved signature" className="max-h-24" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Business details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Step 2: Business Details
            {businessSaved && (
              <Badge variant="default" className="ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />Saved
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            We use this for remittance/invoicing. Your bank payout details are handled securely by Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="abn">ABN (Australian Business Number)</Label>
              <Input
                id="abn"
                inputMode="numeric"
                placeholder="XX XXX XXX XXX"
                maxLength={14}
                value={abn}
                onChange={(e) => {
                  setAbn(e.target.value.replace(/[^\d\s]/g, ''));
                  clearBusinessError('abn');
                }}
              />
              {businessErrors.abn && <p className="text-xs text-destructive">{businessErrors.abn}</p>}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="entityName">Entity / Business Name</Label>
              <Input
                id="entityName"
                placeholder="e.g. Dr Jane Smith Pty Ltd"
                value={entityName}
                onChange={(e) => {
                  setEntityName(e.target.value);
                  clearBusinessError('entityName');
                }}
              />
              {businessErrors.entityName && <p className="text-xs text-destructive">{businessErrors.entityName}</p>}
            </div>

            <div className="space-y-1 sm:col-span-2 flex items-center gap-3">
              <Switch id="gst" checked={gstRegistered} onCheckedChange={setGstRegistered} />
              <Label htmlFor="gst">Registered for GST</Label>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="remittanceEmail">Remittance Email</Label>
              <Input
                id="remittanceEmail"
                type="email"
                placeholder="accounts@example.com"
                value={remittanceEmail}
                onChange={(e) => {
                  setRemittanceEmail(e.target.value);
                  clearBusinessError('remittanceEmail');
                }}
              />
              {businessErrors.remittanceEmail && (
                <p className="text-xs text-destructive">{businessErrors.remittanceEmail}</p>
              )}
            </div>
          </div>

          <Button onClick={() => void saveBusinessDetails()} variant="outline">
            Save Business Details
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Stripe payouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Step 3: Stripe Payout Setup
            {stripePayoutsEnabled && (
              <Badge variant="default" className="ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />Enabled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to receive consultation payouts. We never charge you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Payouts enabled:</span>{' '}
              <span className="font-medium">{stripePayoutsEnabled ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Details submitted:</span>{' '}
              <span className="font-medium">{stripeDetailsSubmitted ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Charges enabled:</span>{' '}
              <span className="font-medium">{stripeChargesEnabled ? 'Yes' : 'No'}</span>
            </div>
            {stripeCurrentlyDue.length > 0 && (
              <div className="pt-2">
                <p className="text-muted-foreground">Stripe still needs:</p>
                <ul className="list-disc pl-5">
                  {stripeCurrentlyDue.slice(0, 6).map((x) => (
                    <li key={x} className="font-medium">{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleConnectStripe()} disabled={stripeLoading}>
              {stripeAccountId ? 'Continue in Stripe' : 'Connect Stripe'}
            </Button>
            <Button variant="outline" onClick={() => void syncStripeStatus()} disabled={stripeLoading}>
              Refresh status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complete */}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!canComplete}
          onClick={handleComplete}
          className="gap-2"
        >
          Complete Onboarding
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {!canComplete && (
        <p className="text-sm text-muted-foreground text-right">
          {!signature && 'Save your signature to continue.'}
          {signature && !businessSaved && 'Save your business details to continue.'}
          {signature && businessSaved && !stripePayoutsEnabled && 'Connect Stripe payouts to continue.'}
        </p>
      )}
    </div>
  );
}
