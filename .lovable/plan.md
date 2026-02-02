

# UI Adjustments: Payment Page Doctor Name & Timezone Consistency (Revised)

## Summary

Two minimal UI changes to improve the booking flow:
1. Hide assigned doctor name on payment page until after payment confirmation
2. Add timezone label (AEST/AEDT) to consultations list using `Intl.DateTimeFormat` for correct daylight saving detection

---

## Files to Change

| File | Change Description |
|------|-------------------|
| `src/pages/patient/BookingPayment.tsx` | Replace doctor name display with "Assigned after payment" message |
| `src/pages/patient/Consultations.tsx` | Add dynamic timezone abbreviation next to time display |

---

## Change 1: Payment Page - Hide Doctor Name

### File: `src/pages/patient/BookingPayment.tsx`

**Lines 176-181** - Replace the conditional doctor name display:

**Current:**
```tsx
{booking.doctorName && (
  <div className="bg-muted/50 rounded-lg p-3 mt-4">
    <p className="text-sm text-muted-foreground">Assigned Doctor</p>
    <p className="font-medium">{booking.doctorName}</p>
  </div>
)}
```

**New:**
```tsx
<div className="bg-muted/50 rounded-lg p-3 mt-4">
  <p className="text-sm text-muted-foreground">Doctor Assignment</p>
  <p className="font-medium text-muted-foreground">Assigned after payment confirmation</p>
</div>
```

---

## Change 2: Consultations Page - Add Dynamic Timezone Label

### File: `src/pages/patient/Consultations.tsx`

**Step 1:** Update the `allBookings` mapping to include optional `displayTimezone` (lines 56-71):

**Current:**
```tsx
const allBookings = [
  ...mockBookings.map(b => ({
    id: b.id,
    scheduledAt: new Date(`${b.scheduledDate}T${b.timeWindowStart}:00`),
    status: b.status,
    doctorName: b.doctorName,
    isMock: true,
  })),
  ...consultations.map(c => ({
    id: c.id,
    scheduledAt: new Date(c.scheduled_at),
    status: c.status as BookingStatus,
    doctorName: null,
    isMock: false,
  })),
];
```

**New:**
```tsx
const allBookings = [
  ...mockBookings.map(b => ({
    id: b.id,
    scheduledAt: new Date(`${b.scheduledDate}T${b.timeWindowStart}:00`),
    status: b.status,
    doctorName: b.doctorName,
    displayTimezone: b.displayTimezone,
    isMock: true,
  })),
  ...consultations.map(c => ({
    id: c.id,
    scheduledAt: new Date(c.scheduled_at),
    status: c.status as BookingStatus,
    doctorName: null,
    displayTimezone: undefined,
    isMock: false,
  })),
];
```

**Step 2:** Add dynamic timezone abbreviation helper function (after the `allBookings` definition, around line 80):

```tsx
const getTimezoneAbbr = (date: Date, timezone: string): string => {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone,
    timeZoneName: 'short'
  }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
};
```

**Step 3:** Update `BookingCard` time display (lines 118-121):

**Current:**
```tsx
<span className="flex items-center gap-1">
  <Clock className="h-4 w-4" />
  {format(booking.scheduledAt, 'h:mm a')}
</span>
```

**New:**
```tsx
<span className="flex items-center gap-1">
  <Clock className="h-4 w-4" />
  {format(booking.scheduledAt, 'h:mm a')} {getTimezoneAbbr(booking.scheduledAt, booking.displayTimezone || 'Australia/Brisbane')}
</span>
```

---

## Key Corrections from Review

| Issue | Resolution |
|-------|------------|
| Hardcoded AEST | Use `Intl.DateTimeFormat` with `timeZoneName: 'short'` to dynamically output AEST or AEDT based on the booking date |
| Required field | Treat `displayTimezone` as optional (`displayTimezone?: string`) and use `|| 'Australia/Brisbane'` fallback at usage site |

---

## Constraints Verified

| Constraint | Status |
|------------|--------|
| No backend/Supabase changes | ✓ UI only |
| No new BookingStatus values | ✓ None added |
| Phone-only | ✓ No changes to this |
| localStorage/mock patterns | ✓ Unchanged |
| Type safety | ✓ Optional field with fallback |

---

## Testing Checklist

1. Navigate to `/patient/book` and select a slot
2. Verify payment page shows "Assigned after payment confirmation" (not doctor name)
3. Complete mock payment
4. Verify confirmation page shows assigned doctor name
5. Navigate to `/patient/consultations`
6. Verify upcoming booking shows time with correct timezone label:
   - AEST for dates during standard time
   - AEDT for dates during daylight saving time

