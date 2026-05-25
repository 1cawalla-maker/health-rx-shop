# PouchCare minimum compliant telehealth operations proposal

**Status:** regulatory summary / operating proposal only. Not legal advice, not clinical advice, and not a final clinical protocol. Must be reviewed by an Australian health/privacy lawyer and the responsible medical practitioners before launch.
**Scope:** Australian phone-first telehealth clinic supporting assessment for private/non-PBS paper prescriptions or written authorities. This assumes PouchCare is not claiming PBS, not using eScript tokens as the primary output, and is not attempting questionnaire-only prescribing.
**Core question:** What is the bare minimum PouchCare needs to operate the telehealth side compliantly?

---

## 1. Short answer

PouchCare can operate a compliant phone-first telehealth model, but only if it operates as a real clinical service, not as a quiz-to-checkout funnel.

The minimum viable compliant model is:

1. Patient creates an account or starts intake.
2. PouchCare gives a clear privacy / collection notice before collecting health information.
3. Patient provides identity, contact, eligibility and clinically relevant intake information.
4. Patient gives consent to collect and use sensitive health information for telehealth assessment, prescribing support, records, fulfilment and compliance.
5. PouchCare verifies the patient is an adult and records enough identity/contact detail for clinical care and prescription validity.
6. Nurse/admin prescreening may clarify information and triage risk, but must not diagnose, prescribe, or promise a prescription.
7. A registered Australian doctor reviews the intake, prescreen notes, identity status, risk flags and requested medicine/product before consultation.
8. The doctor has a real-time direct consultation with the patient — telephone can be acceptable; video is preferable when practical and should be escalated to when clinically needed.
9. The doctor decides whether telehealth is clinically appropriate, whether prescribing is appropriate, whether more information is needed, or whether the patient needs in-person/urgent care.
10. If prescribing, the doctor issues a valid private/non-PBS paper prescription or written authority with required prescription details.
11. PouchCare stores a clinical record: intake, consent, identity status, consult details, doctor decision, advice, prescription/written authority, follow-up and audit trail.
12. PouchCare protects health information with role-based access, secure storage, audit logs, data minimisation, breach response and access/correction processes.
13. Shopify, Stripe, analytics and ordinary email must receive only minimum operational metadata, not unnecessary clinical detail.

The two non-negotiables are:

- **No prescription based only on a web questionnaire.**
- **Clinical records are required.** The clinic/doctors must keep adequate records of the telehealth consultation and prescribing decision.

---

## 2. Official-source basis

This proposal is based on official Australian regulator/government sources, including:

- Medical Board of Australia — *Telehealth consultations with patients*
  https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx
- Medical Board of Australia — *Good medical practice: a code of conduct for doctors in Australia*
  https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Code-of-conduct.aspx
- Ahpra — *Managing health records*
  https://www.ahpra.gov.au/Resources/Managing-health-records.aspx
- OAIC — *APP 3 Collection of solicited personal information*
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information
- OAIC — *APP 5 Notification of the collection of personal information*
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information
- OAIC — *APP 11 Security of personal information*
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information
- TGA — *Personal Importation Scheme*
  https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme
- Services Australia — *Prescribing PBS medicines*
  https://www.servicesaustralia.gov.au/prescribing-pbs-medicines?context=20

---

## 3. Minimum operating model

### 3.1 What PouchCare is operating

For compliance purposes, PouchCare should assume it is operating or facilitating a **health service** that handles **sensitive health information**.

Even if the commercial layer looks like ecommerce, the telehealth layer is a clinical pathway because it involves:

- collecting health history and risk information
- arranging nurse/doctor assessment
- supporting prescribing decisions
- generating prescriptions or written authorities
- storing consultation and prescription records
- coordinating medicine/product fulfilment

The clinic should therefore treat its systems as clinical systems, not ordinary ecommerce systems.

### 3.2 Minimum clinical pathway

The minimum pathway should be:

1. **Landing page / eligibility explainer**
   - Explain the service is telehealth assessment, not guaranteed prescribing.
   - State that a doctor decides whether treatment is appropriate.
   - State that phone consult is the default but video/in-person care may be required.

2. **Collection notice and consent**
   - Before intake, show what information is collected, why, who receives it, and consequences if not provided.
   - Obtain explicit consent for collection/use of sensitive health information.

3. **Patient identity and contact capture**
   - Collect legal name, date of birth, phone, email and residential/shipping address.
   - Confirm the patient is in Australia at the time of consultation/importation pathway, if relevant.
   - Confirm age 18+.

4. **Clinical intake**
   - Collect only clinically relevant history and safety information.
   - Ask about current medicines, allergies, relevant conditions, prior use, adverse reactions, pregnancy/breastfeeding where relevant, substance/tobacco/nicotine history where relevant, and red flags.

5. **Prescreen / triage**
   - Nurse/admin confirms missing details, clarifies risk flags and prepares the file.
   - Nurse/admin must not diagnose, prescribe, or guarantee approval.

6. **Doctor review before consult**
   - Doctor sees the intake, prescreen notes, identity status, risk flags, requested product/quantity, prior history, allergies/medicines and uploaded documents.

7. **Real-time doctor consultation**
   - Phone can be the default.
   - Doctor confirms identity, location, privacy, consent and suitability for telehealth.
   - Doctor conducts clinical assessment.
   - Doctor escalates to video/in-person/GP/urgent care where clinically required.

8. **Doctor decision**
   - Prescribe, decline, request more information, refer, or require in-person assessment.
   - Decision must be documented.

9. **Paper prescription / written authority**
   - If prescribing privately/non-PBS, generate a human-readable prescription/written authority PDF or paper script.
   - Store the final prescription in the clinical record.

10. **Follow-up and handover**
   - Provide patient instructions, warning signs, follow-up arrangements and how to contact the clinic.
   - With patient consent and when clinically warranted, inform usual GP or other practitioner.

---

## 4. Phone vs video: what is mandatory?

### 4.1 Phone consults can be compliant

The Medical Board recognises telehealth can include video, internet or telephone consultations. It says video is preferable when practical, but it does **not** make video mandatory for every consultation.

The mandatory requirement is a **real-time direct consultation** where the doctor actually speaks with the patient, unless a narrow exception applies such as an existing treating doctor with access to the clinical record.

For PouchCare, the safer minimum rule is:

- **Default:** phone consultation.
- **Escalate to video:** if visual confirmation/examination is clinically useful or identity/privacy concerns exist.
- **Escalate to in-person/GP/urgent care:** if telehealth is not clinically adequate.

### 4.2 What is not acceptable

Do not allow prescribing where:

- the patient only completes an online quiz
- the doctor never speaks with the patient
- communication is only text/email/live chat/asynchronous messages
- the doctor cannot explain why prescribing was appropriate and necessary
- the doctor has not reviewed the relevant intake and prescreen material

The Medical Board explicitly says prescribing or providing healthcare without a real-time direct consultation, including asynchronous requests based on a questionnaire where the practitioner has never spoken with the patient, is not good practice and is not supported.

### 4.3 Minimum doctor documentation for phone consult

The doctor should document:

- consultation mode: telephone
- date/time
- patient identity confirmed to best ability
- patient location / jurisdiction, if relevant
- whether anyone else was present
- informed consent to telehealth
- relevant history and assessment
- why phone was adequate, or why video/in-person was not required
- advice given
- prescribing decision and rationale
- follow-up / safety-netting
- any technical issues

---

## 5. Client onboarding: mandatory minimum

### 5.1 Patient-facing onboarding requirements

At minimum, onboarding must collect and present:

#### Identity/contact

- full legal name
- date of birth
- phone number
- email address
- residential address
- shipping address, if different
- emergency contact only if clinically justified; do not collect by default unless needed

#### Eligibility

