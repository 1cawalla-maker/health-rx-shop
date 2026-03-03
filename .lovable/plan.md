
# Phase 1 Doctor Portal — Account, Onboarding, Payslips & Signup Fixes (Rev 3)

## Summary

Persist doctor/patient profiles, add doctor onboarding flow (signature + payout profile with ABN), generate payslips, add print-friendly payslip view, fix signup UX, remove approval gate (Phase 1), and clean all "Phase 1/2/stub/mock/dev" copy.

---

## Hard Constraints

- No new dependencies.
- Business flows remain mock/localStorage for Phase 1 (Supabase Auth only).
- **UI must never call localStorage directly** — all reads/writes go through services.
- Remove ALL user-visible "Phase 1 / Phase 2 / stub / mock / dev" copy.
- Money in cents; display via `formatAudFromCents()`.

---

## A) Service Boundary (Explicit)

**Rule**: No component may call `localStorage` directly. All payslip, earnings, and payout data is generated/read ONLY via:
- `doctorEarningsService` — computes earned line items from bookings
- `doctorPayoutService` — tracks paid/pending status per booking
- `doctorPayslipService` (**NEW**) — generates and stores monthly payslip summaries

The Earnings page and any new Payments/Payslips UI calls service methods only.

---

## B) Doctor Onboarding Gate

### B1. New hook: `src/hooks/useDoctorReadiness.ts`

```typescript
export function useDoctorReadiness(): { ready: boolean; loading: boolean }
```

- Checks two conditions:
  1. **Signature saved**: `doctorSignatureService.getSignature(user.id) !== null`
  2. **Payout profile valid**: `doctorPayoutProfileService.getProfile(user.id)` returns a profile where `isComplete === true` (ABN valid, BSB 6 digits, account number 6-10 digits, account name present)
- Returns `{ ready: true }` only when BOTH conditions are met.
- `loading` is true while auth is resolving.

### B2. Gate placement

- In `DoctorLayout` (or a wrapper component rendered inside the doctor `ProtectedRoute`):
  - Call `useDoctorReadiness()`
  - If `!ready` and current path is NOT `/doctor/onboarding`, render `<Navigate to="/doctor/onboarding" replace />`
  - `/doctor/onboarding` is always accessible regardless of readiness.

### B3. New page: `src/pages/doctor/Onboarding.tsx`

Two-section page:

1. **Signature** — canvas pad (reuse Registration.tsx logic). Save button persists immediately via `doctorSignatureService.saveSignature()`. Saved state shown with green check.

2. **Payout Profile** — form with:
   - ABN (11 digits, validated with ATO checksum — see section F)
   - BSB (6 digits)
   - Account number (6-10 digits)
   - Account name (free text, required)
   - Explicit "Save" button — calls `doctorPayoutProfileService.saveProfile()`

3. **Complete Onboarding** button — enabled only when signature is saved AND payout profile validates. On click, marks onboarding complete and redirects to `/doctor/consultations`.

### B4. Partial save behaviour

- Signature can be saved independently (immediately) when captured on the canvas.
- Payout profile is saved on explicit "Save" click.
- Onboarding completion requires BOTH signature saved + payout profile validates.
- If doctor leaves mid-flow (closes tab, navigates away), they will be redirected back to `/doctor/onboarding` on next visit until complete.

### B5. New service: `src/services/doctorPayoutProfileService.ts`

```typescript
export interface DoctorPayoutProfile {
  abn: string;         // 11 digits
  bsb: string;         // 6 digits
  accountNumber: string; // 6-10 digits
  accountName: string;
  updatedAt: string;
}

// Storage key: doctor:{uid}:payout_profile
// Methods:
//   getProfile(uid): DoctorPayoutProfile | null
//   saveProfile(uid, profile): void
//   isComplete(uid): boolean — checks all fields present + ABN valid
```

---

## C) Payslip Revenue Rule (Business Rule)

**Rule**: `no_answer` consults are paid (same as `completed`). An attempted consultation is billable — the doctor's time was allocated and the call was attempted regardless of patient availability.

This is already implemented in `doctorEarningsService.ts` line 19:
```typescript
const PAID_STATUSES: BookingStatus[] = ['completed', 'no_answer'];
```

**Change**: Extract to a named constant with a JSDoc comment:
```typescript
/**
 * Statuses that generate doctor earnings.
 * Business rule: attempted consults (no_answer) are billable because
 * the doctor's time was allocated and call was attempted.
 * To change this policy, remove 'no_answer' from this array.
 */
export const PAID_STATUSES: BookingStatus[] = ['completed', 'no_answer'];
```

Export it so `doctorPayslipService` can reuse it.

---

## D) Payslip Service & Data

### D1. New service: `src/services/doctorPayslipService.ts`

