
# Phase 1 Doctor Portal Fixes — Onboarding, Payslips, Availability & Cleanup (Rev 5)

## Summary

Make doctor portal onboarding + payments + availability fast and obvious. Constraints: Phase 1 mock/localStorage only for business flows; Supabase Auth only; no new dependencies; UI never touches localStorage directly (services only). Migration readiness: new data behind services with TODO(phase2) notes for Supabase tables + RLS; cents ints; UTC ISO timestamps. Remove ALL user-visible "Phase 1/Phase 2/stub/mock/dev/[DEV]" copy from doctor pages touched.

---

## Hard Constraints

- No new dependencies.
- Business flows remain mock/localStorage for Phase 1 (Supabase Auth only).
- **UI must never call localStorage directly** — all reads/writes go through services.
- Remove ALL user-visible "Phase 1 / Phase 2 / stub / mock / dev / [DEV]" copy from doctor pages touched.
- Money in cents; display via `formatAudFromCents()`.
- Doctors are contractors paid per consultation. Xero is Phase 2 system of record.
- ABN is required.

---

## A) Payout Profile — editable in BOTH Onboarding and Account

### A1. Service (Phase 1 localStorage)

**File**: `src/services/doctorPayoutProfileService.ts` (UPDATE existing)

- Key: `doctor:{uid}:payout_profile`
- Type `DoctorPayoutProfile`:
  ```typescript
  { abn, entityName, gstRegistered, remittanceEmail, bsb, accountNumber, accountName, createdAtUtc, updatedAtUtc }
  ```
- Validation:
  - ABN: ATO checksum algorithm (see section F)
  - BSB: 6 digits
  - accountNumber: 6–10 digits
  - required: entityName, accountName, remittanceEmail (valid email format)
- API: `getProfile`, `upsertProfile`, `validateProfile`
- TODO(phase2): replace backing with Supabase table `doctor_payout_profiles` (RLS: `user_id = auth.uid()`)

### A2. Doctor Account page

**File**: `src/pages/doctor/Account.tsx`

- Add "Payout Details" section:
  - Display current payout profile (masked account number except last 2–3 digits)
  - "Edit" → inline form using `doctorPayoutProfileService`
  - Save updates `updatedAtUtc`
  - No phase language.

### A3. Onboarding page

**File**: `src/pages/doctor/Onboarding.tsx`

- Step 1: Signature capture (reuse existing signature pad/service)
- Step 2: Payout Details form (ABN + entity name + GST + remittance email + bank details)
- Completion rule: doctor is "ready" only when BOTH signature saved and payout profile validates.

---

## B) Centralised Onboarding Gate

### B1. Route allowlist constant

**File**: `src/constants/routing.ts` (NEW)

```typescript
/**
 * Route prefixes accessible before doctor onboarding is complete.
 * Deny-by-default: any /doctor/* route not matching these prefixes
 * redirects to /doctor/onboarding.
 * Matching strategy: prefix match on pathname (startsWith).
 */
export const PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES = [
  '/doctor/onboarding',
  '/doctor/account',
  '/doctor/availability',
  '/doctor/earnings',
  '/doctor/info',
  '/doctor/payslips',
] as const;
```

**Blocked by default** (not in allowlist): `/doctor/consultations*`, `/doctor/prescriptions*`, `/doctor/dashboard*`, and any future `/doctor/*` routes.

### B2. Hook: `src/hooks/useDoctorReadiness.ts`

```typescript
export function useDoctorReadiness(): { ready: boolean; loading: boolean }
```

- Checks:
  1. Signature saved: `doctorSignatureService.getSignature(user.id) !== null`
  2. Payout profile valid: `doctorPayoutProfileService.isComplete(user.id)`
- Returns `{ ready: true }` only when BOTH conditions are met.

### B3. Gate placement in DoctorLayout

**File**: `src/components/layout/DoctorLayout.tsx`

- Call `useDoctorReadiness()`
- If `!ready`:
  - Check if `location.pathname` matches any prefix in `PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES` (via `startsWith`)
  - If NO match → `<Navigate to="/doctor/onboarding" replace />`
  - If YES match → render `<Outlet />` but show **onboarding banner** (see B4)
- If `ready` → render `<Outlet />` normally (no banner)

### B4. Onboarding banner

