# Telehealth clinic data storage and protection research

**Prepared:** 2026-05-21
**Scope:** Australian telehealth clinic / online prescribing / pharmacy fulfilment model.
**Source rule:** Official regulator or government sources only.
**Important:** This is implementation research, not legal advice. Get Australian privacy/health-law review before production.

---

## Executive summary

A telehealth clinic that collects symptoms, diagnoses, prescriptions, identity details, payment metadata, uploaded files, consultation notes, pharmacy/order details and doctor/admin records is handling **health information**, which is **sensitive information** under the Privacy Act. The official guidance points to a high bar:

1. **Collect less, collect deliberately.** Only collect health/personal data that is reasonably necessary for the service, and obtain consent for sensitive health information unless a narrow exception applies.
2. **Tell patients at the point of collection.** Privacy notices cannot live only in a footer policy. Intake, quiz, file upload, booking, checkout and account flows should each explain what is collected, why, who receives it, consequences of not providing it, and cross-border/cloud disclosure where relevant.
3. **Store clinical data in controlled clinical systems, not browser storage or ecommerce tools.** Browser `localStorage`/`sessionStorage`, Shopify carts, Stripe metadata and email templates should not contain unnecessary symptoms, diagnoses, uploaded documents or prescription/clinical detail.
4. **Use role-based access with auditability.** Patients, doctors, pharmacists, support staff and admins should have separate permissions. Clinical record access and privileged actions should be logged.
5. **Protect data across the lifecycle.** Security starts before collection, includes privacy-by-design, risk assessment, access control, encryption, supplier governance, backups, breach response, and secure destruction/de-identification when data is no longer needed.
6. **Telehealth must still meet normal clinical standards.** The Medical Board says telehealth care must, as far as possible, meet the same standard as in-person care. It expects secure systems for clinical records, notes, prescriptions, referrals, investigation requests, images and storage/transfer of patient information.
7. **A questionnaire-only prescribing model is high risk.** Medical Board guidance says prescribing/providing healthcare without a real-time consultation, based on asynchronous text/email/live-chat/online questionnaire where the doctor has never spoken with the patient, is not good practice and is not supported.
8. **Records must be clinically useful, respectful, timely and transferable.** Ahpra says good health records should be accurate, up-to-date, factual, legible, objective, respectful, include relevant clinical history/diagnosis/treatment/advice/correspondence, identify date/time/provider/location where relevant, document informed consent, support continuity of care, be securely held, and be accessible/transferrable when patients request it.

For PouchCare, the safest architecture is: **Supabase/Postgres as the clinical source of truth with strict RLS + private storage + signed URLs + audit logs**, while Shopify/Stripe receive only non-clinical fulfilment/payment data.

---

## 1. What data telehealth clinics typically store

Based on the official sources reviewed, a telehealth clinic should expect to create or hold these record categories:

### Patient identity and account data
- Name, DOB, contact details, address.
- Account login/authentication data.
- Medicare/IHI/healthcare identifiers if used.
- Identity verification evidence if collected.

### Health and clinical intake data
- Symptoms, conditions, medical history, medicines, allergies, contraindications.
- Eligibility quiz responses and risk screening answers.
- Uploaded images/documents.
- Notes from telephone/video consultation.
- Clinical decision, diagnosis/impression, treatment plan, advice, follow-up instructions.

### Prescription and pharmacy data
- Prescription details.
- Prescriber identity and registration details.
- Pharmacy/dispensing/fulfilment instructions.
- Order status and delivery data.

### Payment and operational data
- Appointment/consultation booking details.
- Payment status, invoice/receipt identifiers.
- Refunds, payouts and doctor earnings.
- Support tickets and complaints.

### Access and security records
- Login events.
- Clinical record views/downloads.
- File access events.
- Admin changes.
- RLS/permission failures if logged.
- Breach/incident register entries.

---

## 2. Core legal/privacy duties from official sources

### 2.1 Health information is sensitive and needs stronger handling

OAIC’s health privacy guidance states that health service providers routinely handle sensitive health information and must understand Privacy Act obligations and embed good privacy in practice.

**Implication for PouchCare:** Treat quiz answers, prescriptions, consultation notes, uploaded files, diagnosis/treatment data, pharmacy fulfilment data and doctor-patient communications as sensitive health information.

Source: OAIC, *Guide to health privacy*
https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/health-service-providers/guide-to-health-privacy

### 2.2 Collection must be necessary, minimised and consented to for sensitive data

OAIC APP 3 guidance says organisations may collect personal information only where reasonably necessary for their functions/activities. For sensitive information, the entity generally needs consent. OAIC also says proportionality/data minimisation is implicit: collect the minimum necessary; over-collection increases security risk and breach harm.

