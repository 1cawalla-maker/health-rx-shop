

# Phase 1: Add Countdown Timer for Upcoming Consultations (Updated)

## Overview
Create a shared countdown chip component that displays remaining time for consultations within 24 hours. The component will update live every 60 seconds and automatically hide when time has passed.

---

## New File to Create

### `src/components/bookings/CountdownChip.tsx`

```typescript
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
```

---

## Files to Update (4 files)

### 1. `src/pages/patient/Dashboard.tsx`
- Add import: `import { CountdownChip } from '@/components/bookings/CountdownChip';`
- Add after time display in "Next Consultation" card:
```tsx
<CountdownChip utcTimestamp={nextBooking.utcTimestamp} />
```

---

### 2. `src/pages/patient/Consultations.tsx`
- Add import: `import { CountdownChip } from '@/components/bookings/CountdownChip';`
- Add after time span in BookingCard:
```tsx
<CountdownChip utcTimestamp={booking.utcTimestamp} />
```

---

### 3. `src/components/patient/ManageBookingDialog.tsx`
- Add import: `import { CountdownChip } from '@/components/bookings/CountdownChip';`
- Note: ManageBookingDialog receives `scheduledAt: Date` - need to pass as targetMs:
```tsx
<CountdownChip targetMs={booking.scheduledAt.getTime()} />
```

---

### 4. `src/components/patient/ConsultationDetailDialog.tsx`
- Add import: `import { CountdownChip } from '@/components/bookings/CountdownChip';`
- Add after status badge:
```tsx
<CountdownChip utcTimestamp={booking.utcTimestamp} />
```

---

## Summary Table

| File | Change Type | Prop Used |
|------|-------------|-----------|
| `src/components/bookings/CountdownChip.tsx` | **Create** | N/A |
| `src/pages/patient/Dashboard.tsx` | Update | `utcTimestamp` |
| `src/pages/patient/Consultations.tsx` | Update | `utcTimestamp` |
| `src/components/patient/ManageBookingDialog.tsx` | Update | `targetMs` |
| `src/components/patient/ConsultationDetailDialog.tsx` | Update | `utcTimestamp` |

---

## Key Implementation Details

| Requirement | Implementation |
|-------------|----------------|
| Immediate update on mount | `update()` called before `setInterval` |
| 60s interval | `setInterval(update, 60000)` |
| Cleanup on unmount | `return () => clearInterval(interval)` |
| Timestamp input | `utcTimestamp: string` OR `targetMs: number` |
| Compute remaining | `targetDate.getTime() - Date.now()` |
| Hide when passed | `minutesRemaining <= 0` returns null |
| Hide when > 24h | `minutesRemaining > 1440` returns null |
| Display >= 60m | `${Math.floor(minutes / 60)}h left` |
| Display < 60m | `${minutes}m left` |

---

**Awaiting approval.**

