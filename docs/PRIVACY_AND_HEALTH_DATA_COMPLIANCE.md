# PouchCare privacy, health data and clinical information compliance brief

Working status: implementation brief, not legal advice. Have an Australian privacy/health lawyer review before launch.

## Scope reviewed

PouchCare is operating as a telehealth + dispensary/fulfilment pathway for nicotine pouch patients. The current codebase collects or may collect:

- account identity: name, email, phone, DOB, address, role
- eligibility questionnaire answers about nicotine use, age, residence, health/safety factors and treatment intent
- booking/consultation metadata: preferred time, consultation type, doctor assignment, consultation status, call attempts
- clinical intake: symptoms/reason, medical history, current medications, allergies, preferred pharmacy, consents
- clinical records: consultation notes, prescriptions, uploaded prescription/document files, issued prescription PDFs
- doctor data: AHPRA/provider details, onboarding, signatures, payout profile, availability, remittance data
- commerce data: Shopify cart/order references, order items, prescription/packing slip PDFs, shipping details
- payment data: Stripe checkout/session/payment status; no raw card details should touch PouchCare systems
- operational data: email outbox, logs, audit trails, analytics/cookies if enabled

This is **sensitive health information** and must be treated as higher-risk than ordinary ecommerce data.

## Key legal / regulatory sources researched

Primary sources checked in this pass:

- OAIC APP guidelines: APP 1 privacy policy / open and transparent management; APP 3 collection; APP 5 collection notices; APP 6 use/disclosure; APP 7 direct marketing; APP 11 security; APP 12 access; APP 13 correction.
- OAIC direct marketing guidance and ACMA Spam Act guidance.
- OAIC Notifiable Data Breaches scheme guidance.
- OAIC small business / health service provider guidance: health service providers are generally covered even if otherwise small.
- Medical Board of Australia telehealth guidelines: secure clinical records, secure transmission/storage of notes/prescriptions/images, patient identity confirmation, informed consent, prescribing obligations, follow-up and telehealth-specific records.
- Ahpra shared Code of Conduct / advertising hub: patient-first, privacy/confidentiality, respectful and ethical practice, no misleading advertising/testimonials.
- TGA Personal Importation Scheme: prescription-only imports require a valid Australian prescription/written authority, personal use only, quantity limits, counterfeit/prohibited products risks, and written authority details.

## Bottom line obligations

PouchCare should assume it is an **APP entity** because it provides or facilitates health services and handles health information. Even if revenue is below the general small-business threshold, health service provider handling brings Privacy Act obligations into scope.

The practical obligations are:

1. **Have a clear APP-compliant privacy policy** before collecting patient/doctor data.
2. **Give point-of-collection notices** wherever sensitive health information is collected.
3. **Collect only what is reasonably necessary** for telehealth, prescribing, dispensing/fulfilment, payment, legal compliance and safety.
4. **Get consent for sensitive information collection** and separate clinical/financial consent where needed.
5. **Use/disclose health information only for the primary purpose** or permitted secondary purposes.
6. **Keep health and prescription information secure** with role-based access, private storage, auditability and strict third-party minimisation.
7. **Provide access and correction rights** for personal/health information.
8. **Have a data breach response plan** and NDB assessment process.
9. **Meet telehealth clinical standards**: real-time consultation for prescribing, identity confirmation, informed consent, records, secure clinical systems and follow-up.
10. **Avoid unlawful or misleading therapeutic advertising** for nicotine products and healthcare services.

## What the privacy policy needs to cover

The public privacy policy should state, plainly:

- who operates PouchCare, including legal entity/ABN once finalised
- what information is collected
- which information is health/sensitive information
- how information is collected: website, account signup, quiz, consultation, uploads, doctors, prescriptions, orders, support, cookies/logs
- why it is collected: eligibility, clinical assessment, prescriptions, dispensing/fulfilment, orders, payment, safety, compliance, support, fraud/security
- consequences if a user does not provide required information
- who information may be disclosed to:
  - consulting doctors and clinical support staff
  - pharmacists/dispensers/suppliers/fulfilment partners where needed
  - Shopify/order platform only for necessary order/fulfilment data
  - Stripe/payment processor only for payment processing data
  - Supabase/cloud hosting/email/SMS/telehealth providers as processors
  - regulators, law enforcement, courts, insurers or professional advisers where required
- overseas disclosures / overseas processors if Supabase, Shopify, Stripe, email/SMS or hosting stores or accesses data outside Australia
- security measures at a high level
- retention and deletion/destruction approach, including medical-record retention constraints
- how users can access/correct data
- complaint process and OAIC escalation
- direct marketing consent/opt-out and Spam Act unsubscribe
- cookies/analytics
- child/minor position: service is 18+ only
- policy updates

