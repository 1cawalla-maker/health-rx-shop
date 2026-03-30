import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Copy, Trash2, Clock, CalendarCheck, Pencil } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MockAvailabilityBlock } from '@/types/telehealth';

/* ─── constants ─── */
const DAYS = [
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
  { key: 0, label: 'Sun' },
];

const HOUR_START = 6;
const HOUR_END = 23;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 60;
const SNAP_MINUTES = 5;
const AUTO_SCROLL_EDGE = 40; // px from edge to trigger
const AUTO_SCROLL_SPEED = 4; // px per frame

/* ─── helpers ─── */
function minutesToPx(minutes: number): number {
  return ((minutes - HOUR_START * 60) / 60) * PX_PER_HOUR;
}

function pxToMinutes(px: number): number {
  const raw = (px / PX_PER_HOUR) * 60 + HOUR_START * 60;
  return Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function timeToMinutes(time: string): number {
  const [hh, mm] = time.split(':').map(Number);
  return hh * 60 + mm;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Generate 5-minute time options for selects */
function timeOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  for (let m = HOUR_START * 60; m <= HOUR_END * 60; m += SNAP_MINUTES) {
    opts.push({ value: minutesToTime(m), label: formatTime(m) });
  }
  return opts;
}

const TIME_OPTIONS = timeOptions();

/* ─── booking overlay type ─── */
export interface GridBooking {
  id: string;
  dayOfWeek: number;
  startMin: number;
  endMin: number;
  patientName?: string;
}

/* ─── props ─── */
interface AvailabilityGridProps {
  blocks: MockAvailabilityBlock[];
  timezone: string;
  bookings?: GridBooking[];
  onAddBlock: (dayOfWeek: number, startTime: string, endTime: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onEditBlock?: (blockId: string, dayOfWeek: number, startTime: string, endTime: string) => void;
  onCopyMondayToWeekdays: () => void;
  onClearWeek: () => void;
  onSetWeekdayPreset: () => void;
}

/* ─── visual split helper ─── */
interface VisualSegment {
  blockId: string;
  startMin: number;
  endMin: number;
}

function splitBlockAroundBookings(
  blockStartMin: number,
  blockEndMin: number,
  blockId: string,
  dayBookings: GridBooking[]
): VisualSegment[] {
  // Sort bookings by start time
  const sorted = [...dayBookings].sort((a, b) => a.startMin - b.startMin);
  const segments: VisualSegment[] = [];
  let cursor = blockStartMin;

  for (const bk of sorted) {
    // Only if booking overlaps with remaining segment
    if (bk.endMin <= cursor || bk.startMin >= blockEndMin) continue;
    const overlapStart = Math.max(bk.startMin, cursor);
    if (overlapStart > cursor) {
      segments.push({ blockId, startMin: cursor, endMin: overlapStart });
    }
    cursor = Math.max(cursor, bk.endMin);
  }
  if (cursor < blockEndMin) {
    segments.push({ blockId, startMin: cursor, endMin: blockEndMin });
  }
  return segments;
}

export function AvailabilityGrid({
  blocks,
  timezone,
  bookings = [],
  onAddBlock,
  onRemoveBlock,
  onEditBlock,
  onCopyMondayToWeekdays,
  onClearWeek,
  onSetWeekdayPreset,
}: AvailabilityGridProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  /* ─── state ─── */
  const [dragState, setDragState] = useState<{
    day: number;
    startMin: number;
    currentMin: number;
  } | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [mobilePopoverBlockId, setMobilePopoverBlockId] = useState<string | null>(null);

  /* ─── refs ─── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const pointerYRef = useRef(0);
  const activeColRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  /* ─── derived ─── */
  const blocksByDay = useMemo(() => {
    const map: Record<number, MockAvailabilityBlock[]> = {};
    for (const b of blocks) {
      const day = b.dayOfWeek ?? 0;
      if (!map[day]) map[day] = [];
      map[day].push(b);
    }
    return map;
  }, [blocks]);

  const bookingsByDay = useMemo(() => {
    const map: Record<number, GridBooking[]> = {};
    for (const b of bookings) {
      if (!map[b.dayOfWeek]) map[b.dayOfWeek] = [];
      map[b.dayOfWeek].push(b);
    }
    return map;
  }, [bookings]);

  const totalHeight = TOTAL_HOURS * PX_PER_HOUR;

  /* ─── E3: auto-scroll during drag ─── */
  const autoScrollLoop = useCallback(() => {
    if (!isDraggingRef.current || !scrollRef.current) {
      rafRef.current = null;
      return;
    }
    const container = scrollRef.current;
    const rect = container.getBoundingClientRect();
    const y = pointerYRef.current;

    if (y < rect.top + AUTO_SCROLL_EDGE) {
      container.scrollTop -= AUTO_SCROLL_SPEED;
    } else if (y > rect.bottom - AUTO_SCROLL_EDGE) {
      container.scrollTop += AUTO_SCROLL_SPEED;
    }
    rafRef.current = requestAnimationFrame(autoScrollLoop);
  }, []);

  const startAutoScroll = useCallback(() => {
    isDraggingRef.current = true;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(autoScrollLoop);
    }
  }, [autoScrollLoop]);

  const stopAutoScroll = useCallback(() => {
    isDraggingRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* ─── drag helpers ─── */
  const getMinutesFromPointer = useCallback((clientY: number, colEl: HTMLElement): number => {
    const rect = colEl.getBoundingClientRect();
    const y = clientY - rect.top;
    const minutes = pxToMinutes(y);
    return Math.max(HOUR_START * 60, Math.min(HOUR_END * 60, minutes));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, day: number) => {
    // Left-click / primary pointer only
    // @ts-ignore
    if (typeof (e as any).button === 'number' && (e as any).button !== 0) return;

    // If the edit dialog is open, never start a drag-create interaction.
    if (editingBlockId) return;

    if ((e.target as HTMLElement).closest('[data-block]') || (e.target as HTMLElement).closest('[data-booking]')) return;
    const colEl = e.currentTarget as HTMLElement;
    const minutes = getMinutesFromPointer(e.clientY, colEl);

    activeColRef.current = colEl;
    activePointerIdRef.current = e.pointerId;

    setDragState({ day, startMin: minutes, currentMin: minutes });
    pointerYRef.current = e.clientY;
    startAutoScroll();
  }, [getMinutesFromPointer, startAutoScroll, editingBlockId]);

  const handlePointerMove = useCallback((e: React.PointerEvent, day: number) => {
    if (!dragState || dragState.day !== day) return;
    const colEl = e.currentTarget as HTMLElement;
    const minutes = getMinutesFromPointer(e.clientY, colEl);
    pointerYRef.current = e.clientY;
    setDragState((prev) => prev ? { ...prev, currentMin: minutes } : null);
  }, [dragState, getMinutesFromPointer]);

  // Window-level pointer tracking so we don't need pointer capture (which can break Radix Select clicks)
  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: PointerEvent) => {
      if (editingBlockId) return;
      if (activePointerIdRef.current !== e.pointerId) return;
      const colEl = activeColRef.current;
      if (!colEl) return;
      const minutes = getMinutesFromPointer(e.clientY, colEl);
      pointerYRef.current = e.clientY;
      setDragState((prev) => prev ? { ...prev, currentMin: minutes } : null);
    };

    const onUp = (e: PointerEvent) => {
      if (editingBlockId) return;
      if (activePointerIdRef.current !== e.pointerId) return;
      activePointerIdRef.current = null;
      activeColRef.current = null;
      stopAutoScroll();

      setDragState((prev) => {
        if (!prev) return null;
        const startMin = Math.min(prev.startMin, prev.currentMin);
        const endMin = Math.max(prev.startMin, prev.currentMin);

        if (endMin - startMin >= SNAP_MINUTES) {
          const dayBlocks = blocksByDay[prev.day] || [];
          const dayBookingsList = bookingsByDay[prev.day] || [];

          const hasBlockOverlap = dayBlocks.some((b) => {
            const bStart = timeToMinutes(b.startTime);
            const bEnd = timeToMinutes(b.endTime);
            return rangesOverlap(startMin, endMin, bStart, bEnd);
          });
          const hasBookingOverlap = dayBookingsList.some((bk) =>
            rangesOverlap(startMin, endMin, bk.startMin, bk.endMin)
          );

          if (hasBookingOverlap) toast.error('Cannot overlap with a scheduled booking');
          else if (hasBlockOverlap) toast.error('Block overlaps with existing availability');
          else onAddBlock(prev.day, minutesToTime(startMin), minutesToTime(endMin));
        }

        return null;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragState, getMinutesFromPointer, stopAutoScroll, blocksByDay, bookingsByDay, onAddBlock, editingBlockId]);

  // Pointer up is handled at window-level while dragging; keep this as a no-op safety.
  const handlePointerUp = useCallback(() => {
    stopAutoScroll();
    setDragState(null);
    activePointerIdRef.current = null;
    activeColRef.current = null;
  }, [stopAutoScroll]);

  /* ─── E4: keyboard delete ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedBlockId) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        onRemoveBlock(selectedBlockId);
        setSelectedBlockId(null);

        // Safety: if we were mid-drag (or pointer state got stuck), reset drag state so user can create blocks again.
        setDragState(null);
        activePointerIdRef.current = null;
        activeColRef.current = null;
        stopAutoScroll();

        toast.success('Availability block deleted');
      }
      if (e.key === 'Escape') {
        setSelectedBlockId(null);
        setEditingBlockId(null);
        setMobilePopoverBlockId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedBlockId, onRemoveBlock, stopAutoScroll]);

  // Deselect on click-away
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      // Ignore clicks inside blocks, popovers, or Radix portal content (Select/Popover render in portals)
      if (
        el.closest('[data-block]') ||
        el.closest('[data-popover-content]') ||
        el.closest('[data-radix-popper-content-wrapper]') ||
        el.closest('[role="listbox"]')
      ) {
        return;
      }
      setSelectedBlockId(null);
      setMobilePopoverBlockId(null);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  /* ─── E5: inline edit handlers ─── */
  const openEditor = (block: MockAvailabilityBlock) => {
    // Ensure no drag state is active when opening the editor.
    setDragState(null);
    activePointerIdRef.current = null;
    activeColRef.current = null;

    setEditingBlockId(block.id);
    setEditStart(block.startTime);
    setEditEnd(block.endTime);
  };

  const editingBlock = useMemo(
    () => (editingBlockId ? blocks.find((b) => b.id === editingBlockId) || null : null),
    [editingBlockId, blocks]
  );

  const handleSaveEdit = (block: MockAvailabilityBlock) => {
    const newStartMin = timeToMinutes(editStart);
    const newEndMin = timeToMinutes(editEnd);

    if (newEndMin <= newStartMin) {
      toast.error('End time must be after start time');
      return;
    }

    const day = block.dayOfWeek ?? 0;
    const dayBlocks = blocksByDay[day] || [];
    const dayBookingsList = bookingsByDay[day] || [];

    // Check overlap with other blocks (excluding current)
    const hasBlockOverlap = dayBlocks
      .filter((b) => b.id !== block.id)
      .some((b) => rangesOverlap(newStartMin, newEndMin, timeToMinutes(b.startTime), timeToMinutes(b.endTime)));

    const hasBookingOverlap = dayBookingsList.some((bk) =>
      rangesOverlap(newStartMin, newEndMin, bk.startMin, bk.endMin)
    );

    if (hasBookingOverlap) {
      toast.error('Cannot overlap with a scheduled booking');
      return;
    }
    if (hasBlockOverlap) {
      toast.error('Overlaps with existing availability');
      return;
    }

    if (onEditBlock) {
      onEditBlock(block.id, day, editStart, editEnd);
    } else {
      // Fallback: remove + add
      onRemoveBlock(block.id);
      onAddBlock(day, editStart, editEnd);
    }
    setEditingBlockId(null);
    setMobilePopoverBlockId(null);
    toast.success('Block updated');
  };

  /* ─── block click handler ─── */
  const handleBlockClick = (e: React.MouseEvent, block: MockAvailabilityBlock) => {
    e.stopPropagation();
    if (isMobile) {
      setMobilePopoverBlockId(mobilePopoverBlockId === block.id ? null : block.id);
    } else {
      setSelectedBlockId(selectedBlockId === block.id ? null : block.id);
    }
  };

  const handleTimeClick = (e: React.MouseEvent, block: MockAvailabilityBlock) => {
    e.stopPropagation();
    if (!isMobile) {
      openEditor(block);
    }
  };

  /* ─── hour markers ─── */
  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      markers.push(h);
    }
    return markers;
  }, []);

  /* ─── render ─── */
  return (
    <div className="space-y-4">
      <Dialog
        open={Boolean(editingBlock)}
        onOpenChange={(open) => {
          if (!open) setEditingBlockId(null);
        }}
      >
        <DialogContent
          className="max-w-sm"
          // Prevent any pointer events inside the dialog from starting grid drag interactions behind it.
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Edit times</DialogTitle>
            <DialogDescription>Adjust the start and end times for this availability block.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Use <input type="time"> to avoid native select/portal interactions triggering grid drags. */}
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Start</label>
                <input
                  type="time"
                  step={SNAP_MINUTES * 60}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">5-minute increments</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">End</label>
                <input
                  type="time"
                  step={SNAP_MINUTES * 60}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                toast.message('Cancel clicked');
                setEditingBlockId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.message('Save clicked');
                if (editingBlock) handleSaveEdit(editingBlock);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onCopyMondayToWeekdays}>
          <Copy className="h-3.5 w-3.5" />Copy Mon → Weekdays
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onSetWeekdayPreset}>
          <Clock className="h-3.5 w-3.5" />Set 9–5 Weekdays
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={onClearWeek}>
          <Trash2 className="h-3.5 w-3.5" />Clear Week
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Click and drag to create blocks. {isMobile ? 'Tap' : 'Click'} a block to {isMobile ? 'edit or delete' : 'select'}. {!isMobile && 'Press Backspace to delete.'} All times in <strong>{timezone}</strong>.
      </p>

      {/* Grid with scroll container */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-auto border rounded-lg bg-background",
          editingBlockId ? "pointer-events-none" : ""
        )}
        style={{ maxHeight: '70vh' }}
      >
        <div ref={gridRef} className="flex min-w-[700px]">
          {/* Time axis */}
          <div className="w-16 shrink-0 border-r border-border sticky left-0 bg-background z-10">
            <div className="h-8 border-b border-border sticky top-0 bg-background z-20" />
            <div className="relative" style={{ height: totalHeight }}>
              {hourMarkers.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 text-[10px] text-muted-foreground pr-2 text-right leading-none"
                  style={{ top: (h - HOUR_START) * PX_PER_HOUR - 5 }}
                >
                  {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {DAYS.map(({ key: day, label }) => {
            const dayBlocks = blocksByDay[day] || [];
            const dayBookings = bookingsByDay[day] || [];

            return (
              <div key={day} className="flex-1 min-w-[85px] border-r border-border last:border-r-0">
                {/* Day header */}
                <div className="h-8 flex items-center justify-center border-b border-border sticky top-0 bg-background z-20">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  {dayBlocks.length > 0 && (
                    <span className="ml-1 text-[10px] text-primary font-medium">({dayBlocks.length})</span>
                  )}
                </div>

                {/* Time column */}
                <div
                  className="relative cursor-crosshair select-none touch-none"
                  style={{ height: totalHeight }}
                  onPointerDown={(e) => handlePointerDown(e, day)}
                >
                  {/* Hour lines */}
                  {hourMarkers.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border/40"
                      style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {hourMarkers.slice(0, -1).map((h) => (
                    <div
                      key={`${h}-half`}
                      className="absolute left-0 right-0 border-t border-border/20 border-dashed"
                      style={{ top: (h - HOUR_START) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                    />
                  ))}

                  {/* Availability blocks (visual split around bookings) */}
                  {dayBlocks.map((b) => {
                    const bStartMin = timeToMinutes(b.startTime);
                    const bEndMin = timeToMinutes(b.endTime);
                    const segments = splitBlockAroundBookings(bStartMin, bEndMin, b.id, dayBookings);
                    const isSelected = selectedBlockId === b.id;
                    const isMobileActive = mobilePopoverBlockId === b.id;

                    return segments.map((seg, segIdx) => {
                      const top = minutesToPx(seg.startMin);
                      const height = minutesToPx(seg.endMin) - top;
                      const isFirstSeg = segIdx === 0;

                      const blockEl = (
                        <div
                          key={`${b.id}-${segIdx}`}
                          data-block
                          className={cn(
                            "absolute left-1 right-1 rounded-md border cursor-pointer transition-all overflow-hidden z-10",
                            isSelected
                              ? "bg-primary/20 border-primary ring-2 ring-primary ring-offset-1"
                              : "bg-primary/15 border-primary/30 hover:bg-primary/25"
                          )}
                          style={{ top, height: Math.max(height, 14) }}
                          onClick={(e) => handleBlockClick(e, b)}
                          title={`${formatTime(bStartMin)} – ${formatTime(bEndMin)}${!isMobile ? '\nClick time to edit • Select + Delete to remove' : ''}`}
                        >
                          {isFirstSeg && height >= 14 && (
                            <div
                              className="px-1 py-0.5 text-[10px] leading-tight text-primary font-medium truncate cursor-pointer hover:underline"
                              onClick={(e) => handleTimeClick(e, b)}
                            >
                              {formatTime(bStartMin)}
                            </div>
                          )}
                          {isFirstSeg && height >= 40 && (
                            <div className="px-1 text-[10px] leading-tight text-primary/70 truncate">
                              {formatTime(bEndMin)}
                            </div>
                          )}
                        </div>
                      );

                      // Wrap first segment with popover for mobile actions only.
                      // Desktop time editing is handled via a Dialog to avoid Radix portal/pointer issues.
                      if (isFirstSeg && isMobileActive) {
                        return (
                          <Popover
                            key={`${b.id}-${segIdx}`}
                            open={isMobileActive}
                            onOpenChange={(open) => {
                              if (!open) {
                                setMobilePopoverBlockId(null);
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              {blockEl}
                            </PopoverTrigger>
                            <PopoverContent
                              data-popover-content
                              className="w-56 p-3 space-y-3"
                              side="right"
                              align="start"
                            >
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground font-medium">
                                  {formatTime(bStartMin)} – {formatTime(bEndMin)}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditor(b);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />Edit times
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveBlock(b.id);
                                    setMobilePopoverBlockId(null);
                                    toast.success('Availability block deleted');
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />Delete
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      }

                      return blockEl;
                    });
                  })}

                  {/* Booking chips (E6) */}
                  {dayBookings.map((bk) => {
                    const top = minutesToPx(bk.startMin);
                    const height = Math.max(minutesToPx(bk.endMin) - top, 14);
                    return (
                      <div
                        key={`bk-${bk.id}`}
                        data-booking
                        className="absolute left-1 right-1 rounded-md border border-accent bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden z-20 pointer-events-auto"
                        style={{ top, height: Math.max(height, 18), marginTop: 1, marginBottom: 1 }}
                        onClick={() => navigate(`/doctor/consultation/${bk.id}`)}
                        title={`Booking: ${bk.patientName || 'Patient'}\n${formatTime(bk.startMin)} – ${formatTime(bk.endMin)}\nClick to view`}
                      >
                        {height >= 14 && (
                          <div className="px-1 py-0.5 text-[9px] leading-tight text-accent-foreground font-medium truncate flex items-center gap-0.5">
                            <CalendarCheck className="h-2.5 w-2.5 shrink-0" />
                            {bk.patientName || 'Booked'}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Drag preview */}
                  {dragState && dragState.day === day && (() => {
                    const s = Math.min(dragState.startMin, dragState.currentMin);
                    const e = Math.max(dragState.startMin, dragState.currentMin);
                    if (e - s < SNAP_MINUTES) return null;
                    const top = minutesToPx(s);
                    const height = minutesToPx(e) - top;
                    return (
                      <div
                        className="absolute left-1 right-1 rounded-md border-2 border-dashed border-primary/60 bg-primary/10 pointer-events-none z-10"
                        style={{ top, height }}
                      >
                        <div className="px-1 py-0.5 text-[10px] text-primary font-medium">
                          {formatTime(s)} – {formatTime(e)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