```typescript
export interface Payslip {
  id: string;
  doctorId: string;
  periodLabel: string;    // e.g. "March 2026"
  periodStart: string;    // ISO date
  periodEnd: string;      // ISO date
  consultCount: number;
  totalCents: number;
  generatedAt: string;
  lines: PayslipLineItem[];
}

export interface PayslipLineItem {
  bookingId: string;
  patientId: string;
  scheduledAtIso: string;
  status: BookingStatus;  // 'completed' | 'no_answer'
  feeCents: number;
}
```

Storage key: `doctor:{uid}:payslips`

Methods:
- `generatePayslip(doctorId, year, month): Payslip` — filters earnings lines by month, creates payslip, stores it. Idempotent: if payslip for that month already exists, returns existing.
- `getPayslips(doctorId): Payslip[]` — returns all stored payslips sorted by period descending.
- `getPayslip(doctorId, payslipId): Payslip | null`

Uses `doctorEarningsService.getEarnings()` as the source of truth for line items. Filters by `scheduledAtIso` falling within the requested month.

### D2. Earnings page update

Add a "Payslips" section below the existing ledger:
- "Generate Payslip" button with month/year selector (defaults to current month)
- List of generated payslips with: period label, consult count, total, "View" link → `/doctor/payslips/:id/print` (opens new tab)

---

## E) Print-Friendly Payslip View

### E1. New route: `/doctor/payslips/:payslipId/print`

**File**: `src/pages/doctor/PayslipPrint.tsx`

- Dedicated route (added to `App.tsx` inside doctor routes)
- Minimal layout — NO sidebar, NO header. Just the payslip content.
- Content:
  - Header: "Payslip" + period label + generated date
  - Doctor info: name (from profile), ABN (from payout profile)
  - Table: Date | Booking ID | Patient | Status | Fee
  - Footer: Total consults, Total amount
  - "Print" button that calls `window.print()` (hidden in print CSS)
- Print CSS (`@media print`):
  - Hide the Print button
  - Remove shadows/borders for clean output
  - Set page margins

### E2. Route registration (`App.tsx`)

```typescript
<Route path="payslips/:payslipId/print" element={<PayslipPrint />} />
```

This route is inside the doctor protected area but should NOT be wrapped in `DoctorLayout` (no sidebar). Use a separate route entry outside the layout outlet, or render without layout.

---

## F) ABN Checksum Algorithm

### F1. New util: `src/lib/abnValidation.ts`

Implements the ATO ABN validation algorithm:

1. Subtract 1 from the first digit of the ABN.
2. Multiply each digit by its corresponding weighting factor: `[10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]`
3. Sum all 11 products.
4. ABN is valid if `sum % 89 === 0`.

```typescript
export function validateAbn(abn: string): { valid: boolean; error?: string } {
  const digits = abn.replace(/\s/g, '');
  if (digits.length !== 11) return { valid: false, error: 'ABN must be exactly 11 digits' };
  if (!/^\d{11}$/.test(digits)) return { valid: false, error: 'ABN must contain only digits' };

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const nums = digits.split('').map(Number);
  nums[0] -= 1; // subtract 1 from first digit

  const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
  if (sum % 89 !== 0) return { valid: false, error: 'Invalid ABN (checksum failed)' };

  return { valid: true };
}
```

Used by `doctorPayoutProfileService.isComplete()` and the onboarding form validation.

---

## G) Existing Plan Items (Carried Forward)

### G1. Patient Signup — Persist Profile via Service

**File: `src/pages/Auth.tsx`**

After successful patient signup, call `userProfileService.upsertProfile(uid, { fullName, dateOfBirth, phoneE164, timezone })`. Timezone comes from the required `AU_TIMEZONE_OPTIONS` select (default `'Australia/Brisbane'`), no auto-detect.

### G2. Patient Account Page — Editable Profile

**File: `src/pages/patient/Account.tsx`** (full rewrite)

- Load from `userProfileService.getProfile(user.id)` on mount.
- Editable fields: Full Name, Email (read-only), DOB (DD/MM/YYYY numeric inputs), Phone (+61 prefix), Timezone (AU_TIMEZONE_OPTIONS select).
- Save button:
  - Validates DOB and phone via shared utils (`src/lib/validation.ts`)
  - Calls `userProfileService.upsertProfile()`
  - Calls `userPreferencesService.setTimezone()`
  - **Syncs `profiles.full_name`** to Supabase `profiles` table (also phone + date_of_birth)
  - Shows success toast

### G3. Doctor Signup — Fix Phone UX + Add Timezone

**File: `src/pages/Auth.tsx`**