**Implication for PouchCare:**
- Every intake question should map to a clinical, prescribing, identity, payment or fulfilment purpose.
- Do not collect “nice to have” health data.
- Explicitly capture sensitive health information consent before eligibility/intake submission.
- Do not send unnecessary health data to analytics, marketing tools, Shopify, Stripe, email providers or logs.

Source: OAIC, *Chapter 3: APP 3 Collection of solicited personal information*
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information

### 2.3 Point-of-collection notices are required

OAIC APP 5 guidance says entities must take reasonable steps to notify or ensure awareness of collection matters at or before collection, or as soon as practicable afterwards. Notices should be clearer and more rigorous where sensitive information is collected. APP 5 matters include entity identity/contact, collection circumstances, purpose, consequences of non-collection, usual disclosures, access/correction/complaints, and likely overseas disclosures.

**Implication for PouchCare:** Add short notices to:
- eligibility quiz/intake
- signup/profile
- file upload
- appointment booking/payment
- checkout/fulfilment
- doctor onboarding
- support/contact forms

Each notice should be contextual, not just a generic privacy-policy link.

Source: OAIC, *Chapter 5: APP 5 Notification of the collection of personal information*
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information

### 2.4 Security must include technical and organisational controls

OAIC APP 11 says entities must take reasonable steps to protect personal information from misuse, interference, loss, unauthorised access, modification and disclosure. Reasonable steps depend on sensitivity, amount, consequences of breach, business model and third-party handling. OAIC specifically lists governance/training, policies/procedures, ICT security, access security, third-party/cloud providers, data breaches, physical security, destruction/de-identification and standards.

**Implication for PouchCare:** Security cannot be only “Supabase has encryption”. PouchCare needs documented governance plus technical controls:
- RLS/least privilege
- MFA for staff/admin/doctor accounts
- private buckets and signed URLs
- audit logs
- incident response process
- supplier/data processing review
- retention/deletion process
- backups and restore testing

Source: OAIC, *Chapter 11: APP 11 Security of personal information*
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information

### 2.5 Outsourced/cloud storage is still “held” by the clinic

OAIC APP 11/12/13 guidance says an entity can “hold” personal information where it has possession or control, including when storage is outsourced to a third party but the entity retains the right/power to deal with it.

**Implication for PouchCare:** Using Supabase, Shopify, Stripe, Postmark/email, hosting, analytics or logging providers does not remove responsibility. PouchCare still needs to control what is sent, restrict access, contractually manage suppliers and answer patient access/correction requests.

Sources:
- OAIC, *Guide to securing personal information*
  https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/guide-to-securing-personal-information
- OAIC, *Chapter 12: APP 12 Access to personal information*
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-12-app-12-access-to-personal-information
- OAIC, *Chapter 13: APP 13 Correction of personal information*
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-13-app-13-correction-of-personal-information

### 2.6 Patients need access and correction pathways

OAIC APP 12 requires access to personal information on request unless an exception applies. OAIC APP 13 requires reasonable steps to correct inaccurate/out-of-date/incomplete/irrelevant/misleading personal information, including at the patient’s request.

**Implication for PouchCare:** Build or document:
- request channel, e.g. `privacy@pouchcare.com.au`
- identity verification process
- internal process to search patient records, files, orders, prescriptions, support logs
- correction workflow, including clinical correction/annotation where direct alteration is inappropriate
- refusal reasons and complaint pathway

Sources:
- OAIC, *Chapter 12: APP 12 Access to personal information*
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-12-app-12-access-to-personal-information
- OAIC, *Chapter 13: APP 13 Correction of personal information*
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-13-app-13-correction-of-personal-information

---

## 3. Telehealth-specific clinical obligations

### 3.1 Telehealth is not a lower standard of care

The Medical Board says telehealth consultations use technology as an alternative to in-person consultations and can include video, internet or telephone consultations, transmitting digital images/data and prescribing medicines. It supports responsible telehealth, but says telehealth is not appropriate for all consultations and should meet the same standards of care as in-person consultations as far as possible.

**Implication for PouchCare:** Product design must allow the clinician to decide whether telehealth is appropriate, require escalation/in-person referral where needed, and avoid treating the quiz as the clinical decision-maker.

Source: Medical Board of Australia, *Telehealth consultations with patients*
https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx

### 3.2 Secure clinical record systems are explicitly expected

The Medical Board says practitioners should use systems that allow secure access to patient clinical records and secure transmission/storage of clinical notes, prescriptions, referrals, investigation requests and videos/photographs/images, including store-and-forward transfers.

