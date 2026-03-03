
# Phase 1 Account + Signup Fixes (Patient+Doctor)

## Summary
Make profile data persist and editable, fix doctor signup phone UX to match patient, add timezone to doctor signup, remove the doctor approval gate for Phase 1, and clean all remaining "Phase 1/2/stub/mock/dev" copy from account pages.

---

## A) New Local Profile Service

**New file: `src/services/userProfileService.ts`**

Create a localStorage-backed service (following the same pattern as `userPreferencesService`):

- Storage key: `user:{uid}:profile`
- Shape: `{ fullName: string; dateOfBirth: string | null; phoneE164: string; timezone: string; updatedAt: string }`
- Methods:
  - `getProfile(uid: string): UserProfile | null` -- reads and returns stored profile
  - `upsertProfile(uid: string, patch: Partial<UserProfile>): void` -- merges patch into existing profile and writes back
- Early-return null/void if `uid` is falsy (per service abstraction pattern)

---

## B) Patient Signup -- Persist Profile via Service

**File: `src/pages/Auth.tsx`** (lines ~274-295, patient post-signup block)

After successful patient signup, add a call to `userProfileService.upsertProfile(uid, { fullName, dateOfBirth, phoneE164, timezone })` alongside the existing `userPreferencesService.setTimezone()` call. This ensures all onboarding data is available from a single service on the Account page.

No other changes to patient signup -- DOB fields, phone input, and timezone selector are already implemented correctly from the previous plan.

---

## C) Patient Account Page -- Editable Profile

**File: `src/pages/patient/Account.tsx`** (full rewrite of the component body)

Replace the current read-only card + timezone-only page with:

1. Load profile on mount: `userProfileService.getProfile(user.id)` to populate state for `fullName`, `dobDay/dobMonth/dobYear`, `phone` (strip +61 prefix for display), `timezone`.
2. Also load timezone via `userPreferencesService.getTimezoneWithMeta()` (for reset toast).
3. Editable fields:
   - **Full Name**: text input
   - **Email**: read-only (from `user.email`), shown with a muted badge
   - **DOB**: 3 fields (DD/MM/YYYY) with the same `validateDob` logic from Auth.tsx (extract to a shared util or inline)
   - **Phone**: fixed `+61` prefix span + 9-digit input starting with '4' (same UX as signup)
   - **Timezone**: `<Select>` with `AU_TIMEZONE_OPTIONS`
4. Single "Save" button that:
   - Validates DOB and phone inline (shows errors, blocks save)
   - Calls `userProfileService.upsertProfile(uid, { fullName, dateOfBirth, phoneE164: '+61' + digits, timezone })`
   - Calls `userPreferencesService.setTimezone(uid, timezone)`
   - Updates Supabase `profiles` table (phone + date_of_birth) for data that flows to backend
   - Shows success toast
5. Remove "Read-only in Phase 1" text and the read-only badge.

**Extract shared validation**: Move `validateDob` and `formatDobForStorage` from `Auth.tsx` into a new `src/lib/validation.ts` utility, then import in both Auth.tsx and Account.tsx.

---

## D) Doctor Signup -- Fix Phone UX + Add Timezone

**File: `src/pages/Auth.tsx`** (doctor-specific fields section, lines ~648-741)

1. **Phone**: Replace the current free-text `+61...` input with the same fixed-prefix UX used for patients:
   - New state: `doctorPhone` (string, digits only)
   - Fixed `+61` span + input with `placeholder="4xx xxx xxx"`, `maxLength={9}`, `inputMode="numeric"`
   - Validation: 9 digits starting with '4'
   - Store as `+61${digits}`
   - Remove old `phoneNumber` state and `phoneSchema` usage for doctors

2. **Timezone**: Add a required `<Select>` dropdown (AU only, `AU_TIMEZONE_OPTIONS`) below the Specialty field:
   - New state: `doctorTimezone` (default `'Australia/Brisbane'`)
   - After successful doctor signup, persist via `userPreferencesService.setTimezone(newUser.id, doctorTimezone)`

3. Update the doctor post-signup block (lines ~228-265) to:
   - Use `'+61' + doctorPhone` when saving to `doctors.phone` and `profiles.phone`
   - Call `userPreferencesService.setTimezone(newUser.id, doctorTimezone)` with try/catch + console.warn

