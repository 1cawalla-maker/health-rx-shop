# PouchCare patient flow — current MVP decision

**Decision date:** 2026-05-21
**Status:** current MVP direction
**Implementation status:** planning only — do not begin implementation until explicitly requested.

## Decision

Do **not** include a nurse prescreen / nurse consultation in the MVP workflow.

The MVP will follow the current website pattern:

1. patient starts the screening quiz
2. patient accepts legal/privacy notices at the start of the quiz
3. patient completes the screening quiz
4. if appropriate to continue, patient signs up / creates account
5. patient enters identity/contact details
6. patient completes email/SMS verification
7. patient books a doctor consultation
8. doctor reviews quiz + account details
9. doctor completes real-time phone/video consult
10. doctor makes the prescribing decision

The nurse-prescreen research documents remain useful background, but they are **not the current implementation plan**.


---

## Current website flow audit note

A light repo audit has now been added at `CURRENT_WEBSITE_FLOW_LIGHT_AUDIT_FOR_COMPLIANCE_PLANNING.md`. The audit confirms the current build already follows the broad MVP choreography:

- quiz first
- signup/account creation after quiz
- patient booking/payment after account creation
- doctor portal review of patient details and quiz result
- phone consultation before prescribing decision
- issued prescription unlocks the shop
- shop checkout validates prescription/strength/allowance before Shopify handoff

The compliance plan should preserve that choreography and only require changes where mandatory for privacy, health, identity/age assurance, telehealth prescribing standards, or importation/fulfilment compliance.

Mandatory planning gaps identified from the current build:

- production quiz answers should not be stored in browser storage as sensitive health information
- email and SMS verification need to be explicit booking gates
- age/DOB assurance needs to be server-side and may need stronger digital ID verification depending final regulatory/legal review
- address/state/profile completeness needs to be captured before booking or prescribing
- doctor portal needs consent/verification/flag visibility, not just quiz answers
- quiz/status language needs to avoid “eligible/approved” before doctor decision
---

## Current MVP patient flow

### 1. Patient starts with Step 1 screening quiz + legal/privacy notices

The screening quiz remains the first customer-facing step on the website.

Before the patient answers health questions, show the required legal/privacy notices and require agreement/acknowledgement for:

- Terms & Conditions
- Privacy Policy
- Collection Notice
- sensitive health information collection/use
- telehealth process
- prescription is not guaranteed
- doctor makes final clinical decision

Store at quiz start:

- accepted document versions
- timestamp
- quiz/session identifier
- later link to patient account ID after signup

Purpose:

- reduce friction before account creation
- make privacy/collection notice visible before sensitive health answers are collected
- quickly identify whether PouchCare may be an appropriate pathway
- collect initial clinical/contextual answers for doctor review
- avoid creating accounts for obvious hard-stop cases

The quiz should collect clinical/contextual information only, not full signup identity/contact details.

Quiz should include:

- 18+ gate or age acknowledgement
- smoking/vaping/nicotine context
- requested product/use context
- current medicines/allergies
- major medical/risk questions
- pregnancy/breastfeeding where relevant
- mental-health/self-harm safety where relevant
- oral-health questions where pouches/oral nicotine products are relevant
- personal importation/personal-use understanding where relevant
- acknowledgement that prescription is not guaranteed
- acknowledgement that doctor consult is required

Quiz must not say:

- approved
- eligible for prescription
- script ready
- guaranteed supply

---

### 2. Quiz result routes the patient

Automation may triage and organise cases, but must not prescribe or approve.

Possible quiz outcomes:

- `continue_to_signup`
- `hard_stop_not_suitable_for_service`
- `urgent_or_in_person_care_recommended`
- `manual_or_doctor_review_before_booking`

Patient-facing language should be cautious.

Use language like:

> Based on your answers, you may continue to create an account and book a doctor consultation. A prescription is not guaranteed. The doctor will make the final clinical decision.

Do not use language like:

> You are approved.

or:

> You are eligible for a prescription.

---

### 3. Patient signs up / creates account

After quiz continuation, collect account/contact details:

- email
- mobile number
- password or passwordless login setup

Verification:

- email verification required
- SMS phone verification required

Purpose:

- secure account access
- reliable patient contact
- reduce impersonation/misdirected clinical communications
- enable doctor booking and communication

---

### 4. Patient completes profile / identity details

Collect:

- legal first name
- legal last name
- date of birth
- residential address
- state/territory
- shipping address, if different

System checks:

- calculate 18+ from DOB
- hard-stop under-18 users for MVP
- confirm patient is in Australia / Australian state or territory context
- compare DOB/age against earlier quiz answer if collected

Reason for collecting address:

- patient identity
- clinical record
- prescription/written-authority generation if clinically approved
- state/territory context
- shipping/fulfilment if applicable

Do not collect at signup unless later required:

- Medicare number
- emergency contact
- usual GP
- full medical history
- raw payment card details
- raw licence/passport images

---

### 5. Confirm legal/privacy acknowledgements during signup

Because the patient already accepted the legal/privacy notices at the start of the quiz, signup should not create a second conflicting consent flow.

During signup:

- show a brief reminder that the quiz answers and account details are handled under the accepted Terms, Privacy Policy and Collection Notice
- link the quiz-start acknowledgement record to the new patient account
- if any notice version changed between quiz start and signup, require re-acknowledgement

Store:

- patient account ID linked to quiz/session identifier
- accepted document versions
- timestamp
- any re-acknowledgement event if required

---

### 6. Link quiz response to patient account

Once signup is completed, attach the earlier quiz response to the verified account.

Important controls:

- preserve original quiz answers
- prevent silent overwrites
- store quiz version/question IDs
- store timestamp
- store source/session identifier
- compare quiz DOB/18+ answer with signup DOB if applicable
- flag inconsistencies for doctor review

---

### 7. Patient books doctor consultation

Allow doctor booking only after:

- quiz completed with `continue_to_signup` or review-allowed status
- account created
- email verified
- SMS phone verified
- required profile details completed
- required consents accepted

If there are serious flags, either:

- block booking with appropriate advice, or
- allow booking only after doctor/admin review depending on clinical/legal protocol

No nurse step in MVP.

---

### 8. System creates automated status/flags

Suggested statuses:

- `quiz_started`
- `quiz_completed_continue_to_signup`
- `quiz_hard_stop_not_suitable`
- `quiz_urgent_or_in_person_care_recommended`
- `signup_required`
- `email_verification_required`
- `sms_verification_required`
- `profile_incomplete`
- `consents_required`
- `doctor_consult_booking_available`
- `doctor_consult_booked`
- `doctor_review_required`
- `doctor_consult_completed`
- `more_information_requested_by_doctor`
- `prescribed`
- `declined_not_clinically_appropriate`
- `in_person_or_gp_review_recommended`
- `urgent_or_emergency_care_recommended`
- `cancelled_or_withdrawn`

Suggested automated flags:

- missing required answer
- inconsistent answer
- under 18 / age mismatch
- quiz age answer conflicts with signup DOB
- not located in Australia
- identity/contact verification incomplete
- pregnancy/breastfeeding/trying to conceive
- serious cardiovascular history
- severe current symptoms
- mental health/self-harm concern
- medication interaction risk
- allergy/adverse reaction risk
- oral-health issue relevant to pouches
- product/request quantity concern
- importation/personal-use concern

Important: flags are for doctor review, not patient-facing approval.

---

### 9. Doctor reviews the case

Doctor dashboard should show:

- original quiz answers
- quiz version/question IDs
- automated flags
- signup/profile details
- email/SMS verification status
- identity details
- residential address/state
- requested product/order context
- consents/acknowledgements
- prior prescriptions/orders, if any
- generated draft prescription fields, if applicable, marked draft only

Doctor can decide:

- proceed with consult
- request more information before consult
- recommend GP/in-person care
- decline because service is unsuitable
- complete real-time phone/video consult

---

### 10. Doctor completes real-time consult

Consult may be phone-first, with video preferred/escalated when clinically needed.

Doctor must:

- introduce themselves and role
- confirm patient identity
- confirm DOB
- confirm residential address/current location/state
- confirm privacy/participants present
- confirm telehealth is appropriate
- review relevant quiz answers
- ask follow-up questions
- assess clinical suitability
- discuss risks, benefits, alternatives and no-treatment option where relevant
- confirm importation/personal-use/quantity understanding where relevant
- decide whether to prescribe, decline, request more info, or recommend other care

No questionnaire-only prescribing.

---

### 11. Doctor decision and prescription/written authority

Only after doctor review and real-time consult:

Possible outcomes:

- prescribed / written authority issued
- prescribed with changed product/quantity/directions
- declined — not clinically appropriate
- more information required
- GP/in-person review recommended
- urgent/emergency care recommended

If clinically appropriate, generate prescription/written authority using verified profile details.

---

## Explicitly removed from MVP

Do not build:

- nurse booking
- nurse dashboard
- nurse call script
- nurse clarification workflow
- nurse outcome statuses
- nurse approval/escalation logic

unless Callum explicitly revives the nurse workflow later.

---

## Immediate next planning tasks, not implementation yet

1. Audit the current website screening quiz as the first step.
2. Adjust the quiz so it can safely route to signup without implying approval.
3. Audit and adjust signup fields.
4. Add/define email verification and SMS mobile verification.
5. Define quiz-to-account linking logic.
6. Define doctor booking gate conditions.
7. Define doctor dashboard fields and risk flags.
8. Define patient-facing status language without implying approval.
9. Confirm with clinician/legal advisor before build.