**Implication for PouchCare:**
- Clinical records/files must be stored in protected clinical infrastructure.
- Use private file storage, signed URLs, short expiry, access checks and logging.
- Avoid public buckets, permanent download links or files attached to ordinary transactional emails.
- Keep ecommerce/order systems separate from clinical record systems.

Source: Medical Board of Australia, *Telehealth consultations with patients*
https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx

### 3.3 The doctor must verify identity and manage privacy during the consultation

Medical Board guidance says doctors should confirm patient identity and any other persons present, protect privacy/confidentiality, explain process and alternatives, explain billing/financial consent, and make arrangements if technology fails.

**Implication for PouchCare:** Add product/process support for:
- patient identity confirmation before consult/prescribing
- consent and privacy prompts
- support-person/interpreter handling where relevant
- fallback if video/phone fails
- billing/financial consent
- in-person referral/escalation

Source: Medical Board of Australia, *Telehealth consultations with patients*
https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx

### 3.4 Record keeping must include telehealth-specific facts

Medical Board guidance says records should include normal consultation documentation plus the technology used, technical issues, and consent from all participants if digitally recorded or when information is uploaded to digital health infrastructure such as My Health Record.

**Implication for PouchCare:** Store structured fields for:
- consultation modality: video/phone/other
- technology/platform used
- technical issues
- identity confirmation
- patient consent/financial consent
- GP/other practitioner communication, if consented and clinically warranted
- follow-up arrangements

Source: Medical Board of Australia, *Telehealth consultations with patients*
https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx

### 3.5 Questionnaire-only prescribing is a red flag

Medical Board guidance says prescribing or providing healthcare without a real-time direct consultation, whether in-person, video or telephone, is not good practice and is not supported. It specifically includes asynchronous requests for medication by text, email, live-chat or online questionnaire, where the practitioner has never spoken with the patient.

**Implication for PouchCare:** The eligibility quiz should be triage/intake only. Before a prescription is issued, the doctor workflow should support a real-time consultation unless the scenario falls into a narrow clinically justified exception such as usual practitioner/record access context.

Source: Medical Board of Australia, *Telehealth consultations with patients*
https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx

### 3.6 Ahpra health-record management expectations

Ahpra says maintaining clear and accurate health records is essential for continuing good care and public safety. Its summary of obligations says records should be accurate, up-to-date, factual, legible, objective, respectful and non-judgemental. Good records include relevant clinical history, diagnostic information, treatment/services information, advice and correspondence with other treating practitioners. Each record should identify the date and time of service, who provided it, and where the service was provided when relevant. Practitioners should document informed consent, make records at the time of events or as soon as possible afterwards, keep billing information accurate, make records understandable to other practitioners, protect privacy/integrity of electronic records, comply with state/territory health-record legislation, access records only when involved in care or authorised, and facilitate patient access/transfer/management/disposal of records in a timely way.

**Implication for PouchCare:** Store clinical records in a form that supports actual care, not just compliance. The product should capture:
- service date/time, provider, modality and location/jurisdiction where relevant
- relevant history, diagnosis/impression, treatment/service/advice, management plan and follow-up
- informed consent and financial consent
- correspondence/handover with other practitioners where clinically warranted
- accurate billing/order links without mixing unnecessary clinical details into ecommerce/payment systems
- patient access/export workflows
- secure transfer/disposal workflows for practice closure, relocation or practitioner departure
- access controls that prevent doctor/support/admin browsing unless involved in care or authorised

Source: Ahpra, *Managing health records*
https://www.ahpra.gov.au/Resources/Managing-health-records.aspx

### 3.7 Ahpra self-reflective record audit tool: product requirements

The Ahpra self-reflective tool turns the record-keeping obligations into practical audit questions. It is useful as a product checklist because it shows what a practitioner should be able to confirm when reviewing a sample of records.

**Record structure PouchCare should support:**
- factual, accurate, up-to-date patient demographics, contact details, emergency contacts and relevant administrative details
- service date/time, record-created date/time where different, location/jurisdiction where relevant, and practitioner identity
- clear records understandable by another practitioner, including assessment, treatment and management plan
- respectful, objective and culturally safe language
- clear amendment/correction trail rather than silent overwrites of clinical records
- accurate billing/funding information, preferably linked but separated from clinical notes where appropriate
- patient capacity, special needs, linguistic/cultural factors relevant to treatment, support person/witness, guardian/substitute decision maker and advance care directive where relevant
- current presentation, history, relevant health/lifestyle/social/cultural factors
- medical history, medication history, allergies and adverse reactions
- informed consent for treatment and costs, including options, risks/benefits, referrals and individual circumstances relevant to consent
- diagnosis plus alternative diagnoses where relevant
- agreed management plan, treatment options, advantages/disadvantages, goals/outcome measures where relevant
- copies or records of correspondence/communications with and about the patient, including text/email, kept professional and respectful
- referral and handover details, including laboratory/diagnostic imaging referrals, costs where relevant and patient consent
- examinations/assessments performed, outcomes and interpretation, including negative findings where relevant
- treatment/procedure details and reasons for treatment choices
- patient response to treatment and adverse events/unusual responses
- infection-control details where relevant
- prescribed/administered medicines or therapeutic/diagnostic agents, including name, quantity, dose and instructions, including OTC products where relevant
- advice, education and other information provided, with enough specificity for another practitioner to continue care

