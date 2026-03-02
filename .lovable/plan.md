

# Phase 1 Patient + Doctor UX Polish

## Summary
Make the Phase 1 app look like a finished product: remove all dev/stub/mock/phase copy from patient UI, fix signup inputs, add timezone to signup, improve doctor availability UX, and tighten auth protection.

---

## A) Remove Phase 1/2/Stub/Dev/Mock Messaging from Patient UI

Affected files and changes:

1. **`src/pages/patient/UploadPrescription.tsx`** -- This page is entirely a stub with no real functionality. Since upload is unavailable, **hide the page entirely**: replace with a simple info card: "Prescription upload is coming soon. In the meantime, book a consultation to have a doctor issue your prescription directly." Remove all Phase 1/2/stub text. No disabled upload dropzone -- no broken or non-interactive CTAs.

2. **`src/pages/patient/Prescriptions.tsx`** -- Remove the "Phase 1: entitlement is mock/localStorage only" subtitle, the "PDF Upload/View Disabled (Phase 1)" warning card, and the "Upload (Phase 2)" button. Replace "Shop Entitlement" card description "Derived from localStorage mock prescription data (Phase 1)" with "Your current prescription details". Change "View PDF (Phase 2)" disabled button to simply not render (hide it). Change "Dev Mock Prescription toggle" references to generic copy like "No active prescription found."

3. **`src/pages/patient/Intake.tsx`** -- Replace "Phase 1: intake form submission is disabled" subtitle and "Phase 1 Stub" card with a user-friendly info card: "Your intake form will be available closer to your consultation date." Remove all Phase 2 references.

4. **`src/pages/patient/Dashboard.tsx`** -- Remove code comments mentioning "mock" and "Phase 1" (code comments are fine to keep for developers, but ensure no user-visible text mentions these). Check rendered text -- currently clean except the "Upload Prescription" CTA which links to the stub page (keep the link, the stub page will now show a friendly info card).

5. **`src/pages/patient/Consultations.tsx`** -- The `isMock` field in `CombinedBooking` is internal only (not rendered), so no user-visible change needed. Add call expectation copy (see item B).

6. **`src/pages/patient/BookingPayment.tsx`** -- Line 225: "Mock payment form - no real payment will be processed" -- remove this text entirely. The mock payment card numbers (4242...) should render without the disclaimer.

7. **`src/components/shop/DevPrescriptionToggle.tsx`** -- Keep the component as-is (it already gates on `import.meta.env.DEV || ?dev=1`), so it's hidden in production. No changes needed.

8. **`src/pages/patient/Shop.tsx`** -- Verify `DevPrescriptionToggle` is only shown in dev mode (it is). No user-facing stub text to remove.

---

## B) Patient Consultations -- Call Expectation Copy

**`src/pages/patient/Consultations.tsx`** -- In the `BookingCard` component, for bookings with status `booked` or `confirmed`, add a line below the time: **"You'll receive a call from the doctor at this time."**

**`src/components/patient/ConsultationDetailDialog.tsx`** -- For upcoming bookings (status `booked`/`confirmed`), add a note near the time display: **"You'll receive a call from the doctor at this time."**

For `no_answer` status, the existing label "No Answer" is already user-friendly. Keep it.

---

## C) Patient Account Page -- Verify Nav

**`src/components/layout/PatientLayout.tsx`** -- The sidebar has a "Profile" link pointing to `/patient/profile`, but the actual route is `/patient/account`. Fix the link `href` from `/patient/profile` to `/patient/account`. Also rename the nav label from "Profile" to "Account".

Additionally, add an `Account` entry to the main `navItems` array (with `User` icon) so it appears in the sidebar proper, not just the bottom section. Or simply fix the existing bottom link.

---

## D) Patient Signup -- Timezone Selector

**`src/pages/Auth.tsx`** -- For patient signup:

1. Add state: `const [patientTimezone, setPatientTimezone] = useState<string>('Australia/Brisbane')` (preselected default).
2. Import `AU_TIMEZONE_OPTIONS` from `@/lib/timezones` and `userPreferencesService` from `@/services/userPreferencesService`.
3. Add a required `<Select>` dropdown labeled "Timezone" in the patient-specific fields section, using `AU_TIMEZONE_OPTIONS` for options.
4. After successful signup (in the patient branch, after `supabase.auth.getUser()`), call:
   ```
   try {
     userPreferencesService.setTimezone(newPatientUser.id, patientTimezone);
   } catch (e) {
     console.warn('Failed to persist timezone preference:', e);
   }
   ```
   This runs before the navigate call. On failure, log a warning and continue (runtime falls back to default).

---

## E) Auth Bypass Protection

All `/patient/*` routes are already wrapped in `<ProtectedRoute allowedRoles={['patient']}>` in `App.tsx` (line 95). This redirects unauthenticated users to `/auth`.

**Verify**: Any public page CTA linking to `/patient/*` (e.g., eligibility quiz result linking to upload) will correctly bounce through `/auth` because `ProtectedRoute` handles it.

No code changes needed here -- the protection is already in place. The `UploadPrescription` page is inside the patient layout which is inside `ProtectedRoute`.

---

## F) DOB and Phone Input Fixes

**`src/pages/Auth.tsx`**:

### DOB -- 3-field entry (DD / MM / YYYY)
1. Replace `dateOfBirth` state (`Date | undefined`) with three states: `dobDay`, `dobMonth`, `dobYear` (all strings, initially empty).
2. Remove the `Calendar`/`Popover` DOB picker. Replace with three inline `<Input>` fields in a row:
   - DD: `type="text"`, `maxLength={2}`, `placeholder="DD"`, `inputMode="numeric"`
   - MM: `type="text"`, `maxLength={2}`, `placeholder="MM"`, `inputMode="numeric"`
   - YYYY: `type="text"`, `maxLength={4}`, `placeholder="YYYY"`, `inputMode="numeric"`