When `!ready` AND on an allowlisted route (excluding `/doctor/onboarding` itself):

- Render a persistent info banner at the top of the main content area (inside `<main>`, above `<Outlet />`).
- Copy: "Complete your onboarding to start receiving consultations." with a "Complete Setup →" link to `/doctor/onboarding`.
- Styled as a non-dismissible info alert using the existing `Alert` component.
- On `/doctor/onboarding` route: do NOT show the banner (redundant).

### B5. Partial save behaviour

- Signature can be saved independently (immediately) when captured on the canvas.
- Payout profile is saved on explicit "Save" click.
- Onboarding completion requires BOTH signature saved + payout profile validates.
- If doctor leaves mid-flow, they will be redirected back (or see banner) on next visit until complete.

---

## C) Billable Consultation Statuses (Business Rule)

**Rule**: `no_answer` consults are paid (same as `completed`). An attempted consultation is billable — the doctor's time was allocated and the call was attempted.

**File**: `src/services/doctorEarningsService.ts`

Rename `PAID_STATUSES` → `BILLABLE_CONSULT_STATUSES` with JSDoc:

```typescript
/**
 * Billable consultation statuses.
 * Business rule: attempted consults (no_answer) are billable because
 * the doctor's time was allocated and the call was attempted.
 * To change this policy, update this constant.
 */
export const BILLABLE_CONSULT_STATUSES: BookingStatus[] = ['completed', 'no_answer'];
```

---

## D) Weekly Payslips (auto-derived; no manual generation)

### D1. Service

**File**: `src/services/doctorPayslipService.ts` (UPDATE existing)

- Key: `doctor:{uid}:payslips`
- Payslip model:
  ```typescript
  {
    id: string,              // e.g. "2026-W10"
    weekStartUtc: string,    // ISO Monday 00:00 UTC
    weekEndUtc: string,      // ISO Sunday 23:59 UTC
    consultCount: number,
    grossCents: number,
    status: 'draft' | 'paid',
    paidAtUtc?: string | null,
    xeroReference?: string | null,
    createdAtUtc: string,
    lines: PayslipLineItem[]
  }
  ```
- Week boundary: Monday 00:00 → Sunday 23:59, stored as UTC ISO boundaries.
- Generation:
  - Expose `ensurePayslipsUpToDate(uid)`: creates missing weeks by deriving from `doctorEarningsService` booking history.
  - UI triggers `ensurePayslipsUpToDate` on page load; there is **NO** "Generate payslip" button.
- TODO(phase2): payslips come from Supabase ledger and link to Xero bill/payment via `xeroReference`.

### D2. UI

**File**: `src/pages/doctor/Earnings.tsx`

- Replace current content with:
  - Summary cards (total/pending/paid) — keep existing
  - Payout Ledger — keep existing
  - **Payslips section**: Weekly payslips list (week range formatted)
  - Each row: week range, consultCount, gross formatted AUD, status, "View" button
  - View → `window.open('/doctor/payslips/{id}/print', '_blank')`
  - Remove manual "Generate Payslip" button and month/year selectors
  - On mount: call `doctorPayslipService.ensurePayslipsUpToDate(user.id)`

### D3. Print view

**File**: `src/pages/doctor/PayslipPrint.tsx` (UPDATE existing)

- Update to use `grossCents` instead of `totalCents`, `createdAtUtc` instead of `generatedAt`
- Minimal layout (no sidebar/nav)
- "Print" button calls `window.print()`
- Print CSS for clean output

---

## E) Availability UX — Visual Weekly Grid (5-minute snap)

### E1. Data shape (compatible with existing availability blocks)

- Continue storing recurring weekly availability as blocks: `{ dayOfWeek, startTime, endTime, timezone }`
- Enforce 5-minute increments on start/end times
- Service remains the only localStorage boundary (`mockAvailabilityService`)

### E2. Component

**File**: `src/components/doctor/AvailabilityGrid.tsx` (UPDATE existing)

- UI:
  - Columns: days Mon–Sun
  - Rows/time axis: 6 AM–11 PM with visible ticks every 30/60m; selection snaps to 5m
  - Interactions — see E3–E6 below
  - Helper actions:
    - "Copy Monday → Weekdays"
    - "Clear Week"
    - "Set 9–5 Weekdays" preset
  - Inline validation:
    - Prevent overlaps per day (including booking-occupied intervals)
    - Ensure end > start

