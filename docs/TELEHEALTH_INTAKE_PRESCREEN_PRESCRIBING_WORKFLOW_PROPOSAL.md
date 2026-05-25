# PouchCare telehealth intake, nurse prescreening, ID verification and prescribing workflow proposal

**Status:** research / compliance proposal only — not legal advice, not clinical protocol, and not a production implementation spec.
**Scope:** Australian online telehealth workflow where a patient completes intake on the PouchCare website, verifies identity, receives nurse prescreening, then has a real-time doctor consultation. The doctor reviews all intake and nurse notes and may issue a prescription / written authority for personal importation if clinically appropriate.
**Important assumption:** prescription generation is for a private/non-PBS Australian prescription or written authority, not PBS claiming, unless PouchCare later deliberately implements PBS-specific workflows.

---

## 1. Executive summary

PouchCare should not run a “quiz-only prescription” model. The safer compliant model is:

1. **Patient account + privacy notice**
2. **Identity and contact verification**
3. **Structured patient intake quiz**
4. **Eligibility/risk triage**
5. **Nurse prescreening call**
6. **Doctor review of all collected information**
7. **Real-time doctor consultation by video or phone**
8. **Doctor decision: prescribe, decline, request more information, refer, or recommend in-person care**
9. **If prescribed, generate a private Australian prescription / written authority PDF**
10. **Store all clinical records, prescription metadata, consents and audit logs in controlled Supabase clinical storage**
11. **Keep Shopify/Stripe/email limited to non-clinical fulfilment and payment metadata**

The regulatory reason is straightforward: the Medical Board says prescribing without a real-time direct consultation, where the practitioner has never spoken with the patient and relies only on an online questionnaire, is not good practice and is not supported. The doctor must accept responsibility for evaluating information used in assessment and treatment, including information gathered by a nurse or third party.

PouchCare can still use the website heavily, but the website must support the clinical workflow rather than replace clinical judgement.

---

## 2. Official-source basis

This proposal is based on official Australian regulator/government sources only:

- Medical Board of Australia, **Telehealth consultations with patients**
  https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx
- Medical Board of Australia, **Good medical practice: a code of conduct for doctors in Australia**
  https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Code-of-conduct.aspx
- Ahpra, **Shared Code of conduct**
  https://www.ahpra.gov.au/Resources/Code-of-conduct/Shared-Code-of-conduct.aspx
- Ahpra, **Managing health records**
  https://www.ahpra.gov.au/Resources/Managing-health-records.aspx
- Ahpra, **Register of practitioners**
  https://www.ahpra.gov.au/Registration/Registers-of-Practitioners.aspx
- Nursing and Midwifery Board of Australia, **Professional standards**
  https://www.nursingmidwiferyboard.gov.au/Codes-Guidelines-Statements/Professional-standards.aspx
- Nursing and Midwifery Board of Australia, **Registered nurse standards for practice**
  https://www.nursingmidwiferyboard.gov.au/Codes-Guidelines-Statements/Professional-standards/registered-nurse-standards-for-practice.aspx
- OAIC, **Guide to health privacy**
  https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/health-service-providers/guide-to-health-privacy
- OAIC, **APP 3 — Collection of solicited personal information**
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information
- OAIC, **APP 5 — Notification of the collection of personal information**
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information
- OAIC, **APP 11 — Security of personal information**
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information
- OAIC, **Guide to securing personal information**
  https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/guide-to-securing-personal-information
- OAIC, **Report a data breach**
  https://www.oaic.gov.au/privacy/notifiable-data-breaches/report-a-data-breach
- Australian Digital Health Agency, **Cyber security for healthcare providers**
  https://www.digitalhealth.gov.au/healthcare-providers/cyber-security-for-healthcare-providers
- Australian Digital Health Agency, **Fundamentals of cyber security in healthcare**
  https://www.digitalhealth.gov.au/healthcare-providers/cyber-security/cyber-security-fundamentals
