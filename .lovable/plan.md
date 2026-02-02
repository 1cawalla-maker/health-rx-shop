
# 5-Minute Booking Availability System - Final Implementation Plan

## Summary

This plan implements a complete 5-minute slot booking system with:
- Proper timezone handling (store UTC, display in patient's timezone with AEST/AEDT label)
- Doctor availability aggregation (slots only shown if at least one doctor is available)
- Collision prevention with optional short-lived reservations
- All UI + logic using localStorage mock patterns (no Supabase changes)

---

## Constraint Compliance

| Constraint | Implementation |
|------------|----------------|
| No backend work | All data in localStorage; no Supabase table changes |
| Reuse before create | Extend `consultationService.ts`, `availabilityService.ts`, existing types |
| Existing BookingStatus only | Use `pending_payment`, `booked`, `in_progress`, `completed`, `cancelled`, `no_answer` |
| Phone-only | Remove video option completely |

---

## Technical Design

### Timezone Handling

```text
Doctor creates block:
  - Input: "09:00-12:00 Australia/Brisbane"
  - Store: startTime="09:00", endTime="12:00", timezone="Australia/Brisbane"

Patient views slots:
  - Convert doctor's local times to UTC
  - Convert UTC to patient's display timezone
  - Show label: "AEST" or "AEDT" (depending on daylight saving)

Booking stored:
  - scheduledAt: ISO string (absolute UTC instant)
  - displayTimezone: patient's timezone for display purposes
```

### Doctor Assignment & Slot Aggregation

```text
For a given date:
1. Fetch all active doctor availability blocks
2. Generate 5-min slots for each doctor
3. Group slots by time (e.g., "09:00" might have 3 doctors available)
4. Subtract booked slots per doctor
5. Show patient only times where at least 1 doctor has capacity
6. On booking: auto-assign one available doctor for that time
```

### Collision Prevention

```text
When patient clicks "Proceed to Payment":
1. Create reservation in localStorage with 10-minute TTL
2. Reservation holds {doctorId, date, time, expiresAt}
3. Other patients see that doctor's slot as unavailable during TTL
4. On payment success: convert reservation to booking
5. On timeout/cancel: release reservation
```

---

## Files Overview

### Files to MODIFY

| File | Changes |
|------|---------|
| `src/services/availabilityService.ts` | Add `generateFiveMinuteSlots()`, mock availability aggregation |
| `src/services/consultationService.ts` | Add `mockBookingService` for localStorage bookings with reservations |
| `src/types/telehealth.ts` | Add `FiveMinuteSlot` interface |
| `src/pages/patient/BookConsultation.tsx` | Replace with 5-min slot picker, add no-show warning, payment flow |
| `src/pages/patient/Consultations.tsx` | Remove video references, show assigned doctor name |
| `src/pages/doctor/Availability.tsx` | Add slot count preview per block |
| `src/pages/doctor/BookingDetail.tsx` | Add call attempt UI section |
| `src/components/layout/DoctorLayout.tsx` | Remove broken `/doctor/profile` link |
| `src/App.tsx` | Add new patient booking routes |

### Files to CREATE

| File | Purpose |
|------|---------|
| `src/pages/patient/BookingPayment.tsx` | Mock payment page with reservation handling |
| `src/pages/patient/BookingConfirmation.tsx` | Confirmation showing assigned doctor |

---

## Phase 1: Types & Service Layer

### 1.1 Extend `src/types/telehealth.ts`

Add new interface:

```typescript
export interface FiveMinuteSlot {
  time: string;           // Local time "09:05"
  date: string;           // "2025-02-05"
  utcTimestamp: string;   // ISO string for absolute time
  doctorIds: string[];    // Doctors available at this time
  isAvailable: boolean;   // At least one doctor available
  displayTimezone: string; // e.g., "Australia/Brisbane"
  timezoneAbbr: string;   // "AEST" or "AEDT"
}

export interface BookingReservation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  utcTimestamp: string;
  expiresAt: string;      // ISO string, 10 min from creation
}
```

### 1.2 Extend `src/services/availabilityService.ts`

Add pure functions for slot generation and mock availability:

```typescript
// Constants
const SLOT_DURATION_MINUTES = 5;
const MOCK_AVAILABILITY_KEY = 'nicopatch_mock_availability';
const DEFAULT_TIMEZONE = 'Australia/Brisbane';

// Generate 5-minute slots from a block
export function generateFiveMinuteSlots(
  startTime: string,   // "09:00"
  endTime: string,     // "12:00"
  date: string,        // "2025-02-05"
  doctorId: string,
  timezone: string = DEFAULT_TIMEZONE
): FiveMinuteSlot[] {
  const slots: FiveMinuteSlot[] = [];
  let [hour, minute] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  // Calculate timezone abbreviation (AEST vs AEDT)
  const testDate = new Date(`${date}T${startTime}:00`);
  const timezoneAbbr = getTimezoneAbbr(testDate, timezone);
  
  while (hour < endHour || (hour === endHour && minute < endMin)) {
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    // Create UTC timestamp
    const localDateTime = `${date}T${time}:00`;
    const utcTimestamp = convertToUTC(localDateTime, timezone);
    
    slots.push({
      time,
      date,
      utcTimestamp,
      doctorIds: [doctorId],
      isAvailable: true,
      displayTimezone: timezone,
      timezoneAbbr,
    });
    
    minute += SLOT_DURATION_MINUTES;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  return slots;
}

// Get timezone abbreviation
function getTimezoneAbbr(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone,
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  return tzPart?.value || 'AEST';
}

// Convert local time to UTC ISO string
function convertToUTC(localDateTime: string, timezone: string): string {
  // Use Intl API to calculate offset and convert
  const date = new Date(localDateTime);
  // Implementation using timezone offset calculation
  return date.toISOString();
}

// Mock service for MVP
export const mockAvailabilityService = {
  // Get aggregated slots for a date (merges all doctors)
  getAggregatedSlotsForDate(date: string): FiveMinuteSlot[] {
    const blocks = this.getMockDoctorBlocks();
    const bookings = this.getMockBookings();
    const reservations = this.getActiveReservations();
    
    // Generate slots from all blocks
    const allSlots: FiveMinuteSlot[] = [];
    
    for (const block of blocks) {
      if (this.blockMatchesDate(block, date)) {
        const slots = generateFiveMinuteSlots(
          block.startTime,
          block.endTime,
          date,
          block.doctorId,
          block.timezone
        );
        allSlots.push(...slots);
      }
    }
    
    // Aggregate by time (merge doctorIds for same time)
    const aggregated = this.aggregateSlotsByTime(allSlots);
    
    // Remove booked/reserved doctor-times
    return this.subtractBookedSlots(aggregated, bookings, reservations);
  },
  
  // Aggregate slots - same time can have multiple doctors
  aggregateSlotsByTime(slots: FiveMinuteSlot[]): FiveMinuteSlot[] {
    const timeMap = new Map<string, FiveMinuteSlot>();
    
    for (const slot of slots) {
      const key = `${slot.date}-${slot.time}`;
      if (timeMap.has(key)) {
        const existing = timeMap.get(key)!;
        existing.doctorIds = [...new Set([...existing.doctorIds, ...slot.doctorIds])];
      } else {
        timeMap.set(key, { ...slot });
      }
    }
    
    return Array.from(timeMap.values())
      .filter(s => s.doctorIds.length > 0)
      .sort((a, b) => a.time.localeCompare(b.time));
  },
  
  // Remove times where doctor is already booked/reserved
  subtractBookedSlots(
    slots: FiveMinuteSlot[],
    bookings: MockBooking[],
    reservations: BookingReservation[]
  ): FiveMinuteSlot[] {
    return slots.map(slot => {
      const availableDoctors = slot.doctorIds.filter(docId => {
        // Check bookings
        const isBooked = bookings.some(b => 
          b.doctorId === docId && 
          b.scheduledDate === slot.date && 
          b.timeWindowStart === slot.time &&
          b.status !== 'cancelled'
        );
        
        // Check active reservations
        const isReserved = reservations.some(r =>
          r.doctorId === docId &&
          r.date === slot.date &&
          r.time === slot.time
        );
        
        return !isBooked && !isReserved;
      });
      
      return {
        ...slot,
        doctorIds: availableDoctors,
        isAvailable: availableDoctors.length > 0,
      };
    }).filter(s => s.isAvailable);
  },
  
  // Get mock doctor availability blocks
  getMockDoctorBlocks(): MockAvailabilityBlock[] {
    // Default mock data
    return [
      {
        id: 'block-1',
        doctorId: 'mock-doc-1',
        doctorName: 'Dr. Sarah Chen',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '12:00',
        timezone: 'Australia/Brisbane',
        isRecurring: true,
      },
      {
        id: 'block-2',
        doctorId: 'mock-doc-2',
        doctorName: 'Dr. Michael Thompson',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '14:00',
        timezone: 'Australia/Brisbane',
        isRecurring: true,
      },
      // Add more default blocks for other weekdays
    ];
  },
  
  // Reservation management
  createReservation(
    patientId: string,
    doctorId: string,
    date: string,
    time: string,
    utcTimestamp: string
  ): BookingReservation {
    const reservations = this.getReservations();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const reservation: BookingReservation = {
      id: crypto.randomUUID(),
      patientId,
      doctorId,
      date,
      time,
      utcTimestamp,
      expiresAt,
    };
    
    reservations.push(reservation);
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    return reservation;
  },
  
  getActiveReservations(): BookingReservation[] {
    const now = Date.now();
    return this.getReservations().filter(r => 
      new Date(r.expiresAt).getTime() > now
    );
  },
  
  releaseReservation(reservationId: string): void {
    const reservations = this.getReservations()
      .filter(r => r.id !== reservationId);
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  },
};
```

### 1.3 Extend `src/services/consultationService.ts`

Add mock booking service at bottom of file:

```typescript
// Mock booking layer for MVP
const MOCK_BOOKINGS_KEY = 'nicopatch_mock_bookings';

interface MockBooking {
  id: string;
  patientId: string;
  doctorId: string | null;
  doctorName: string | null;
  scheduledDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  utcTimestamp: string;
  displayTimezone: string;
  status: BookingStatus;
  amountPaid: number | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  reservationId?: string;
  callAttempts: Array<{
    attemptNumber: number;
    attemptedAt: string;
    notes: string | null;
    answered: boolean;
  }>;
}

const MOCK_DOCTORS = [
  { id: 'mock-doc-1', name: 'Dr. Sarah Chen' },
  { id: 'mock-doc-2', name: 'Dr. Michael Thompson' },
  { id: 'mock-doc-3', name: 'Dr. Emily Patel' },
];

export const mockBookingService = {
  // Create booking with pending_payment status and reservation
  createBooking(
    patientId: string,
    date: string,
    time: string,
    utcTimestamp: string,
    displayTimezone: string,
    availableDoctorIds: string[]
  ): MockBooking {
    // Pick first available doctor (deterministic for now)
    const doctorId = availableDoctorIds[0];
    const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);
    
    // Create reservation to hold the slot
    const reservation = mockAvailabilityService.createReservation(
      patientId,
      doctorId,
      date,
      time,
      utcTimestamp
    );
    
    const endTime = this.addMinutes(time, 5);
    
    const booking: MockBooking = {
      id: crypto.randomUUID(),
      patientId,
      doctorId,
      doctorName: doctor?.name || null,
      scheduledDate: date,
      timeWindowStart: time,
      timeWindowEnd: endTime,
      utcTimestamp,
      displayTimezone,
      status: 'pending_payment',
      amountPaid: null,
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reservationId: reservation.id,
      callAttempts: [],
    };
    
    const bookings = this.getBookings();
    bookings.push(booking);
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    
    return booking;
  },
  
  // Confirm payment - converts reservation to booking
  confirmPayment(bookingId: string): MockBooking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return null;
    
    const booking = bookings[index];
    
    // Release reservation
    if (booking.reservationId) {
      mockAvailabilityService.releaseReservation(booking.reservationId);
    }
    
    bookings[index] = {
      ...booking,
      status: 'booked',
      amountPaid: 4900, // $49.00 in cents
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reservationId: undefined, // Clear reservation reference
    };
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    return bookings[index];
  },
  
  // Cancel booking (releases reservation if pending)
  cancelBooking(bookingId: string): void {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return;
    
    const booking = bookings[index];
    
    // Release reservation if exists
    if (booking.reservationId) {
      mockAvailabilityService.releaseReservation(booking.reservationId);
    }
    
    bookings[index] = {
      ...booking,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
  },
  
  // Log call attempt
  logCallAttempt(bookingId: string, answered: boolean, notes?: string): void {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return;
    
    const booking = bookings[index];
    const attemptNumber = booking.callAttempts.length + 1;
    
    if (attemptNumber > 3) return;
    
    booking.callAttempts.push({
      attemptNumber,
      attemptedAt: new Date().toISOString(),
      notes: notes || null,
      answered,
    });
    
    booking.updatedAt = new Date().toISOString();
    
    // If answered, mark as in_progress
    if (answered) {
      booking.status = 'in_progress';
    }
    
    bookings[index] = booking;
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
  },
  
  // Mark as no-show (requires 3 failed attempts)
  markNoShow(bookingId: string): boolean {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return false;
    
    const booking = bookings[index];
    const failedAttempts = booking.callAttempts.filter(a => !a.answered);
    
    if (failedAttempts.length < 3) return false;
    
    booking.status = 'no_answer';
    booking.updatedAt = new Date().toISOString();
    bookings[index] = booking;
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    return true;
  },
  
  // Mark as completed
  markCompleted(bookingId: string): void {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return;
    
    bookings[index].status = 'completed';
    bookings[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
  },
  
  getBookings(): MockBooking[] {
    const stored = localStorage.getItem(MOCK_BOOKINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  
  getPatientBookings(patientId: string): MockBooking[] {
    return this.getBookings()
      .filter(b => b.patientId === patientId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },
  
  getBooking(bookingId: string): MockBooking | null {
    return this.getBookings().find(b => b.id === bookingId) || null;
  },
  
  addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m + minutes;
    return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  },
};
```

---

## Phase 2: Patient Booking Flow

### 2.1 Modify `src/pages/patient/BookConsultation.tsx`

Complete rewrite to:
- Remove video/phone selection (phone-only)
- Show calendar with dates that have availability
- Show 5-minute slot grid for selected date
- Display timezone label (AEST/AEDT)
- Add prominent no-show policy warning
- Navigate to payment page on slot selection

Key changes:
```typescript
// Remove: Video icon import, consultationType state, RadioGroup
// Add: mockAvailabilityService import, timezone display, no-show Alert

// Time slots now come from mockAvailabilityService.getAggregatedSlotsForDate()
// Only show dates where at least one slot is available
// Show slots with timezone abbreviation: "09:05 AEST"

// No-show policy alert (must be prominent):
<Alert className="border-orange-500/50 bg-orange-500/10">
  <AlertTriangle className="h-4 w-4 text-orange-500" />
  <AlertDescription>
    <strong>Important:</strong> If the doctor calls 3 times and you do not 
    answer, your consultation will be marked as a no-show and you will 
    still be charged.
  </AlertDescription>
</Alert>

// Summary shows "Phone Consultation" only (no type selection)
// Button: "Proceed to Payment ($49)" → creates booking with pending_payment
// Navigate to /patient/booking/payment/:bookingId
```

### 2.2 Create `src/pages/patient/BookingPayment.tsx`

Mock payment page:
- Shows booking summary (date, time, timezone, fee)
- No-show policy checkbox (required)
- Mock payment form (visual-only inputs)
- "Pay Now" button → confirms payment → navigates to confirmation
- Cancel button → releases reservation → returns to booking

```typescript
// Route: /patient/booking/payment/:bookingId

// On mount: start 10-minute countdown (reservation TTL)
// Show warning if < 3 minutes remaining
// On timeout: auto-cancel and redirect back

// Payment form fields (all disabled/mock):
// - Card number: "4242 4242 4242 4242"
// - Expiry: "12/25"
// - CVV: "123"

// Checkbox (required):
// "I understand that if I do not answer 3 call attempts, my consultation 
//  will be marked as no-show and I will still be charged."

// On "Pay Now":
// - mockBookingService.confirmPayment(bookingId)
// - Navigate to /patient/booking/confirmation/:bookingId
```

### 2.3 Create `src/pages/patient/BookingConfirmation.tsx`

Confirmation page:
- Success icon
- Date/time with timezone
- Assigned doctor name (prominently displayed)
- Status: "Booked"
- Amount paid: $49 AUD
- No-show reminder
- "The doctor will call you at the scheduled time"
- "View My Consultations" button

### 2.4 Modify `src/pages/patient/Consultations.tsx`

Changes:
- Remove Video icon import
- Remove consultation_type conditional (line 78-82)
- Always show Phone icon
- Add assigned doctor name display when available
- Update interface to include doctorName field

---

## Phase 3: Doctor Portal Enhancements

### 3.1 Modify `src/pages/doctor/Availability.tsx`

Add slot count preview to each block:

```typescript
// Calculate slots per block
const slotCount = Math.floor(
  (timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time)) / 5
);

// Display change (line ~328):
<p className="text-sm text-muted-foreground">
  {slot.start_time} - {slot.end_time} ({slotCount} × 5-min slots)
</p>
```

### 3.2 Modify `src/pages/doctor/BookingDetail.tsx`

Add Call Attempts section before prescription form:

```typescript
{/* Call Patient Section */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Phone className="h-5 w-5" />
      Call Patient
    </CardTitle>
    <CardDescription>
      Make up to 3 call attempts. If no answer after 3 attempts, mark as No-show.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Phone number - large and prominent */}
    <div className="p-4 bg-muted rounded-lg">
      <Label className="text-xs text-muted-foreground">Patient Phone</Label>
      <p className="text-2xl font-mono font-bold tracking-wide">
        {patientProfile?.phone || 'Not provided'}
      </p>
      {patientProfile?.phone && (
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <a href={`tel:${patientProfile.phone}`}>
            <Phone className="h-4 w-4 mr-2" />
            Call Now
          </a>
        </Button>
      )}
    </div>
    
    {/* Call attempt log */}
    <div className="space-y-2">
      <Label>Call Attempts</Label>
      {callAttempts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No call attempts yet</p>
      ) : (
        callAttempts.map((attempt, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <Badge variant={attempt.answered ? "default" : "outline"}>
              Attempt {attempt.attemptNumber}
            </Badge>
            <span className="text-sm">
              {format(new Date(attempt.attemptedAt), 'h:mm a')}
            </span>
            <span className="text-sm text-muted-foreground">
              {attempt.answered ? '✓ Answered' : '✗ No answer'}
            </span>
          </div>
        ))
      )}
    </div>
    
    {/* Action buttons */}
    {callAttempts.length < 3 && booking.status !== 'completed' && (
      <div className="flex gap-2">
        <Button 
          onClick={() => logAttempt(true)}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Patient Answered
        </Button>
        <Button 
          variant="outline" 
          onClick={() => logAttempt(false)}
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-2" />
          No Answer
        </Button>
      </div>
    )}
    
    {/* No-show button (after 3 failed attempts) */}
    {callAttempts.filter(a => !a.answered).length >= 3 && 
     booking.status !== 'no_answer' && (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          3 unsuccessful call attempts. Patient will still be charged.
          <Button 
            variant="destructive" 
            size="sm" 
            className="mt-2 w-full"
            onClick={markAsNoShow}
          >
            Mark as No-Show
          </Button>
        </AlertDescription>
      </Alert>
    )}
    
    {/* Complete button (after successful call) */}
    {callAttempts.some(a => a.answered) && booking.status !== 'completed' && (
      <Button 
        className="w-full" 
        variant="outline"
        onClick={markAsCompleted}
      >
        Mark Consultation Complete
      </Button>
    )}
  </CardContent>
</Card>
```

---

## Phase 4: Navigation & Route Fixes

### 4.1 Modify `src/components/layout/DoctorLayout.tsx`

Remove the broken Profile link (lines 101-107):

```diff
 <div className="p-4 border-t border-border space-y-2">
-  <Link
-    to="/doctor/profile"
-    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
-  >
-    <User className="h-5 w-5" />
-    <span>Profile</span>
-  </Link>
   <button
     onClick={handleSignOut}
     ...
```

### 4.2 Modify `src/App.tsx`

Add new patient booking routes:

```typescript
// Add imports
import BookingPayment from "./pages/patient/BookingPayment";
import BookingConfirmation from "./pages/patient/BookingConfirmation";

// Add routes inside patient route group (after line 93):
<Route path="booking/payment/:bookingId" element={<BookingPayment />} />
<Route path="booking/confirmation/:bookingId" element={<BookingConfirmation />} />
```

---

## Required Copy (Must Appear in UI)

### Patient Booking + Payment Pages

```
"If the doctor calls 3 times and you do not answer, your consultation 
will be marked as a no-show and you will still be charged."
```

### Doctor Booking Detail Page

```
"Make up to 3 call attempts. If no answer after 3 attempts, mark as No-show."
```

---

## File Change Summary

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `src/types/telehealth.ts` | Add `FiveMinuteSlot`, `BookingReservation` interfaces |
| MODIFY | `src/services/availabilityService.ts` | Add slot generation, mock availability, reservations |
| MODIFY | `src/services/consultationService.ts` | Add `mockBookingService` for localStorage bookings |
| MODIFY | `src/pages/patient/BookConsultation.tsx` | Replace with 5-min slot picker, no-show warning |
| MODIFY | `src/pages/patient/Consultations.tsx` | Remove video, add doctor name display |
| MODIFY | `src/pages/doctor/Availability.tsx` | Add slot count preview |
| MODIFY | `src/pages/doctor/BookingDetail.tsx` | Add call attempt UI section |
| MODIFY | `src/components/layout/DoctorLayout.tsx` | Remove broken profile link |
| MODIFY | `src/App.tsx` | Add booking payment/confirmation routes |
| CREATE | `src/pages/patient/BookingPayment.tsx` | Mock payment with reservation handling |
| CREATE | `src/pages/patient/BookingConfirmation.tsx` | Confirmation with assigned doctor |

---

## Testing Checklist

1. **Patient books consultation**
   - Select date → see only dates with availability
   - Select 5-min slot → see timezone label (AEST/AEDT)
   - See no-show policy warning
   - Click "Proceed to Payment" → creates pending_payment booking

2. **Payment flow**
   - See booking summary with assigned doctor name
   - Must check no-show policy checkbox
   - Click "Pay Now" → booking status becomes "booked"
   - Redirected to confirmation page

3. **Reservation collision test**
   - Open two browser tabs as different patients
   - Both select same time slot
   - First to pay gets it, second should see slot unavailable

4. **Doctor call attempts**
   - Open booking detail page
   - See patient phone prominently
   - Log "No Answer" attempt × 3
   - "Mark as No-Show" button appears
   - Click it → status updates to "no_answer"

5. **Navigation**
   - Doctor sidebar: no Profile link (404 fixed)
   - All booking routes work correctly

---

## Data Flow Diagram

```text
Patient Booking Flow:
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Select Date    │────▶│ Select Slot    │────▶│ Payment Page   │
│                │     │ (5-min grid)   │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
                              │                       │
                              ▼                       ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │ Creates:        │     │ On Pay Now:     │
                    │ - Booking       │     │ - Release res.  │
                    │ - Reservation   │     │ - Set status    │
                    │   (10min TTL)   │     │   to 'booked'   │
                    └─────────────────┘     └─────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────┐
                                          │ Confirmation    │
                                          │ - Doctor name   │
                                          │ - Date/time     │
                                          │ - No-show copy  │
                                          └─────────────────┘

Doctor Consultation Flow:
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ View Booking   │────▶│ Call Patient   │────▶│ Log Attempt    │
│                │     │ (phone link)   │     │ (answered/no)  │
└────────────────┘     └────────────────┘     └────────────────┘
                                                    │
                              ┌──────────────────────┴──────────────────────┐
                              ▼                                              ▼
                    ┌─────────────────┐                            ┌─────────────────┐
                    │ If answered:    │                            │ If 3 no-answer: │
                    │ Mark complete   │                            │ Mark as no-show │
                    │ Issue Rx        │                            │ Patient charged │
                    └─────────────────┘                            └─────────────────┘
```
