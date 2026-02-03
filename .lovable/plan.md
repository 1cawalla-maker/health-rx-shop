
# Implementation: Patient Consultation Details Dialog

## Overview
Adding a "Consultation Details" dialog to the patient consultations page with conditional rendering based on the approved plan.

## Files to Create/Modify

### 1. NEW: `src/components/patient/ConsultationDetailDialog.tsx`
Creates the dialog component with:
- Date + time + timezone label (AEST/AEDT) using existing Intl approach
- Status badge (reusing getStatusBadge pattern)
- Assigned doctor name (only shown if booked/confirmed)
- Amount paid ($49) - conditional, only if amountPaid exists
- No-show policy reminder - conditional, only for upcoming (booked/confirmed)
- Booking ID with copy button
- Primary CTA: "Book another" linking to /patient/book

### 2. MODIFY: `src/pages/patient/Consultations.tsx`
- Add `amountPaid` to the allBookings mapping (defaults to 49 for mock bookings with booked/confirmed/completed status)
- Add state for `selectedBooking` and `dialogOpen`
- Add "View details" button with Eye icon to BookingCard
- Import and render ConsultationDetailDialog
- Extract getStatusBadge to be reusable (or pass as prop)

## Technical Details

### ConsultationDetailDialog Props
```typescript
interface ConsultationDetailDialogProps {
  booking: {
    id: string;
    scheduledAt: Date;
    status: BookingStatus;
    doctorName: string | null;
    displayTimezone?: string;
    amountPaid?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Conditional Rendering Logic
- Amount Paid section: Only rendered when `booking.amountPaid` is truthy
- No-show policy: Only rendered when status is `'booked'` or `'confirmed'`
- Doctor name: Only rendered when `booking.doctorName` is truthy

### No-Show Policy Text (exact copy)
"If you do not answer after 3 call attempts within the scheduled time, your consultation will be marked as a no-show. The $49 consultation fee is non-refundable for no-shows."

### Copy to Clipboard
Uses navigator.clipboard.writeText() with toast feedback on success

## Implementation Order
1. Create ConsultationDetailDialog component
2. Update Consultations.tsx to integrate the dialog