- age 18+ confirmation
- located in Australia / Australian patient pathway confirmation where relevant
- ability to participate in phone consult
- understands prescription is not guaranteed
- agrees to provide accurate information

#### Privacy and consent

- privacy collection notice
- consent to collect sensitive health information
- consent to share relevant information with consulting doctor, authorised clinical/admin staff and fulfilment/pharmacy/importation partners as needed
- financial consent before charging consult fee
- consent for usual GP communication if clinically warranted; this can be optional and captured later

#### Clinical intake

The intake should collect only what the doctor reasonably needs for safe assessment, such as:

- reason for request
- requested medicine/product/category and intended use
- prior use and response
- tobacco/nicotine status where relevant
- relevant medical history
- current medications/supplements
- allergies/adverse reactions
- pregnancy/breastfeeding status where relevant
- mental health/substance-use risk questions where clinically relevant
- cardiovascular/respiratory or other condition-specific red flags where relevant
- previous relevant prescriptions or treating practitioner details, if available
- usual GP details, optional unless clinically necessary

### 5.2 Collection notice minimum content

Under APP 5, PouchCare must take reasonable steps to notify the patient at or before collection. The notice should cover:

- PouchCare entity identity and contact details
- what information is collected
- that some information is sensitive health information
- how information is collected: website, phone, uploads, consults, orders/support
- why it is collected: eligibility, clinical assessment, prescribing, records, fulfilment, safety, compliance, support, payment
- consequences if required information is not provided: clinic may be unable to assess or prescribe
- who information may be disclosed to: doctors, nurses, admin, fulfilment/pharmacy/import partners, payment/order providers with minimum necessary data, cloud/software providers, regulators/legal advisers where required
- overseas disclosures if any vendors store/access data overseas
- how patient can access/correct their information
- how patient can complain
- link to full privacy policy

For phone prescreening, staff should use a short script reminding the patient that health information is being collected and documented for clinical assessment.

### 5.3 Consent minimum

Because health information is sensitive information, obtain explicit consent before collecting clinical intake information.

Suggested checkbox wording:

> I consent to PouchCare collecting and using my personal and sensitive health information to assess eligibility, arrange telehealth care, support clinical assessment by a registered doctor, issue and manage prescriptions/written authorities if clinically appropriate, coordinate fulfilment, maintain health records, and comply with legal and regulatory obligations.

Also include:

> I understand completing this intake does not guarantee a prescription or supply. A doctor must decide whether treatment is clinically appropriate.

---

## 6. Detail handling / privacy: mandatory minimum

### 6.1 Treat all clinical data as sensitive health information

The following should be treated as health information:

- quiz answers
- intake answers
- uploaded documents
- identity verification linked to clinical care
- nurse notes
- doctor notes
- call outcomes
- diagnosis/assessment
- prescribing decision
- prescription/written authority PDFs
- product request when it reveals treatment/health context
- adverse event/follow-up messages
- clinical support messages

### 6.2 Data minimisation

Collect only what is reasonably necessary for:

- identity and contact
- age eligibility
- clinical assessment
- safe prescribing
- prescription validity
- fulfilment/importation
- payment/admin
- record keeping
- legal/regulatory compliance
- complaints, access/correction and audit

Avoid collecting:

- irrelevant lifestyle data
- unnecessary ID images if lower-risk verification is sufficient
- excessive family history unless clinically relevant
- raw payment card data
- clinical detail in Shopify/Stripe/email if not needed

### 6.3 System separation

Minimum safe architecture:

- **Clinical system of record:** Supabase or equivalent controlled clinical database/storage.
- **Commerce:** Shopify only receives order/fulfilment metadata required to process the order.
- **Payment:** Stripe handles payment; PouchCare stores payment status/session IDs only.
- **Email/SMS:** avoid clinical detail; use generic notifications and secure portal links.
- **Analytics:** no health answers, prescription events, or sensitive traits in analytics tools.

