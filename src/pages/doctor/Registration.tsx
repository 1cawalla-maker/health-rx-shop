import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorSignatureService } from '@/services/doctorSignatureService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorRegistration() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const sig = doctorSignatureService.getSignature(user.id);
    setSignature(sig?.signatureDataUrl || null);
  }, [user?.id]);

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

  const end = () => {
    setDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    if (!user?.id) {
      toast.error('Please sign in');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    doctorSignatureService.saveSignature(user.id, dataUrl);
    setSignature(dataUrl);
    toast.success('Signature saved');
  };

  const remove = () => {
    if (!user?.id) return;
    doctorSignatureService.clearSignature(user.id);
    setSignature(null);
    clear();
    toast.success('Signature removed');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Doctor Registration (Phase 1)</h1>
        <p className="text-muted-foreground mt-1">Save your signature once. It will be attached to issued prescriptions.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Phase 1 Note
          </CardTitle>
          <CardDescription>
            This is a local-only signature capture for testing. Phase 2 will store signatures securely (Storage + RLS) and embed into PDFs.
          </CardDescription>
        </CardHeader>
      </Card>

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
                onPointerLeave={end}
                className="w-full h-[220px] touch-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={clear}>Clear</Button>
              <Button onClick={save}>Save Signature</Button>
              <Button variant="outline" onClick={remove} className="gap-2">
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
