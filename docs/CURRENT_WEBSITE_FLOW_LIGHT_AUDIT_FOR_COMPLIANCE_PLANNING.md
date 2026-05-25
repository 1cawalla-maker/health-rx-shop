# Current website flow — light audit for compliance planning

**Status:** planning/audit note only. No implementation.
**Purpose:** capture what the current build already does so compliance planning can preserve the existing choreography where possible.

## Current choreography observed in the repo

### 1. Quiz before signup

Current route/component:

- `/eligibility`
- `src/pages/EligibilityQuiz.tsx`
- `src/services/eligibilityService.ts`

Current behaviour:

- Patient is pushed to complete the questionnaire before patient signup.
- Patient signup checks for a completed quiz and sends the user back to `/eligibility` if missing.
- Quiz responses are saved pre-auth, then attached to the patient account after signup.
- Current quiz has nicotine use, previous NRT, nicotine intensity, reason, medical safety, and age confirmation.
- Current final-step consents include nicotine risk, no guarantee, doctor discussion, and sensitive health collection.

Current handoff:

- Pre-signup quiz result is saved in browser storage.
- On signup, `persistQuizToProfile(userId)` writes the quiz result into `patient_profiles.additional_notes` as `eligibility_quiz`.

Planning impact:

- The flow shape is already right: quiz first, signup second.
- Compliance planning should not replace this choreography.
- Mandatory compliance change: production quiz responses should not be stored in localStorage/sessionStorage as sensitive health data. Use a server-side temporary quiz session or short-lived non-sensitive browser token.
- Mandatory compliance change: start-of-quiz notice must be before health questions and must be versioned/auditable.

---

### 2. Signup/account creation after quiz

Current route/component:

- `/auth`
- `src/pages/Auth.tsx`

Current behaviour:

- Patient signup is blocked unless the quiz has been completed.
- Signup collects full name, email, password, Australian mobile number, date of birth, and timezone.
- DOB validation enforces 18+.
- After patient signup, app stores phone/DOB in `profiles`, persists a local profile, stores timezone, and imports quiz result into the patient profile.
- Signup then redirects patient toward booking.

Planning impact:

- The current signup position is right.
- Mandatory compliance change: add/confirm email verification before booking.
- Mandatory compliance change: add/confirm SMS verification before booking because phone is relied on for the doctor call and patient contact.
- Mandatory compliance change: add stronger identity/age checks if legal/clinical review confirms it is required for nicotine pouch/importation pathway. At minimum, DOB must be server-side recorded and checked against the quiz age answer.
- Likely required profile additions before booking/prescribing: legal first/last name, residential address, state/territory, and shipping address if different.

---

### 3. Booking after account creation

Current route/components:

- `/patient/book`
- `src/pages/patient/BookConsultation.tsx`
- `src/pages/patient/BookingPayment.tsx`
- `src/pages/patient/BookingConfirmation.tsx`

Current behaviour:

- Patient selects a doctor availability date and 5-minute phone slot.
- Frontend creates a requested Supabase consultation, then calls fair reservation RPC.
- Local mock booking mirrors the consultation ID for UI continuity.
- Payment is started through embedded Stripe checkout.
- Confirmation page only treats booking as confirmed if Supabase `consultation_payments.status` is `paid`.
- Patient is told the doctor will call at the scheduled time.

Planning impact:

- Booking/payment choreography can stay.
- Mandatory compliance gate should sit before booking/payment: quiz complete, account/profile complete, email verified, SMS verified, required consents accepted, and no hard-stop quiz outcome.
- Booking language should avoid implying medical eligibility. Current “If eligible” wording on confirmation should be changed later to “If clinically appropriate after the doctor consultation”.

---

### 4. Doctor portal review before prescribing decision

Current route/components:

- Doctor consultation workspace: `src/pages/doctor/ConsultationView.tsx`
- Quiz display card: `src/components/doctor/EligibilityQuizCard.tsx`

Current behaviour:

- Doctor loads consultation by ID from Supabase first, with local fallback.
- Doctor sees patient full name, DOB, phone number, patient ID.
- Doctor sees eligibility quiz card populated from `patient_profiles.additional_notes.eligibility_quiz`.
- Doctor can log call attempts and mark attempts answered/no-answer.
- Doctor can save consultation notes.
- Doctor can issue a prescription with max strength 3mg/6mg/9mg or complete without prescription.
- No-show requires 3 unanswered call attempts.