**Process controls PouchCare should support:**
- random record audits, e.g. at least 10 records, with “always/usually/sometimes/never” style review outcomes
- consent process for accessing external health information such as My Health Record
- confidential transfer of records to other providers, with patient release authority retained in the record
- patient access-to-records policy and workflow
- correction request policy and workflow
- privacy, safety and confidentiality policy, including breach management
- confidential disposal/destruction process
- staff/practitioner training and periodic updates on privacy/security/record obligations
- feedback and continuous-improvement process for record keeping, including scheduled audits and CPD/training tracking

**Implication for PouchCare:** Treat this as an acceptance-test checklist for the clinical admin portal. A doctor should be able to open a patient/consult record and answer the Ahpra audit questions without hunting across Shopify, Stripe, emails and local files.

Source: Ahpra, *Managing health records – Self-reflective tool*
https://www.ahpra.gov.au/Resources/Managing-health-records.aspx

---

## 4. Recommended storage architecture for PouchCare

### 4.1 Separate clinical, ecommerce and payment data

**Clinical source of truth:** Supabase/Postgres tables for:
- patients/profiles
- eligibility/intake submissions
- consultations
- prescriptions
- uploaded clinical files metadata
- clinical notes
- audit logs
- consent records

**Private object storage:** Supabase Storage private buckets for:
- patient uploads
- generated prescriptions/PDFs
- clinical attachments

**Ecommerce/fulfilment:** Shopify should receive only:
- product/variant/cart data
- shipping/contact details needed for fulfilment
- order references
- non-clinical fulfilment notes only where necessary

**Payment:** Stripe should receive only:
- payment amount/currency
- customer/payment identifiers
- invoice/payment metadata that does not reveal clinical conditions or treatment unless absolutely necessary

**Email/SMS:** Transactional messages should avoid sensitive detail where possible. Prefer “Your consultation/order update is available in your secure account” over including symptoms, diagnosis, medicine or attachments in email.

### 4.2 Do not store health data in browser storage

Browser `localStorage` and `sessionStorage` are accessible to JavaScript running on the page and are high-impact if XSS occurs. They are not appropriate for production storage of sensitive health intake or eligibility results.

**Recommended approach:**
- Submit quiz/intake data directly to Supabase.
- Store only an opaque submission ID client-side if needed.
- Fetch patient results after authentication and RLS checks.
- Clear temporary form state after submission.

### 4.3 Use row-level security and least privilege

Suggested roles:

- **Patient:** can view/update own profile, own intake submissions, own files, own orders, own consult history, own prescriptions where allowed.
- **Doctor:** can access assigned patient consults and necessary history; cannot browse all patients by default.
- **Pharmacist/fulfilment:** can access prescriptions/order fulfilment data needed to dispense/ship; not full intake unless clinically/legally required.
- **Support:** can access limited non-clinical order/account info; clinical data requires break-glass or escalation.
- **Admin:** privileged, audited, limited to operational necessity.
- **System/service role:** only in backend functions; never exposed to frontend.

### 4.4 Audit access to clinical data

Audit log should capture:
- actor user ID and role
- patient/record/file ID
- action: view, create, update, delete, download, sign URL generated, prescription generated, payout/admin override
- timestamp
- IP/user agent where practical
- reason/context for privileged access
- before/after diff for sensitive admin changes where appropriate

Audit logs should be append-only from the app perspective and restricted from ordinary users. Consider an internal `/storage/audit` or equivalent protected pathway for file-access logging if direct storage logs are insufficient.

### 4.5 Encrypt and protect secrets

Use:
- TLS everywhere
- provider-managed encryption at rest
- strict secret handling for Supabase service keys, Stripe keys, Shopify tokens, email provider keys
- no service keys in frontend bundles
- short-lived signed URLs for files
- key rotation process
- least-privilege API tokens

### 4.6 Backups and restore testing

ACSC/ASD guidance treats regular backups of important data/software/configuration, disconnected storage, retention and restoration testing as essential for ransomware and destructive threats.

