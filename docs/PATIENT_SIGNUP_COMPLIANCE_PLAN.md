# Patient signup compliance plan

**Status:** research / product planning only. Not legal advice. Must be reviewed by Australian health/privacy lawyer and responsible clinical lead before launch.

**Scope:** PouchCare account creation / patient signup before the Step 1 prescreen quiz and before nurse prescreening.

---

## 1. Compliance position

Patient signup should collect enough information to:

- identify the patient
- confirm the patient is 18+
- contact the patient for nurse/doctor consultation
- support clinical records
- support prescription/written-authority validity
- support fulfilment/shipping where clinically approved
- meet privacy, health-record and telehealth expectations

It should not collect more than is reasonably necessary.

The key rule is **data minimisation**: collect the minimum personal information needed for the account and clinical pathway, then collect health information separately in the clinical quiz/intake with specific consent.

---

## 2. Regulatory basis

### OAIC APP 3 — collection minimisation

APP 3 says an organisation may collect personal information only where reasonably necessary for its functions or activities. Sensitive information requires consent unless an exception applies. OAIC also says entities should adopt a data minimisation approach and limit collection to the minimum amount necessary.

### OAIC APP 5 — collection notice

APP 5 requires reasonable steps to notify the patient at or before collection about the entity, what is collected, why, consequences of not providing it, usual disclosures, access/correction and complaints, and likely overseas disclosures.

### OAIC health privacy guidance

Health service providers routinely handle sensitive health information and need to embed privacy into practice. For PouchCare, account data becomes linked to clinical data, so it should be treated as part of the health-service privacy environment.

### Medical Board telehealth guidance

Doctors must confirm the patient’s identity to the best of their ability during telehealth consultations. The clinic also needs secure systems for clinical records, prescriptions and related information.

### TGA vape patient/prescriber information

For therapeutic vaping goods, age and identity matter. TGA material says pharmacist supply requires identity/age evidence, and prescription pathways vary by age, product strength, clinical complexity and state/territory law. Even if PouchCare focuses on pouches rather than vapes, nicotine products are age-sensitive and clinical-suitability-sensitive, so age/identity verification is a reasonable control.

---

## 3. What data should signup collect?

### 3.1 Required at signup

Collect these during account creation:

1. **Legal first name**
   - Needed for identity, clinical record, prescriptions and doctor/nurse communication.

2. **Legal last name**
   - Same reason.

3. **Date of birth**
   - Needed for age check, patient identity and clinical record.

4. **Mobile phone number**
   - Needed for OTP/account security, nurse/doctor phone consult, urgent clinical contact and appointment handling.

5. **Email address**
   - Needed for account login/verification, notices, appointment/admin messages and secure portal notifications.

6. **Residential address**
   - Needed for patient identification, jurisdiction/state, clinical record and prescription/written-authority details.

7. **State/territory**
   - Needed because prescribing/supply rules may vary by state/territory.

8. **Shipping address, if different**
   - Needed only if fulfilment/shipping may occur after clinical approval.

9. **Password or passwordless login setup**
   - Needed for secure account access. Prefer passwordless/OTP or strong password + MFA options.

10. **Terms / Privacy / Collection Notice agreement**
   - User agrees to account terms and acknowledges privacy/collection notice.
   - Store version + timestamp.

11. **18+ confirmation**
   - Keep this also in quiz as a clinical gate if desired, but account signup should capture DOB and calculate age.

### 3.2 Required only if using identity/age verification

If PouchCare verifies age/identity through a provider, collect/process only what the provider requires:

- licence number or document number
- licence state / issuing state
- passport or Medicare card details if supported by provider
- selfie/liveness check if required
- verification result/status
- verification timestamp
- verification provider reference ID

**Recommendation:** do not store raw licence images or full ID document data unless absolutely necessary. Store the verification result and provider reference instead.

### 3.3 Optional / later, not signup-default

Do not require these at signup unless there is a clear operational need:

- Medicare number — only if Medicare/PBS/bulk-billing workflow is implemented.
- Emergency contact — only if clinically justified later.
- Usual GP — collect during clinical intake/nurse prescreen, not account signup.
- Full photo ID upload — only if automated verification fails or legal/clinical review requires it.
- Gender/sex assigned at birth — collect in clinical intake only if clinically relevant.
- Payment details — handled by Stripe at payment stage; do not store raw card details.
- Full medical history — belongs in prescreen quiz/intake, not signup.

---

## 4. Is licence verification required?

### Short answer

**Not necessarily as a universal legal requirement at signup, but age/identity verification is strongly recommended.**

Based on the sources reviewed:

- OAIC does not require licence collection; it actually pushes data minimisation.
- Medical Board guidance requires the doctor to confirm patient identity to the best of their ability during consultation.
- TGA vape rules make age and identity important for therapeutic vape supply, especially because under-18 rules and state/territory rules differ.
- Prescriptions/written authorities need accurate patient identity details.

So the practical position is:

- **Must know who the patient is.**
- **Must know they are 18+ for MVP.**
- **Should verify identity/age proportionately.**
- **Should avoid collecting/storing licence data if a lower-risk method works.**

### Recommended approach

Use a staged identity model. This mirrors normal online telehealth practice: collect patient identity details, verify the contact method, then have the nurse/doctor confirm identity during the real-time consult. Licence/passport/Medicare verification should be conditional unless legal/clinical review or a fulfilment/pharmacy partner requires it.

#### Level 1 — Account and contact verification

Required baseline:

- Email verification.
- SMS OTP phone verification.
- Legal name, DOB, residential address and state/territory capture.
- 18+ calculated from DOB.

