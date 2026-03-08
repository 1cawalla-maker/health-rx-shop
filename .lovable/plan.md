

## Doctor Consultation Workspace UX Adjustments

**Target file:** `src/pages/doctor/ConsultationView.tsx` (the active workspace at `/doctor/consultation/:id`)

### A) Patient Details Block (top of page)

- After the header, add a prominent "Patient Details" card with:
  - Full name, DOB, Phone number (largest text, with a copy-to-clipboard button using `navigator.clipboard`)
- **Data source:** `userProfileService.getProfile(booking.patientId)` which returns `{ fullName, dateOfBirth, phoneE164 }`.
- Phone displayed as `+61 4XX XXX XXX` format. Fallbacks: "Not provided" for missing fields; always show patient ID as last resort.
- Import `Copy` icon from lucide-react; toast "Phone number copied" on click.

### B) Status Controls Simplification

- Remove "Start Consult" and "Mark Completed" buttons from the Status Controls card.
- Keep only:
  - **Cancel** (opens existing cancel dialog)
  - **Mark No-Show** (existing 3-attempt gate logic stays)
- The card title can be simplified or the card merged into the header area.

### C) Prescription Decision: Always Expanded + Consult Notes

- Remove `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` wrapper and `rxOpen` state. Render the Prescription Decision card content directly (always visible).
- Add a **"Consultation Notes"** `<Textarea>` at the top of the Prescription Decision card content.
  - Persist via a new thin method on `doctorPortalService` (e.g., `setConsultNotes(bookingId, notes)` / `getConsultNotes(bookingId)`) which stores to the booking's mock data. This keeps the service boundary intact.
  - Load notes on mount; save on blur or via a small "Save notes" button.
- Remove any separate "Consult Notes" card if one exists on this page (there isn't one currently — the call attempt notes field is different and stays).

### D) Remove PaymentsCard

- Delete the `<PaymentsCard>` render from the right column (line 311).
- Keep the `PaymentsCard` component and service files unchanged.

### E) Remove "Phase 1" Copy

- Scan the file for any remaining "Phase 1", "Phase 2", "mock", "stub" text. Current file appears clean, but will verify sub-components (`EligibilityQuizCard`, `MedicationGuideCard`, `PatientEligibilitySummary`) and remove/neutralize any found.

### F) Post-Issue Navigation

- In `doIssue()`, after success toast, add `navigate('/doctor/consultations')`.
- In `doDecline()`, after success toast, add `navigate('/doctor/consultations')`.
- Error/failure cases stay on page (already handled with toast.error).

### Secondary: BookingDetail.tsx Cleanup

`BookingDetail.tsx` at `/doctor/booking/:id` is a legacy duplicate. Apply the same changes for consistency:
- Remove PaymentsCard, remove "Start Consult" / "Mark Completed", add post-issue navigate. Keep it light since this route may be deprecated.

### Files to modify:
| File | Changes |
|------|---------|
| `src/pages/doctor/ConsultationView.tsx` | All of A–F above |
| `src/services/doctorPortalService.ts` | Add `getConsultNotes` / `setConsultNotes` methods |
| `src/pages/doctor/BookingDetail.tsx` | Mirror removals (PaymentsCard, status buttons, post-issue nav) |

### Answers to your questions:
1. **Single notes field** inside Prescription Decision (no separate card exists currently, so this is clean).
2. **Phone displayed as `+61 ...`** with a one-click copy button — yes, recommended approach.

