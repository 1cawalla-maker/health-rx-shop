# PouchCare quiz-start legal/privacy notice plan

**Status:** planning draft — not legal advice. Have an Australian privacy/health lawyer and clinical lead review before launch.

## Purpose

Because the PouchCare screening quiz is the first customer-facing step and collects health-related answers before account signup, the legal/privacy notice must appear **before any sensitive health information is collected**.

The start-of-quiz screen should make the patient aware of what is being collected, why it is collected, who may receive it, the telehealth limits, and that prescription/supply is not guaranteed.

## Official/legal source basis

### OAIC — APP 3 collection of solicited personal information

OAIC APP 3 guidance says an organisation may only collect personal information where it is reasonably necessary for its functions or activities, and sensitive information generally requires consent. OAIC also emphasises proportionality and data minimisation.

**Planning impact for PouchCare:**

- The quiz should only ask questions needed for triage, clinical assessment, safety, prescribing/importation context, or regulatory compliance.
- Health/risk answers should be treated as sensitive information.
- The patient should actively consent before answering health questions.
- The quiz should not collect full signup identity/contact details unless necessary at that stage.

Source: OAIC, APP 3 — Collection of solicited personal information
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information

### OAIC — APP 5 notification of collection

OAIC APP 5 guidance says an entity collecting personal information must take reasonable steps to notify the individual, or ensure they are aware, of required collection matters at or before collection, or as soon as practicable afterwards. For online forms, OAIC gives prominent display of APP 5 matters or a prominent link to a collection notice as an example of reasonable steps. More rigorous steps may be needed where sensitive information is collected.

**Planning impact for PouchCare:**

- The notice should be displayed at the start of the quiz, not hidden only in the footer or privacy policy.
- The notice should be clear, short, and linked to the full Privacy Policy and Terms.
- A checkbox/active acknowledgement should be required before continuing.
- The system should store evidence of the notice version and acknowledgement.

Source: OAIC, APP 5 — Notification of the collection of personal information
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information

### OAIC — Guide to health privacy

OAIC health privacy guidance states health service providers routinely handle sensitive health information and must embed privacy obligations in their practice.

**Planning impact for PouchCare:**

- Treat quiz answers as health information even before signup.
- Apply higher-risk privacy controls from the first quiz screen.
- Do not treat the quiz as ordinary marketing/ecommerce data.

Source: OAIC, Guide to health privacy
https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/health-service-providers/guide-to-health-privacy

### Medical Board of Australia — telehealth consultations with patients

Medical Board telehealth guidance supports responsible telehealth but says the same standard of care should apply as far as possible. It expects secure systems for clinical records and says prescribing/providing healthcare without a real-time direct consultation, based only on an online questionnaire where the practitioner has never spoken with the patient, is not good practice and is not supported.

**Planning impact for PouchCare:**

- The quiz must be framed as preliminary screening/intake only.
- The quiz must not imply approval, eligibility, treatment, prescription, or supply.
- The patient must be told a doctor consultation is required and the doctor makes the final clinical decision.
- The notice should warn that telehealth may not be appropriate and in-person/urgent care may be recommended.

Source: Medical Board of Australia, Telehealth consultations with patients
https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx

### TGA — Personal Importation Scheme

TGA guidance says personal importation of therapeutic goods has conditions. For prescription-only medicines, the patient must hold a valid Australian prescription or written authority at the time of importation; import quantities must match the written authority and generally not exceed permitted supply limits. The TGA also warns imported products may not be evaluated for safety, quality, or efficacy and unlawful imports may be seized.

**Planning impact for PouchCare:**

- If the pathway involves importation, the quiz-start notice should explain that importation/supply depends on legal requirements and a valid written authority/prescription if clinically issued.
- Do not let users think completing the quiz gives permission to import or receive products.
- Quantity/product requests must remain subject to doctor review and written authority.

Source: TGA, Personal Importation Scheme
https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme



## Current build fit

The current website already places the questionnaire before patient signup and imports quiz results into the patient profile after signup. The start-of-quiz legal/privacy notice should therefore be added as the first screen of the existing `/eligibility` flow, not as a separate account/signup step.

Important current-build constraint for later implementation: the existing pre-signup quiz persistence uses browser storage for continuity. For production compliance, sensitive quiz answers should move to server-side temporary storage, with the browser holding only a short-lived non-sensitive token where needed.

## Required start-of-quiz notice content

The start screen should include a concise layered notice with links to full policies.

### Must disclose

1. **Who is collecting the information**
   - PouchCare / final legal entity name.
   - Privacy contact email, e.g. `privacy@pouchcare.com.au`.

2. **What will be collected**
   - Quiz answers about nicotine use, health, medicines, allergies, risk factors, product/use context, and other information relevant to assessing whether a doctor consultation may be appropriate.

3. **Sensitive health information**
   - State that quiz answers may include sensitive health information.
   - Require explicit consent to collect/use that information.

4. **Why it is collected**
   - To support preliminary screening/triage.
   - To help determine whether the patient may continue to account creation and doctor booking.
   - To support doctor review and clinical assessment if the patient proceeds.
   - To support safety, record keeping, compliance, and, if clinically appropriate later, prescription/written authority workflow.

5. **Who may access/disclose**
   - Consulting doctor.
   - Authorised clinical/admin staff.
   - Technology/service providers supporting secure operation.
   - Pharmacy/dispensing/fulfilment/importation partners only where necessary later.
   - Regulators/law enforcement/courts where legally required.

