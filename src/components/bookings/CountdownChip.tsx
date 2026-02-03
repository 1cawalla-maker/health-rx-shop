import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownChipProps {
  utcTimestamp?: string;
  targetMs?: number;
  className?: string;
}

export function CountdownChip({ utcTimestamp, targetMs, className }: CountdownChipProps) {
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Compute target time from props
    const targetDate = utcTimestamp 
      ? new Date(utcTimestamp) 
      : targetMs 
        ? new Date(targetMs) 
        : null;

    if (!targetDate || isNaN(targetDate.getTime())) {
      setMinutesRemaining(null);
      return;
    }

    const update = () => {
      const msRemaining = targetDate.getTime() - Date.now();
      setMinutesRemaining(Math.floor(msRemaining / 60000));
    };

    // Call immediately on mount
    update();

    // Then update every 60 seconds
    const interval = setInterval(update, 60000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [utcTimestamp, targetMs]);

  // Hide if no data, passed, or > 24 hours away
  if (minutesRemaining === null || minutesRemaining <= 0 || minutesRemaining > 1440) {
    return null;
  }

  // Format: hours if >= 60min, otherwise minutes
  const displayText = minutesRemaining >= 60
    ? `${Math.floor(minutesRemaining / 60)}h left`
    : `${minutesRemaining}m left`;

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 border border-amber-500/20",
      className
    )}>
      <Clock className="h-3 w-3" />
      <span>{displayText}</span>
    </div>
  );
}