For PouchCare:
- define RPO/RTO for clinical records
- enable database backups
- test restore regularly
- ensure private file storage backup/replication strategy
- protect backups from ordinary admin deletion
- document business continuity process

Source: ASD/ACSC, *Strategies to mitigate cyber security incidents*
https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/mitigating-cyber-security-incidents/strategies-to-mitigate-cybersecurity-incidents

---

## 5. Security controls mapped to official guidance

### 5.1 OAIC personal information lifecycle controls

OAIC’s securing guide says organisations should protect personal information through its lifecycle:

1. consider whether collection is necessary
2. embed privacy by design
3. assess risks using PIAs/security risk assessments/reviews
4. protect information held
5. destroy or de-identify when no longer needed

**PouchCare actions:**
- Perform privacy impact assessment before launch.
- Create data inventory/data map.
- Remove unnecessary clinical data from third-party payloads.
- Document retention/destruction/de-identification rules.
- Review security controls before new features.

Source: OAIC, *Guide to securing personal information*
https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/guide-to-securing-personal-information

### 5.2 OAIC “reasonable steps” security areas

OAIC APP 11 identifies these areas:
- governance, culture and training
- internal policies, procedures and systems
- ICT security
- access security
- third-party providers/cloud
- data breaches
- physical security
- destruction/de-identification
- standards

**PouchCare actions:**
- Privacy/security policy set.
- Staff/doctor onboarding and confidentiality agreements.
- MFA and role review.
- Vendor list and data-sharing register.
- Incident response plan.
- Retention/deletion schedule.
- Periodic access review.

Source: OAIC, *Chapter 11: APP 11 Security of personal information*
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information

### 5.3 Healthcare cyber basics from Australian Digital Health Agency

ADHA says the health sector is a prime cyber-attack target and that cyber attacks can cause theft/loss of information, loss of access to critical business systems, service disruption, patient/client risk, reputational damage, loss of trust and fines. It recommends practical controls including software updates, no unapproved software, strong passphrases, MFA, regular backups, phishing awareness, ransomware response and healthcare-sector cyber security training/alerts.

**PouchCare actions:**
- Enforce MFA for staff/doctors/admins.
- Patch dependencies and infrastructure.
- Use dependency scanning and vulnerability remediation.
- Train staff on phishing and support/social-engineering risks.
- Subscribe to relevant alerts if operating healthcare infrastructure.
- Document ransomware response.

Source: Australian Digital Health Agency, *Fundamentals of cyber security in healthcare*
https://www.digitalhealth.gov.au/healthcare-providers/cyber-security/cyber-security-fundamentals

### 5.4 ASD/ACSC mitigation baseline

ASD/ACSC’s cyber incident guidance says its essential strategies are a baseline for all organisations. Relevant controls include application control, patching applications and operating systems, macro controls, user application hardening, restricting admin privileges, MFA, and regular tested backups.

**PouchCare actions:**
- MFA: all privileged access and access to sensitive repositories.
- Patch: dependencies, operating systems, browsers, server runtimes.
- Least privilege: no shared admin accounts; separate production roles.
- Backups: tested restore, offline/isolated backup strategy where possible.
- Logs: centralised logging for authentication, file access, admin actions.

Source: ASD/ACSC, *Strategies to mitigate cyber security incidents*
https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/mitigating-cyber-security-incidents/strategies-to-mitigate-cybersecurity-incidents

---

## 6. Breach response obligations

OAIC says when a Privacy Act-covered organisation has reasonable grounds to believe an eligible data breach has occurred, it must promptly notify affected individuals at risk of serious harm and notify OAIC. An eligible data breach involves unauthorised access/disclosure or likely unauthorised access/disclosure after loss, likely serious harm, and inability to prevent serious harm through remedial action. Notifications must include organisation contact details, breach description, kinds of information involved and recommended steps for affected individuals.

**PouchCare needs:**
- breach response SOP
- incident register
- triage process: contain, assess, remediate, notify
- template notification to patients/OAIC
- vendor breach escalation clauses
- evidence preservation/log review process
- assigned breach response owner

Source: OAIC, *Report a data breach*
https://www.oaic.gov.au/privacy/notifiable-data-breaches/report-a-data-breach

---

## 7. My Health Record / electronic prescribing considerations

### 7.1 Electronic health records

The Department of Health says electronic health records provide a safe and secure digital space to store health information and allow authorised healthcare providers to access up-to-date information. My Health Record is Australia’s secure national electronic health record system and provides patients and healthcare providers access to key health information at the point of care.

**Implication for PouchCare:** If PouchCare integrates with My Health Record or digital health infrastructure, additional obligations apply beyond ordinary app storage.