- Australian Government Department of Health, **Telehealth**
  https://www.health.gov.au/topics/health-technologies-and-digital-health/about/telehealth
- TGA, **Personal Importation Scheme**
  https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme
- Services Australia, **Prescribing PBS medicines**
  https://www.servicesaustralia.gov.au/prescribing-pbs-medicines?context=20

---

## 3. Key compliance principles translated into product rules

### 3.1 Do not prescribe from questionnaire alone

**Regulatory basis:** The Medical Board says prescribing or providing healthcare without a real-time direct consultation, whether in-person, video or telephone, is not good practice and is not supported. It specifically includes asynchronous requests based on a questionnaire where the practitioner has never spoken with the patient.

**Product rule:** The quiz can collect history and triage risk, but it must not itself approve a prescription. The prescription button should only become available after a doctor has reviewed the case and completed/documented a real-time consultation.

### 3.2 Telehealth must meet the same standard as in-person care as far as possible

**Regulatory basis:** The Medical Board expects telehealth care to be safe and, as far as possible, meet the same standards as in-person care. It also says video is preferable to telephone when practical, and telehealth may be inappropriate if physical examination or in-person review is needed.

**Product rule:** The doctor dashboard must include an explicit clinical suitability decision:

- suitable for telehealth
- suitable only if video completed
- more information required
- in-person care recommended
- urgent/emergency care recommended
- declined / not clinically appropriate

### 3.3 Doctor remains responsible for all information used

**Regulatory basis:** The Medical Board says the doctor must accept responsibility for evaluating information used in assessment and treatment, irrespective of source, including information gathered by a third party.

**Product rule:** Nurse prescreening can support triage, but the doctor must see the original intake, identity status, nurse notes, call outcome, red flags and supporting files. The doctor must actively attest that they reviewed this information before prescribing.

### 3.4 Collect only what is reasonably necessary

**Regulatory basis:** OAIC APP 3 requires collection to be reasonably necessary for the organisation’s functions. Sensitive information generally requires consent. OAIC also emphasises proportionality and data minimisation.

**Product rule:** Every question should map to a clinical, identity, safety, importation, communication, payment or fulfilment purpose. Avoid “nice to have” demographic questions unless clinically justified.

### 3.5 Tell the patient what is collected and why

**Regulatory basis:** OAIC APP 5 requires reasonable steps to notify individuals at or before collection about the entity, purposes, consequences of not collecting information, usual disclosures, access/correction/complaints, and likely overseas disclosures.

**Product rule:** Before intake begins, show a plain-English collection notice. For phone prescreening, the nurse should use a short script confirming identity and reminding the patient the call collects health information for clinical assessment and may be documented for the doctor.

### 3.6 Health records must be accurate, clear, timely and secure

**Regulatory basis:** Ahpra says good records support safety and continuity of care. Records should be accurate, up-to-date, factual, legible, objective, non-judgemental, identify date/time/provider, document consent, be made at the time or soon after, include relevant history, treatment/advice, and be securely held.

**Product rule:** Intake answers, nurse notes, doctor notes, prescribing decision, consent, telehealth mode, technical issues, follow-up and generated prescription must be stored as a clinical record with audit logging and immutable timestamps.

---

## 4. End-to-end website workflow

### Stage A — Patient account, eligibility notice and privacy notice

**Goal:** Make sure the patient understands this is healthcare, not ordinary ecommerce.

**Website screen:** `/consult/start`

**Required content:**

- PouchCare identity and contact details
- privacy collection notice
- what health information will be collected
- why it is collected: eligibility assessment, clinical review, nurse prescreening, doctor consultation, prescription/written authority, fulfilment, safety follow-up, legal/record-keeping
- who may access it: authorised nurses, doctors, admin staff with role-based need, technical providers, pharmacy/supplier only where necessary
- whether any information may be disclosed overseas, especially if a foreign supplier receives prescription/order information for personal importation
- consequences of not providing information: PouchCare may be unable to assess, consult, prescribe or fulfil
- patient access/correction/complaint route, e.g. privacy@pouchcare.com.au
- emergency warning: not for emergencies; call 000 or seek urgent care if severe symptoms

