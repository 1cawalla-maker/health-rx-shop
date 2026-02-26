import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorSignatureService } from '@/services/doctorSignatureService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { AU_TIMEZONE_OPTIONS, timezoneLabel } from '@/lib/timezones';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorAccount() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('Australia/Brisbane');

  useEffect(() => {
    if (!user?.id) return;
    const sig = doctorSignatureService.getSignature(user.id);
    setSignature(sig?.signatureDataUrl || null);
    const { timezone: tz, wasReset } = userPreferencesService.getTimezoneWithMeta(user.id);
    setTimezone(tz);
    if (wasReset) toast.info('Your timezone preference was reset to the default (Australia/Brisbane) because the stored value was invalid.');
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

  const end = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    if (!user?.id) { toast.error('Please sign in'); return; }
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

  const saveTz = () => {
    if (!user?.id) return;
    userPreferencesService.setTimezone(user.id, timezone);
    toast.success('Timezone saved');
    toast.warning('Changing timezone may require reviewing your availability blocks to ensure times are still correct.', { duration: 6000 });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-1">Doctor profile and settings</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Profile</CardTitle>
          <CardDescription>Read-only in Phase 1. Phase 2 will allow editing via backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Legal Name</Label>
              <Input value={user?.user_metadata?.full_name || '—'} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email || '—'} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label>AHPRA Number</Label>
              <Input value="—" readOnly className="bg-muted/30" />
              <p className="text-xs text-muted-foreground">Phase 2: fetched from doctor record</p>
            </div>
            <div className="space-y-1">
              <Label>Provider Number</Label>
              <Input value="—" readOnly className="bg-muted/30" />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value="—" readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label>Practice Location</Label>
              <Input value="—" readOnly className="bg-muted/30" />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>
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
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
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
            <Button variant="outline" onClick={remove} className="gap-2"><Trash2 className="h-4 w-4" />Remove</Button>
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