### 6.4 Access controls

Minimum access roles:

- patient: own records/appointments/orders as appropriate
- nurse/prescreen staff: assigned cases only; no prescribing controls
- doctor: assigned cases and prescribing controls
- clinical admin: operational access only where needed
- compliance/admin: audit and record management access
- developer/support: no production health data by default; break-glass access only with logging

Required controls:

- role-based access control
- row-level security / tenant isolation
- private file storage for prescriptions/uploads
- audit log for record views, edits, exports, prescription generation and status changes
- MFA for staff/doctor accounts where possible
- least-privilege access
- offboarding process for staff/clinicians

### 6.5 Security and breach readiness

APP 11 requires reasonable steps to protect personal information from misuse, interference, loss, unauthorised access, modification or disclosure.

Minimum controls:

- secure authentication
- encrypted transport
- private storage buckets
- backups
- audit logging
- secure staff devices/processes
- staff privacy/security training
- vendor review for cloud tools
- incident response plan
- notifiable data breach assessment process
- retention/destruction process

---

## 7. Are medical records needed?

Yes.

For PouchCare’s model, adequate health/medical records are required because registered health practitioners must keep health records that support safe care, continuity, accountability and privacy obligations.

Ahpra states that all registered health practitioners must comply with health record keeping requirements. Good records should be accurate, up-to-date, factual, objective, respectful, dated/timed, identify who provided the service, document informed consent, include relevant clinical history/treatment/advice, and be made at the time or soon after.

The Medical Board telehealth guidance also says doctors should use systems that allow secure access to patients’ clinical records and secure transmission/storage of clinical notes, prescriptions, referrals, requests and images. It also requires telehealth-specific records such as technology used, technical issues and recording/upload consent where relevant.

### 7.1 What records PouchCare must create/keep

Minimum clinical record per patient/case:

#### Patient profile

- full name
- DOB
- contact details
- address
- identity/age verification status
- Medicare number only if PBS/Medicare billing is used; otherwise avoid unless necessary

#### Consent and notices

- privacy notice version shown
- timestamp of sensitive health collection consent
- telehealth consent
- financial consent
- consent/refusal for GP communication where relevant

#### Intake record

- patient-submitted answers
- submitted date/time
- uploads/documents
- risk flags and eligibility result
- product/medicine requested or treatment goal

#### Prescreen record

- staff member/nurse name
- date/time
- contact attempts
- clarifications obtained
- triage notes
- escalation flags
- statement that no prescription was promised

#### Doctor consultation record

- doctor name and AHPRA registration/provider details as relevant
- date/time
- mode: phone/video
- patient identity confirmed
- patient consent/understanding confirmed
- relevant history taken
- relevant clinical findings/assessment
- telehealth suitability
- whether video/in-person was needed
- advice given
- diagnosis/clinical impression if made
- management plan
- prescribing decision and rationale
- follow-up/safety-netting
- GP/referral/handover decisions
- technical issues

#### Prescription/written authority record

- medicine/product details
- dose/instructions
- quantity and repeats, if any
- date issued
- prescriber details
- prescription PDF/file hash/version
- whether private/non-PBS
- destination/fulfilment partner shared with
- cancellation/reissue history

#### Audit trail

- who viewed/edited/exported records
- who generated/reissued prescription
- timestamped state changes
- access to prescription/upload files

### 7.2 How do we get medical records from patients?

PouchCare does **not** need to obtain the patient’s complete historical GP medical record for every case by default. That would often be excessive.

The minimum approach is:

1. **Patient self-reported history** through intake.
2. **Doctor history-taking** during phone consult.
3. **Uploaded supporting documents** only where clinically needed.
4. **Usual GP details** requested optionally, or required only when clinically necessary.
5. **Patient consent to contact GP / share care summary** when clinically warranted.
6. **My Health Record / available electronic records** checked where clinically appropriate and accessible by the practitioner, subject to applicable access rules and patient context.

