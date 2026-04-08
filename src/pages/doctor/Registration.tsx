import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorOnboardingSupabaseService } from '@/services/doctorOnboardingSupabaseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function DoctorRegistration() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

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
    };

    void run();
  }, [user?.id]);

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure we keep receiving pointer events even if the pointer leaves the canvas.
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // no-op (older browsers / edge cases)
    }

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

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const end = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && e) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // no-op
      }
    }
    setDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawing(false);
  };

  const save = async () => {
    if (!user?.id) {
      toast.error('Please sign in');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
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

  const remove = async () => {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Doctor Registration</h1>
        <p className="text-muted-foreground mt-1">Save your signature once. It will be attached to issued prescriptions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
          <CardDescription>Draw your signature below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Signature pad</Label>
            <div className="border rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={700}
                height={220}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onPointerLeave={end}
                className="w-full h-[220px] touch-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={clear}>Clear</Button>
              <Button onClick={() => void save()}>Save Signature</Button>
              <Button variant="outline" onClick={() => void remove()} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>

          {signature && (
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Saved signature preview</p>
              <img src={signature} alt="Saved signature" className="max-h-24" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