Planning impact:

- Core clinical handoff exists: quiz/account details are visible to doctor.
- Mandatory compliance change: doctor view should show consent/notice versions, verification status, profile completeness, age/DOB consistency, risk flags, and whether any answer needs manual review.
- Mandatory compliance language change: doctor-facing `Eligible` badge should not be treated as clinical approval. Rename later to something like `Quiz: continue`, `Quiz: needs review`, `Quiz: stop`.
- Mandatory clinical governance change: prescribing button should be conditioned by completed real-time consult/call answered and required notes/audit trail, not only by page access.

---

### 5. Prescription issuance unlocks shop

Current files/components:

- `src/pages/doctor/ConsultationView.tsx`
- `src/hooks/usePrescriptionStatus.ts`
- `src/pages/patient/Shop.tsx`
- `src/pages/patient/ShopCheckout.tsx`

Current behaviour:

- If doctor issues prescription in Supabase, `issuedPrescriptionsSupabaseService.issue(...)` creates an issued prescription record.
- `usePrescriptionStatus()` checks latest Supabase-issued prescription for the patient.
- Patient shop is locked unless an active prescription is found.
- Shop displays prescription allowance and max strength.
- Checkout blocks if no active prescription, cart exceeds 60-can allowance, or items exceed prescribed strength.
- Shopify handoff occurs only after PouchCare review page validates active prescription/allowance/strength, with server-side checks noted in code comments.

Planning impact:

- The “prescribed → shop unlocked” choreography is already aligned with the MVP concept.
- Mandatory compliance change: patient-facing shop unlock language should be “active prescription/authority on file”, not “approved”.
- Mandatory fulfilment/importation planning: Shopify should receive only order/shipping/product data necessary for fulfilment, not quiz health answers.
- Mandatory audit planning: prescription/written authority record should link doctor, patient, consultation, issued date/time, max strength/quantity, and relevant consult notes or generated document ID.

---

## Mandatory compliance gaps to plan around

These are the gaps that appear mandatory or high-priority based on the current plan and official sources:

1. **Pre-question collection notice and sensitive-health consent** before any health question.
2. **Remove production sensitive quiz answers from browser storage**; use server-side temporary storage or a non-sensitive session token.
3. **Email verification before booking.**
4. **SMS verification before booking** because the consult is phone-based and phone is clinically operational.
5. **Age/DOB assurance**: DOB server-side, 18+ check, compare with quiz age answer, and decide whether stronger digital ID verification is required for the pouch/importation pathway.
6. **Complete identity/profile before booking or prescribing**: legal name, DOB, phone, address/state/territory; shipping address later if relevant.
7. **Doctor portal compliance view**: quiz answers, flags, consent status, verification status, profile completeness, age/DOB mismatch, and importation/personal-use acknowledgements.
8. **Neutral triage language**: no patient-facing approval/eligibility/prescription guarantee before doctor decision.
9. **Real-time consult evidence** before prescribing: call answered/consult completed, notes saved, decision recorded.
10. **Data separation**: quiz/clinical data stays in health app/Supabase clinical records, not Shopify/Stripe/analytics/ad pixels/email marketing.

## What should not change unless required

- Quiz first.
- Signup second.
- Booking after signup.
- Doctor reviews quiz/account details in portal.
- Phone consultation happens before decision.
- Doctor prescription unlocks shop.
- Shop checkout validates prescription, strength and allowance before Shopify handoff.

## Source basis to keep attached to the plan

- OAIC APP 3: collect only reasonably necessary personal information; sensitive information generally requires consent.
- OAIC APP 5: notify individuals of collection matters at or before collection where reasonable.
- OAIC health privacy guidance: health information requires higher privacy handling.
- Medical Board telehealth guidance: confirm identity, protect privacy, keep records, obtain informed consent, and do not prescribe based only on a questionnaire without real-time consultation where the practitioner has never spoken with the patient.
- TGA Personal Importation Scheme: prescription/written authority and quantity/personal-use constraints must be satisfied before importation/supply assumptions are made.
