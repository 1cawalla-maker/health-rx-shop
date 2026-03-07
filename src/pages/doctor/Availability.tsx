import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { mockAvailabilityService } from '@/services/availabilityService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { AvailabilityGrid } from '@/components/doctor/AvailabilityGrid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { MockAvailabilityBlock } from '@/types/telehealth';
import { dayOfWeekLabels } from '@/types/telehealth';

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

  const doctorTz = useMemo(
    () => (user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane'),
    [user?.id]
  );

  const refresh = () => {
    if (!user?.id) return;
    setBlocks(mockAvailabilityService.getDoctorBlocks(user.id));
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const byDay = useMemo(() => {
    const map: Record<number, MockAvailabilityBlock[]> = {};
    for (const b of blocks) {
      const day = b.dayOfWeek ?? 0;
      if (!map[day]) map[day] = [];
      map[day].push(b);
    }
    return map;
  }, [blocks]);

  const handleAddBlock = (dayOfWeek: number, startTime: string, endTime: string) => {
    if (!user?.id) return;
    const existing = byDay[dayOfWeek] || [];
    const overlapping = existing.find((b) => blocksOverlap({ startTime, endTime }, b));
    if (overlapping) {
      toast.error(
        `Overlaps with ${formatTime12h(overlapping.startTime)} – ${formatTime12h(overlapping.endTime)}`
      );
      return;
    }
    mockAvailabilityService.addDoctorBlock(user.id, {
      dayOfWeek,
      specificDate: null,
      startTime,
      endTime,
      timezone: doctorTz,
      isRecurring: true,
    });
    toast.success('Block added');
    refresh();
  };

  const handleRemoveBlock = (blockId: string) => {
    if (!user?.id) return;
    mockAvailabilityService.removeDoctorBlock(user.id, blockId);
    toast.success('Block removed');
    refresh();
  };

  const handleCopyMondayToWeekdays = () => {
    if (!user?.id) return;
    const monBlocks = byDay[1] || [];
    if (monBlocks.length === 0) {
      toast.error('No Monday blocks to copy');
      return;
    }
    let copied = 0;
    for (const targetDay of [2, 3, 4, 5]) {
      const existing = mockAvailabilityService.getDoctorBlocks(user.id).filter(
        (b) => b.dayOfWeek === targetDay
      );
      for (const block of monBlocks) {
        const isDuplicate = existing.some(
          (eb) => eb.startTime === block.startTime && eb.endTime === block.endTime
        );
        if (isDuplicate) continue;
        const overlapping = existing.find((eb) => blocksOverlap(block, eb));
        if (overlapping) continue;
        mockAvailabilityService.addDoctorBlock(user.id, {
          dayOfWeek: targetDay,
          specificDate: null,
          startTime: block.startTime,
          endTime: block.endTime,
          timezone: doctorTz,
          isRecurring: true,
        });
        existing.push({ ...block, id: '', doctorId: user.id, doctorName: '', isActive: true, dayOfWeek: targetDay });
        copied++;
      }
    }
    toast.success(`Copied ${copied} block(s) to Tue–Fri`);
    refresh();
  };

  const handleClearWeek = () => {
    if (!user?.id) return;
    for (const b of blocks) {
      mockAvailabilityService.removeDoctorBlock(user.id, b.id);
    }
    toast.success('All blocks cleared');
    refresh();
  };

  const handleSetWeekdayPreset = () => {
    if (!user?.id) return;
    // Clear existing weekday blocks first
    for (const b of blocks) {
      if (b.dayOfWeek !== null && b.dayOfWeek >= 1 && b.dayOfWeek <= 5) {
        mockAvailabilityService.removeDoctorBlock(user.id, b.id);
      }
    }
    // Add 9–5 for Mon–Fri
    for (const day of [1, 2, 3, 4, 5]) {
      mockAvailabilityService.addDoctorBlock(user.id, {
        dayOfWeek: day,
        specificDate: null,
        startTime: '09:00',
        endTime: '17:00',
        timezone: doctorTz,
        isRecurring: true,
      });
    }
    toast.success('Set 9:00 AM – 5:00 PM for weekdays');
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Availability</h1>
        <p className="text-muted-foreground mt-1">Set your weekly recurring availability</p>
      </div>

      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertTriangle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          All times shown in your timezone: <strong>{doctorTz}</strong>. If you change your
          timezone in Account settings, review your availability blocks to ensure times are
          still correct.
        </AlertDescription>
      </Alert>

      <AvailabilityGrid
        blocks={blocks}
        timezone={doctorTz}
        onAddBlock={handleAddBlock}
        onRemoveBlock={handleRemoveBlock}
        onCopyMondayToWeekdays={handleCopyMondayToWeekdays}
        onClearWeek={handleClearWeek}
        onSetWeekdayPreset={handleSetWeekdayPreset}
      />
    </div>
  );
}