6. **Consequences of not providing information**
   - Patient cannot continue through the PouchCare screening/doctor booking pathway if required quiz answers/consent are not provided.

7. **Telehealth limitation**
   - The quiz is not medical advice.
   - The quiz does not replace a doctor consultation.
   - Telehealth may not be suitable for every patient.
   - Doctor may request more information or recommend GP/in-person/urgent care.

8. **Prescription/supply limitation**
   - Completing the quiz does not guarantee a prescription, written authority, supply, or importation.
   - Final decision is made by an Australian-registered doctor after review and real-time phone/video consultation.

9. **Emergency/urgent care**
   - If patient has urgent symptoms or is at immediate risk, do not use the quiz; call 000 or seek urgent medical care.

10. **Policy links**
   - Terms & Conditions.
   - Privacy Policy.
   - Collection Notice.
   - Telehealth consent/process page if separate.

## Recommended screen structure

### Screen title

> Before we begin

### Short intro

> This screening quiz asks health-related questions so PouchCare can help determine whether you may continue to account creation and book a doctor consultation. Your answers may include sensitive health information.

### Key points shown before checkbox

- This quiz is preliminary screening only and is not medical advice.
- A prescription, written authority, product supply or importation is not guaranteed.
- An Australian-registered doctor must review your information and complete a real-time phone/video consultation before deciding whether any treatment or prescription is clinically appropriate.
- Telehealth may not be suitable for everyone. The doctor may decline treatment, ask for more information, or recommend GP/in-person/urgent care.
- We collect and use your quiz answers in accordance with our Privacy Policy and Collection Notice.

### Emergency warning

> If you have severe symptoms, chest pain, trouble breathing, signs of stroke, thoughts of self-harm, or any immediate safety concern, do not continue with this quiz. Call 000 or seek urgent medical care.

## Required acknowledgements / checkboxes

Use separate checkboxes where possible, rather than one bundled checkbox.

### Checkbox 1 — privacy / sensitive health information

> I have read the Collection Notice and Privacy Policy, and I consent to PouchCare collecting, using and disclosing my personal information and sensitive health information for preliminary screening, doctor consultation, clinical assessment, safety, record keeping, compliance, and related service purposes.

### Checkbox 2 — telehealth / no guarantee

> I understand this quiz is not medical advice, does not guarantee a prescription, written authority, product supply or importation, and that a doctor will make the final clinical decision after reviewing my information and completing a real-time consultation.

### Checkbox 3 — accuracy

> I confirm the answers I provide will be accurate and complete to the best of my knowledge.

### Checkbox 4 — age gate

> I confirm I am 18 years or older.

## Button language

Use cautious neutral wording:

- `I agree — start screening`
- `Start screening`

Avoid:

- `Check eligibility`
- `Get approved`
- `Get prescription`
- `Start order`
- `Claim treatment`

## Data/audit requirements

When the patient starts the quiz, store:

- quiz session ID
- timestamp
- IP/user agent if appropriate and disclosed
- notice version IDs:
  - Terms version
  - Privacy Policy version
  - Collection Notice version
  - Telehealth consent/process version
- checkbox acknowledgement values
- quiz version/question set version
- source page/path
- later patient account ID once signup occurs

The record should be immutable or append-only where practical. If notices change before signup is completed, require re-acknowledgement and store the later version separately.

## Implementation guardrails

- Do not place health questions before the notice/acknowledgement.
- Do not store pre-signup quiz answers in browser localStorage for production, except a short-lived non-sensitive session token if needed.
- Do not send quiz answers to analytics, Shopify, Stripe, Meta/Google pixels, email marketing tools, or ordinary support inboxes.
- Do not use the quiz result to auto-approve treatment or prescription.
- Do not show patient-facing outcomes that imply clinical approval.
- Do not allow doctor booking unless required quiz, signup, verification, profile and consent steps are complete.

## Suggested patient-facing copy — v1 draft

> **Before we begin**
>
> This screening quiz asks health-related questions so PouchCare can help determine whether you may continue to account creation and book a doctor consultation. Your answers may include sensitive health information.
>
> This quiz is not medical advice and does not guarantee a prescription, written authority, product supply or importation. An Australian-registered doctor must review your information and complete a real-time phone/video consultation before deciding whether any treatment or prescription is clinically appropriate.
>
> Telehealth may not be suitable for everyone. The doctor may ask for more information, decline treatment, or recommend GP, in-person, or urgent care.
>
> If you have severe symptoms, chest pain, trouble breathing, signs of stroke, thoughts of self-harm, or any immediate safety concern, do not continue with this quiz. Call 000 or seek urgent medical care.
>
> By continuing, you agree to our Terms & Conditions, Privacy Policy and Collection Notice, and you consent to PouchCare collecting, using and disclosing your personal information and sensitive health information for preliminary screening, doctor consultation, clinical assessment, safety, record keeping, compliance, and related service purposes.

## Open legal/clinical review points

- Final legal entity name and privacy contact details.
- Whether one combined checkbox is acceptable or separate checkboxes are preferred by counsel.
- Final Collection Notice wording.
- Whether nicotine pouch pathway requires stronger default age/ID verification.
- Whether pharmacy/fulfilment/importation partner requires specific consent wording.
- Whether importation wording should be shown to all users or only once the user is routed to an importation pathway.
- Whether any state/territory-specific prescription/telehealth warnings are needed.