**Data captured:**

- patient account ID
- timestamp accepted privacy collection notice
- version of privacy notice
- consent to collect sensitive health information
- consent to telehealth process
- consent/acknowledgement that quiz alone does not guarantee prescription

**Storage:** Supabase `clinical_consents` table, not Shopify.

**Reason:** Supports OAIC APP 3 and APP 5; sets expectations before sensitive health collection.

---

### Stage B — Account security and contact verification

**Goal:** Reduce impersonation, misdirected prescriptions and misdirected clinical communications.

**Website screen:** `/consult/verify-contact`

**Recommended checks:**

- verify email by one-time link/code
- verify mobile by SMS one-time code
- force HTTPS
- require strong password or passwordless magic-link auth
- MFA for staff, doctors and nurses; optional or step-up MFA for patients before viewing prescription PDFs

**Patient questions/data:**

- legal first name
- legal middle name, optional
- legal surname
- preferred name
- date of birth
- mobile number
- email
- residential address
- shipping address, if different

**Storage:** Supabase Auth + `patient_profiles`; separate clinical profile from marketing/customer profile.

**Reason:** Medical Board says practitioners should confirm patient identity during telehealth. APP 11 requires protection against unauthorised access/disclosure. Misaddressed prescriptions are a clinical and privacy risk.

---

### Stage C — Identity verification

**Goal:** The doctor must be able to confirm, to the best of their ability, that the person being consulted is the patient receiving the prescription.

**Website screen:** `/consult/identity`

**Minimum model:**

1. Patient enters identity details.
2. Patient uploads or completes third-party ID verification.
3. Platform stores verification result, not more identity document data than necessary.
4. Nurse confirms verbal identifiers at start of call.
5. Doctor reconfirms patient identity at consultation.

**Recommended identity data to ask:**

- full legal name
- date of birth
- residential address
- mobile number
- email
- Medicare number, optional and only if needed for clinical/PBS/identity matching; do not collect if not necessary
- government photo ID verification via third-party provider, if used

**If using an ID verification provider:**

- prefer provider-hosted verification
- store only: provider, verification status, verification reference, checked name/DOB/address match outcome, timestamp, expiry/recheck date
- avoid storing raw licence/passport images unless absolutely required
- if raw ID images must be stored, place in private encrypted clinical storage with short retention and strict access controls

**Nurse/doctor identity confirmation questions:**

- “Can you confirm your full name?”
- “Can you confirm your date of birth?”
- “Can you confirm the address we have on file?”
- “Are you currently in Australia? If not, where are you located?”
- “Is anyone else present for this call?”
- “Are you comfortable discussing your health information where you are?”

**Storage:**

- `identity_verifications`: status, provider reference, confidence/match status, timestamps
- `identity_documents`: avoid where possible; if unavoidable, private storage bucket with short retention policy
- `consultation_participants`: who was present and identity confirmation outcome

**Reason:** Medical Board requires confirming identity “to the best of your ability” at each consultation. OAIC APP 3 requires minimisation; APP 11 requires security. Therefore store proof of verification, not excessive identity-document copies.

---

### Stage D — Patient intake quiz

**Goal:** Collect enough health information for safe triage and later doctor assessment, without pretending the quiz is the consult.

**Website screen:** `/consult/intake`

#### D1. Core demographic and care context questions

Ask:

- legal name, DOB, sex assigned at birth where clinically relevant
- gender identity, optional if relevant to care and respectful communication
- height and weight, if dose/safety relevant
- pregnancy/breastfeeding status where clinically relevant
- usual GP/clinic name, optional
- whether the patient consents to PouchCare informing their usual GP if clinically warranted
- Aboriginal and/or Torres Strait Islander status only if clinically justified and explained; avoid if not needed
- preferred language
- interpreter required? yes/no
- accessibility needs

