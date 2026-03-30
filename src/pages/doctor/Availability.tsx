import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorAvailabilityBlocksService } from '@/services/availabilityService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { supabase } from '@/integrations/supabase/client';
import { doctorPortalService } from '@/services/doctorPortalService';
import { AvailabilityGrid, type GridBooking } from '@/components/doctor/AvailabilityGrid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { MockAvailabilityBlock } from '@/types/telehealth';

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
  const [doctorRowId, setDoctorRowId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<MockAvailabilityBlock[]>([]);

  const doctorTz = useMemo(
    () => (user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane'),
    [user?.id]
  );

  useEffect(() => {
    const loadDoctorRowId = async () => {
      if (!user?.id) {
        setDoctorRowId(null);
        return;
      }
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Failed to load doctor row id:', error);
        setDoctorRowId(null);
        return;
      }

      setDoctorRowId(data?.id ?? null);
    };

    void loadDoctorRowId();
  }, [user?.id]);

  const refresh = async () => {
    if (!doctorRowId) return;
    try {
      const data = await doctorAvailabilityBlocksService.getDoctorBlocks(doctorRowId);
      setBlocks(data);
    } catch (err: any) {
      console.error('Failed to load availability blocks:', err);
      toast.error(err?.message || 'Failed to load availability');
    }
  };

  useEffect(() => {
    void refresh();
  }, [doctorRowId]);

  const byDay = useMemo(() => {
    const map: Record<number, MockAvailabilityBlock[]> = {};
    for (const b of blocks) {
      const day = b.dayOfWeek ?? 0;
      if (!map[day]) map[day] = [];
      map[day].push(b);
    }
    return map;
  }, [blocks]);

  /* ─── E6/E7: derive bookings for grid overlay ─── */
  const gridBookings: GridBooking[] = useMemo(() => {
    if (!user?.id) return [];
    const doctorBookings = doctorPortalService.getDoctorBookings(user.id);
    return doctorBookings
      .filter((b) => b.status === 'booked' || b.status === 'in_progress')
      .map((b) => {
        const date = new Date(b.scheduledDate);
        // JS getDay: 0=Sun,1=Mon..6=Sat — matches our grid keys
        const dayOfWeek = date.getDay();
        const [hh, mm] = b.timeWindowStart.split(':').map(Number);
        const startMin = hh * 60 + (mm || 0);
        return {
          id: b.id,
          dayOfWeek,
          startMin,
          endMin: startMin + 5, // 5-min consult
          patientName: undefined,
        };
      });
  }, [user?.id, blocks]); // re-derive when blocks change (proxy for refresh)

  const handleAddBlock = async (dayOfWeek: number, startTime: string, endTime: string) => {
    if (!doctorRowId) return;
    const existing = byDay[dayOfWeek] || [];
    const overlapping = existing.find((b) => blocksOverlap({ startTime, endTime }, b));
    if (overlapping) {
      toast.error(
        `Overlaps with ${formatTime12h(overlapping.startTime)} – ${formatTime12h(overlapping.endTime)}`
      );
      return;
    }
    try {
      await doctorAvailabilityBlocksService.addDoctorBlock(doctorRowId, {
        dayOfWeek,
        specificDate: null,
        startTime,
        endTime,
        timezone: doctorTz,
        isRecurring: true,
      });
      toast.success('Block added');
      await refresh();
    } catch (err: any) {
      console.error('Failed to add block:', err);
      toast.error(err?.message || 'Failed to add block');
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    if (!doctorRowId) return;
    try {
      await doctorAvailabilityBlocksService.removeDoctorBlock(doctorRowId, blockId);
      await refresh();
    } catch (err: any) {
      console.error('Failed to remove block:', err);
      toast.error(err?.message || 'Failed to remove block');
    }
  };

  const handleEditBlock = async (blockId: string, dayOfWeek: number, startTime: string, endTime: string) => {
    if (!doctorRowId) return;
    try {
      await doctorAvailabilityBlocksService.removeDoctorBlock(doctorRowId, blockId);
      await doctorAvailabilityBlocksService.addDoctorBlock(doctorRowId, {
        dayOfWeek,
        specificDate: null,
        startTime,
        endTime,
        timezone: doctorTz,
        isRecurring: true,
      });
      await refresh();
    } catch (err: any) {
      console.error('Failed to edit block:', err);
      toast.error(err?.message || 'Failed to edit block');
    }
  };

  const handleCopyMondayToWeekdays = async () => {
    if (!doctorRowId) return;
    const monBlocks = byDay[1] || [];
    if (monBlocks.length === 0) {
      toast.error('No Monday blocks to copy');
      return;
    }

    try {
      let copied = 0;
      for (const targetDay of [2, 3, 4, 5]) {
        const existing = byDay[targetDay] || [];
        for (const block of monBlocks) {
          const isDuplicate = existing.some(
            (eb) => eb.startTime === block.startTime && eb.endTime === block.endTime
          );
          if (isDuplicate) continue;
          const overlapping = existing.find((eb) => blocksOverlap(block, eb));
          if (overlapping) continue;

          await doctorAvailabilityBlocksService.addDoctorBlock(doctorRowId, {
            dayOfWeek: targetDay,
            specificDate: null,
            startTime: block.startTime,
            endTime: block.endTime,
            timezone: doctorTz,
            isRecurring: true,
          });
          copied++;
        }
      }

      toast.success(`Copied ${copied} block(s) to Tue–Fri`);
      await refresh();
    } catch (err: any) {
      console.error('Failed to copy blocks:', err);
      toast.error(err?.message || 'Failed to copy blocks');
    }
  };

  const handleClearWeek = async () => {
    if (!doctorRowId) return;
    try {
      for (const b of blocks) {
        await doctorAvailabilityBlocksService.removeDoctorBlock(doctorRowId, b.id);
      }
      toast.success('All blocks cleared');
      await refresh();
    } catch (err: any) {
      console.error('Failed to clear week:', err);
      toast.error(err?.message || 'Failed to clear week');
    }
  };

  const handleSetWeekdayPreset = async () => {
    if (!doctorRowId) return;

    try {
      // Clear existing weekday blocks
      for (const b of blocks) {
        if (b.dayOfWeek !== null && b.dayOfWeek >= 1 && b.dayOfWeek <= 5) {
          await doctorAvailabilityBlocksService.removeDoctorBlock(doctorRowId, b.id);
        }
      }

      // Add preset
      for (const day of [1, 2, 3, 4, 5]) {
        await doctorAvailabilityBlocksService.addDoctorBlock(doctorRowId, {
          dayOfWeek: day,
          specificDate: null,
          startTime: '09:00',
          endTime: '17:00',
          timezone: doctorTz,
          isRecurring: true,
        });
      }

      toast.success('Set 9:00 AM – 5:00 PM for weekdays');
      await refresh();
    } catch (err: any) {
      console.error('Failed to set weekday preset:', err);
      toast.error(err?.message || 'Failed to set weekday preset');
    }
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
        bookings={gridBookings}
        onAddBlock={handleAddBlock}
        onRemoveBlock={handleRemoveBlock}
        onEditBlock={handleEditBlock}
        onCopyMondayToWeekdays={handleCopyMondayToWeekdays}
        onClearWeek={handleClearWeek}
        onSetWeekdayPreset={handleSetWeekdayPreset}
      />
    </div>
  );
}
