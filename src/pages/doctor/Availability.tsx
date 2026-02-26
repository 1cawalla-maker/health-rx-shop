import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { mockAvailabilityService } from '@/services/availabilityService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MockAvailabilityBlock } from '@/types/telehealth';
import { dayOfWeekLabels } from '@/types/telehealth';

const DEFAULT_TZ = 'Australia/Brisbane';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<MockAvailabilityBlock[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('12');
  const [endMin, setEndMin] = useState('00');

  const refresh = () => {
    if (!user?.id) return;
    setBlocks(mockAvailabilityService.getDoctorBlocks(user.id));
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const handleAdd = () => {
    if (!user?.id) return;
    const startTime = `${startHour}:${startMin}`;
    const endTime = `${endHour}:${endMin}`;
    if (startTime >= endTime) { toast.error('End time must be after start time'); return; }

    mockAvailabilityService.addDoctorBlock(user.id, {
      dayOfWeek: Number(dayOfWeek),
      specificDate: null,
      startTime,
      endTime,
      timezone: DEFAULT_TZ,
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

  // Group blocks by day
  const byDay = blocks.reduce<Record<number, MockAvailabilityBlock[]>>((acc, b) => {
    const day = b.dayOfWeek ?? 0;
    if (!acc[day]) acc[day] = [];
    acc[day].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Availability</h1>
        <p className="text-muted-foreground mt-1">Set your weekly recurring availability blocks (all times {DEFAULT_TZ})</p>
      </div>

      {/* Add Block */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Block</CardTitle>
          <CardDescription>Create a new recurring weekly availability window</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5 items-end">
            <div className="space-y-1">
              <Label>Day</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
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
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={startMin} onValueChange={setStartMin}>
                  <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>End</Label>
              <div className="flex gap-1">
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={endMin} onValueChange={setEndMin}>
                  <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <div className="h-10 flex items-center text-sm text-muted-foreground">{DEFAULT_TZ}</div>
            </div>
            <Button onClick={handleAdd}>Add Block</Button>
          </div>
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
                          <span className="font-medium">{b.startTime} – {b.endTime}</span>
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