**Reason:** Medical Board and Ahpra expect relevant history, communication, culturally safe care and continuity. Avoid collecting demographics that are not clinically needed.

#### D2. Presenting need and treatment goal

Ask:

- “What are you seeking help with today?”
- “What outcome are you hoping for?”
- “Have you used this type of product/medicine before?”
- “What have you tried previously?”
- “What worked, what did not, and any side effects?”
- “Are you currently under care for this issue?”

**Reason:** Good medical practice requires assessment, management plan and shared decision-making, not automatic fulfilment.

#### D3. Medical history

Ask:

- current medical conditions
- past significant medical conditions
- surgeries/hospitalisations relevant to treatment
- allergies and adverse drug reactions
- current medications, including prescription, OTC, supplements and recreational substances
- mental health history where relevant
- cardiovascular history where relevant
- liver/kidney disease where relevant
- pregnancy, breastfeeding or trying to conceive where relevant
- recent investigations or diagnoses relevant to treatment

**Reason:** Needed for clinical safety, contraindications, interactions and documented health record.

#### D4. Red-flag safety questions

The exact red flags depend on the product/condition. The platform should maintain doctor-approved condition/product-specific red-flag templates.

Generic examples:

- chest pain, severe shortness of breath, collapse, severe allergic reaction, severe bleeding, acute neurological symptoms, suicidal thoughts, overdose, severe infection symptoms
- recent hospitalisation or unstable condition
- unexplained severe symptoms
- age outside approved internal protocol range
- pregnancy/breastfeeding where product risk is uncertain
- current use of contraindicated medication
- history of serious allergy to proposed product/ingredient

**Workflow:** Any red flag should trigger:

- immediate stop/warning
- urgent-care advice if relevant
- case status: `requires_clinician_review_before_checkout`
- no payment capture or prescription generation until clinician resolves

**Reason:** Telehealth must be clinically appropriate. Doctor must arrange in-person/urgent care if telehealth alone is unsuitable.

#### D5. Personal importation acknowledgement questions

Ask:

- “Do you understand products imported under the Personal Importation Scheme may not be evaluated by the TGA for safety, quality and efficacy?”
- “Do you understand the product must be for your personal use or immediate family member only and cannot be supplied to others?”
- “Do you understand the import cannot exceed 3 months’ supply at maximum prescribed dose per order?”
- “Do you understand total importation cannot exceed 15 months’ supply in 12 months?”
- “Do you understand counterfeit, controlled, prohibited, mislabelled or quarantine-restricted products may be seized?”
- “Do you agree to provide truthful information and only order what is prescribed?”

**Reason:** TGA Personal Importation Scheme conditions affect whether a prescription/written authority can support lawful importation. Patient acknowledgement does not replace legal compliance, but it documents education and reduces misuse.

#### D6. Consent and declarations

Ask:

- consent to collect sensitive health information
- consent to nurse prescreening call
- consent to doctor telehealth consultation
- consent for doctor/nurse/admin access on a need-to-know basis
- consent to create/store clinical record
- consent to generate prescription/written authority if doctor determines clinically appropriate
- acknowledgement that PouchCare may decline treatment or refer to in-person care
- acknowledgement that information must be accurate and complete

**Storage:**

- `intake_responses` with versioned question IDs
- `intake_summary` generated for clinician convenience
- `risk_flags`
- `consent_events`

**Reason:** OAIC APP 3 sensitive information consent; Ahpra records; Medical Board informed consent and telehealth process transparency.

---

### Stage E — Automated triage and case creation

**Goal:** Convert intake into a structured clinical case while keeping automation advisory only.

**System output:**

- case ID
- patient ID
- intake completion status
- identity verification status
- risk category: low / medium / high / urgent
- red flags
- missing information
- recommended nurse call script sections
- recommended doctor review checklist

**Important rule:** Automation can sort and flag; it must not make the prescribing decision.

**Possible statuses:**

