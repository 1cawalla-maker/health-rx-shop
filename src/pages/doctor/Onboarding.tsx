import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorOnboardingSupabaseService } from '@/services/doctorOnboardingSupabaseService';
import { doctorPayoutProfileService } from '@/services/doctorPayoutProfileService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, CheckCircle2, PenTool, Landmark, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Signature state
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  // Payout state
  const [abn, setAbn] = useState('');
  const [entityName, setEntityName] = useState('');
  const [gstRegistered, setGstRegistered] = useState(false);
  const [remittanceEmail, setRemittanceEmail] = useState('');
  const [bsb, setBsb] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [payoutErrors, setPayoutErrors] = useState<Record<string, string>>({});

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
          setBsb(payout.bsb);
          setAccountNumber(payout.account_number);
          setAccountName(payout.account_name);
          setPayoutSaved(true);
        }
      } catch (e) {
        console.error('Failed to load onboarding data:', e);
        setSignature(null);
        setPayoutSaved(false);
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

  // Payout profile save
  const savePayout = async () => {
    if (!user?.id) return;

    const errors = doctorPayoutProfileService.validateProfile({
      abn, entityName, gstRegistered, remittanceEmail, bsb, accountNumber, accountName,
    });
    setPayoutErrors(errors);

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
        bsb,
        accountNumber,
        accountName,
      });
      setPayoutSaved(true);
      toast.success('Payout profile saved');
    } catch (e: any) {
      console.error('Failed to save payout profile:', e);
      toast.error(e?.message || 'Could not save payout profile');
    }
  };

  const clearPayoutError = (field: string) => {
    setPayoutErrors((p) => { const n = { ...p }; delete n[field]; return n; });
    setPayoutSaved(false);
  };

  const canComplete = signature !== null && payoutSaved;

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
          Before you can start seeing patients, we need your signature and payment details.
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

      {/* Step 2: Payout Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Step 2: Payout Details
            {payoutSaved && <Badge variant="default" className="ml-2"><CheckCircle2 className="h-3 w-3 mr-1" />Saved</Badge>}
          </CardTitle>
          <CardDescription>We'll use these details to process your consultation payments.</CardDescription>
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
                onChange={(e) => { setAbn(e.target.value.replace(/[^\d\s]/g, '')); clearPayoutError('abn'); }}
              />
              {payoutErrors.abn && <p className="text-xs text-destructive">{payoutErrors.abn}</p>}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="entityName">Entity / Business Name</Label>
              <Input
                id="entityName"
                placeholder="e.g. Dr Jane Smith Pty Ltd"
                value={entityName}
                onChange={(e) => { setEntityName(e.target.value); clearPayoutError('entityName'); }}
              />
              {payoutErrors.entityName && <p className="text-xs text-destructive">{payoutErrors.entityName}</p>}
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
                onChange={(e) => { setRemittanceEmail(e.target.value); clearPayoutError('remittanceEmail'); }}
              />
              {payoutErrors.remittanceEmail && <p className="text-xs text-destructive">{payoutErrors.remittanceEmail}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="bsb">BSB</Label>
              <Input
                id="bsb"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={bsb}
                onChange={(e) => { setBsb(e.target.value.replace(/\D/g, '').slice(0, 6)); clearPayoutError('bsb'); }}
              />
              {payoutErrors.bsb && <p className="text-xs text-destructive">{payoutErrors.bsb}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                inputMode="numeric"
                placeholder="123456789"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); clearPayoutError('accountNumber'); }}
              />
              {payoutErrors.accountNumber && <p className="text-xs text-destructive">{payoutErrors.accountNumber}</p>}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="Dr. Jane Smith"
                value={accountName}
                onChange={(e) => { setAccountName(e.target.value); clearPayoutError('accountName'); }}
              />
              {payoutErrors.accountName && <p className="text-xs text-destructive">{payoutErrors.accountName}</p>}
            </div>
          </div>

          <Button onClick={() => void savePayout()} variant="outline">
            Save Payout Details
          </Button>
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
          {!signature && !payoutSaved && 'Complete both steps above to continue.'}
          {signature && !payoutSaved && 'Save your payout details to continue.'}
          {!signature && payoutSaved && 'Save your signature to continue.'}
        </p>
      )}
    </div>
  );
}