Use this for basic account creation and to confirm the patient is reachable on the contact details they provide.

#### Level 2 — Verbal identity confirmation during nurse/doctor interaction

Before clinical assessment or prescribing proceeds, staff should confirm identity against the account record.

Suggested script:

> Can you confirm your full legal name, date of birth, residential address, and the state or territory you are currently located in?

Record that identity was verbally confirmed, who confirmed it, and when.

#### Level 3 — Conditional age/identity verification

Use a trusted ID verification provider only if legal/clinical review confirms this is necessary or prudent, or if risk flags arise.

Trigger ID verification if:

- age appears questionable
- patient details mismatch
- phone/email verification fails
- duplicate or suspicious account indicators appear
- the doctor requests stronger identity assurance
- pharmacy/fulfilment partner requires verified ID
- legal advice says nicotine pouches require stronger age verification

If triggered:

- Patient enters licence/passport/Medicare details into verification provider flow.
- PouchCare receives pass/fail, age verified, name/DOB match status, provider reference.
- PouchCare does not store raw ID images unless necessary.

#### Level 4 — Manual review

If verification fails or mismatch occurs:

- ask patient to correct details
- request manual ID upload only if needed
- restrict access to authorised staff only
- delete ID image once verification/retention requirements allow, unless legal advice says retain

---

## 5. Signup flow recommendation

### Screen 1 — Create account

Fields:

- email
- mobile number
- password or passwordless setup

Actions:

- verify email
- verify mobile with OTP

### Screen 2 — Personal details

Fields:

- legal first name
- legal last name
- date of birth
- residential address
- state/territory
- shipping address if different

System:

- calculate age
- if under 18: stop for MVP

### Screen 3 — Terms and privacy

Checkbox:

> I agree to PouchCare’s Terms & Conditions and acknowledge the Privacy Policy and Collection Notice.

Show links/modal:

- Terms & Conditions
- Privacy Policy
- Collection Notice

Store:

- accepted terms version
- privacy policy version
- collection notice version
- timestamp
- IP/device metadata if appropriate and disclosed

### Screen 4 — Baseline identity confirmation

Before the clinical pathway proceeds, require:

- email verification completed
- SMS OTP phone verification completed
- DOB confirms patient is 18+
- residential address captured for prescription/written-authority generation if clinically approved

Then send the patient to the Step 1 prescreen quiz.

### Screen 5 — Nurse/doctor verbal identity check

During nurse prescreen or doctor consult, confirm the patient’s identity against the account record:

- full legal name
- date of birth
- residential address
- current state/territory location

Store:

- identity verbally confirmed: yes/no
- confirmed by
- confirmed at
- mismatch notes, if any

### Screen 6 — Conditional ID/age verification

Do not make licence/passport/Medicare verification the default signup step unless counsel or partner requirements say otherwise.

Trigger only if needed:

- automated provider check using driver licence/passport/Medicare card
- manual review fallback

Store:

- verification status: not_started/pending/pass/fail/manual
- provider reference
- verified age over 18
- name/DOB match outcome
- timestamp

Avoid storing:

- full licence number long-term unless required
- raw licence/passport images unless required
- selfie/liveness images unless required

---

## 6. Data storage requirements

Signup data should be stored in the controlled clinical/user system, not scattered across marketing tools.

Minimum controls:

- Supabase/Auth or equivalent secure auth
- RLS / role-based access
- separate patient profile table from quiz/clinical records, but linked by patient ID
- audit log for staff views/edits of patient identity details
- private storage for any ID files if used
- encrypted transport
- least-privilege staff access
- no clinical/ID data in analytics
- no raw card data in PouchCare system

---

## 7. Recommended data model

### patient_accounts

- id
- auth_user_id
- email
- email_verified_at
- mobile
- mobile_verified_at
- created_at
- updated_at
- account_status

### patient_profiles

- id
- patient_account_id
- legal_first_name
- legal_last_name
- date_of_birth
- age_over_18_confirmed
- residential_address_line_1
- residential_address_line_2
- suburb
- state
- postcode
- country
- shipping_address fields if different
- created_at
- updated_at

### patient_consents

- id
- patient_account_id
- consent_type: terms/privacy/collection_notice/sensitive_health/financial/etc
- version
- accepted_at
- ip_address/device metadata if collected and disclosed

### consultation_identity_checks

- id
- patient_account_id
- consultation_id or prescreen_id
- checked_by_user_id
- checked_by_role: nurse/doctor/admin
- full_name_confirmed
- date_of_birth_confirmed
- residential_address_confirmed
- current_state_or_territory_confirmed
- result: confirmed/mismatch/unable_to_confirm
- notes
- checked_at

### identity_verifications

- id
- patient_account_id
- provider
- provider_reference
- status: not_started/pending/verified/failed/manual_review
- verified_age_over_18
- name_match_status
- dob_match_status
- document_type
- document_issuing_state if applicable
- created_at
- updated_at

Avoid storing full document numbers/images unless required.

---

## 8. Final recommendation

For MVP signup, collect:

- email
- mobile
- legal first name
- legal last name
- DOB
- residential address
- state/territory
- shipping address if different
- terms/privacy/collection notice agreement
- 18+ confirmation/calculated from DOB
- email verification
- SMS phone verification

Then require nurse/doctor verbal identity confirmation against the account record before clinical assessment/prescribing proceeds.

Use licence verification only as a conditional proportional age/identity check, preferably through a third-party provider where PouchCare stores only pass/fail/reference metadata.

Do not collect Medicare, emergency contact, usual GP, full ID images, payment card details or medical history at signup unless clearly required later.