---

## E) Remove Doctor Approval Gate (Phase 1)

### E1. `src/hooks/useAuth.tsx` (line 154)
Change:
```typescript
const status: UserStatus = role === 'doctor' ? 'pending_approval' : 'approved';
```
To:
```typescript
const status: UserStatus = 'approved';
```
All roles get `approved` status on signup in Phase 1.

### E2. `src/hooks/useAuth.tsx` -- doctor signup also sets `is_active: true` and `registration_complete: true`
Change lines 196-200 in the `doctors` insert from `is_active: false, registration_complete: false` to `is_active: true, registration_complete: true`.

### E3. `src/pages/Auth.tsx` -- useEffect redirect (lines 109-127)
Remove the `pending_approval` branch. Simplify to: if user has a role and status is approved, redirect to the role's dashboard.

### E4. `src/pages/Auth.tsx` -- post-signup redirect (lines 270-272)
Change from:
```
toast.success('Account created! Your application is pending approval.');
navigate('/doctor/pending');
```
To:
```
toast.success('Account created successfully!');
navigate('/doctor/dashboard');
```

### E5. `src/components/ProtectedRoute.tsx` (lines 44-46)
Remove the `pending_approval` redirect block entirely. Doctors with `approved` status will pass through normally.

### E6. `src/pages/doctor/Pending.tsx`
Replace the Phase1Stub content with a simple redirect to `/doctor/dashboard` using `<Navigate>`. Keep the file/route so any old bookmarks don't 404.

### E7. `src/pages/Auth.tsx` -- doctor signup note (lines 737-740)
Remove the "Your credentials will be verified before your account is activated" note since there's no approval gate now.

---

## F) Doctor Account Page -- Clean Phase Copy

**File: `src/pages/doctor/Account.tsx`**

1. Line 99: Change `CardDescription` from `"Read-only in Phase 1. Phase 2 will allow editing via backend."` to `"Your registered details"`.
2. Line 114: Remove `"Phase 2: fetched from doctor record"` helper text under AHPRA Number.
3. Populate the read-only fields (AHPRA, Provider, Phone, Practice Location) from the Supabase `doctors` table query on mount, instead of showing "---". Add a `useEffect` that fetches `doctors` row by `user_id` and populates the inputs.

---

## G) Doctor Registration Page -- Clean Phase Copy

**File: `src/pages/doctor/Registration.tsx`**

1. Line 80: Change heading from `"Doctor Registration (Phase 1)"` to `"Doctor Registration"`.
2. Lines 84-94: Remove the entire "Phase 1 Note" card (the one with AlertCircle and "This is a local-only signature capture for testing...").

---

## D2) Remaining Phase/Stub Copy Sweep

Search all patient and doctor pages for any remaining user-visible "Phase 1", "Phase 2", "stub", "mock", "dev" text and remove or replace:
- `src/pages/doctor/Account.tsx` -- covered in F above
- `src/pages/doctor/Registration.tsx` -- covered in G above
- `src/pages/doctor/Pending.tsx` -- covered in E6 above
- `src/pages/patient/Account.tsx` -- covered in C above (removing "Read-only in Phase 1")

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/services/userProfileService.ts` | **NEW** -- localStorage profile service |
| `src/lib/validation.ts` | **NEW** -- shared `validateDob`, `formatDobForStorage` |
| `src/pages/Auth.tsx` | Doctor phone UX, doctor timezone, remove approval gate redirect/copy, persist patient profile, import shared validation |
| `src/pages/patient/Account.tsx` | Full rewrite: editable name/DOB/phone/timezone with save |
| `src/hooks/useAuth.tsx` | Set all roles to `approved` on signup; doctor `is_active: true` |
| `src/components/ProtectedRoute.tsx` | Remove `pending_approval` redirect |
| `src/pages/doctor/Pending.tsx` | Replace stub with redirect to dashboard |
| `src/pages/doctor/Account.tsx` | Clean phase copy; fetch doctor record for fields |
| `src/pages/doctor/Registration.tsx` | Remove phase heading + note card |

No new dependencies. No backend schema changes. No edge functions.

---

Awaiting approval.