- `draft_intake`
- `awaiting_identity_verification`
- `awaiting_nurse_prescreen`
- `nurse_prescreen_completed`
- `doctor_review_required`
- `doctor_consult_booked`
- `doctor_consult_completed`
- `prescribed`
- `declined`
- `referred_in_person`
- `urgent_care_recommended`
- `cancelled`

**Reason:** Supports safe workflow and auditability while preserving clinician judgement.

---

### Stage F — Nurse prescreening call

**Goal:** Verify identity, clarify intake, identify red flags, prepare the case for the doctor, and ensure the patient understands the telehealth process.

**Important boundary:** The nurse should not diagnose, prescribe, promise a prescription, or override doctor review. The nurse can gather history, assess risk within scope, educate on process, escalate urgent concerns, and document accurately.

**Regulatory basis:** NMBA standards recognise accountability, scope of practice, delegation, person-centred practice and documentation. Ahpra requires accurate, factual, timely records. Medical Board requires the doctor to evaluate third-party information used in assessment.

#### F1. Nurse call opening script

- “Hi, I’m [name], a [registered/enrolled] nurse calling from PouchCare.”
- “This call is part of your prescreening before a doctor reviews your case.”
- “I can’t guarantee a prescription. The doctor will make the clinical decision.”
- “I’ll confirm your identity, clarify your health answers, check for safety concerns and document this for the doctor.”
- “Are you somewhere private and comfortable to talk?”
- “Is anyone else present?”
- “Do you need an interpreter or support person?”
- “If urgent symptoms come up, I may advise urgent care or escalation.”

#### F2. Nurse identity and privacy checks

Ask:

- full name
- date of birth
- residential address
- current location/state or territory
- callback number
- who is present on the call
- consent to continue the call and document notes

#### F3. Nurse intake clarification questions

Ask:

- “Can you briefly tell me what you’re seeking treatment for?”
- “Can you confirm your current medications?”
- “Any allergies or bad reactions to medicines?”
- “Any major medical conditions we should know about?”
- “Any recent changes since you completed the quiz?”
- “Have you answered the quiz yourself and truthfully?”
- “Is there anything important not captured in the form?”

#### F4. Nurse red-flag questions

Ask product/condition-specific red flags approved by the doctor/clinical lead. Generic examples:

- “Are you experiencing chest pain, severe shortness of breath, fainting or severe allergic symptoms now?”
- “Have you recently been hospitalised or told to seek urgent care?”
- “Are you pregnant, breastfeeding or trying to conceive?” where relevant
- “Have you ever had a severe reaction to this medicine/product or related products?”
- “Are you taking any medication that you think may interact?”
- “Do you have any concerns about your mental health or safety today?” where relevant

#### F5. Nurse personal importation understanding check

Ask:

- “Do you understand this may involve personal importation under TGA rules?”
- “Do you understand the product must only be for you or an immediate family member, not resale or sharing?”
- “Do you understand the 3-month supply per import limit and 15-month total in 12 months?”
- “Do you understand a doctor may issue a written authority only if clinically appropriate?”
- “Do you understand imported products can be seized if counterfeit, controlled, prohibited, mislabelled or not matching the written authority?”

#### F6. Nurse outcome options

The nurse should select one:

- suitable to proceed to doctor review
- suitable to proceed, but missing information to collect first
- medium risk — doctor priority review
- high risk — doctor review before payment/fulfilment
- urgent concern — advised urgent care / emergency pathway
- patient withdrew
- unable to verify identity
- unable to complete call

#### F7. Nurse documentation fields

Store:

- nurse name and registration type/number if collected
- call date/time
- call duration
- call mode: phone/video
- patient identity confirmed yes/no
- current patient location
- participants present
- interpreter/support person details if relevant
- answers clarified
- red flags identified
- nurse concerns
- patient questions
- patient understanding confirmed
- outcome status
- escalation action
- nurse signature/attestation

**Reason:** Ahpra says records should identify date/time/service/provider and include relevant history/advice. Medical Board says telehealth records should include technology used and technical issues.