### E3. Auto-scroll while dragging to create/resize blocks

**File**: `src/components/doctor/AvailabilityGrid.tsx`

- The time grid uses a single scroll container (the outer `overflow-x-auto` div, or a new wrapper with `overflow-y-auto` if needed). Avoid nested scroll conflicts.
- When drag is active and pointer is within ~40 px of the top/bottom edge of the scroll container:
  - Continuously adjust `scrollTop` using `requestAnimationFrame`.
  - Maintain 5-minute snapping while scrolling.
  - Speed: ~4 px/frame (~240 px/s at 60 fps).
- Use pointer capture (`setPointerCapture`) so drag continues smoothly even if the cursor briefly leaves the column.
- Stop auto-scroll when drag ends (mouseup / pointerup).

### E4. Block selection + immediate delete

**Desktop**:
- Click a block to **select** it (visible ring/outline using `ring-2 ring-primary`).
- Press `Backspace` or `Delete` key to remove the selected block immediately (no confirmation dialog).
- Show a toast: `"Availability block deleted"`. No undo needed (existing toast infra doesn't support action callbacks cleanly).
- Clicking elsewhere or pressing `Escape` deselects.

**Mobile**:
- Tap a block to open a `Popover` (from `@/components/ui/popover`) anchored to the block with two actions:
  - **Edit times** — opens the inline time editor (see E5).
  - **Delete** — removes immediately with toast.

### E5. Edit times by clicking the time label

- Clicking the **time label** (top-left of a block, the start-time text) opens an **inline editor**:
  - Two `<Select>` dropdowns (from `@/components/ui/select`): Start time and End time, both populated with 5-minute increments within the grid range (06:00–23:00).
  - "Save" button applies the change immediately; "Cancel" closes without saving.
- The editor is rendered as a `Popover` anchored to the block.
- Validation:
  - `end > start`
  - No overlap with other blocks on the same day (excluding the block being edited).
  - Toast error on violation; editor stays open.
- On save: call `onRemoveBlock(oldId)` then `onAddBlock(day, newStart, newEnd)` (atomic from UI perspective; parent page handles service calls).

### E6. Booking overlay + split availability around bookings

**Props change**: Add optional prop to `AvailabilityGrid`:
```typescript
bookings?: Array<{
  id: string;
  dayOfWeek: number;
  startMin: number;  // minutes from midnight
  endMin: number;
  patientName?: string;
}>;
```

**1) Derive bookings for display**

**File**: `src/pages/doctor/Availability.tsx`

- Import `doctorPortalService.getDoctorBookings(user.id)` (existing).
- Map upcoming bookings (status `booked` or `in_progress`) to the `bookings` prop shape:
  - Convert `scheduledDate` + `timeWindowStart` to `dayOfWeek` and `startMin`.
  - Assume 5-min consult duration: `endMin = startMin + 5`.
- Pass the mapped array to `<AvailabilityGrid bookings={...} />`.

**2) Split availability visually**

- When rendering availability blocks, subtract booked intervals from the **visual representation**:
  - e.g. availability 09:00–12:00 with booking at 10:00–10:05 renders as two visual segments: 09:00–10:00 and 10:05–12:00.
  - Both segments share the same block ID for editing/deletion purposes.
- The **underlying stored availability block is unchanged** — the split is render-time only.
- Editing rules:
  - Cannot create/move/resize an availability block to overlap a booking.
  - Show inline toast error if attempted: `"Cannot overlap with a scheduled booking"`.

**3) Booking chip rendering**

- Each booking renders as a non-draggable chip at its scheduled time range.
- Styling: distinct from availability blocks — use `bg-accent` background, `border-accent` border, and a small calendar/user icon.
- Display patient name (truncated) if available.
- Non-interactive on the grid (cannot drag/resize/delete).

**4) Booking click action**

- Clicking a booking chip navigates to that booking's consultation page: `/doctor/consultations/${booking.id}`.
- Use `useNavigate()` from react-router-dom.

### E7. Page integration

**File**: `src/pages/doctor/Availability.tsx`

- Pass `bookings` prop to `<AvailabilityGrid>`.
- Keep timezone warning copy but remove any phase/dev wording.

---

## F) ABN Checksum Algorithm

