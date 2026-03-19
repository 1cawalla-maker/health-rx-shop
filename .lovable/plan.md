

## Phase 1 MVP Polish — Portals (Revised Plan)

### A) Copy/Label Cleanup

| # | File | Before | After |
|---|------|--------|-------|
| A1 | `PaymentPlaceholder.tsx` L26–30 | Amber alert: "Note: Payment processing is coming soon…" | **Remove entire `<Alert>` block** |
| A2 | `PaymentPlaceholder.tsx` L38–40 | `Secure payment powered by Stripe (coming soon)` | `Secure payment processing` |
| A3 | `PaymentPlaceholder.tsx` L43 | `{/* Mock Payment Form */}` | `{/* Payment Form */}` |
| A4 | `Shop.tsx` L51 | `// Combine context and hook - prefer mock/hook for Phase 1 testing` | `// Combine context and hook` |
| A5 | `Shop.tsx` L55 | `// Use prescription strength or default to 9 for mock` | `// Use prescription strength or default` |
| A6 | `BookingPayment.tsx` L93 | `// Simulate payment processing delay` | Remove comment |
| A7 | `BookingPayment.tsx` L197 | `{/* Mock payment form - disabled inputs */}` | `{/* Payment form */}` |
| A8 | `Account.tsx` (patient) L33 | `// Load from local profile service` | Remove comment |
| A9 | `Account.tsx` (patient) L99 | `// Save to local profile service` | Remove comment |
| A10 | `CartDrawer.tsx` L69 | `{/* Product Image Placeholder */}` | `{/* Product Image */}` |

---

### B) Patient Upload Prescription — Working Flow

**New file: `src/services/prescriptionBlobService.ts`**

```ts
interface PrescriptionBlob {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
  // blob stored in IDB value
}

interface PrescriptionBlobService {
  saveBlob(patientId: string, file: File): Promise<{ id: string }>;
  listBlobs(patientId: string): Promise<PrescriptionBlob[]>;
  getBlob(id: string): Promise<Blob | null>;
  removeBlob(id: string): Promise<void>;
}
```

- DB name: `healthrx_prescriptions`, store: `uploads`, indexed by `patientId`.
- **`onupgradeneeded`**: guard with `if (!db.objectStoreNames.contains('uploads'))` before creating store.
- Phase 2: swap internals to Supabase Storage — interface unchanged.

**Updated: `src/services/prescriptionUploadService.ts`**
- `createUpload()` calls `prescriptionBlobService.saveBlob()` instead of `fileStorageService`.
- `getFileDownloadUrl()` calls `prescriptionBlobService.getBlob()` then `URL.createObjectURL()`.
- `getPatientUploads()` merges blob metadata with localStorage records.

**Rewritten: `src/pages/patient/UploadPrescription.tsx`**
- **Pre-write validation**: Before calling `saveBlob`/`createUpload`, validate:
  - File type: `.pdf, .jpg, .jpeg, .png` only.
  - File size: max 10 MB. Show toast error if exceeded.
- File input + upload button.
- List of uploads: fileName, date, status badge, view/download, remove.
- Empty state: guidance text + "Book a Consultation" CTA.
- **Object URL lifecycle**:
  - Store created object URLs in component state (e.g. `Map<string, string>`).
  - `useEffect` cleanup calls `URL.revokeObjectURL()` for all active URLs.
  - On item remove: revoke that item's URL before deleting.

---

### C) Account Pages — Fully Editable via Local Services (3A)

**Current state violates Phase 1 constraint**: Patient Account currently writes to Supabase `profiles` table on save (lines 111–118). Doctor Account has identity fields (name, AHPRA, provider number, phone, practice location) as read-only from Supabase (lines 73–85, 184–189).

#### C1: New file — `src/services/doctorProfileService.ts`

localStorage-backed service for doctor identity fields. Key: `doctor:{uid}:profile`.

```ts
export interface DoctorProfile {
  fullName: string;
  email: string;
  ahpraNumber: string;
  providerNumber: string;
  phone: string;
  practiceLocation: string;
  updatedAt: string;
}

export const doctorProfileService = {
  getProfile(uid: string): DoctorProfile | null;
  upsertProfile(uid: string, patch: Partial<DoctorProfile>): void;
};
```

- On first load, seed from Supabase `doctors` table + `user_metadata` (one-time hydration into localStorage).
- All subsequent reads/writes are local only.
- Phase 2: swap internals to Supabase update — interface unchanged.