---

### Stage G — Doctor review dashboard

**Goal:** Give the doctor a complete, auditable clinical view before consultation.

**Doctor should see:**

1. Patient identity status
2. Patient demographics and location
3. Intake answers, not just summary
4. Risk flags and red flags
5. Nurse prescreen notes and outcome
6. Product/order requested
7. Quantity requested and 3-month supply calculation
8. Medication/allergy/current condition history
9. Uploaded files/images if any
10. Consent history
11. Prior prescriptions/orders if any
12. Communication history
13. Personal importation acknowledgement
14. Draft prescription fields, if generated for review
15. Audit trail of who touched the case

**Doctor attestation before prescribing:**

- “I have reviewed the patient intake responses.”
- “I have reviewed the nurse prescreening notes.”
- “I confirmed the patient’s identity to the best of my ability.”
- “I completed a real-time consultation by phone/video.”
- “I assessed telehealth as clinically appropriate, or documented limitations.”
- “I considered relevant history, contraindications, interactions and alternatives.”
- “I discussed risks, benefits, alternatives and follow-up.”
- “The prescription/written authority is clinically appropriate and matches the authorised quantity.”

**Reason:** This directly addresses Medical Board telehealth expectations and the doctor’s responsibility for information used.

---

### Stage H — Doctor consultation

**Goal:** Real-time clinical consultation and prescribing decision.

**Preferred mode:** Video where practical; phone may be acceptable if clinically appropriate and documented.

**Doctor opening checklist:**

- introduce name, role, specialty if relevant, principal place of practice
- confirm patient identity
- confirm patient location
- confirm privacy of setting and participants present
- explain telehealth process and limitations
- confirm technology is working and backup plan if failure
- ask if interpreter/support person needed
- confirm consent to proceed

**Clinical discussion checklist:**

- reason for consult
- relevant history
- current medications/allergies
- review nurse notes and clarify discrepancies
- assess contraindications/interactions
- discuss options, including no treatment and in-person care if relevant
- discuss product-specific risks/benefits
- discuss personal importation risks and limits where relevant
- confirm quantity and usage instructions
- confirm follow-up plan and what to do if adverse effects occur
- confirm whether usual GP should be informed, if clinically warranted and patient consents

**Doctor decision options:**

- prescribe/written authority issued
- prescribe lower quantity/different directions
- do not prescribe — not clinically appropriate
- request more information
- request tests/investigations
- refer to GP/specialist/in-person care
- urgent care recommended

**Doctor record fields:**

- consultation mode
- date/time
- doctor identity/provider details
- patient identity confirmation
- other participants
- technical issues
- clinical history summary
- assessment
- management plan
- risks/benefits/alternatives discussed
- consent
- prescribing rationale or decline rationale
- follow-up plan
- prescription details if issued

**Reason:** Medical Board telehealth guidance says records should include technology used, technical issues, consent for recording/uploading to digital health infrastructure, and the usual clinical record details. Ahpra says records should document relevant clinical history, treatment, services and advice.

---

### Stage I — Prescription / written authority generation

**Goal:** Generate a document that supports personal importation and normal prescription expectations.

**Do not rely on eScript token alone:** TGA says eScripts cannot be accepted as valid written authority for importation because they often lack necessary details and TGA/ABF cannot verify them.

**Document type:** Private/non-PBS Australian prescription / written authority PDF.

**Required TGA written-authority fields:**

- prescriber name
- prescriber address
- prescriber telephone number
- Australian prescriber number
- prescriber signature
- date of written authority
- patient name and address
- item
- dosage form
- strength
- quantity
- usage instructions
- number of times the medicine can be supplied under the written authority

**Recommended additional fields:**

- patient DOB
- active ingredient
- AHPRA registration number
- script/reference number
- maximum daily dose
- personal importation statement
- QR verification code showing minimal validity metadata
- signature timestamp

**Quantity controls:**

