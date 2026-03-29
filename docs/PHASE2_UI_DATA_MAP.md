# Phase 2 UI → Data Map (Supabase wiring)

Directive: Phase 2 must be **UI-driven**. Every persisted field/state must be justified by existing UI capture/display. No speculative fields, and no UI changes.

This document maps:
- UI screens/components → data fields and states they require
- Proposed Supabase tables/columns → where each field comes from in the UI

---

## 0) Global identity + role

### UI
- `src/pages/Auth.tsx`
  - Role selector: patient vs doctor
  - Signup: email + password
  - Login: email + password
  - Forgot password flow

### Data required by UI
- Auth user
  - login email (read-only display in patient Account)
  - session
- Role
  - used for routing and gating (patient vs doctor)

### Supabase design
- Auth:
  - email+password
  - store role in `auth.users.user_metadata.role`
- DB:
  - `profiles` table
    - `id uuid pk` (auth uid)
    - `role text` (patient|doctor|admin)

### Notes
- Patient eligibility gating exists in UI (signup blocked unless quiz complete). Phase 2 persists quiz result after auth.

---

## 1) Doctor availability (weekly recurring blocks)

### UI
- Page: `src/pages/doctor/Availability.tsx`
- Grid: `src/components/doctor/AvailabilityGrid.tsx`

### What the UI captures
From `DoctorAvailability.handleAddBlock(...)` and edit/copy flows:
- `dayOfWeek` (0=Sun..6=Sat)
- `startTime` (HH:MM string)
- `endTime` (HH:MM string)
- `timezone` (from `userPreferencesService.getTimezone(user.id)`; defaults to Australia/Brisbane)
- `isRecurring` (currently always true in UI)
- `specificDate` (currently set to null in UI)

### What the UI displays/needs
- List of existing blocks for the current doctor
- Create/edit/delete blocks
- Overlap validation (can be client-side; DB should still enforce basic sanity)

### Proposed Supabase table: `doctor_availability_blocks`
Columns (UI-derived):
- `id uuid pk`
- `doctor_id uuid not null` (auth uid)
- `day_of_week int not null` (0..6)
- `start_time time not null`
- `end_time time not null`
- `timezone text not null`
- `is_recurring boolean not null`
- `specific_date date null`
- timestamps

Constraints (match UI rules):
- `day_of_week between 0 and 6`
- `start_time < end_time`

RLS:
- doctor can CRUD their own blocks (`doctor_id = auth.uid()`)

### Service seam to wire
- `src/services/availabilityService.ts` (currently `mockAvailabilityService`)
  - Replace local storage reads/writes with Supabase table ops.

---

## 2) Doctor onboarding + pending state

### UI
- Pending: `src/pages/doctor/Pending.tsx`
- Registration: `src/pages/doctor/Registration.tsx`
- Onboarding: `src/pages/doctor/Onboarding.tsx`
- Account: `src/pages/doctor/Account.tsx`

### Data required by UI
(TBD: audit specific fields shown/edited)
- Doctor status: pending/approved/rejected
- Doctor identity fields (AHPRA, name, etc.)

### Proposed Supabase tables
- `doctor_profiles` (UI-derived fields)
  - includes `status`

---

## 3) Patient profile + contact details

### UI
- `src/pages/patient/Account.tsx`

### Data required by UI
(TBD: audit fields; Phase 1 uses local-only `userProfileService`)
- Editable contact email separate from login email
- Name/DOB/phone/address fields as displayed

### Proposed Supabase tables
- `patient_profiles` (UI-derived fields)

---

## 4) Eligibility questionnaire

### UI
- `src/pages/EligibilityQuiz.tsx`
- Doctor view card: `src/components/doctor/EligibilityQuizCard.tsx`

### Data required by UI
- responses (for detail)
- computed result summary

### Proposed Supabase table
- `eligibility_quiz_results` (per patient)

RLS:
- patient can read/write own
- doctor can read if linked via booking

---

## 5) Booking + payment (Stripe)

### UI
- Patient booking: `src/pages/patient/BookConsultation.tsx`
- Patient consult management/reschedule pages/components
- Doctor consultations views

### Data required by UI
- slot availability (computed from doctor availability + existing bookings)
- reservation while paying (TTL=10 minutes)
- payment confirmation
- booking status lifecycle

### Proposed Supabase tables
- `booking_reservations` (TTL, idempotent via checkout session id)
- `bookings`

Stripe:
- checkout session created via Edge Function
- webhook finalises booking and assigns doctor

---

## Next: audit checklist (execution order)

1) Doctor availability: finish audit (grid + types), design SQL + RLS, wire `availabilityService`.
2) Auth/signup: upsert `profiles` on signup/login.
3) Doctor status + onboarding fields.
4) Eligibility persistence.
5) Booking reservations + Stripe.
