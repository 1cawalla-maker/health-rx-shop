
# Phase 1 Doctor Portal Fixes — Onboarding, Payslips, Availability & Cleanup (Rev 4)

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

## E) Availability UX Overhaul — Visual Weekly Grid (5-minute snap)

### E1. Data shape (compatible with existing availability blocks)

- Continue storing recurring weekly availability as blocks: `{ dayOfWeek, startTime, endTime, timezone }`
- Enforce 5-minute increments on start/end times
- Service remains the only localStorage boundary (`mockAvailabilityService`)

### E2. New component

**File**: `src/components/doctor/AvailabilityGrid.tsx` (NEW)

- UI:
  - Columns: days Mon–Sun
  - Rows/time axis: 24h with visible ticks every 30/60m; selection snaps to 5m
  - Interactions:
    - Click+drag to create availability block
    - Drag handles to resize; drag block to move within day
    - Click block to delete/confirm delete
    - Keyboard accessible fallback: selected block shows start/end dropdowns (5m increments)
  - Helper actions:
    - "Copy Monday → Weekdays"
    - "Clear Week"
    - "Set 9–5 Weekdays" preset
  - Inline validation:
    - Prevent overlaps per day
    - Ensure end > start

### E3. Page integration

**File**: `src/pages/doctor/Availability.tsx`

- Replace current form UI with `AvailabilityGrid`
- Persist via availability service methods only
- Keep timezone warning copy but remove any phase/dev wording

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
| `src/constants/routing.ts` | **NEW** | `PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES` constant |
| `src/components/doctor/AvailabilityGrid.tsx` | **NEW** | Visual weekly availability grid component |
| `src/services/doctorPayoutProfileService.ts` | UPDATE | Add entityName, gstRegistered, remittanceEmail; upsertProfile/validateProfile API |
| `src/services/doctorPayslipService.ts` | UPDATE | Weekly (Mon–Sun) auto-derived payslips; ensurePayslipsUpToDate |
| `src/services/doctorEarningsService.ts` | UPDATE | Rename to BILLABLE_CONSULT_STATUSES |
| `src/hooks/useDoctorReadiness.ts` | UPDATE | No change (already correct) |
| `src/components/layout/DoctorLayout.tsx` | UPDATE | Prefix-match gate using PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES + onboarding banner |
| `src/pages/doctor/Onboarding.tsx` | UPDATE | Add entityName, GST, remittance email fields |
| `src/pages/doctor/Account.tsx` | UPDATE | Add editable Payout Details section with masked display |
| `src/pages/doctor/Earnings.tsx` | UPDATE | Auto-derived weekly payslips; remove generate button |
| `src/pages/doctor/PayslipPrint.tsx` | UPDATE | Use grossCents/createdAtUtc |
| `src/pages/doctor/Availability.tsx` | REWRITE | Replace form with AvailabilityGrid |
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
8. Build `AvailabilityGrid.tsx` + rewrite `Availability.tsx`
9. Copy sweep: `Patients.tsx`, `PatientDetail.tsx`, `ConsultationView.tsx`

---

Awaiting approval.
