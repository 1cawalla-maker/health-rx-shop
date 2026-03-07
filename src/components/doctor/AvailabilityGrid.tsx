import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Copy, Trash2, Clock } from 'lucide-react';
import type { MockAvailabilityBlock } from '@/types/telehealth';

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

function blocksOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

interface AvailabilityGridProps {
  blocks: MockAvailabilityBlock[];
  timezone: string;
  onAddBlock: (dayOfWeek: number, startTime: string, endTime: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onCopyMondayToWeekdays: () => void;
  onClearWeek: () => void;
  onSetWeekdayPreset: () => void;
}

export function AvailabilityGrid({
  blocks,
  timezone,
  onAddBlock,
  onRemoveBlock,
  onCopyMondayToWeekdays,
  onClearWeek,
  onSetWeekdayPreset,
}: AvailabilityGridProps) {
  const [dragState, setDragState] = useState<{
    day: number;
    startMin: number;
    currentMin: number;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const blocksByDay = useMemo(() => {
    const map: Record<number, MockAvailabilityBlock[]> = {};
    for (const b of blocks) {
      const day = b.dayOfWeek ?? 0;
      if (!map[day]) map[day] = [];
      map[day].push(b);
    }
    return map;
  }, [blocks]);

  const getMinutesFromEvent = useCallback((e: React.MouseEvent, colEl: HTMLElement): number => {
    const rect = colEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = pxToMinutes(y);
    return Math.max(HOUR_START * 60, Math.min(HOUR_END * 60, minutes));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, day: number) => {
    // Only start drag on the column background, not on blocks
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    const colEl = (e.currentTarget as HTMLElement);
    const minutes = getMinutesFromEvent(e, colEl);
    setDragState({ day, startMin: minutes, currentMin: minutes });
  }, [getMinutesFromEvent]);

  const handleMouseMove = useCallback((e: React.MouseEvent, day: number) => {
    if (!dragState || dragState.day !== day) return;
    const colEl = (e.currentTarget as HTMLElement);
    const minutes = getMinutesFromEvent(e, colEl);
    setDragState((prev) => prev ? { ...prev, currentMin: minutes } : null);
  }, [dragState, getMinutesFromEvent]);

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;
    const startMin = Math.min(dragState.startMin, dragState.currentMin);
    const endMin = Math.max(dragState.startMin, dragState.currentMin);

    if (endMin - startMin >= SNAP_MINUTES) {
      // Check overlaps
      const dayBlocks = blocksByDay[dragState.day] || [];
      const hasOverlap = dayBlocks.some((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return blocksOverlap(startMin, endMin, bStart, bEnd);
      });

      if (hasOverlap) {
        toast.error('Block overlaps with existing availability');
      } else {
        onAddBlock(dragState.day, minutesToTime(startMin), minutesToTime(endMin));
      }
    }
    setDragState(null);
  }, [dragState, blocksByDay, onAddBlock]);

  const handleDeleteClick = (blockId: string) => {
    if (confirmDelete === blockId) {
      onRemoveBlock(blockId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(blockId);
    }
  };

  // Hour markers
  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      markers.push(h);
    }
    return markers;
  }, []);

  const totalHeight = TOTAL_HOURS * PX_PER_HOUR;

  return (
    <div className="space-y-4">
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
        Click and drag on the grid to create availability blocks. Click a block to delete it. All times in <strong>{timezone}</strong>.
      </p>

      {/* Grid */}
      <div className="overflow-x-auto border rounded-lg bg-background" ref={gridRef}>
        <div className="flex min-w-[700px]">
          {/* Time axis */}
          <div className="w-16 shrink-0 border-r border-border">
            <div className="h-8 border-b border-border" /> {/* header spacer */}
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

            return (
              <div key={day} className="flex-1 min-w-[85px] border-r border-border last:border-r-0">
                {/* Day header */}
                <div className="h-8 flex items-center justify-center border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  {dayBlocks.length > 0 && (
                    <span className="ml-1 text-[10px] text-primary font-medium">({dayBlocks.length})</span>
                  )}
                </div>

                {/* Time column */}
                <div
                  className="relative cursor-crosshair select-none"
                  style={{ height: totalHeight }}
                  onMouseDown={(e) => handleMouseDown(e, day)}
                  onMouseMove={(e) => handleMouseMove(e, day)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    if (dragState?.day === day) handleMouseUp();
                  }}
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

                  {/* Existing blocks */}
                  {dayBlocks.map((b) => {
                    const startMin = timeToMinutes(b.startTime);
                    const endMin = timeToMinutes(b.endTime);
                    const top = minutesToPx(startMin);
                    const height = minutesToPx(endMin) - top;
                    const isConfirming = confirmDelete === b.id;

                    return (
                      <div
                        key={b.id}
                        data-block
                        className={cn(
                          "absolute left-1 right-1 rounded-md border cursor-pointer transition-colors overflow-hidden",
                          isConfirming
                            ? "bg-destructive/20 border-destructive/50"
                            : "bg-primary/15 border-primary/30 hover:bg-primary/25"
                        )}
                        style={{ top, height: Math.max(height, 14) }}
                        onClick={() => handleDeleteClick(b.id)}
                        title={isConfirming ? 'Click again to delete' : `${formatTime(startMin)} – ${formatTime(endMin)}\nClick to delete`}
                      >
                        {height >= 24 && (
                          <div className="px-1 py-0.5 text-[10px] leading-tight text-primary font-medium truncate">
                            {formatTime(startMin)}
                          </div>
                        )}
                        {height >= 40 && (
                          <div className="px-1 text-[10px] leading-tight text-primary/70 truncate">
                            {formatTime(endMin)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Drag preview */}
                  {dragState && dragState.day === day && (
                    (() => {
                      const s = Math.min(dragState.startMin, dragState.currentMin);
                      const e = Math.max(dragState.startMin, dragState.currentMin);
                      if (e - s < SNAP_MINUTES) return null;
                      const top = minutesToPx(s);
                      const height = minutesToPx(e) - top;
                      return (
                        <div
                          className="absolute left-1 right-1 rounded-md border-2 border-dashed border-primary/60 bg-primary/10 pointer-events-none"
                          style={{ top, height }}
                        >
                          <div className="px-1 py-0.5 text-[10px] text-primary font-medium">
                            {formatTime(s)} – {formatTime(e)}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