**File**: `src/lib/abnValidation.ts` (EXISTS — no changes needed)

ATO algorithm:
1. Subtract 1 from the first digit
2. Weights: `[10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]`
3. Sum products
4. Valid if `sum % 89 === 0`

---

## G) Copy Sweep (required)

Remove all user-visible text containing Phase 1/Phase 2/stub/mock/dev/[DEV] in doctor portal pages, including:

- `src/pages/doctor/Patients.tsx` — replace Phase1Stub with neutral "coming soon" or remove page
- `src/pages/doctor/PatientDetail.tsx` — same
- `src/pages/doctor/ConsultationView.tsx` — remove "Phase 2" text in Patient Summary and Patient History cards; replace with neutral placeholders
- `src/pages/doctor/Earnings.tsx` — remove any remaining phase language
- `src/components/doctor/Phase1Stub.tsx` — can be deleted if no longer referenced

---

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/constants/routing.ts` | NEW | `PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES` constant |
| `src/components/doctor/AvailabilityGrid.tsx` | UPDATE | Auto-scroll drag, selection+delete, inline time edit, booking overlay |
| `src/pages/doctor/Availability.tsx` | UPDATE | Pass bookings prop to grid |
| `src/services/doctorPayoutProfileService.ts` | UPDATE | Add entityName, gstRegistered, remittanceEmail; upsertProfile/validateProfile API |
| `src/services/doctorPayslipService.ts` | UPDATE | Weekly (Mon–Sun) auto-derived payslips; ensurePayslipsUpToDate |
| `src/services/doctorEarningsService.ts` | UPDATE | Rename to BILLABLE_CONSULT_STATUSES |
| `src/hooks/useDoctorReadiness.ts` | UPDATE | No change (already correct) |
| `src/components/layout/DoctorLayout.tsx` | UPDATE | Prefix-match gate using PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES + onboarding banner |
| `src/pages/doctor/Onboarding.tsx` | UPDATE | Add entityName, GST, remittance email fields |
| `src/pages/doctor/Account.tsx` | UPDATE | Add editable Payout Details section with masked display |
| `src/pages/doctor/Earnings.tsx` | UPDATE | Auto-derived weekly payslips; remove generate button |
| `src/pages/doctor/PayslipPrint.tsx` | UPDATE | Use grossCents/createdAtUtc |
| `src/pages/doctor/Patients.tsx` | UPDATE | Remove phase copy |
| `src/pages/doctor/PatientDetail.tsx` | UPDATE | Remove phase copy |
| `src/pages/doctor/ConsultationView.tsx` | UPDATE | Remove phase copy from patient summary/history |

---

## Implementation Order

1. `src/constants/routing.ts` (new routing constant)
2. Update services: `doctorPayoutProfileService.ts`, `doctorEarningsService.ts`, `doctorPayslipService.ts`
3. Update `DoctorLayout.tsx` (prefix-match gate + banner)
4. Update `Onboarding.tsx` (new payout fields)
5. Update `Account.tsx` (payout details section)
6. Update `Earnings.tsx` (auto-derived weekly payslips)
7. Update `PayslipPrint.tsx` (fix field names)
8. **Update `AvailabilityGrid.tsx`** (E3: auto-scroll, E4: selection+delete, E5: inline time edit, E6: booking overlay)
9. **Update `Availability.tsx`** (E7: pass bookings prop)
10. Copy sweep: `Patients.tsx`, `PatientDetail.tsx`, `ConsultationView.tsx`

---

## QA Checklist (Section E)

- [ ] Drag-create a block, keep dragging beyond bottom edge → grid auto-scrolls; blocks can be created past 7 PM.
- [ ] Desktop: click block to select (ring visible) → press Backspace/Delete → block removed immediately with toast.
- [ ] Mobile: tap block → popover with "Edit times" and "Delete" → Delete removes immediately.
- [ ] Click time label on block → popover with Start/End selects → change times → Save → block updates; overlap rejected with toast.
- [ ] Booking chip appears at correct time slot with accent styling and is clickable → navigates to consultation page.
- [ ] Availability visually splits around a booking (two segments shown for one block).
- [ ] Cannot create/resize availability to overlap a booking → toast error shown.
- [ ] Escape / click-away deselects a selected block.

---

Awaiting approval.
