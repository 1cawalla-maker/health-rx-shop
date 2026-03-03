

# Phase 1 Doctor Portal UI (Mock/localStorage) -- Rev 1

## Current State

The doctor portal has a working foundation:
- **Working pages**: Bookings (list + detail/workspace), Prescriptions (list), Earnings (ledger + payouts), Registration (signature pad)
- **Stub pages**: Dashboard, Consultations, Calendar, Availability, Patients, ConsultationView, ConsultationWorkspace -- all render `DoctorPhase1Stub`
- **Working services**: `doctorPortalService`, `doctorEarningsService`, `doctorPayoutService`, `doctorSignatureService`, `issuedPrescriptionService`, `availabilityService` (mock)
- **Layout**: `DoctorLayout` with sidebar nav (Dashboard, Bookings, Calendar, Availability, Patients, Prescriptions, Earnings)

## Build Errors to Fix First

`MockCallAttempt` (telehealth.ts line 226) lacks an `id` field, but `doctorPortalService.ts` line 64 pushes objects with `id`, and `BookingDetail.tsx` line 179 uses `a.id` as a React key. Fix: add `id?: string` to `MockCallAttempt` (optional for backward compat) and also remove the extra fields (`bookingId`, `doctorId`) that `doctorPortalService` adds but aren't on the type.

---

## Plan Overview

Replace the stub pages with functional mock UIs. Add two new routes (`/doctor/info`, `/doctor/account`). Refactor the sidebar nav. All data flows through existing services (no direct localStorage access from UI).

---

## File-by-File Changes

### 1. Fix: `src/types/telehealth.ts` -- Add `id` to MockCallAttempt

```typescript
export interface MockCallAttempt {
  id?: string;           // <-- add (optional for legacy data)
  attemptNumber: number;
  attemptedAt: string;
  notes: string | null;
  answered: boolean;
}
```

### 2. Fix: `src/services/doctorPortalService.ts` -- Clean up addCallAttempt

Remove the extra fields (`bookingId`, `doctorId`) from the push to `callAttempts` since they don't exist on `MockCallAttempt`. Add `answered: true` default (call attempt = doctor tried calling). The object should match `MockCallAttempt` exactly:

```typescript
attempts.push({
  id: crypto.randomUUID(),
  attemptNumber: attempts.length + 1,
  attemptedAt: new Date().toISOString(),
  notes: input.notes || null,
  answered: false,  // default: not answered (doctor logs outcome separately)
});
```

### 3. `src/components/layout/DoctorLayout.tsx` -- Update nav items

Replace current nav with:

```typescript
const navItems = [
  { href: '/doctor/consultations', label: 'Consultations', icon: Phone },
  { href: '/doctor/availability', label: 'Availability', icon: Clock },
  { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/doctor/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/doctor/info', label: 'Info', icon: Info },
  { href: '/doctor/account', label: 'Account', icon: User },
];
```

Remove Dashboard, Bookings, Calendar, Patients from nav. Keep the routes in `App.tsx` for backward compatibility but nav focuses on the 6 active screens.

### 4. `src/pages/doctor/Consultations.tsx` -- Consultation Queue (replaces stub)

This replaces the current Phase1Stub with a full Upcoming/Past consultation list. Reuse the pattern from `Bookings.tsx` (which already works), but rename to "Consultations" semantics:

- Uses `doctorPortalService.getDoctorBookings(user.id)`
- Tabs: Upcoming | Past
- Each card shows: status badge, countdown chip, scheduled time in doctor TZ (default `Australia/Brisbane`), patient ID, Open button (links to `/doctor/consultation/:id`), Cancel button (for non-terminal statuses, requires reason via dialog)
- Cancel action: calls `doctorPortalService.setBookingStatus(id, 'cancelled')` after reason is collected
- Status state machine enforced: terminal statuses (`completed`, `no_answer`, `cancelled`) disable all action buttons

### 5. `src/pages/doctor/ConsultationView.tsx` -- Consultation Workspace (replaces stub)

This is the detailed workspace for a single consultation. Currently `BookingDetail.tsx` already implements most of this. This page will be a thin wrapper that either:
- **Option A**: Redirect `/doctor/consultation/:id` to use the existing `BookingDetail` component logic
- **Option B**: Move `BookingDetail` logic into `ConsultationView` and have `BookingDetail` redirect

Chosen approach: Rewrite `ConsultationView.tsx` as the primary workspace (absorb BookingDetail logic) with these panels:

**Header**: Status badge + scheduled time + patient ID + Back button

**Left column (2/3)**:
- **Status controls**: Start Consult / Mark No Answer / Cancel (with reason dialog) / Mark Completed. Terminal statuses lock all buttons.
- **Call Attempts**: Log attempt (notes optional, `answered` toggle). List of past attempts with attempt # + time + notes + answered badge. "Mark as No-Show" button enabled only after 3 unanswered attempts.
- **Prescription Decision** (collapsible, collapsed by default): Issue (3/6/9mg, low/mod/high tier, step-down allowed) or Decline (reason required). Issuing calls `doctorPortalService.issuePrescription()` and sets status to `completed`.

**Right column (1/3)**:
- **Patient Summary**: Patient ID (Phase 1 no name lookup)
- **Eligibility Quiz**: `EligibilityQuizCard`
- **Patient History**: Scaffold card ("Phase 2: will show past consultations and prescriptions for this patient")
- **Payment**: `PaymentsCard` showing $39.00 (3900 cents) per consult
- **Medication Guide**: `MedicationGuideCard` with TGA links

### 6. `src/pages/doctor/Availability.tsx` -- Weekly Recurring Blocks (replaces stub)

Uses `mockAvailabilityService` to manage doctor-specific availability blocks.

**New service method needed**: Add `addBlock(block)` and `removeBlock(blockId)` to `mockAvailabilityService` that filter by the current doctor's ID.

**UI**:
- Day-of-week grid (Mon-Sun) showing existing blocks for the logged-in doctor
- Each block shows: start time - end time, timezone (default Australia/Brisbane), delete button
- "Add Block" form: select day of week, start time (hour:minute dropdowns), end time, auto-set timezone to Australia/Brisbane
- All times displayed in doctor's TZ
- No recurring vs one-off distinction in Phase 1 (all treated as recurring weekly)

### 7. `src/pages/doctor/Prescriptions.tsx` -- Already functional

The current implementation is already working (lists issued prescriptions from `issuedPrescriptionService`). No changes needed.

### 8. `src/pages/doctor/Earnings.tsx` -- Already functional

The current implementation is already working (totals + ledger + toggle paid). No changes needed.

### 9. `src/pages/doctor/Info.tsx` -- NEW page

Static educational content page:
- Product Information Sheet (PIS) overview for nicotine pouches
- TGA regulatory context (Schedule 4, Personal Importation Scheme)
- Links to TGA resources (external)
- Neutral, non-promotional language
- No clinical recommendations

### 10. `src/pages/doctor/Account.tsx` -- NEW page

Doctor account/profile management:
- **Legal name**: read from Supabase `profiles.full_name` (display only in Phase 1, editable in Phase 2)
- **AHPRA number**: read from `doctors` table or mock; display only
- **Provider number**: optional, display only
- **Phone**: from `profiles` or display placeholder
- **Practice location**: optional text
- **Timezone**: default `Australia/Brisbane`, stored in localStorage (`doctor:{uid}:timezone`)
- **Signature pad**: Reuse the canvas logic from `Registration.tsx` -- draw, save, clear, preview. Uses `doctorSignatureService`.

### 11. `src/services/doctorPortalService.ts` -- Add cancellation with reason

Add method:
```typescript
cancelBooking(bookingId: string, reason: string): MockBooking | null {
  // Only if current status is not terminal
  const booking = this.getBooking(bookingId);
  if (!booking) return null;
  const terminal: BookingStatus[] = ['completed', 'no_answer', 'cancelled'];
  if (terminal.includes(booking.status)) return null;
  
  const all = mockBookingService.getBookings();
  const idx = all.findIndex(b => b.id === bookingId);
  if (idx === -1) return null;
  
  all[idx] = {
    ...all[idx],
    status: 'cancelled',
    doctorNotes: `Cancelled by doctor: ${reason.trim()}`,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem('nicopatch_mock_bookings', JSON.stringify(all));
  return all[idx];
}
```

### 12. `src/services/availabilityService.ts` -- Add doctor-scoped CRUD

Add to `mockAvailabilityService`:

```typescript
addDoctorBlock(doctorId: string, block: Omit<MockAvailabilityBlock, 'id' | 'doctorId' | 'doctorName' | 'isActive'>): MockAvailabilityBlock {
  const blocks = this.getMockDoctorBlocks();
  const newBlock: MockAvailabilityBlock = {
    id: crypto.randomUUID(),
    doctorId,
    doctorName: '', // Phase 1: no name lookup
    isActive: true,
    ...block,
  };
  blocks.push(newBlock);
  localStorage.setItem(MOCK_AVAILABILITY_KEY, JSON.stringify(blocks));
  return newBlock;
}

removeDoctorBlock(doctorId: string, blockId: string): boolean {
  const blocks = this.getMockDoctorBlocks();
  const filtered = blocks.filter(b => !(b.id === blockId && b.doctorId === doctorId));
  if (filtered.length === blocks.length) return false;
  localStorage.setItem(MOCK_AVAILABILITY_KEY, JSON.stringify(filtered));
  return true;
}

getDoctorBlocks(doctorId: string): MockAvailabilityBlock[] {
  return this.getMockDoctorBlocks().filter(b => b.doctorId === doctorId);
}
```

### 13. `src/App.tsx` -- Add new routes

Add inside the `/doctor` layout route:

```typescript
<Route path="consultation/:id" element={<DoctorConsultationView />} />
<Route path="info" element={<DoctorInfo />} />
<Route path="account" element={<DoctorAccount />} />
```

Import the new page components. Keep existing routes (bookings, booking/:id, etc.) for backward compatibility.

### 14. `src/pages/doctor/Dashboard.tsx` -- Redirect to Consultations

Replace the stub with a redirect:
```typescript
import { Navigate } from 'react-router-dom';
export default function DoctorDashboard() {
  return <Navigate to="/doctor/consultations" replace />;
}
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/types/telehealth.ts` | UPDATE | Add `id?` to `MockCallAttempt` (fixes build error) |
| `src/services/doctorPortalService.ts` | UPDATE | Fix `addCallAttempt` type conformance; add `cancelBooking` with reason + terminal guard |
| `src/services/availabilityService.ts` | UPDATE | Add `addDoctorBlock`, `removeDoctorBlock`, `getDoctorBlocks` to mock service |
| `src/components/layout/DoctorLayout.tsx` | UPDATE | Replace nav items (6 items: Consultations, Availability, Prescriptions, Earnings, Info, Account) |
| `src/pages/doctor/Dashboard.tsx` | UPDATE | Redirect to `/doctor/consultations` |
| `src/pages/doctor/Consultations.tsx` | REWRITE | Full consultation queue with Upcoming/Past tabs, cancel with reason |
| `src/pages/doctor/ConsultationView.tsx` | REWRITE | Full workspace: status controls, call log (3-attempt no-show), Rx issue/decline, side panels |
| `src/pages/doctor/Availability.tsx` | REWRITE | Weekly recurring blocks CRUD, doctor-scoped, times in Australia/Brisbane |
| `src/pages/doctor/Info.tsx` | NEW | Static PIS + TGA education page |
| `src/pages/doctor/Account.tsx` | NEW | Doctor profile display + signature pad (reuse Registration canvas logic) |
| `src/App.tsx` | UPDATE | Add routes for `/doctor/consultation/:id`, `/doctor/info`, `/doctor/account` |

---

## Implementation Order

1. Fix build errors: `telehealth.ts` + `doctorPortalService.ts`
2. Service updates: `doctorPortalService` (cancelBooking) + `availabilityService` (doctor CRUD)
3. Layout: `DoctorLayout.tsx` nav update
4. Routes: `App.tsx` + `Dashboard.tsx` redirect
5. Pages (parallel): `Consultations.tsx`, `ConsultationView.tsx`, `Availability.tsx`, `Info.tsx`, `Account.tsx`

---

## Key Constraints Honored

- **No new deps**: All UI uses existing Radix/shadcn components
- **Services only**: UI never touches localStorage directly
- **Money in cents**: `DOCTOR_FEE_CENTS_PER_CONSULT = 3900`, displayed via `formatAudFromCents()`
- **Phone only**: All copy says "phone consultation", no video references
- **no_answer paid**: Earnings service already includes `no_answer` in `PAID_STATUSES`
- **Terminal lock**: `completed`, `no_answer`, `cancelled` disable all action buttons
- **Doctor-initiated cancellation only**: `cancelBooking` requires a reason string
- **3-call no-show**: "Mark as No-Show" enabled only when `attempts.filter(a => !a.answered).length >= 3`
- **Signature as base64 data URL**: Existing `doctorSignatureService` pattern preserved

---

Awaiting approval.

