

## Phase 1 Final QA + Copy Cleanup

### Verification Results

**1. Consult happy path** ✅ Already correct
- `ConsultationView.tsx` lines 127-143: `doIssue()` and `doDecline()` both call `navigate('/doctor/consultations')` on success.
- Status controls (lines 237-258): Only "Cancel Consultation" and "Mark No-Show" buttons present. No "Start Consult" or "Mark Completed".
- Patient phone is prominent with copy button (Patient Details card, lines ~198-229).

**2. Availability booking chip** ✅ Already correct
- `AvailabilityGrid.tsx` line 635: `navigate('/doctor/consultation/${bk.id}')` — uses singular route.

**3. Internal copy to remove** — 4 files need changes:

| # | File | Current text | Proposed fix |
|---|------|-------------|--------------|
| 1 | `src/components/doctor/PaymentsCard.tsx` L19 | `Payment (Mock)` | `Payment` |
| 2 | `src/components/doctor/PaymentsCard.tsx` L21 | `Phase 1: tracked locally; Phase 2 will use Stripe payouts` | `Consult payment tracking` |
| 3 | `src/components/doctor/PrescriptionForm.tsx` L69 | `// Phase 1: doctor-side prescription issuance is disabled...` | Remove comment |
| 4 | `src/components/doctor/PrescriptionForm.tsx` L74 | `toast.error('Prescription issuing will be enabled in Phase 2')` | `toast.error('Prescription issuing is not available yet')` |
| 5 | `src/components/doctor/PrescriptionForm.tsx` L78 | `// If someone flips ENABLE_PRESCRIPTION_PDF without wiring Phase 2...` | Remove comment |
| 6 | `src/components/doctor/PrescriptionForm.tsx` L81 | `toast.error(err.message \|\| 'Prescription issuing will be enabled in Phase 2')` | `toast.error(err.message \|\| 'Prescription issuing is not available yet')` |
| 7 | `src/components/doctor/PrescriptionForm.tsx` L93 | `// Phase 1: no backend writes.` | Remove comment |
| 8 | `src/components/doctor/PrescriptionForm.tsx` L97 | `toast.success('Recorded for Phase 2 (no changes saved in Phase 1)')` | `toast.success('Decision recorded')` |
| 9 | `src/components/doctor/PrescriptionForm.tsx` L100 | `toast.error(err.message \|\| 'This will be enabled in Phase 2')` | `toast.error(err.message \|\| 'Could not record decision')` |
| 10 | `src/services/doctorRemittanceService.ts` L1-6 | JSDoc mentioning "Phase 1" and "Phase 2" | `/** Per-week remittance metadata service. localStorage-backed... */` |

**Code-internal type names** (`MockBooking`, `MockAvailabilityBlock`, `mockAvailabilityService`) are import/variable identifiers only — not doctor-visible. No change needed.

### Files to modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/doctor/PaymentsCard.tsx` | Edit | 2 string replacements (title + description) |
| `src/components/doctor/PrescriptionForm.tsx` | Edit | Remove 3 comments, update 4 toast messages |
| `src/services/doctorRemittanceService.ts` | Edit | Neutralize JSDoc header |

### QA steps after implementation
1. Navigate to `/doctor/consultations` → open a consult → confirm patient phone card visible with copy button.
2. In consult workspace → "Issue Prescription" → confirm redirect to `/doctor/consultations`.
3. Navigate to `/doctor/availability` → confirm booking chips are clickable and open `/doctor/consultation/:id`.
4. Global search doctor pages for "phase", "mock", "stub", "dev" (case-insensitive in UI strings/toasts) → zero hits in user-visible text.