Source: Australian Government Department of Health, *Electronic health records*
https://www.health.gov.au/topics/health-technologies-and-digital-health/about/electronic-health-records

### 7.2 My Health Record security/access policy

ADHA states healthcare provider organisations registered with My Health Record must have, communicate and enforce a written security and access policy under Rule 42 of the My Health Records Rule 2016.

**Implication for PouchCare:** If registering to use My Health Record, prepare a written security/access policy and enforce it operationally. Even if not integrating with My Health Record, the Rule 42 pattern is a useful baseline for clinical access governance.

Source: Australian Digital Health Agency, *Fundamentals of cyber security in healthcare*
https://www.digitalhealth.gov.au/healthcare-providers/cyber-security/cyber-security-fundamentals

### 7.3 Electronic prescribing

ADHA provides separate guidance for electronic prescribing for prescribers and dispensers and points to the electronic prescribing conformance register.

**Implication for PouchCare:** If using formal electronic prescribing infrastructure, verify conformant software/workflows and prescriber/dispenser obligations. Do not invent a prescription workflow that bypasses e-prescribing/legal prescription requirements.

Source: Australian Digital Health Agency, *Electronic prescribing*
https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/electronic-prescribing

### 7.4 My Health Record legislation and governance

ADHA says the My Health Record system operates under the My Health Records Act 2012. That Act establishes the role/functions of the System Operator, a registration framework for individuals and healthcare provider organisations, and a privacy framework aligned with the Privacy Act that specifies which entities can collect, use and disclose information in the system and the penalties for improper collection, use and disclosure. ADHA also notes the Healthcare Identifiers Service is a foundation of My Health Record and is established under the Healthcare Identifiers Act 2010.

**Implication for PouchCare:** Do not treat My Health Record integration as a normal API integration. If PouchCare uses My Health Record or healthcare identifiers, it needs a separate governance stream covering registration, authorised access, identity/identifier handling, upload/access rules, audit logging, staff training, security/access policy and penalties for misuse.

Source: Australian Digital Health Agency, *My Health Record legislation and governance*
https://www.digitalhealth.gov.au/about-us/policies-privacy-and-reporting/my-health-record-legislation-and-governance

---

## 8. Retention and deletion position

Official OAIC guidance is clear on the privacy principle: under APP 11.2, personal information must be destroyed or de-identified when no longer needed for any APP-permitted purpose, unless it is a Commonwealth record or retention is required by Australian law/court/tribunal order.

However, health/medical record retention can also be affected by state/territory law, professional obligations, insurance/medico-legal needs, pharmacy/medicines law and My Health Record/e-prescribing obligations.

**Practical recommendation for PouchCare:**
- Do not promise instant deletion of clinical records.
- Create a retention schedule reviewed by an Australian health/privacy lawyer.
- Distinguish:
  - clinical records
  - prescriptions
  - uploaded files
  - payment/order records
  - support tickets
  - audit logs
  - marketing/account data
- Delete/de-identify unnecessary duplicates and temporary/browser copies quickly.
- Retain audit logs long enough to investigate misuse, breaches and clinical/legal disputes.

Source: OAIC, *Chapter 11: APP 11 Security of personal information*
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information

---

## 9. Concrete implementation checklist for PouchCare

### Must do before production

- [ ] Replace browser-stored health eligibility results with server-side storage protected by RLS.
- [ ] Store uploads in private storage buckets only; serve via short-lived signed URLs after permission checks.
- [ ] Add point-of-collection notices to intake, upload, signup, booking/payment, checkout and doctor onboarding.
- [ ] Capture explicit sensitive health information consent with timestamp, version and source flow.
- [ ] Review all Shopify/Stripe/email payloads to strip unnecessary clinical/health data.
- [ ] Implement patient/doctor/admin/pharmacist/support role separation.
- [ ] Tighten doctor RLS to assigned patients/consults only unless clinically justified.
- [ ] Add audit logging for clinical record/file access and privileged admin actions.
- [ ] Ensure clinical records capture date/time, provider, modality/location where relevant, informed consent, management plan and follow-up.
- [ ] Add clinical correction/amendment history so errors are traceable rather than silently overwritten.
- [ ] Add support for record audits against Ahpra self-reflective questions.
- [ ] Add breach response SOP and incident register.
- [ ] Add retention/deletion/de-identification policy.
- [ ] Add health-record export/transfer/disposal workflow for patient requests and practitioner/practice changes.
- [ ] Add privacy access/correction workflow.
- [ ] Enforce MFA for doctors/admin/support.
- [ ] Document vendor/subprocessor register.
- [ ] Run privacy impact assessment.
- [ ] Obtain Australian privacy/health-law review.

### Strongly recommended