#### C2: Update `src/pages/doctor/Account.tsx`

- Import `doctorProfileService`.
- Load identity fields from `doctorProfileService.getProfile()` (falls back to Supabase hydration on first visit).
- **Remove read-only constraint** on Legal Name, AHPRA, Provider Number, Phone, Practice Location — all editable.
- Remove "To update your registered details, please contact support." text.
- Save calls `doctorProfileService.upsertProfile()` (local only).
- Email remains read-only (from `user.email`).

#### C3: Update `src/pages/patient/Account.tsx`

- **Remove Supabase `profiles` write** (lines 111–118). Save calls `userProfileService.upsertProfile()` only.
- **Remove Supabase `profiles` read fallback** (lines 44–59). Load from `userProfileService` only.
- On first visit with no local data, seed from `user_metadata` (name) — no Supabase query.
- Phase 2: swap `userProfileService` internals to Supabase — UI unchanged.

---

### D) Remove DevPrescriptionToggle

#### D1: Consumer audit

`mockEnabled` and `setMockPrescription` are consumed in exactly **2 files**:
1. `src/hooks/usePrescriptionStatus.ts` — defines them
2. `src/pages/patient/Shop.tsx` — destructures and uses them

No other consumers.

#### D2: Changes

| File | Change |
|------|--------|
| `src/hooks/usePrescriptionStatus.ts` | Remove `setMockPrescription` callback, `mockEnabled` variable, and both from the return object. Remove hook comment "Phase 1: Mock/localStorage only". |
| `src/pages/patient/Shop.tsx` | Remove `mockEnabled`, `setMockPrescription` from destructure. Replace `mockEnabled \|\| rxHasActive` with `rxHasActive`. Replace `!mockEnabled && !rxHasActive` with `!rxHasActive`. Replace `allowedStrengthMg \|\| (mockEnabled ? 9 : 0)` with `allowedStrengthMg \|\| 0`. Remove `handleCreatePrescription`, `handleClearPrescription`. Remove `<DevPrescriptionToggle>` JSX + import. |
| `src/components/shop/DevPrescriptionToggle.tsx` | **Delete file.** |

---

### File Summary

| File | Action |
|------|--------|
| `src/components/checkout/PaymentPlaceholder.tsx` | Copy cleanup (A1–A3) |
| `src/pages/patient/Shop.tsx` | Copy cleanup (A4–A5) + remove dev toggle (D2) |
| `src/pages/patient/BookingPayment.tsx` | Copy cleanup (A6–A7) |
| `src/pages/patient/Account.tsx` | Copy cleanup (A8–A9) + remove Supabase reads/writes (C3) |
| `src/components/shop/CartDrawer.tsx` | Copy cleanup (A10) |
| `src/services/prescriptionBlobService.ts` | **New** — IndexedDB service with upgrade guard (B) |
| `src/services/prescriptionUploadService.ts` | Update to use blob service (B) |
| `src/pages/patient/UploadPrescription.tsx` | Full rewrite — working upload UI with validation + URL lifecycle (B) |
| `src/services/doctorProfileService.ts` | **New** — localStorage-backed doctor identity service (C1) |
| `src/pages/doctor/Account.tsx` | Make all identity fields editable via doctorProfileService (C2) |
| `src/components/shop/DevPrescriptionToggle.tsx` | **Delete** (D2) |
| `src/hooks/usePrescriptionStatus.ts` | Remove mock toggle exports (D1–D2) |

### QA Checklist

1. `npm run build` succeeds with no TS errors.
2. Patient Shop loads, shows products, no dev toggle visible.
3. Patient Upload Prescription: select file, see validation error for >10 MB or wrong type; upload valid file, see list, view/download, remove. Persists after refresh. Object URLs revoked on unmount (no memory leak).
4. Patient Checkout: no "coming soon" or amber alert — just payment form and Place Order.
5. Booking Payment: no "mock" or "simulate" language.
6. **Patient Account: edit name, DOB, phone, timezone. Save. Refresh page. All edits persisted. No Supabase calls.**
7. **Doctor Account: edit Legal Name, AHPRA, Provider Number, Phone, Practice Location. Save. Refresh. All edits persisted locally. Payout edit still works.**
8. No rendered UI text contains: Phase 1, Phase 2, mock, stub, dev, local, coming soon, not available.

