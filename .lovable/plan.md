

## Phase 1 Cleanup — CSS Build Warning + Copy Hygiene

### A) CSS @import ordering fix

**File: `src/index.css`**

| Line | Before | After |
|------|--------|-------|
| 1-5 | `@tailwind base;` then `@tailwind components;` then `@tailwind utilities;` then blank then `@import url(...)` | Move `@import url(...)` to line 1, then blank line, then `@tailwind` directives |

### B) Doctor portal copy — remaining issue

After reviewing every file listed, the previous cleanup round already handled `PaymentsCard.tsx`, `PrescriptionForm.tsx`, and `doctorRemittanceService.ts`. Most files listed (Registration, Patients, PatientDetail, Account, Earnings, ConsultationWorkspace, Bookings, BookingDetail, Calendar, Pending, MedicationGuideCard, EligibilityQuizCard) contain **zero** Phase/mock/stub/dev strings in rendered UI text. The `MockBooking`/`mockAvailabilityService` references are TypeScript imports/type annotations only — not rendered.

**One remaining issue found:**

| File | Line | Before | After |
|------|------|--------|-------|
| `src/pages/doctor/Prescriptions.tsx` | 47 | `<Badge variant="outline">Local</Badge>` | Remove this badge entirely |

The "Local" badge exposes an implementation detail (data stored locally vs remotely). Remove it so the prescription card header just shows the title and description without a storage-origin label.

### C) localStorage boundary

Confirmed clean. No direct `localStorage.*` calls in `src/pages/doctor/*` or `src/components/doctor/*`. All persistence goes through services.

### D) `Phase1Stub.tsx`

Does not exist in the codebase — no action needed.

### Files to modify

| File | Action | Change |
|------|--------|--------|
| `src/index.css` | Edit lines 1-5 | Move `@import` above `@tailwind` directives |
| `src/pages/doctor/Prescriptions.tsx` | Edit line 47 | Remove `<Badge variant="outline">Local</Badge>` |

### QA checklist
1. `npm run build` produces no `@import must precede all other statements` warning.
2. Grep `src/pages/doctor` and `src/components/doctor` for rendered strings containing Phase/mock/stub/dev/Local — zero hits (code identifiers in imports/types are acceptable).