- [ ] Break-glass access workflow with reason capture and review.
- [ ] Periodic access reviews for doctors/admin/support.
- [ ] Centralised security logs for auth, admin and storage actions.
- [ ] Backup restore tests.
- [ ] Dependency/security scanning in CI.
- [ ] Security headers and XSS hardening to reduce browser-token/storage risk.
- [ ] Staff/doctor privacy and phishing training.
- [ ] Secure support tooling: prevent support staff seeing clinical detail unless needed.
- [ ] Privacy-safe analytics: no health data in tracking pixels/events.

---

## 10. Source list

1. OAIC — *Guide to health privacy*
   https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/health-service-providers/guide-to-health-privacy
2. OAIC — *Chapter 3: APP 3 Collection of solicited personal information*
   https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information
3. OAIC — *Chapter 5: APP 5 Notification of the collection of personal information*
   https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information
4. OAIC — *Chapter 11: APP 11 Security of personal information*
   https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information
5. OAIC — *Guide to securing personal information*
   https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/guide-to-securing-personal-information
6. OAIC — *Chapter 12: APP 12 Access to personal information*
   https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-12-app-12-access-to-personal-information
7. OAIC — *Chapter 13: APP 13 Correction of personal information*
   https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-13-app-13-correction-of-personal-information
8. OAIC — *Report a data breach*
   https://www.oaic.gov.au/privacy/notifiable-data-breaches/report-a-data-breach
9. Medical Board of Australia — *Telehealth consultations with patients*
   https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx
10. Medical Board of Australia — *Good medical practice: a code of conduct for doctors in Australia*
    https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Code-of-conduct.aspx
11. Ahpra — *Shared Code of conduct*
    https://www.ahpra.gov.au/Resources/Code-of-conduct/Shared-Code-of-conduct.aspx
12. Ahpra — *Advertising hub*
    https://www.ahpra.gov.au/Resources/Advertising-hub.aspx
13. Australian Government Department of Health — *Telehealth*
    https://www.health.gov.au/topics/health-technologies-and-digital-health/about/telehealth
14. Australian Government Department of Health — *Electronic health records*
    https://www.health.gov.au/topics/health-technologies-and-digital-health/about/electronic-health-records
15. Australian Digital Health Agency — *Cyber security for healthcare providers*
    https://www.digitalhealth.gov.au/healthcare-providers/cyber-security-for-healthcare-providers
16. Australian Digital Health Agency — *Fundamentals of cyber security in healthcare*
    https://www.digitalhealth.gov.au/healthcare-providers/cyber-security/cyber-security-fundamentals
17. Australian Digital Health Agency — *Electronic prescribing*
    https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/electronic-prescribing
18. ASD/ACSC — *Strategies to mitigate cyber security incidents*
    https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/mitigating-cyber-security-incidents/strategies-to-mitigate-cybersecurity-incidents
19. Ahpra — *Managing health records*
    https://www.ahpra.gov.au/Resources/Managing-health-records.aspx
20. Australian Digital Health Agency — *My Health Record legislation and governance*
    https://www.digitalhealth.gov.au/about-us/policies-privacy-and-reporting/my-health-record-legislation-and-governance
21. Ahpra — *Managing health records – Self-reflective tool*
    https://www.ahpra.gov.au/Resources/Managing-health-records.aspx

---

## 11. Paper prescription / written authority for Personal Importation Scheme

### 11.1 Key finding

For the TGA Personal Importation Scheme, an electronic prescription token/eScript is **not enough**. TGA says electronic prescriptions cannot be accepted as valid written authority for importation because they often lack necessary details and TGA/ABF cannot verify them through clinical information systems.

For prescription-only medicines imported under the Personal Importation Scheme, the patient must hold a valid Australian prescription or written authority **at the time of importation**. The written authority must match the quantity being imported. If the patient obtains the authority only after the import is held, TGA says the scheme requirements have not been met.

Source: TGA, *Personal Importation Scheme*
https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme

### 11.2 Personal Importation Scheme conditions relevant to PouchCare

TGA says all of these conditions must be met:

- product is for the patient’s personal use or immediate family member’s use only
- it cannot be sold, supplied or given away to others
- if prescription-only in Australia, the patient must hold a valid Australian prescription or written authority at the time of importation
- import must not exceed 3 months’ supply at the maximum prescribed dose
- total imported in any 12-month period must not exceed 15 months’ supply
- product must not include vaping products
- product must not contain a controlled substance
- product must not be prohibited under Customs or quarantine rules
- counterfeit products are prohibited even if the patient has a prescription

