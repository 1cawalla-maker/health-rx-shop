import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { mockAvailabilityService } from '@/services/availabilityService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Plus, Trash2, AlertTriangle, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { MockAvailabilityBlock } from '@/types/telehealth';
import { dayOfWeekLabels } from '@/types/telehealth';

// Hours 6-23 in 24h format
const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function to12h(hour24: string): string {
  const h = parseInt(hour24, 10);
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function formatTime12h(time: string): string {
  const [hh, mm] = time.split(':');
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mm} ${suffix}`;
}

function blocksOverlap(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }): boolean {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<MockAvailabilityBlock[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('12');
  const [endMin, setEndMin] = useState('00');
  const [addError, setAddError] = useState('');

  // Copy-to-days state
  const [copySourceDay, setCopySourceDay] = useState<number | null>(null);
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([]);

  const doctorTz = useMemo(() => user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane', [user?.id]);

  const refresh = () => {
    if (!user?.id) return;
    setBlocks(mockAvailabilityService.getDoctorBlocks(user.id));
  };

  useEffect(() => { refresh(); }, [user?.id]);

  // Group blocks by day
  const byDay = blocks.reduce<Record<number, MockAvailabilityBlock[]>>((acc, b) => {
    const day = b.dayOfWeek ?? 0;
    if (!acc[day]) acc[day] = [];
    acc[day].push(b);
    return acc;
  }, {});

  const handleAdd = () => {
    if (!user?.id) return;
    const startTime = `${startHour}:${startMin}`;
    const endTime = `${endHour}:${endMin}`;
    
    if (startTime >= endTime) {
      setAddError('End time must be after start time');
      return;
    }

    // Check overlaps on same day
    const dayNum = Number(dayOfWeek);
    const existingBlocks = byDay[dayNum] || [];
    const overlapping = existingBlocks.find(b => blocksOverlap({ startTime, endTime }, b));
    if (overlapping) {
      setAddError(`This block overlaps with ${formatTime12h(overlapping.startTime)} – ${formatTime12h(overlapping.endTime)}`);
      return;
    }

    setAddError('');
    mockAvailabilityService.addDoctorBlock(user.id, {
      dayOfWeek: dayNum,
      specificDate: null,
      startTime,
      endTime,
      timezone: doctorTz,
      isRecurring: true,
    });
    toast.success('Availability block added');
    refresh();
  };

  const handleRemove = (blockId: string) => {
    if (!user?.id) return;
    mockAvailabilityService.removeDoctorBlock(user.id, blockId);
    toast.success('Block removed');
    refresh();
  };

  const toggleCopyTarget = (day: number) => {
    setCopyTargetDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleCopyToOtherDays = () => {
    if (!user?.id || copySourceDay === null || copyTargetDays.length === 0) return;

    const sourceBlocks = byDay[copySourceDay] || [];
    if (sourceBlocks.length === 0) {
      toast.error('No blocks to copy from this day');
      return;
    }

    let copiedCount = 0;
    const skippedDays: string[] = [];

    for (const targetDay of copyTargetDays) {
      const existingBlocks = byDay[targetDay] || [];
      
      for (const block of sourceBlocks) {
        // Skip duplicates
        const isDuplicate = existingBlocks.some(
          eb => eb.startTime === block.startTime && eb.endTime === block.endTime
        );
        if (isDuplicate) continue;

        // Check overlaps
        const overlapping = existingBlocks.find(eb => blocksOverlap(block, eb));
        if (overlapping) {
          toast.error(`Block ${formatTime12h(block.startTime)} – ${formatTime12h(block.endTime)} overlaps with existing block on ${dayOfWeekLabels[targetDay]}. Skipped.`);
          if (!skippedDays.includes(dayOfWeekLabels[targetDay])) {
            skippedDays.push(dayOfWeekLabels[targetDay]);
          }
          continue;
        }

        mockAvailabilityService.addDoctorBlock(user.id, {
          dayOfWeek: targetDay,
          specificDate: null,
          startTime: block.startTime,
          endTime: block.endTime,
          timezone: doctorTz,
          isRecurring: true,
        });
        
        // Update existing blocks for subsequent overlap checks
        existingBlocks.push({ ...block, id: '', doctorId: user.id, doctorName: '', isActive: true, dayOfWeek: targetDay });
        copiedCount++;
      }
    }

    if (copiedCount > 0) {
      const dayNames = copyTargetDays.map(d => dayOfWeekLabels[d]).join(', ');
      toast.success(`Copied ${copiedCount} block${copiedCount !== 1 ? 's' : ''} to ${dayNames}`);
    }

    setCopySourceDay(null);
    setCopyTargetDays([]);
    refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Availability</h1>
        <p className="text-muted-foreground mt-1">Set your weekly recurring availability blocks</p>
      </div>

      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertTriangle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          All times shown in your timezone: <strong>{doctorTz}</strong>. If you change your timezone in Account settings, review your availability blocks to ensure times are still correct.
        </AlertDescription>
      </Alert>

      {/* Add Block */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Block</CardTitle>
          <CardDescription>Create a new recurring weekly availability window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-5 items-end">
            <div className="space-y-1">
              <Label>Day</Label>
              <Select value={dayOfWeek} onValueChange={(v) => { setDayOfWeek(v); setAddError(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,0].map((d) => (
                    <SelectItem key={d} value={String(d)}>{dayOfWeekLabels[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start</Label>
              <div className="flex gap-1">
                <Select value={startHour} onValueChange={(v) => { setStartHour(v); setAddError(''); }}>
                  <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{to12h(h)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={startMin} onValueChange={(v) => { setStartMin(v); setAddError(''); }}>
                  <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>End</Label>
              <div className="flex gap-1">
                <Select value={endHour} onValueChange={(v) => { setEndHour(v); setAddError(''); }}>
                  <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{to12h(h)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={endMin} onValueChange={(v) => { setEndMin(v); setAddError(''); }}>
                  <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <div className="h-10 flex items-center text-sm text-muted-foreground">{doctorTz}</div>
            </div>
            <Button onClick={handleAdd}>Add Block</Button>
          </div>
          {addError && (
            <p className="text-sm text-destructive">{addError}</p>
          )}
        </CardContent>
      </Card>

      {/* Copy to Other Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Copy className="h-5 w-5" />Copy Blocks to Other Days</CardTitle>
          <CardDescription>Copy all blocks from one day to other days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Copy from</Label>
            <Select value={copySourceDay !== null ? String(copySourceDay) : ''} onValueChange={(v) => { setCopySourceDay(Number(v)); setCopyTargetDays([]); }}>
              <SelectTrigger><SelectValue placeholder="Select source day" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,0].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {dayOfWeekLabels[d]} ({(byDay[d] || []).length} blocks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {copySourceDay !== null && (
            <>
              <div className="space-y-2">
                <Label>Copy to</Label>
                <div className="flex flex-wrap gap-3">
                  {[1,2,3,4,5,6,0].filter(d => d !== copySourceDay).map((d) => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={copyTargetDays.includes(d)}
                        onCheckedChange={() => toggleCopyTarget(d)}
                      />
                      <span className="text-sm">{dayOfWeekLabels[d]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCopyToOtherDays}
                disabled={copyTargetDays.length === 0}
                variant="outline"
              >
                Apply
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Weekly Grid */}
      <div className="space-y-4">
        {[1,2,3,4,5,6,0].map((day) => {
          const dayBlocks = byDay[day] || [];
          return (
            <Card key={day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {dayOfWeekLabels[day]}
                  <Badge variant="outline" className="ml-auto">{dayBlocks.length} block{dayBlocks.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayBlocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {dayBlocks.map((b) => (
                      <div key={b.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div className="text-sm">
                          <span className="font-medium">{formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}</span>
                          <span className="text-muted-foreground ml-2">({b.timezone})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(b.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
