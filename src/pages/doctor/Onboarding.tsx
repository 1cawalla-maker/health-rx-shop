import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorSignatureService } from '@/services/doctorSignatureService';
import { doctorPayoutProfileService, type DoctorPayoutProfile } from '@/services/doctorPayoutProfileService';
import { validateAbn } from '@/lib/abnValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  const [bsb, setBsb] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [payoutErrors, setPayoutErrors] = useState<Record<string, string>>({});

  // Load existing data
  useEffect(() => {
    if (!user?.id) return;
    const sig = doctorSignatureService.getSignature(user.id);
    setSignature(sig?.signatureDataUrl || null);

    const profile = doctorPayoutProfileService.getProfile(user.id);
    if (profile) {
      setAbn(profile.abn);
      setBsb(profile.bsb);
      setAccountNumber(profile.accountNumber);
      setAccountName(profile.accountName);
      setPayoutSaved(doctorPayoutProfileService.isComplete(user.id));
    }
  }, [user?.id]);

  // Canvas drawing
  const ctx = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, [canvasRef.current]);

  const start = (e: React.PointerEvent) => {
    if (!ctx) return;
    setDrawing(true);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.beginPath();
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing || !ctx) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!user?.id) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    doctorSignatureService.saveSignature(user.id, dataUrl);
    setSignature(dataUrl);
    toast.success('Signature saved');
  };

  const removeSignature = () => {
    if (!user?.id) return;
    doctorSignatureService.clearSignature(user.id);
    setSignature(null);
    clear();
    toast.success('Signature removed');
  };

  // Payout profile save
  const savePayout = () => {
    if (!user?.id) return;

    const errors = doctorPayoutProfileService.validate({ abn, bsb, accountNumber, accountName });
    setPayoutErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors below');
      return;
    }

    doctorPayoutProfileService.saveProfile(user.id, { abn, bsb, accountNumber, accountName });
    setPayoutSaved(true);
    toast.success('Payout profile saved');
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
            <Button onClick={saveSignature}>Save Signature</Button>
            {signature && (
              <Button variant="outline" onClick={removeSignature} className="gap-2">
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
            Step 2: Payout Profile
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
                onChange={(e) => { setAbn(e.target.value.replace(/[^\d\s]/g, '')); setPayoutErrors((p) => ({ ...p, abn: '' })); setPayoutSaved(false); }}
              />
              {payoutErrors.abn && <p className="text-xs text-destructive">{payoutErrors.abn}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="bsb">BSB</Label>
              <Input
                id="bsb"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={bsb}
                onChange={(e) => { setBsb(e.target.value.replace(/\D/g, '').slice(0, 6)); setPayoutErrors((p) => ({ ...p, bsb: '' })); setPayoutSaved(false); }}
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
                onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setPayoutErrors((p) => ({ ...p, accountNumber: '' })); setPayoutSaved(false); }}
              />
              {payoutErrors.accountNumber && <p className="text-xs text-destructive">{payoutErrors.accountNumber}</p>}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="Dr. Jane Smith"
                value={accountName}
                onChange={(e) => { setAccountName(e.target.value); setPayoutErrors((p) => ({ ...p, accountName: '' })); setPayoutSaved(false); }}
              />
              {payoutErrors.accountName && <p className="text-xs text-destructive">{payoutErrors.accountName}</p>}
            </div>
          </div>

          <Button onClick={savePayout} variant="outline">
            Save Payout Profile
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
          {signature && !payoutSaved && 'Save your payout profile to continue.'}
          {!signature && payoutSaved && 'Save your signature to continue.'}
        </p>
      )}
    </div>
  );
}
