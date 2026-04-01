import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorAvailabilityDateBlocksService } from '@/services/availabilityService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { supabase } from '@/integrations/supabase/client';
import { doctorPortalService } from '@/services/doctorPortalService';
import { AvailabilityGrid, type GridBooking } from '@/components/doctor/AvailabilityGrid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { MockAvailabilityBlock } from '@/types/telehealth';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';

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
  const [weekOffset, setWeekOffset] = useState(0);
  const [nextWeekHasBlocks, setNextWeekHasBlocks] = useState<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<'prev' | 'next' | null>(null);

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

  const weekStart = useMemo(() => {
    // ISO week start (Mon)
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }, []);

  const activeWeekStart = useMemo(() => addWeeks(weekStart, weekOffset), [weekStart, weekOffset]);
  const activeWeekEnd = useMemo(() => addDays(activeWeekStart, 6), [activeWeekStart]);

  const maxWeekOffset = 3; // 4 weeks in advance inclusive: 0,1,2,3

  const refresh = async () => {
    if (!doctorRowId) return;
    try {
      const startStr = format(activeWeekStart, 'yyyy-MM-dd');
      const endStr = format(activeWeekEnd, 'yyyy-MM-dd');
      const data = await doctorAvailabilityDateBlocksService.listForDoctorInRange({
        doctorRowId,
        startDate: startStr,
        endDate: endStr,
      });
      setBlocks(data);
    } catch (err: any) {
      console.error('Failed to load availability blocks:', err);
      toast.error(err?.message || 'Failed to load availability');
    }
  };

  useEffect(() => {
    void refresh();
  }, [doctorRowId, weekOffset]);

  // Used for the header CTA (Set/View next week)
  useEffect(() => {
    const run = async () => {
      if (!doctorRowId) {
        setNextWeekHasBlocks(false);
        return;
      }
      try {
        const nextStart = addWeeks(activeWeekStart, 1);
        const nextEnd = addDays(nextStart, 6);
        const next = await doctorAvailabilityDateBlocksService.listForDoctorInRange({
          doctorRowId,
          startDate: format(nextStart, 'yyyy-MM-dd'),
          endDate: format(nextEnd, 'yyyy-MM-dd'),
        });
        setNextWeekHasBlocks(next.length > 0);
      } catch {
        setNextWeekHasBlocks(false);
      }
    };

    void run();
  }, [doctorRowId, activeWeekStart]);

  useEffect(() => {
    const run = async () => {
      if (!doctorRowId) return;
      try {
        const nextStart = addWeeks(activeWeekStart, 1);
        const nextEnd = addDays(nextStart, 6);
        const data = await doctorAvailabilityDateBlocksService.listForDoctorInRange({
          doctorRowId,
          startDate: format(nextStart, 'yyyy-MM-dd'),
          endDate: format(nextEnd, 'yyyy-MM-dd'),
        });
        setNextWeekHasBlocks(data.length > 0);
      } catch {
        setNextWeekHasBlocks(false);
      }
    };
    void run();
  }, [doctorRowId, activeWeekStart]);

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

    // Convert dayOfWeek column into a concrete date within the active week.
    // Our grid keys: 1=Mon..6=Sat,0=Sun. date-fns weekStartsOn:1 gives Mon start.
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const dateStr = format(addDays(activeWeekStart, idx), 'yyyy-MM-dd');

    try {
      await doctorAvailabilityDateBlocksService.addBlock({
        doctorRowId,
        date: dateStr,
        startTime,
        endTime,
        timezone: doctorTz,
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
      await doctorAvailabilityDateBlocksService.removeBlock({ doctorRowId, blockId });
      await refresh();
    } catch (err: any) {
      console.error('Failed to remove block:', err);
      toast.error(err?.message || 'Failed to remove block');
    }
  };

  const handleEditBlock = async (blockId: string, dayOfWeek: number, startTime: string, endTime: string) => {
    if (!doctorRowId) return;
    try {
      // Preserve the original date (specificDate) if available; otherwise map by day into active week.
      const existingBlock = blocks.find((b) => b.id === blockId);
      const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const dateStr = existingBlock?.specificDate || format(addDays(activeWeekStart, idx), 'yyyy-MM-dd');

      await doctorAvailabilityDateBlocksService.removeBlock({ doctorRowId, blockId });
      await doctorAvailabilityDateBlocksService.addBlock({
        doctorRowId,
        date: dateStr,
        startTime,
        endTime,
        timezone: doctorTz,
      });
      await refresh();
    } catch (err: any) {
      console.error('Failed to edit block:', err);
      toast.error(err?.message || 'Failed to edit block');
    }
  };

  const handleCopyWeekToNextWeek = async () => {
    if (!doctorRowId) return;
    if (weekOffset >= maxWeekOffset) {
      toast.error('You can only set availability up to 4 weeks in advance');
      return;
    }

    try {
      const nextStart = addWeeks(activeWeekStart, 1);
      const nextEnd = addDays(nextStart, 6);

      // Load next week blocks so we avoid creating exact duplicates.
      const nextBlocks = await doctorAvailabilityDateBlocksService.listForDoctorInRange({
        doctorRowId,
        startDate: format(nextStart, 'yyyy-MM-dd'),
        endDate: format(nextEnd, 'yyyy-MM-dd'),
      });

      const existingKey = new Set(nextBlocks.map((b) => `${b.specificDate}|${b.startTime}|${b.endTime}`));

      let copied = 0;
      for (const b of blocks) {
        if (!b.specificDate) continue;
        const srcDate = new Date(`${b.specificDate}T00:00:00`);
        const dstDate = format(addDays(srcDate, 7), 'yyyy-MM-dd');
        const key = `${dstDate}|${b.startTime}|${b.endTime}`;
        if (existingKey.has(key)) continue;

        await doctorAvailabilityDateBlocksService.addBlock({
          doctorRowId,
          date: dstDate,
          startTime: b.startTime,
          endTime: b.endTime,
          timezone: doctorTz,
        });
        copied++;
      }

      toast.success(`Copied ${copied} block(s) to next week`);
      // Optional: jump to next week automatically
      setWeekOffset((w) => Math.min(w + 1, maxWeekOffset));
    } catch (err: any) {
      console.error('Failed to copy week:', err);
      toast.error(err?.message || 'Failed to copy week');
    }
  };

  const handleClearWeek = async () => {
    if (!doctorRowId) return;
    try {
      for (const b of blocks) {
        await doctorAvailabilityDateBlocksService.removeBlock({ doctorRowId, blockId: b.id });
      }
      toast.success('This week cleared');
      await refresh();
    } catch (err: any) {
      console.error('Failed to clear week:', err);
      toast.error(err?.message || 'Failed to clear week');
    }
  };

  const handleSetWeekdayPreset = async () => {
    if (!doctorRowId) return;

    try {
      // Clear existing blocks in this week (Mon-Fri)
      for (const b of blocks) {
        if (b.dayOfWeek !== null && b.dayOfWeek >= 1 && b.dayOfWeek <= 5) {
          await doctorAvailabilityDateBlocksService.removeBlock({ doctorRowId, blockId: b.id });
        }
      }

      // Add preset (Mon-Fri 09:00-17:00)
      for (const day of [1, 2, 3, 4, 5]) {
        const idx = day === 0 ? 6 : day - 1;
        const dateStr = format(addDays(activeWeekStart, idx), 'yyyy-MM-dd');
        await doctorAvailabilityDateBlocksService.addBlock({
          doctorRowId,
          date: dateStr,
          startTime: '09:00',
          endTime: '17:00',
          timezone: doctorTz,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Availability</h1>
          <p className="text-muted-foreground mt-1">Set your availability up to 4 weeks in advance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-muted-foreground mr-2">
            Week of <strong className="text-foreground">{format(activeWeekStart, 'd MMM')}</strong> –{' '}
            <strong className="text-foreground">{format(activeWeekEnd, 'd MMM')}</strong>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSlideDirection('prev');
              setWeekOffset((w) => Math.max(0, w - 1));
            }}
            disabled={weekOffset === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSlideDirection('next');
              setWeekOffset((w) => Math.min(maxWeekOffset, w + 1));
            }}
            disabled={weekOffset >= maxWeekOffset}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={nextWeekHasBlocks ? 'outline' : 'default'}
            onClick={() => {
              setSlideDirection('next');
              setWeekOffset((w) => Math.min(maxWeekOffset, w + 1));
            }}
            disabled={weekOffset >= maxWeekOffset}
          >
            {nextWeekHasBlocks ? 'View next week availability' : 'Set next week availability'}
          </Button>
        </div>
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
        weekStartDate={activeWeekStart}
        slideDirection={slideDirection}
        bookings={gridBookings}
        onAddBlock={handleAddBlock}
        onRemoveBlock={handleRemoveBlock}
        onEditBlock={handleEditBlock}
        onCopyMondayToWeekdays={handleCopyWeekToNextWeek}
        onClearWeek={handleClearWeek}
        onSetWeekdayPreset={handleSetWeekdayPreset}
      />
    </div>
  );
}
