

# Phase 1: Fix Reschedule Payment Bug (FINAL)

## Problem
When rescheduling an already-paid booking, the user is incorrectly routed to payment again. The flow should skip payment since the consultation fee was already paid.

---

## Solution Overview
Create a single atomic `rescheduleBooking()` method in the consultation service that:
1. Validates old booking status is exactly `'booked'`
2. Validates old booking is >24 hours in the future (not within 24h window)
3. Validates new slot availability (both aggregated AND doctor-specific)
4. Creates new booking (already paid)
5. Cancels old booking (releases slot)
6. Returns new booking id

Use query param `amountPaid` (in cents) to carry payment data through the flow.

---

## Files to Modify (3 files)

### 1. `src/services/consultationService.ts`
**Add new atomic reschedule method** (after `cancelBooking`, ~line 172):

```typescript
// Reschedule a booking atomically (validates slot, creates new paid booking, cancels old)
rescheduleBooking(
  oldBookingId: string,
  patientId: string,
  date: string,
  time: string,
  utcTimestamp: string,
  displayTimezone: string,
  availableDoctorIds: string[],
  amountPaid: number  // in cents (e.g., 4900 = $49.00)
): MockBooking {
  // 1. Validate amountPaid (must be positive and reasonable)
  if (!amountPaid || amountPaid <= 0 || amountPaid > 100000) {
    throw new Error('Invalid payment amount for reschedule');
  }

  // 2. Validate old booking exists
  const oldBooking = this.getBooking(oldBookingId);
  if (!oldBooking) {
    throw new Error('Original booking not found');
  }

  // 3. Validate old booking status is exactly 'booked' (not 'confirmed', 'pending_payment', etc.)
  if (oldBooking.status !== 'booked') {
    throw new Error('Only booked appointments can be rescheduled');
  }

  // 4. Validate old booking is >24 hours in the future
  const oldBookingTime = new Date(oldBooking.utcTimestamp);
  const now = new Date();
  const hoursUntilOldBooking = (oldBookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilOldBooking <= 0) {
    throw new Error('Cannot reschedule a past appointment');
  }
  
  if (hoursUntilOldBooking <= 24) {
    throw new Error('Appointments within 24 hours cannot be rescheduled');
  }

  // 5. Validate new slot exists in aggregated availability
  const aggregatedSlots = mockAvailabilityService.getAggregatedSlotsForDate(date);
  const targetSlot = aggregatedSlots.find(s => s.time === time);
  if (!targetSlot || !targetSlot.isAvailable) {
    throw new Error('Selected time slot is no longer available');
  }

  // 6. Pick doctor and validate doctor-specific availability
  const doctorId = availableDoctorIds[0];
  if (!doctorId) {
    throw new Error('No doctor available for this time slot');
  }

  // Check that this specific doctor has no existing 'booked' booking at same date/time
  const allBookings = this.getBookings();
  const conflictingBooking = allBookings.find(b => 
    b.doctorId === doctorId &&
    b.scheduledDate === date &&
    b.timeWindowStart === time &&
    b.status === 'booked' &&
    b.id !== oldBookingId  // Exclude the booking we're rescheduling from
  );
  
  if (conflictingBooking) {
    throw new Error('This doctor is not available at the selected time');
  }

  const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);

  // 7. Create reservation for new slot
  const reservation = mockAvailabilityService.createReservation(
    patientId,
    doctorId,
    date,
    time,
    utcTimestamp
  );

  const endTime = this.addMinutes(time, 5);

  // 8. Create new booking with paid status (carry over payment)
  const newBooking: MockBooking = {
    id: crypto.randomUUID(),
    patientId,
    doctorId,
    doctorName: doctor?.name || null,
    scheduledDate: date,
    timeWindowStart: time,
    timeWindowEnd: endTime,
    utcTimestamp,
    displayTimezone,
    status: 'booked',           // Already paid = confirmed status
    amountPaid,                  // Carry over from original (in cents)
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reservationId: undefined,    // No reservation needed (already paid)
    callAttempts: [],
  };

  // 9. Release reservation immediately since it's already paid
  mockAvailabilityService.releaseReservation(reservation.id);

  // 10. Cancel old booking (releases its slot)
  this.cancelBooking(oldBookingId);

  // 11. Save new booking
  const bookings = this.getBookings();
  bookings.push(newBooking);
  localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));

  return newBooking;
}
```

---

### 2. `src/components/patient/ManageBookingDialog.tsx`
**Update interface and reschedule handler**:

**Update interface** (line 19-25) - add amountPaid field:
```typescript
interface ManagedBooking {
  id: string;
  scheduledAt: Date;
  status: BookingStatus;
  doctorName: string | null;
  displayTimezone?: string;
  amountPaid?: number | null;  // in cents
}
```

**Update handleReschedule** (lines 101-118):
```typescript
const handleReschedule = () => {
  setIsRescheduling(true);

  // Get the amount paid (in cents) before navigating
  // Default to $49 (4900 cents) if not set
  const amountPaidCents = booking.amountPaid ?? 4900;

  toast({
    title: 'Select new time',
    description: 'Please choose a new time for your consultation.',
  });

  onOpenChange(false);
  setIsRescheduling(false);

  // Navigate to booking page with reschedule context
  // amountPaid is in cents (e.g., 4900 = $49.00)
  navigate(`/patient/book?reschedule=true&bookingId=${booking.id}&amountPaid=${amountPaidCents}`);
};
```

Note: We pass `bookingId` so the booking page can perform the atomic reschedule. We do NOT cancel yet - the service method will handle cancellation atomically after all validations pass.

---

### 3. `src/pages/patient/BookConsultation.tsx`
**Detect reschedule mode, validate params, update UI and submission logic**:

**Update imports** (line 2):
```typescript
import { useNavigate, useSearchParams } from 'react-router-dom';
```

**Add imports** (line 12):
```typescript
import { Phone, Loader2, CalendarDays, Clock, AlertTriangle, Info } from 'lucide-react';
```

**Add state for reschedule mode** (after line 24):
```typescript
const [searchParams] = useSearchParams();

// Reschedule mode detection and validation
const isReschedule = searchParams.get('reschedule') === 'true';
const rescheduleBookingId = searchParams.get('bookingId') || '';
const amountPaidParam = searchParams.get('amountPaid');

// Validate amountPaid: must be numeric, positive, and reasonable (max $1000)
const rescheduleAmountPaid = (() => {
  if (!isReschedule) return 0;
  const parsed = parseInt(amountPaidParam || '', 10);
  // Validate: must be a positive number between 1 cent and $1000 (100000 cents)
  if (isNaN(parsed) || parsed <= 0 || parsed > 100000) {
    return null; // Invalid
  }
  return parsed;
})();

// If reschedule mode but invalid params, show error
const rescheduleParamsValid = !isReschedule || (rescheduleBookingId && rescheduleAmountPaid !== null);
```

**Update handleSubmit** (lines 63-91):
```typescript
const handleSubmit = async () => {
  if (!user || !selectedDate || !selectedSlot) {
    toast.error('Please select a date and time');
    return;
  }

  // Validate reschedule params
  if (isReschedule && !rescheduleParamsValid) {
    toast.error('Invalid reschedule request. Please try again from your dashboard.');
    return;
  }

  setIsSubmitting(true);

  try {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    if (isReschedule && rescheduleAmountPaid) {
      // Atomic reschedule: validates slot + doctor availability + 24h rule, 
      // creates new paid booking, cancels old
      const newBooking = mockBookingService.rescheduleBooking(
        rescheduleBookingId,
        user.id,
        dateStr,
        selectedSlot.time,
        selectedSlot.utcTimestamp,
        selectedSlot.displayTimezone,
        selectedSlot.doctorIds,
        rescheduleAmountPaid
      );
      
      toast.success('Consultation rescheduled successfully!');
      navigate(`/patient/booking/confirmation/${newBooking.id}`);
    } else {
      // Normal flow: create pending booking and go to payment
      const booking = mockBookingService.createBooking(
        user.id,
        dateStr,
        selectedSlot.time,
        selectedSlot.utcTimestamp,
        selectedSlot.displayTimezone,
        selectedSlot.doctorIds
      );

      toast.success('Proceeding to payment...');
      navigate(`/patient/booking/payment/${booking.id}`);
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    const message = error instanceof Error ? error.message : 'Failed to create booking. Please try again.';
    toast.error(message);
  } finally {
    setIsSubmitting(false);
  }
};
```