3. Validation (in `handleSignup`):
   - Parse DD (1--31), MM (1--12), YYYY (1900--current year).
   - Construct a `Date` object and verify it's a valid calendar date (e.g., reject Feb 31 by checking `new Date(yyyy, mm-1, dd).getDate() === dd`).
   - Check age >= 18.
   - Show inline error text below the fields on failure; block submit.
4. When saving to profile, format as `yyyy-MM-dd`.

### Phone -- Fixed +61 prefix, 9-digit input starting with '4'
1. Replace `patientPhone` initial state from `'+61'` to `''`.
2. Replace the phone input with a composite field:
   - Fixed `+61` prefix displayed as a non-editable span/badge to the left of the input.
   - Input: `placeholder="4xx xxx xxx"`, `maxLength={9}`, `inputMode="numeric"`.
   - On change: strip non-digits, enforce max 9 chars.
3. Validation schema: replace `phoneSchema` usage for patients with a new check: exactly 9 digits, must start with `'4'`. Inline error if invalid.
4. When saving to profile, store as `+61${digits}` (e.g., `+614xxxxxxxx`).

---

## G) Contact Page Updates

**`src/pages/Contact.tsx`**:
1. Remove the phone entry from `contactInfo` array (the object with `icon: Phone`).
2. Change the office entry value from `"Melbourne, VIC"` to `"Gold Coast, QLD"` and description to `"Australia"`.

---

## H) Patient Nav -- Move Shop Higher

**`src/components/layout/PatientLayout.tsx`** -- Reorder `navItems` to place Shop earlier:

```
Dashboard, Shop, Book Consultation, Consultations, Prescriptions, Orders
```

Remove `Upload Prescription` from the main nav (the page still exists at its route but doesn't need prominent nav placement since upload is unavailable). Keep it accessible from the Prescriptions page or Dashboard CTA if needed.

---

## I) Doctor Availability UX Improvements

**`src/pages/doctor/Availability.tsx`**:

### Restrict hours to 6 AM -- 11 PM, display AM/PM
1. Replace `HOURS` (0--23) with a filtered range 6--23 (i.e., `['06','07',...,'23']`).
2. Change hour display labels to 12-hour AM/PM format (e.g., `6 AM`, `7 AM`, ..., `12 PM`, ..., `11 PM`). The stored value remains 24h (`'06'`, `'18'`, etc.) but the `<SelectItem>` label shows AM/PM.
3. In the weekly grid block display, format `startTime` and `endTime` from 24h to 12h AM/PM (e.g., `9:00 AM -- 12:00 PM`).

### Copy to Other Days
1. Add a "Copy to other days" section below the Add Block form (or as a button on each day card).
2. UI: When viewing a day's blocks, show a "Copy blocks to..." button. Clicking opens a popover/inline checkbox group listing Mon--Sun (excluding current day). User selects target days and clicks "Apply".
3. Behavior:
   - For each selected target day, iterate the source day's blocks.
   - For each block, check if the target day already has a block with identical `startTime` and `endTime` -- if so, skip (ignore duplicates).
   - Check for time overlaps: if a new block would overlap an existing block on the target day (start < existingEnd AND end > existingStart), show an inline error toast: "Block X overlaps with existing block on [Day]. Skipped." and skip that block.
   - Append non-duplicate, non-overlapping blocks via `mockAvailabilityService.addDoctorBlock(...)`.
4. Show a summary toast: "Copied N blocks to [days]."

### Overlap Validation on Add
- When adding a new block (handleAdd), before calling `addDoctorBlock`, check existing blocks for the same day for overlaps. If overlap found, show inline error: "This block overlaps with [startTime -- endTime]." and block the add.

---

## J) Doctor Timezone Selector -- Single Select

The timezone selector in `src/pages/doctor/Account.tsx` already uses `<Select>` (Radix single-select). No multi-select issue exists. No changes needed.

---

## K) Doctor Earnings Page -- Clean Copy

**`src/pages/doctor/Earnings.tsx`**:
1. Change heading from `"Earnings (Mock)"` to `"Earnings"`.
2. Change subtitle from `"Phase 1: paid per appointment; payouts tracked weekly (mock)"` to `"Paid per appointment. Payments are processed weekly."`.
3. Change card title from `"Payout Ledger (Mock)"` to `"Payout Ledger"`.
4. Remove CardDescription text `"Phase 2 will be backed by Stripe payouts + an auditable ledger (Supabase)."` -- replace with `"Track payment status for each completed consultation."`.

---

## Files Changed (Summary)

| File | Change Type |
|------|------------|
| `src/pages/patient/UploadPrescription.tsx` | Rewrite to info card |
| `src/pages/patient/Prescriptions.tsx` | Remove stub copy, hide unavailable actions |
| `src/pages/patient/Intake.tsx` | Replace stub card with friendly info |
| `src/pages/patient/BookingPayment.tsx` | Remove mock disclaimer text |
| `src/pages/patient/Consultations.tsx` | Add call expectation copy |
| `src/components/patient/ConsultationDetailDialog.tsx` | Add call expectation copy |
| `src/components/layout/PatientLayout.tsx` | Fix Account link, reorder nav |
| `src/pages/Auth.tsx` | Add timezone selector, DOB 3-field, phone +61 prefix |
| `src/pages/Contact.tsx` | Remove phone, update location |
| `src/pages/doctor/Availability.tsx` | AM/PM display, 6AM-11PM range, copy-to-days, overlap validation |
| `src/pages/doctor/Earnings.tsx` | Clean copy |

No new files. No new dependencies. No backend changes.

---

Awaiting approval.