If the doctor cannot safely assess from patient history + consult + available documents, the compliant action is not to prescribe. The doctor should request further records, refer to GP/specialist, or require in-person care.

### 7.3 Minimum patient-upload options

Provide upload fields for:

- existing prescriptions
- medication list
- GP/specialist letter
- relevant test results
- proof of identity if required

Warn patients not to upload irrelevant documents.

---

## 8. What doctors need to operate consultations

### 8.1 Doctor credentials / setup

Before doctors can consult, PouchCare should hold:

- doctor full name
- AHPRA registration number/status
- principal place of practice
- contact details for prescriptions/pharmacist queries
- prescriber number if relevant
- professional indemnity confirmation appropriate for telehealth
- scope/conditions review, if any
- signed service agreement / clinical governance obligations
- signature asset only if using it for scripts, stored securely

Doctors consulting Australian patients should be registered with the Medical Board of Australia and comply with registration standards, CPD, recency and professional indemnity requirements.

### 8.2 Case information doctors must see before prescribing

The doctor dashboard should show:

- patient name/DOB/contact/address
- patient location/jurisdiction if relevant
- identity and age verification status
- full intake answers
- relevant medical history
- current medicines/supplements
- allergies/adverse reactions
- red flags
- nurse/admin prescreen notes
- uploaded documents
- requested medicine/product and quantity
- proposed prescription/written authority draft
- previous PouchCare cases/prescriptions
- consent status
- privacy/collection notice version
- fulfilment/importation context

### 8.3 Doctor attestations before prescription generation

Before generating a prescription, require doctor confirmation:

- I reviewed the intake and relevant supporting information.
- I completed a real-time direct consultation by phone/video.
- I confirmed patient identity to the best of my ability.
- I assessed telehealth as clinically appropriate, or documented limitations.
- I considered relevant risks, contraindications, interactions and patient history.
- I determined prescribing is clinically appropriate.
- I gave the patient relevant advice, safety-netting and follow-up instructions.
- This prescription is private/non-PBS unless otherwise explicitly marked.

---

## 9. Nurse/admin prescreening: allowed vs not allowed

### 9.1 Allowed

Nurse or trained clinical support staff may:

- confirm patient identity/contact details
- confirm consent and privacy awareness
- clarify incomplete intake answers
- collect extra history for the doctor
- document risk flags
- explain process and billing
- triage urgency according to approved protocol
- escalate to doctor
- tell patient a doctor will decide whether treatment is appropriate

### 9.2 Not allowed unless separately authorised and clinically governed

Nurse/admin staff must not:

- diagnose
- independently determine treatment suitability
- promise a prescription
- modify doctor prescriptions
- sign prescriptions
- tell the patient the doctor will approve
- pressure doctor decision-making
- hide or summarise away risk flags from the doctor

### 9.3 Required script principle

Use wording like:

> I’m collecting and clarifying information for the doctor. I can’t diagnose or guarantee a prescription. The doctor will review your information and decide whether telehealth treatment or prescribing is clinically appropriate.

---

## 10. Paper scripts / written authorities only

### 10.1 Private/non-PBS assumption

Because PouchCare is only providing paper scripts/written authorities, the simplest compliant assumption is private/non-PBS prescribing unless PouchCare deliberately implements PBS workflows.

Do not imply PBS subsidy or Medicare rebate unless actually supported.

### 10.2 Minimum prescription details

For a paper/private prescription, the clinic should ensure the prescription/written authority contains at least:

- prescriber name
- practice address
- telephone/contact number
- prescriber number where applicable
- patient name
- patient address
- medicine/product name, strength, active ingredient and form where applicable
- dose and instructions
- quantity
- repeats, if any
- date written
- prescriber signature
- clear private/non-PBS status where relevant
- brand substitution instruction if applicable