## Collection notices needed in the app

Do not rely only on the privacy policy. Add short notices at the actual collection points.

### Eligibility questionnaire

Notice should say:

- answers may include sensitive health information
- used to assess whether a doctor consultation may be appropriate and to support clinical assessment
- not medical advice and not a guarantee of prescription/supply
- required if the user wants to proceed through PouchCare
- may be shared with the consulting doctor and authorised clinical/admin staff
- link to Privacy Policy
- explicit checkbox: “I consent to PouchCare collecting and using my sensitive health information for these purposes.”

### Account signup / profile

Notice should say:

- contact/DOB/address data is used to identify the patient, manage appointments, prescriptions, orders and legal compliance
- must be accurate
- link to Privacy Policy

### Consultation booking / payment

Notice should say:

- booking/payment data is used to schedule and charge for consultations
- Stripe processes payment details; PouchCare does not store raw card details
- cancellation/refund terms apply

### Intake form / upload prescription

Notice should say:

- uploaded documents and medical history are health information
- shared only with authorised clinicians/admins and dispensing/fulfilment partners as needed
- patients should not upload irrelevant documents
- link to Privacy Policy

### Checkout / dispensary order

Notice should say:

- only order/fulfilment information necessary to process and supply the order is shared with fulfilment partners
- prescription/clinical details are shared only where necessary for lawful dispensing/fulfilment
- Shopify/payment providers process relevant commerce/payment data

### Doctor onboarding

Notice should say:

- AHPRA/provider, identity, signature, banking/payout and practice details are collected for credentialing, compliance, payment and operating the doctor portal
- some professional details may be visible to patients where needed to identify the practitioner

## Code/data safeguards we should implement

### Immediate blockers before production

1. **Stop storing sensitive health data in browser localStorage/sessionStorage** beyond short pre-auth flow.
   - Current `eligibilityQuizService` stores quiz results in localStorage.
   - Current `fileStorageService` mock stores uploaded files as base64 data URLs in localStorage.
   - For production, move eligibility, intake and files to Supabase tables/storage with RLS. If a pre-auth quiz is needed, keep only a short-lived session value and persist immediately after signup.

2. **Do not send clinical details to Shopify/Stripe unless strictly necessary.**
   - Stripe: payment amount/session/customer reference only; no medical history or prescription content.
   - Shopify/fulfilment: order/shipping/product details plus prescription authority only if needed for lawful supply; avoid full consultation notes.

3. **Tighten over-broad doctor RLS policies.**
   - Some historical migrations permit doctors to view broad patient/prescription data. Doctors should only see patients they are assigned to or have a legitimate queue/access reason.
   - Replace policies like “Doctors can view all prescriptions” with assigned-patient or clinically-needed access.

4. **Use private buckets + short signed URLs for prescription/uploads/PDFs.**
   - No public buckets for clinical files.
   - Signed URLs should be short-lived and generated only after role/patient relationship checks.

5. **Add audit logging for clinical record access and privileged actions.**
   - Record user_id, role, action, table/object, record id, timestamp, IP/user agent where available.
   - Log access to prescriptions, files, consultation notes, patient profile, export/download, admin reads.

6. **Separate admin/support from clinical access.**
   - Support/admin should not automatically see full clinical notes unless required.
   - Consider roles: `admin`, `clinical_admin`, `doctor`, `patient`, `fulfilment`.

7. **Create and test a data breach response process.**
   - Identify, contain, assess “likely serious harm”, notify OAIC/affected people where required, document decisions.

### Recommended database/application controls

- RLS enabled on every patient/doctor/order/clinical table.
- Least-privilege policies by role and relationship.
- Service role only inside Edge Functions/server jobs, never client.
- Database constraints for ownership and status transitions.
- Append-only audit table for sensitive reads/writes.
- Private storage buckets: `prescriptions`, `booking-files`, `order-pdfs`.
- File metadata table with patient_id, booking_id/order_id, uploaded_by, purpose, retention class.
- MIME/type/size validation for uploads.
- Malware scanning if feasible before making uploads available to doctors/admins.
- Short signed URLs; no direct permanent URLs.
- No sensitive logs in console, edge logs, email outbox payloads or analytics.
- Redaction helpers for logs/errors.
- Environment isolation: dev/prod Supabase projects and no production PHI in dev.
- Backups protected and included in retention/destruction process.
- MFA enforced for admin/doctor accounts where possible.
- Session timeout / re-auth for high-risk downloads or admin views if practical.
- Disable indexing for private app routes; ensure no PHI in URL query strings.

## Data classification and retention model