- Doctor phone: fixed `+61` prefix + 9-digit input starting with '4' (matching patient UX)
- Doctor timezone: required `AU_TIMEZONE_OPTIONS` select, default `'Australia/Brisbane'`, no auto-detect
- Post-signup: persist via `userPreferencesService.setTimezone()`

### G4. Remove Doctor Approval Gate (Phase 1)

**File: `src/hooks/useAuth.tsx`**
- Set `status: 'approved'` for all roles on signup
- Set doctor `is_active: true` and `registration_complete: true`
- Add `// TODO(phase2): restore approval gate — set doctor status to 'pending_approval' and is_active to false`

**File: `src/components/ProtectedRoute.tsx`**
- Remove `pending_approval` redirect
- Add `// TODO(phase2): restore pending_approval redirect for doctors`

**File: `src/pages/Auth.tsx`**
- Remove "pending approval" toast/copy; redirect doctors to `/doctor/dashboard`
- Remove "credentials will be verified" note

**File: `src/pages/doctor/Pending.tsx`**
- Keep as redirect component: `<Navigate to="/doctor/dashboard" replace />`

### G5. Doctor Account Page — Clean Phase Copy

**File: `src/pages/doctor/Account.tsx`**

- Fields (AHPRA, Provider Number, Phone, Practice Location) populated from Supabase `doctors` table query, displayed **read-only**.
- Add neutral note: "To update your registered details, please contact support."
- Remove all "Phase 1/2" copy.

### G6. Doctor Registration Page — Clean Phase Copy

**File: `src/pages/doctor/Registration.tsx`**

- Remove "Phase 1" heading and "Phase 1 Note" card.

### G7. Shared Validation Utils

**File: `src/lib/validation.ts`** (already created)

Contains `validateDob`, `formatDobForStorage`, `parseDobFromStorage`, `validateAuPhone`, `stripAuPrefix`. Used by both Auth.tsx and Account.tsx.

---

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/abnValidation.ts` | **NEW** | ATO ABN checksum validation |
| `src/services/doctorPayoutProfileService.ts` | **NEW** | Payout profile (ABN, BSB, account) CRUD |
| `src/services/doctorPayslipService.ts` | **NEW** | Monthly payslip generation & storage |
| `src/hooks/useDoctorReadiness.ts` | **NEW** | Centralized onboarding gate hook |
| `src/pages/doctor/Onboarding.tsx` | **NEW** | Signature + payout profile onboarding page |
| `src/pages/doctor/PayslipPrint.tsx` | **NEW** | Print-friendly payslip view |
| `src/services/doctorEarningsService.ts` | UPDATE | Export `PAID_STATUSES` with JSDoc justification |
| `src/pages/doctor/Earnings.tsx` | UPDATE | Add payslip generation UI section |
| `src/components/layout/DoctorLayout.tsx` | UPDATE | Add onboarding gate via `useDoctorReadiness()` |
| `src/App.tsx` | UPDATE | Add routes: `/doctor/onboarding`, `/doctor/payslips/:payslipId/print` |
| `src/pages/Auth.tsx` | UPDATE | Doctor phone/timezone UX, remove approval gate, persist profile |
| `src/pages/patient/Account.tsx` | REWRITE | Editable profile with Supabase `profiles.full_name` sync |
| `src/hooks/useAuth.tsx` | UPDATE | `approved` status + `is_active: true` + TODO(phase2) comments |
| `src/components/ProtectedRoute.tsx` | UPDATE | Remove `pending_approval` + TODO(phase2) comment |
| `src/pages/doctor/Account.tsx` | UPDATE | Read-only populated fields + "contact support" note |
| `src/pages/doctor/Registration.tsx` | UPDATE | Remove phase copy |
| `src/pages/doctor/Pending.tsx` | UPDATE | Keep as redirect component |
| `src/lib/validation.ts` | EXISTS | Shared DOB/phone validation (already created) |
| `src/services/userProfileService.ts` | EXISTS | localStorage profile service (already created) |

---

## Implementation Order

1. New utils/services: `abnValidation.ts`, `doctorPayoutProfileService.ts`, `doctorPayslipService.ts`
2. Update `doctorEarningsService.ts` (export PAID_STATUSES)
3. New hook: `useDoctorReadiness.ts`
4. Onboarding page: `Onboarding.tsx`
5. Payslip print page: `PayslipPrint.tsx`
6. Update `DoctorLayout.tsx` (onboarding gate)
7. Update `App.tsx` (new routes)
8. Auth/signup fixes: `Auth.tsx`, `useAuth.tsx`, `ProtectedRoute.tsx`
9. Account pages: patient `Account.tsx`, doctor `Account.tsx`
10. Cleanup: `Registration.tsx`, `Pending.tsx`, `Earnings.tsx` (payslip section)

---

Awaiting approval.