Services Australia lists PBS prescription requirements; although PouchCare is assuming private/non-PBS scripts, those fields are still a useful minimum safety template for a complete Australian prescription. For non-PBS scripts written on PBS stationery, Services Australia says the PBS/RPBS boxes should be crossed out and the prescription endorsed as non-PBS.

### 10.3 Personal Importation Scheme context

Where the prescription/written authority supports personal importation of a prescription-only medicine/product, the pathway must respect TGA Personal Importation Scheme constraints, including that:

- goods are for the patient’s own treatment or immediate family member where permitted
- quantity limits apply
- prescription-only medicines require a valid Australian prescription or written authority
- importation does not override other prohibited/restricted import controls

The prescription/written authority PDF should be human-readable and suitable to travel with the shipment/pack-in where required. Do not rely on an eScript token alone for this pathway.

### 10.4 Schedule 4 / Schedule 8 / state rules

PouchCare must separately verify medicine scheduling and state/territory rules before launch.

For any controlled medicines, high-risk medicines or medicines subject to real-time prescription monitoring, the doctor must comply with state/territory requirements in both the prescriber and patient jurisdiction where applicable. The Medical Board telehealth guidance specifically reminds doctors to comply with jurisdictional prescribing requirements, RTPM or equivalent, and My Health Record where relevant.

This is a legal review item, not something the product team should guess.

---

## 11. Follow-up, refusal and escalation

### 11.1 Minimum follow-up process

The doctor/clinic should provide:

- prescription or refusal outcome
- patient instructions
- warning signs / when to seek urgent care
- side-effect/adverse reaction instructions
- how to contact clinic
- expected fulfilment/import timing if applicable
- follow-up plan if clinically indicated

### 11.2 If declined

Record:

- reason for refusal or deferral
- advice given
- whether GP/in-person/urgent care recommended
- whether further documents are needed

Patient-facing language should be careful:

> The doctor has determined prescribing through this telehealth pathway is not clinically appropriate based on the information available.

Do not frame it as failed checkout.

### 11.3 GP communication

With patient consent and when clinically warranted, the doctor should be able to send a summary to the patient’s usual GP or relevant practitioner covering:

- assessment date
- treatment/advice
- prescription issued, if any
- follow-up recommendations

Do not force GP communication for every case unless the clinical/legal reviewer requires it, but make it available.

---

## 12. Patient rights and operational policies

Minimum policies/processes required:

1. **Privacy policy**
   - APP-compliant and health-service specific.

2. **Collection notices**
   - At intake, signup, upload, booking/payment and phone prescreen.

3. **Access and correction process**
   - Patients can request access/correction of personal/health information.

4. **Complaints process**
   - Privacy and clinical complaint channels.

5. **Data breach response plan**
   - Includes notifiable data breach assessment and OAIC notification pathway where required.

6. **Record retention/destruction policy**
   - Must account for applicable state/territory health record laws and practitioner obligations.

7. **Clinical escalation protocol**
   - Red flags, urgent care, in-person referral, video escalation.

8. **Prescribing governance protocol**
   - Doctor-only prescribing, no questionnaire-only approvals, jurisdiction/scheduling checks.

9. **Staff training**
   - Privacy, health records, prescreen boundaries, security and escalation.

10. **Vendor/data handling register**
   - Supabase, Shopify, Stripe, email/SMS, analytics, telephony, file storage and support tools.

---

## 13. Minimum product requirements checklist

### Patient app

- [ ] Privacy policy linked before data collection
- [ ] APP 5 collection notice before intake
- [ ] Sensitive health information consent checkbox
- [ ] No prescription guarantee language
- [ ] Adult/identity/contact capture
- [ ] Clinical intake
- [ ] Upload supporting documents
- [ ] Booking/payment with financial consent
- [ ] Patient portal for status/messages/documents
- [ ] Access/correction request path

### Nurse/admin dashboard

- [ ] Assigned cases only
- [ ] View intake and missing fields
- [ ] Prescreen call notes
- [ ] Risk flag escalation
- [ ] No prescribing controls
- [ ] Scripted statement: no diagnosis/prescription guarantee
- [ ] Audit log for access and edits