**Implication for PouchCare:** The platform should show a compliance warning before script generation/order flow: the script does not guarantee border release; the patient/importer must ensure the product, quantity, supplier and ingredients comply with TGA, ABF, controlled-substance and quarantine rules.

### 11.3 TGA written authority fields

TGA says a valid written authority, such as an Australian prescription, must be issued by an Australian registered medical practitioner and include the prescriber’s:

- name
- address
- telephone number
- Australian prescriber number
- signature

It must match the quantity of products being imported and contain:

- date of the written authority
- patient’s name and address
- item
- dosage form
- strength
- quantity
- usage instructions
- number of times the medicine can be supplied under the written authority

**Minimum PouchCare paper-script/PDF fields for Personal Importation Scheme:**

1. Document title: `Australian Prescription / Written Authority for Personal Importation`
2. Script/reference number generated by PouchCare
3. Date written
4. Patient full legal name
5. Patient residential address
6. Patient DOB, recommended for identity matching even though not listed by TGA
7. Medicine/item name
8. Active ingredient, recommended
9. Dosage form, e.g. tablet/capsule/solution/cream
10. Strength/concentration
11. Quantity authorised for import/supply
12. Directions/usage instructions, including dose and frequency
13. Maximum prescribed daily dose, recommended to prove 3-month quantity calculation
14. Repeats / number of times the medicine can be supplied under the authority
15. Statement: `For personal importation only. Quantity must not exceed the prescribed quantity or TGA Personal Importation Scheme limits.`
16. Prescriber full name
17. Prescriber qualification, recommended
18. Prescriber practice address
19. Prescriber telephone number
20. Australian prescriber number
21. AHPRA registration number, recommended
22. Prescriber signature
23. Signature timestamp / digital-signing metadata, if electronically signed and rendered into PDF
24. Platform verification QR/code, optional, resolving to a secure verification page that reveals only minimal script validity metadata to authorised users

### 11.4 Normal paper/PBS prescription fields useful as a baseline

Services Australia says PBS prescriptions should include:

- prescriber name, practice address, telephone number and prescriber number
- patient name and address
- whether PBS/RPBS
- medicine name, strength, active ingredient and form
- dose and instructions
- quantity and repeats
- prescriber signature
- date written, not forward- or back-dated
- Medicare/concession/Veterans entitlement details if PBS/RPBS
- brand substitution not permitted, if applicable
- authority number/code where required

For PouchCare’s personal importation use case, the script will likely be a **private / non-PBS written authority**, not a PBS claiming document. If a PBS form is ever used for non-PBS prescribing, Services Australia says PBS/RPBS boxes must be crossed out and the prescription endorsed `non-PBS`.

Source: Services Australia, *Prescribing PBS medicines*
https://www.servicesaustralia.gov.au/prescribing-pbs-medicines?context=20

Source: PBS, *Prescribing Medicines – Information for PBS Prescribers*
https://www.pbs.gov.au/info/healthpro/explanatory-notes/section1/Section_1_2_Explanatory_Notes

### 11.5 Recommended PouchCare doctor workflow

1. Patient completes intake and personal importation acknowledgement.
2. Doctor reviews intake and conducts real-time consult where required by Medical Board telehealth guidance.
3. Doctor checks medicine suitability, contraindications, dose, quantity and import restrictions.
4. Platform blocks or warns if quantity exceeds a calculated 3-month supply at maximum prescribed dose.
5. Doctor enters prescription fields manually or confirms prefilled fields.
6. Doctor confirms:
   - patient identity
   - clinical appropriateness
   - product is not known/prohibited/controlled based on available checks
   - quantity matches written authority
   - patient understands personal importation risks
7. Doctor signs the written authority.
8. Platform generates immutable PDF in private storage.
9. Platform stores structured prescription metadata in Supabase.
10. Platform logs generation, view, download and send events.
11. Patient receives secure access to the PDF and is instructed to provide it to the overseas supplier for inclusion in the package.

### 11.6 Platform guardrails

- Do not generate an eScript token for personal importation and assume it is enough.
- Generate a human-readable PDF written authority containing all TGA-required fields.
- Do not allow quantity mismatch between prescription and order/import quantity.
- Warn that ABF/TGA may seize goods if the package lacks the written authority, is counterfeit, mislabelled, controlled/prohibited, exceeds quantity limits, or breaches quarantine/customs rules.
- Store the PDF in private Supabase Storage only.
- Never place the full prescription or clinical details in Shopify, Stripe, analytics or ordinary email metadata.
- Add audit logs for script generation, doctor signature, patient download and pharmacy/supplier access.
- Require legal/pharmacy review before production, especially for Schedule 4/Schedule 8/state-specific prescribing, controlled substances, and whether the generated PDF signature is acceptable for the intended workflow.