| Data class | Examples | Access | Retention approach |
|---|---|---|---|
| Account identity | name, email, phone, DOB, address | patient, assigned clinician, limited admin | while account active + legal retention |
| Sensitive health info | quiz answers, medical history, allergies, medications | patient, assigned clinician, limited clinical/admin | medical record retention period; do not delete on simple account close if legally required |
| Prescriptions/files | uploaded scripts, issued scripts, PDF pack-ins | patient where appropriate, assigned clinician, fulfilment/admin as required | medical/pharmacy/legal retention; private storage |
| Consultation records | notes, status, call attempts | assigned clinician, clinical admin, patient subset where appropriate | medical record retention |
| Payment data | Stripe session/payment status, amount | patient/admin, Stripe | finance/tax retention; no raw card storage |
| Order/fulfilment | products, shipping, Shopify IDs | patient/admin/fulfilment | commerce/tax/therapeutic goods retention |
| Doctor data | AHPRA, provider, signature, payouts | doctor/admin | operational/legal retention |
| Audit logs | sensitive access/actions | security/admin only | long enough for compliance investigations; protect strongly |

Retention periods vary by state/territory, patient age and record type. Treat health records as long-retention records and get legal confirmation before implementing deletion automation.

## Telehealth and prescribing obligations to bake into product flow

- Patients must have a real-time consultation with an Australian-registered doctor before a prescription is issued. The Medical Board specifically warns against prescribing for a new patient based only on an asynchronous questionnaire.
- The doctor must be identifiable to the patient, including role/practice details.
- Patient identity should be confirmed as part of the consultation.
- The patient should be told telehealth may be unsuitable and an in-person assessment may be required.
- The clinical record should record:
  - consultation mode: phone/video
  - any technical issues
  - identity confirmation
  - informed consent
  - clinical assessment and decision
  - prescription details / refusal rationale
  - follow-up arrangements
- Prescribing must comply with jurisdictional requirements and real-time prescription monitoring requirements where applicable.
- For personal importation pathways, written authority/prescription must meet TGA requirements and match quantity/product; eScripts may not be sufficient for importation evidence.

## Therapeutic goods / advertising / ethics points

- Avoid claims that nicotine pouches are safe, approved, guaranteed effective, risk-free, or certain to be prescribed.
- Avoid patient testimonials or reviews that promote regulated health services or therapeutic goods in a way Ahpra/TGA prohibit.
- Keep educational content factual, balanced and safety-focused.
- Do not advertise prescription-only products directly to consumers in a prohibited way.
- Make it clear that the doctor independently assesses suitability and may refuse.
- Keep commercial incentives separate from clinical decisions.

## Direct marketing rules

- Marketing needs consent or a permitted basis, must identify PouchCare, and must include functional unsubscribe.
- Do not use sensitive health information for marketing unless the patient has expressly consented or a clear legal exception applies.
- Transactional/clinical messages should be separated from promotional messages.
- Maintain suppression/unsubscribe lists.

## Concrete implementation checklist

### Privacy policy / notices

- [x] Replace generic privacy page with PouchCare-specific health data policy.
- [ ] Add short collection notice + sensitive information consent to eligibility quiz.
- [ ] Add collection notices to signup/profile, intake/upload, booking/payment and checkout.
- [ ] Add direct marketing opt-in separate from clinical/transactional communications.

### Database / Supabase

- [ ] Review all RLS policies for doctors/admins; remove over-broad all-patient/all-prescription access.
- [ ] Add clinical audit log table and logging helpers/RPCs.
- [ ] Store eligibility results in Supabase, not localStorage, with RLS.
- [ ] Store uploaded files in Supabase Storage private buckets, not localStorage mock.
- [ ] Ensure prescriptions/order PDFs are private and access-controlled.
- [ ] Add retention class metadata to clinical/file records.

### Edge functions / integrations

- [ ] Ensure Stripe payloads exclude health data.
- [ ] Ensure Shopify payloads exclude consultation notes and other unnecessary health data.
- [ ] Redact PHI from Edge Function logs and email outbox payloads.
- [ ] Restrict service role use to server-side only.

### Clinical operations

- [ ] Document telehealth identity, consent, prescribing and follow-up SOP.
- [ ] Require real-time doctor consultation before issuing prescriptions.
- [ ] Add doctor-facing record fields for telehealth mode, identity confirmed, informed consent, tech issues, follow-up.
- [ ] Implement breach response SOP and incident register.
- [ ] Confirm medical records retention with lawyer for all operating states.

## Priority recommendation

Do this in order:

1. Ship privacy policy page now so public site is not generic.
2. Add collection notices/consent checkboxes to sensitive collection forms.
3. Remove localStorage mocks for quiz/files before live patient use.
4. Audit and tighten RLS policies.
5. Add audit logging and breach/retention SOPs.
6. Legal review before production launch.