### Doctor dashboard

- [ ] Full case view
- [ ] Identity/consent status
- [ ] Intake, uploads and nurse notes
- [ ] Phone/video consult documentation
- [ ] Telehealth suitability decision
- [ ] Prescribing decision and rationale
- [ ] Safety-net/follow-up fields
- [ ] Prescription/written authority generation
- [ ] Doctor attestations before script issue
- [ ] Audit log

### Clinical record/storage

- [ ] Supabase RLS or equivalent access control
- [ ] Private prescription/upload storage
- [ ] Immutable timestamps
- [ ] Audit trail
- [ ] Backups
- [ ] Break-glass process
- [ ] Retention/destruction policy

### Commerce/payment minimisation

- [ ] Stripe handles raw card details
- [ ] Shopify receives only fulfilment/order minimum
- [ ] No clinical answers in analytics
- [ ] No prescription PDFs in ordinary email attachments unless specifically risk-assessed/approved
- [ ] Secure portal links instead of clinical email content

---

## 14. What is mandatory vs best practice

### Mandatory / minimum

- Real-time doctor consultation before prescribing for new questionnaire-originated cases.
- Adequate patient identity confirmation.
- Informed consent to telehealth and financial terms.
- Consent and notice for sensitive health information collection.
- Doctor review of relevant intake/prescreen information.
- Doctor clinical assessment and prescribing decision.
- Adequate health record.
- Secure storage/transmission of clinical notes, prescriptions and uploaded files.
- Compliance with state/territory prescribing rules.
- Valid paper/private prescription or written authority if prescribing.
- Privacy policy, access/correction, complaint and breach processes.

### Strongly recommended / risk-reducing

- Video escalation criteria.
- GP summary option.
- MFA for all staff/clinicians.
- Structured doctor attestations.
- Prescription file hash/versioning.
- Separate clinical system from Shopify/Stripe.
- Legal review of prescription template and importation pack-in.
- Clinical governance committee or responsible medical director review.

### Not required by default, but may be needed case-by-case

- Video for every patient.
- Full GP medical record for every patient.
- Medicare number, if no PBS/Medicare billing.
- My Health Record access for every case.
- Usual GP notification for every case.
- In-person examination for every case.

---

## 15. Key unresolved legal/clinical review items

Before production, obtain review on:

1. Exact medicine/product scheduling and whether S4/S8 or state restrictions apply.
2. Whether each product can be prescribed/imported under the intended pathway.
3. Prescription/written authority format and signature acceptance.
4. Whether doctors need specific provider/prescriber numbers for the exact prescription type.
5. State/territory retention periods for health records.
6. Whether PouchCare entity structure makes it a health service provider / APP entity beyond doubt.
7. Whether any overseas storage/access occurs and how it is disclosed.
8. Whether advertising/landing pages comply with Ahpra/TGA advertising rules.
9. Whether nurse prescreening scripts and scope are clinically safe.
10. Whether the doctor’s professional indemnity covers this exact telehealth/importation workflow.

---

## 16. Practical MVP recommendation

For the first compliant MVP, build the narrowest safe version:

1. **Private patient portal** for intake, consent, uploads and booking.
2. **Clinical case system** in Supabase, not Shopify.
3. **Nurse prescreen dashboard** with no prescribing capability.
4. **Doctor dashboard** with mandatory review + phone consult + documentation + attestation.
5. **Private/non-PBS prescription/written authority PDF generator**.
6. **Secure storage and audit logs**.
7. **Shopify/Stripe only after clinical approval**, with minimal data.
8. **Clear refusal/escalation flow**.
9. **Policy pack:** privacy, collection notices, breach, retention, access/correction, clinical escalation, prescribing governance.

This is the minimum model I would be comfortable calling a real telehealth clinic workflow rather than a risky questionnaire-prescribing ecommerce flow.
