
# Updated Plan: Fix Dashboard "Next Consultation" Card

## Problem
The patient dashboard at `/patient/dashboard` shows "No upcoming consultations" even when `/patient/consultations` has bookings, because the dashboard queries Supabase directly instead of using the shared mock/localStorage data.

## Solution
Update `src/pages/patient/Dashboard.tsx` to source booking data from the same mock/localStorage approach used in Consultations.tsx.

---

## File to Modify

### `src/pages/patient/Dashboard.tsx`

#### Step 1: Add imports
```typescript
import { useBookings } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
```

#### Step 2: Add booking data retrieval
Replicate the same mock data approach from Consultations.tsx:
```typescript
const { bookings } = useBookings({ patientId: user?.id });

// Merge mock bookings with Supabase bookings (same pattern as Consultations.tsx)
const mockBookings = [
  { id: 'mock-1', scheduledAt: new Date(Date.now() + 86400000), status: 'booked', doctorName: 'Dr. Sarah Chen', amountPaid: 49 },
  // ... other mock entries
];

const allBookings = [...mockBookings, ...bookings.map(b => ({ ... }))];
```

#### Step 3: Derive next upcoming booking with safe Date handling
```typescript
const upcomingStatuses = ['booked', 'confirmed'];
const now = new Date();

const nextBooking = allBookings
  .filter(b => upcomingStatuses.includes(b.status) && new Date(b.scheduledAt) >= now)
  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] || null;
```

#### Step 4: Timezone label using Intl.DateTimeFormat
```typescript
const getTimezoneLabel = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  return tzPart?.value || 'AEST';
};
```

#### Step 5: Safe Dr-prefix logic (same as ConsultationDetailDialog)
```typescript
const formatDoctorName = (name: string): string => {
  return /^dr\.?\s*/i.test(name) ? name : `Dr. ${name}`;
};
```

#### Step 6: Update the "Next Consultation" card JSX
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Calendar className="h-5 w-5" />
      Next Consultation
    </CardTitle>
  </CardHeader>
  <CardContent>
    {nextBooking ? (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium">
            {new Date(nextBooking.scheduledAt).toLocaleDateString('en-AU', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>
          <BookingStatusBadge status={nextBooking.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(nextBooking.scheduledAt).toLocaleTimeString('en-AU', {
            hour: '2-digit', minute: '2-digit'
          })} ({getTimezoneLabel(new Date(nextBooking.scheduledAt))})
        </p>
        {nextBooking.doctorName && (
          <p className="text-sm">
            <span className="text-muted-foreground">Doctor:</span>{' '}
            {formatDoctorName(nextBooking.doctorName)}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/patient/consultations">View consultation</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/patient/book">Book another</Link>
          </Button>
        </div>
      </div>
    ) : (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-4">No upcoming consultations</p>
        <Button asChild>
          <Link to="/patient/book">Book a Consultation</Link>
        </Button>
      </div>
    )}
  </CardContent>
</Card>
```

---

## Key Implementation Details

| Requirement | Implementation |
|-------------|----------------|
| Safe Date handling | `new Date(b.scheduledAt)` for all comparisons and formatting |
| Timezone label | `Intl.DateTimeFormat` with `timeZoneName: 'short'` → AEST/AEDT |
| Dr-prefix logic | Regex `/^dr\.?\s*/i` to prevent "Dr. Dr." duplication |
| Null state | Shows "No upcoming consultations" with single "Book a Consultation" CTA |
| Status badge | Reuses existing `BookingStatusBadge` component |

---

## Files Changed
- `src/pages/patient/Dashboard.tsx` (modify)

---

**Awaiting approval.**