- block or warn if quantity exceeds 3 months’ supply at maximum prescribed dose
- track 12-month rolling total against 15-month supply limit where PouchCare has visibility
- warn that external imports outside PouchCare may affect compliance but may not be visible to PouchCare

**Storage:**

- final PDF: private Supabase Storage bucket
- metadata: `prescriptions`
- line items: `prescription_items`
- signature event: `signature_events`
- verification QR token: separate minimal table, not full clinical record exposure

**Reason:** TGA Personal Importation Scheme requires valid Australian prescription/written authority at time of importation and quantity matching the import. Services Australia PBS prescription fields provide a useful baseline for prescription completeness, but PouchCare should treat personal importation documents as private/non-PBS unless implementing PBS.

---

### Stage J — Patient portal and fulfilment handoff

**Goal:** Let the patient access their clinical documents securely while preventing unnecessary clinical data leakage into ecommerce systems.

**Patient portal should show:**

- case status
- appointment/call status
- prescription issued/not issued
- secure prescription PDF download
- doctor instructions
- follow-up instructions
- adverse event / contact pathway
- privacy/access/correction route

**Fulfilment system should receive only minimum necessary data:**

- order ID
- patient shipping name/address
- product SKU/quantity
- prescription validity reference, not full clinical notes
- PDF only if genuinely necessary for supplier/package inclusion

**Do not send to Shopify/Stripe/email:**

- full intake answers
- medical history
- nurse notes
- doctor notes
- prescription clinical rationale
- full ID documents

**Reason:** OAIC minimisation and APP 11 security. Health information should stay in the clinical system, not be scattered across ecommerce/payment/email providers.

---

## 5. Recommended Supabase storage model

### 5.1 Data classification

| Data | Classification | Store where |
|---|---:|---|
| Auth credentials | sensitive auth | Supabase Auth |
| Patient name/DOB/address/contact | personal + health-context | Supabase DB, RLS |
| ID verification result | sensitive identity metadata | Supabase DB, RLS |
| Raw ID document | high-risk identity document | Avoid; if required, private bucket short retention |
| Intake answers | sensitive health information | Supabase DB, RLS |
| Nurse notes | sensitive health information | Supabase DB, RLS |
| Doctor notes | sensitive health information | Supabase DB, RLS |
| Prescription PDF | sensitive health information | private Supabase Storage |
| Prescription metadata | sensitive health information | Supabase DB, RLS |
| Shopify order | fulfilment/payment metadata | Shopify only minimum needed |
| Stripe payment | payment metadata | Stripe only minimum needed |
| Audit logs | security/clinical accountability | append-only Supabase DB |

### 5.2 Core tables

Recommended tables:

- `patients`
- `patient_profiles`
- `patient_contacts`
- `identity_verifications`
- `clinical_cases`
- `intake_questionnaires`
- `intake_questions`
- `intake_responses`
- `risk_flags`
- `consent_events`
- `nurse_prescreens`
- `doctor_consultations`
- `clinical_notes`
- `prescriptions`
- `prescription_items`
- `prescription_documents`
- `storage_files`
- `audit_events`
- `access_grants`
- `clinician_profiles`
- `staff_roles`
- `case_assignments`

### 5.3 Access model

Use strict role-based access control:

- patient: own portal records, prescription PDFs, messages
- nurse: assigned cases only; intake + prescreen fields; no prescription signing
- doctor: assigned cases; full clinical record required for decision
- admin: operational metadata only unless explicitly authorised for clinical support
- pharmacist/supplier: minimum prescription/order data only, time-limited
- developer/support: no production health data by default; break-glass access only with audit

**Technical controls:**

- Supabase RLS on every clinical table
- private storage buckets only
- short-lived signed URLs
- no public prescription URLs
- audit every read/download/write/signature
- staff MFA mandatory
- least-privilege service keys
- separate production/staging
- no real patient data in staging
- encrypted backups
- retention and deletion/de-identification policy
- breach response plan