**Add reschedule info banner** (after line 132, after the no-show warning alert):
```tsx
{/* Reschedule Mode Banner */}
{isReschedule && rescheduleParamsValid && (
  <Alert className="border-blue-500/50 bg-blue-500/10">
    <Info className="h-4 w-4 text-blue-500" />
    <AlertDescription className="text-blue-700 dark:text-blue-400">
      <strong>Rescheduling:</strong> Select a new time for your consultation. 
      No additional payment required.
    </AlertDescription>
  </Alert>
)}

{/* Invalid reschedule params error */}
{isReschedule && !rescheduleParamsValid && (
  <Alert className="border-red-500/50 bg-red-500/10">
    <AlertTriangle className="h-4 w-4 text-red-500" />
    <AlertDescription className="text-red-700 dark:text-red-400">
      <strong>Error:</strong> Invalid reschedule request. Please return to your 
      dashboard and try again.
    </AlertDescription>
  </Alert>
)}
```

**Update fee display** (lines 253-259):
```tsx
<div className="flex items-center gap-3">
  <div className="h-5 w-5 flex items-center justify-center text-primary font-bold">$</div>
  <div>
    <p className="text-sm text-muted-foreground">Fee</p>
    <p className="font-medium">
      {isReschedule && rescheduleParamsValid ? 'Already paid' : '$49 AUD'}
    </p>
  </div>
</div>
```

**Update submit button** (lines 266-277):
```tsx
<Button 
  onClick={handleSubmit} 
  className="w-full" 
  size="lg"
  disabled={isSubmitting || (isReschedule && !rescheduleParamsValid)}
>
  {isSubmitting ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : isReschedule && rescheduleParamsValid ? (
    'Confirm New Time'
  ) : (
    'Proceed to Payment ($49)'
  )}
</Button>
```

---

## Validation Rules Summary

### `amountPaid` Validation (in BookConsultation.tsx)

| Check | Condition | Error Handling |
|-------|-----------|----------------|
| Present | Must exist when `reschedule=true` | Show error banner, disable submit |
| Numeric | Must parse to valid integer | Show error banner, disable submit |
| Positive | Must be > 0 | Show error banner, disable submit |
| Reasonable | Must be ≤ 100000 (≤$1000) | Show error banner, disable submit |

### `rescheduleBooking()` Validation (in consultationService.ts)

| Check | Condition | Error Message |
|-------|-----------|---------------|
| Old booking exists | Must find booking by ID | "Original booking not found" |
| Status exactly 'booked' | `oldBooking.status === 'booked'` | "Only booked appointments can be rescheduled" |
| Not in past | `hoursUntilOldBooking > 0` | "Cannot reschedule a past appointment" |
| >24 hours away | `hoursUntilOldBooking > 24` | "Appointments within 24 hours cannot be rescheduled" |
| Aggregated slot available | Slot exists in `getAggregatedSlotsForDate()` | "Selected time slot is no longer available" |
| Doctor ID exists | `availableDoctorIds[0]` exists | "No doctor available for this time slot" |
| Doctor-specific availability | No existing 'booked' booking for same doctor/date/time | "This doctor is not available at the selected time" |

---

## Data Flow Summary

```text
ManageBookingDialog 
  → /patient/book?reschedule=true&bookingId=xxx&amountPaid=4900
  
BookConsultation.tsx
  → validate amountPaid (must be numeric, 1-100000 cents)
  → user selects new slot
  → handleSubmit calls rescheduleBooking()

rescheduleBooking() atomically:
  1. ✓ validate amountPaid range
  2. ✓ validate old booking exists
  3. ✓ validate oldBooking.status === 'booked'
  4. ✓ validate old booking >24h in future (not past, not within 24h)
  5. ✓ validate aggregated slot availability
  6. ✓ validate doctor-specific availability (no conflicting 'booked' bookings)
  7. → create reservation
  8. → create new booking (status='booked', amountPaid carried over)
  9. → release reservation
  10. → cancel old booking (releases its slot)
  11. → save new booking
  12. → return new booking

  → navigate to /patient/booking/confirmation/:newId
```

---

## What Is NOT Changed

- No Supabase/Stripe changes
- No new dependencies  
- No new BookingStatus types (uses existing 'booked')
- Existing payment flow unchanged
- Confirmation page unchanged
- ManageBookingDialog 24h UI check remains (belt-and-suspenders with service validation)

---

## Summary Table

| File | Change Type | Description |
|------|-------------|-------------|
| consultationService.ts | Add method | `rescheduleBooking()` - atomic with status + 24h + doctor-specific validation |
| ManageBookingDialog.tsx | Update | Pass `bookingId` and `amountPaid` (cents) via URL |
| BookConsultation.tsx | Update | Validate params, show reschedule UI, call atomic method |

---

**Awaiting approval.**