**Reason:** OAIC APP 11 requires reasonable technical and organisational measures; Digital Health Agency says healthcare is a prime cyber target and recommends MFA, software updates, backups and cyber awareness.

---

## 6. Site workflow mapping

### Patient-facing pages

1. `/consult/start` — privacy notice, eligibility warning, emergency warning
2. `/consult/account` — create/login
3. `/consult/verify-contact` — email/SMS verification
4. `/consult/identity` — identity details and verification
5. `/consult/intake` — structured health questionnaire
6. `/consult/review` — patient reviews answers and consents
7. `/consult/book-nurse` or nurse callback queue — prescreen scheduling
8. `/consult/book-doctor` — only after nurse prescreen if required
9. `/consult/status` — current case status
10. `/consult/documents` — secure prescription/written authority if issued
11. `/consult/follow-up` — adverse events, follow-up, support

### Nurse dashboard

- queue of assigned prescreens
- identity status
- intake summary + original answers
- red flag checklist
- call script
- structured note form
- escalation button
- outcome selector

### Doctor dashboard

- assigned cases
- full intake and nurse notes
- identity/consent status
- telehealth suitability checklist
- consult note template
- prescription builder
- quantity checker
- written authority PDF preview
- sign/finalise button
- decline/refer/follow-up actions

### Admin dashboard

- operational status only
- booking/support workflows
- no clinical note access unless explicitly authorised
- audit view for compliance officer

---

## 7. Recommended “hard stops” before prescription generation

The platform should block prescription generation unless:

- patient account exists
- privacy/health collection consent captured
- contact verified
- identity verification completed or doctor explicitly documents alternative identity confirmation
- intake completed
- nurse prescreen completed, if required by PouchCare policy
- doctor has opened/reviewed intake and nurse note
- real-time consultation completed and documented
- doctor identity/prescriber number exists
- product/quantity/directions completed
- personal importation quantity check passed or doctor override documented
- prescription PDF preview confirmed
- doctor signature applied

---

## 8. Records, retention and audit

### What must be auditable

- account creation
- privacy notice accepted
- consent changes
- intake submitted
- ID verified
- nurse opened case
- nurse call completed
- doctor opened case
- doctor consultation completed
- prescription generated
- prescription downloaded/viewed/shared
- fulfilment data sent
- staff access to records
- corrections/updates to records
- deletion/de-identification actions

### Record quality rules

Clinical records should be:

- accurate
- factual
- objective
- respectful and non-judgemental
- timestamped
- linked to the provider who created them
- legible and understandable to another practitioner
- made at the time or soon after
- capable of supporting continuity of care

**Reason:** Ahpra managing health records guidance.

---

## 9. Policy documents/SOPs needed before launch

1. Privacy collection notice
2. APP privacy policy update
3. Health information handling policy
4. Telehealth suitability policy
5. Patient identity verification SOP
6. Nurse prescreening SOP
7. Doctor prescribing SOP
8. Personal importation written-authority SOP
9. Adverse event / urgent escalation SOP
10. Clinical record-keeping policy
11. Access control and staff onboarding/offboarding policy
12. Data retention and deletion/de-identification policy
13. Data breach response plan
14. Supplier/pharmacy data disclosure policy
15. Staff training records
16. My Health Record / healthcare identifier policy, if later integrated

---

## 10. Practical recommendation

Build the workflow as a **clinical case system embedded in the website**, not as an ecommerce quiz.

Recommended operating model:

1. Patient completes intake and identity verification.
2. The system creates a clinical case.
3. Nurse prescreens and documents.
4. Doctor reviews intake + nurse notes.
5. Doctor conducts real-time phone/video consult.
6. Doctor signs prescription/written authority only if appropriate.
7. Prescription PDF is stored privately and exposed through secure portal access.
8. Shopify/Stripe receive only minimum fulfilment/payment metadata.

This is the strongest direction because it aligns the website with official expectations: telehealth is allowed, but it must be real healthcare, with identity confirmation, informed consent, clinician judgement, secure records, and a real-time consultation before prescribing.
