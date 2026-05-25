# Step 2 — patient screening quiz compliance plan

**Status:** planning draft only — do not implement yet. Not legal advice or clinical advice. Requires review by the responsible doctor/medical director and Australian privacy/health lawyer before launch.

## Purpose

This document plans the compliance shape of the PouchCare Step 1 patient screening quiz after the current MVP decision:

1. quiz is the first customer-facing step
2. legal/privacy notice appears before health questions
3. quiz collects limited clinical/contextual information only
4. signup, identity/contact details, email verification and SMS verification happen after quiz continuation
5. doctor review and real-time phone/video consultation are mandatory before any prescribing decision
6. no nurse prescreen or nurse consultation in MVP

The quiz is **not** an approval engine. It is a structured clinical-intake and triage tool for doctor review.


---

## Current build alignment — light audit summary

A light audit of the current repo is captured in `CURRENT_WEBSITE_FLOW_LIGHT_AUDIT_FOR_COMPLIANCE_PLANNING.md`. The important planning conclusion is that the existing choreography is mostly correct and should be preserved:

1. quiz before signup
2. signup/account details after quiz
3. booking/payment after account creation
4. doctor portal shows patient details and quiz result
5. doctor conducts phone consult and records call attempts/notes
6. doctor prescription issuance unlocks the patient shop
7. shop checkout validates active prescription, max strength and allowance before Shopify handoff

This plan should therefore be implemented later as a compliance layer on top of the current flow, not as a replacement flow.

### Current build items to preserve

- Patient signup is already blocked until the questionnaire is completed.
- Quiz results are already imported into the patient profile after signup.
- Doctor consultation workspace already displays patient details and an eligibility/quiz card.
- Booking/payment/confirmation are already sequenced before the doctor consultation.
- The shop is already locked unless a prescription exists.
- Checkout already checks prescription allowance and strength before Shopify handoff.

### Mandatory or high-priority compliance changes to plan

- Add the quiz-start collection notice and sensitive-health consent before health questions.
- Do not store production quiz health answers in browser localStorage/sessionStorage; use server-side temporary quiz storage or a short-lived non-sensitive token.
- Require email verification before booking.
- Require SMS verification before booking, because the doctor consult is phone-based.
- Strengthen age/DOB assurance: record DOB server-side, enforce 18+, compare against quiz age answer, and confirm whether digital ID verification is required for the final pouch/importation pathway.
- Complete minimum identity/profile fields before booking or prescribing: legal name, DOB, phone, residential address, state/territory, and later shipping address if relevant.
- Expand the doctor portal view to show consent version/status, verification status, profile completeness, age/DOB mismatch flags, and clinical/regulatory risk flags.
- Replace “eligible/approved”-style labels with neutral triage wording. The quiz can say `continue`, `needs review`, or `stop`; it must not imply clinical approval.
- Require evidence of real-time consult before prescription issuance: call answered/consult completed, notes saved, doctor decision recorded.
- Keep quiz/clinical data out of Shopify, Stripe, analytics, ad pixels, email marketing tools and ordinary support inboxes.
---

## Official/legal source basis

### OAIC — APP 3 collection/data minimisation/sensitive information

OAIC APP 3 guidance says organisations may collect personal information only where reasonably necessary for their functions or activities. Sensitive information generally requires consent, and OAIC emphasises proportionality and data minimisation.

**Planning impact:**

- Quiz questions must be limited to what is reasonably necessary for preliminary triage, doctor assessment, safety, prescribing/importation context and compliance.
- Do not collect full signup identity/contact details inside the quiz, except the 18+ gate and any minimum routing fields.
- Treat answers as sensitive health information from the start.

Source: OAIC APP 3 — Collection of solicited personal information
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information

### OAIC — APP 5 collection notice

OAIC APP 5 guidance says individuals must be notified or made aware of collection matters at or before collection where reasonable. More rigorous steps may be required for sensitive information, and online forms should prominently display or link to collection notices.

**Planning impact:**

- Start-of-quiz notice must precede quiz questions.
- Store notice versions and consent timestamp.
- Quiz answers should link back to the consent/session record.

Source: OAIC APP 5 — Notification of collection
https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information

### Medical Board of Australia — telehealth consultations

Medical Board telehealth guidance says telehealth must meet the same standard of care as far as possible, doctors should confirm patient identity, protect privacy/confidentiality, obtain informed consent, keep records, and prescribing/providing healthcare without a real-time direct consultation based only on an online questionnaire where the practitioner has never spoken with the patient is not good practice and is not supported.

**Planning impact:**

- Quiz must not prescribe, approve, or substitute for doctor consult.
- Quiz must collect enough information for doctor review but leave final clinical assessment to the doctor.
- Patient-facing quiz results must say doctor consultation is required and prescription is not guaranteed.
- Quiz should include telehealth-suitability and urgent-care red-flag routing.

Source: Medical Board of Australia — Telehealth consultations with patients
https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx

### RACGP — Supporting smoking cessation

RACGP smoking cessation guidance is an Australian clinical source for smoking/vaping cessation support. It discusses smoking and vaping cessation, pharmacotherapy, nicotine replacement therapies and nicotine vaping products as part of smoking cessation care.

**Planning impact:**

- Quiz should ask about smoking/vaping/nicotine use, dependence indicators, quit attempts, prior therapies, treatment goals and relevant clinical risks.
- Product requests should be captured as patient preference only, not as an order or entitlement.
- Doctor should be able to consider alternatives such as behavioural support, NRT or other cessation options.

Source: RACGP — Supporting smoking cessation: A guide for health professionals
https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/supporting-smoking-cessation

### TGA — Personal Importation Scheme

TGA Personal Importation Scheme guidance says prescription-only medicine imports require a valid Australian prescription or written authority at the time of importation, quantity must match the written authority, and products cannot be sold/supplied to others. TGA warns imported goods may not be evaluated for safety, quality or efficacy.

**Planning impact:**

- If the quiz routes to importation/personal-use context, ask only enough to support doctor review and compliance: intended personal use, product requested, quantity/duration estimate, understanding that importation/supply is not guaranteed.
- Do not imply quiz completion authorises importation.
- The doctor must review quantity/product request before any written authority.

Source: TGA — Personal Importation Scheme
https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme

### TGA — Vaping hub / therapeutic vaping goods

TGA vaping information explains Australian regulation of vaping goods and gives up-to-date regulatory context for health practitioners and the public.

**Planning impact:**

- For vaping/nicotine-dependence routes, avoid consumer-marketing framing.
- Treat therapeutic-vaping questions as clinical/regulatory context for the doctor, not product promotion.

Source: TGA — Vaping hub
https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub

---

## Compliance design principles

### The quiz should do

- collect minimum necessary clinical/contextual answers
- identify obvious hard stops and urgent-care risks
- route suitable users to signup/account creation
- flag risks and missing information for doctor review
- preserve original answers and quiz version
- make clear doctor consult is required
- make clear prescription/supply/importation is not guaranteed

### The quiz should not do

- approve the patient
- say the patient is eligible for prescription
- generate or imply a prescription
- collect full signup identity/contact details before signup
- ask irrelevant lifestyle/marketing questions
- send answers to Shopify, Stripe, analytics, ad pixels or email marketing tools
- hide adverse/risk answers from the doctor

---

## Recommended quiz structure

### Screen 0 — Before we begin

Use the separate plan in `QUIZ_START_LEGAL_PRIVACY_NOTICE_PLAN.md`.

Required acknowledgements before any health question:

- collection notice / privacy policy / sensitive health information consent
- telehealth process and no-guarantee acknowledgement
- accuracy acknowledgement
- 18+ acknowledgement

If not accepted: stop.

---

### Screen 1 — Age and basic pathway gate

Purpose: hard-stop minors and identify the broad pathway without collecting full identity/contact details.

Questions:

1. **Are you 18 years or older?**
   - Yes
   - No

   Rule: No = hard stop for MVP.

2. **Are you currently in Australia?**
   - Yes
   - No

   Rule: No = hard stop or manual review depending final legal model. For MVP, safest default is hard stop.

3. **Which state or territory are you currently in?**
   - ACT / NSW / NT / QLD / SA / TAS / VIC / WA
   - Prefer not to say

   Rule: Prefer not to say = can continue only if doctor booking/signup later captures state; flag missing state for profile/signup.

4. **What are you seeking help with?**
   - Quit smoking cigarettes
   - Quit vaping
   - Manage nicotine dependence
   - Reduce nicotine use
   - Discuss nicotine pouches/oral nicotine products
   - Importation/written authority question
   - Unsure
   - Other

   Rule: route to relevant question branch. Other/unsure should not block by itself; flag for doctor review.

---

### Screen 2 — Current nicotine/tobacco use

Purpose: clinical context for nicotine dependence and treatment suitability.

Questions:

5. **Do you currently smoke cigarettes?**
   - Daily
   - Some days
   - Not currently, but I used to
   - Never

6. **If you smoke, about how many cigarettes do you smoke per day?**
   - 1–5
   - 6–10
   - 11–20
   - 21–30
   - 31+
   - Not applicable

7. **How soon after waking do you usually use your first nicotine product?**
   - Within 5 minutes
   - 6–30 minutes
   - 31–60 minutes
   - After 60 minutes
   - Not applicable

8. **Do you currently vape?**
   - Daily
   - Some days
   - Not currently, but I used to
   - Never

9. **If you vape, what do you use?**
   - Nicotine vape
   - Non-nicotine vape
   - Unsure
   - Not applicable

10. **Do you currently use nicotine pouches or other oral nicotine products?**
   - Yes
   - No
   - Unsure

11. **Do you currently use more than one nicotine product?**
   - Yes
   - No
   - Unsure

Doctor flag examples:

- high dependence: first nicotine within 30 minutes of waking, heavy cigarette use, daily multi-product use
- unclear nicotine exposure: unsure nicotine/non-nicotine vape or unsure pouch status

---

### Screen 3 — Goals and previous quit attempts

Purpose: support smoking/vaping cessation assessment and alternatives.

Questions:

12. **What is your main goal?**
   - Quit completely
   - Reduce use
   - Stop smoking but not ready to stop nicotine entirely
   - Stop vaping
   - Discuss whether a nicotine product is appropriate
   - Unsure

13. **Have you tried to quit or reduce smoking/vaping/nicotine before?**
   - Yes
   - No

14. **Which supports or treatments have you tried before?**
   - Quitline/counselling/behavioural support
   - Nicotine patches
   - Nicotine gum/lozenges/spray/inhalator
   - Prescription medicine
   - Vaping/nicotine vaping product
   - Nicotine pouches/oral nicotine product
   - Other
   - None

15. **Did you have side effects or problems with any previous treatment?**
   - Yes — free text
   - No
   - Not sure

16. **Are you currently requesting a specific product or treatment?**
   - No / I want the doctor’s advice
   - Nicotine replacement therapy
   - Prescription medicine
   - Therapeutic vaping/nicotine vaping product
   - Nicotine pouches/oral nicotine product
   - Written authority/importation support
   - Other

Required acknowledgement:

17. **I understand the doctor may recommend a different option, request more information, decline prescribing, or recommend GP/in-person care.**
   - Yes
   - No

Rule: No = stop or require acknowledgement before continuing.

---

### Screen 4 — Medical and medicine safety screen

Purpose: collect minimum safety information for doctor triage.

Questions:

18. **Do you have any significant heart or blood vessel history?**
   Examples: recent heart attack, stroke/TIA, unstable angina, serious arrhythmia, uncontrolled blood pressure.
   - Yes
   - No
   - Unsure

19. **Do you have significant breathing/lung disease or severe current breathing symptoms?**
   - Yes
   - No
   - Unsure

20. **Have you ever had seizures or epilepsy?**
   - Yes
   - No
   - Unsure

21. **Do you have significant mental-health history or current severe symptoms?**
   Examples: severe depression/anxiety, psychosis, mania, recent self-harm.
   - Yes
   - No
   - Prefer to discuss with doctor

22. **Are you pregnant, breastfeeding, or trying to conceive?**
   - Yes
   - No
   - Not applicable
   - Prefer to discuss with doctor

23. **Do you have diabetes, significant kidney disease, significant liver disease, or another serious medical condition the doctor should know about?**
   - Yes — free text
   - No
   - Unsure

24. **Are you currently taking any prescription medicines, over-the-counter medicines, supplements, or nicotine replacement products?**
   - Yes — free text
   - No
   - Unsure

25. **Do you have any allergies or previous serious reactions to medicines or nicotine products?**
   - Yes — free text
   - No
   - Unsure

Doctor flag examples:

- cardiovascular risk
- respiratory risk
- seizure history
- mental-health/self-harm concern
- pregnancy/breastfeeding/trying to conceive
- medicine/allergy interaction review needed
- serious medical condition/manual doctor review

---

### Screen 5 — Urgent-care red flags

Purpose: identify patients who should not continue a routine online pathway.

Question:

26. **Do you currently have any urgent symptoms or immediate safety concerns?**
   Examples: chest pain, severe shortness of breath, fainting, stroke-like symptoms, seizure, severe allergic reaction, or thoughts of harming yourself or someone else.
   - Yes
   - No

Rule:

- Yes = show urgent-care message and route to `urgent_or_in_person_care_recommended`.
- Patient-facing language should advise calling 000 or seeking urgent medical care if immediate risk.
- Do not continue ordinary booking path unless reviewed by clinician/legal protocol.

---

### Screen 6 — Pouch/oral nicotine specific branch

Only show if patient indicates nicotine pouches/oral nicotine products or the route requires it.

Purpose: collect oral-health and product-use context relevant to doctor review without promoting the product.

Questions:

27. **Have you had recent mouth ulcers, gum disease, oral lesions, unexplained mouth pain, or dental/oral surgery?**
   - Yes
   - No
   - Unsure

28. **Have you had irritation, burns, nausea, dizziness, palpitations, or other side effects from nicotine pouches/oral nicotine products before?**
   - Yes — free text
   - No
   - Never used them

29. **If you are requesting a pouch/oral nicotine product, is it for your own personal use only?**
   - Yes
   - No
   - Not applicable / not requesting

Rule:

- No personal use = hard stop/manual review depending legal protocol; do not present importation/supply as available.
- Oral-health yes/unsure = doctor review flag.

---

### Screen 7 — Importation / written authority branch

Only show if patient is on an importation or written-authority pathway.

Purpose: support doctor review and TGA Personal Importation Scheme context without implying permission to import.

Questions:

30. **Do you understand that completing this quiz does not give you permission to import or receive any product?**
   - Yes
   - No

31. **Do you understand that prescription-only imports require a valid Australian prescription or written authority if clinically issued, and that the product and quantity must match that authority?**
   - Yes
   - No

32. **Are you requesting product for yourself only, not for resale, supply, or giving to another person?**
   - Yes
   - No

33. **Do you understand imported products may not have been evaluated in Australia for safety, quality, or efficacy, and may be seized if legal requirements are not met?**
   - Yes
   - No

Rule:

- Any No = do not route as ordinary continuation; show education/review language or hard stop depending final legal protocol.

---

### Screen 8 — Telehealth readiness and doctor consult requirement

Purpose: support Medical Board telehealth expectations and prepare doctor booking.

Questions:

34. **Can you attend a private phone or video consultation with a doctor?**
   - Yes
   - No

35. **Do you need an interpreter, support person, or accessibility support for the consultation?**
   - Yes — free text
   - No

36. **Do you understand the doctor may require video, more information, or in-person/GP review if telehealth is not appropriate?**
   - Yes
   - No

Rules:

- Cannot attend phone/video = do not allow ordinary doctor booking.
- Interpreter/support need = flag for booking/doctor workflow.
- No acknowledgement = require acknowledgement before continuing.

---

### Screen 9 — Final confirmation before routing

Questions:

37. **I confirm my answers are accurate and complete to the best of my knowledge.**
   - Yes
   - No

38. **I understand this screening quiz does not guarantee a prescription, written authority, product supply, or importation, and the doctor makes the final clinical decision after a real-time consultation.**
   - Yes
   - No

Rule:

- No = cannot continue to signup.

---

## Recommended quiz outcomes

Use neutral routing/status language.

### `continue_to_signup`

Meaning: no automated hard stop was triggered; patient may create account and book doctor after verification/profile completion.

Patient-facing language:

> Based on your answers, you may continue to create an account and book a doctor consultation. A prescription, written authority, product supply or importation is not guaranteed. The doctor will review your information and make the final clinical decision after a real-time consultation.

### `manual_or_doctor_review_before_booking`

Meaning: answers include complexity/risk/missing info that should be reviewed before booking or before ordinary pathway continuation.

Patient-facing language:

> Your answers include information that needs review before the next step. PouchCare may request more information or advise you to speak with a doctor, GP or in-person service. A prescription is not guaranteed.

### `hard_stop_not_suitable_for_service`

Meaning: MVP should not continue, e.g. under 18, outside Australia, no required consent, not personal use where required.

Patient-facing language:

> Based on your answers, PouchCare cannot continue this online pathway. This does not mean you cannot receive care elsewhere. Please speak with your GP, pharmacist or another appropriate health professional.

### `urgent_or_in_person_care_recommended`

Meaning: urgent symptoms/safety concerns or telehealth is not appropriate.

Patient-facing language:

> Your answers suggest you may need urgent or in-person medical care. If this is an emergency or immediate safety concern, call 000 now or attend an emergency department. Otherwise, please contact your GP or an urgent care service.

---

## Automated risk/missing-info flags for doctor dashboard

Suggested flags:

- `age_under_18`
- `outside_australia`
- `state_missing`
- `consent_missing`
- `telehealth_acknowledgement_missing`
- `no_realtime_consult_capacity`
- `interpreter_or_support_needed`
- `urgent_symptoms`
- `self_harm_or_immediate_safety_concern`
- `high_nicotine_dependence`
- `dual_or_multi_product_use`
- `unclear_nicotine_exposure`
- `product_specific_request`
- `requested_pouch_or_oral_nicotine_product`
- `requested_importation_or_written_authority`
- `not_personal_use`
- `cardiovascular_history`
- `respiratory_history_or_symptoms`
- `seizure_history`
- `mental_health_concern`
- `pregnant_breastfeeding_trying_to_conceive`
- `significant_medical_condition`
- `current_medicines_review_needed`
- `allergy_or_adverse_reaction`
- `oral_health_concern`
- `previous_treatment_side_effects`
- `missing_required_answer`
- `free_text_requires_review`

---

## Patient-facing wording rules

### Avoid

- approved
- eligible for prescription
- script ready
- prescription confirmed
- order confirmed
- product reserved
- guaranteed supply
- import approved
- doctor will prescribe

### Use instead

- may continue to account creation
- may book a doctor consultation
- doctor will review your information
- doctor will make the final clinical decision
- prescription is not guaranteed
- written authority/product supply/importation is not guaranteed
- doctor may recommend another option or in-person care

---

## Data/versioning requirements

For each quiz response, store:

- quiz session ID
- quiz version
- question IDs and answer values
- displayed branch/path
- consent/notice version IDs from Screen 0
- timestamp started
- timestamp completed
- source page/path
- outcome status
- automated flags
- later linked patient account ID after signup
- whether answers were changed or supplemented later

Do not silently overwrite original quiz answers. If later corrected, preserve both original and amended values with timestamps.

---

## Implementation guardrails for later

- No app/code implementation until explicitly requested.
- Do not store production quiz answers in localStorage/sessionStorage except a short-lived non-sensitive session token if needed.
- Do not send quiz answers to Shopify, Stripe, analytics, ad pixels, email marketing tools or ordinary support email payloads.
- Do not let the quiz create a prescription, written authority, order, Shopify checkout, or product allocation.
- Doctor dashboard must show original quiz answers, risk flags, consent status and signup/profile verification status.
- Doctor must complete real-time phone/video consult before prescribing decision.

---

## Open review points

- Confirm final nicotine pouch regulatory pathway and whether additional official guidance applies specifically to pouches/oral nicotine products.
- Confirm whether pouch pathway requires stronger default age/ID verification.
- Confirm whether fulfilment/pharmacy/importation partner requires specific quiz acknowledgements.
- Responsible doctor/medical director to approve the clinical risk questions and hard-stop/manual-review logic.
- Lawyer to approve wording for collection notice, consent, importation/personal-use acknowledgements and patient-facing status language.
- Decide whether final quiz should be condensed from 38 planned questions into a shorter dynamic flow while preserving the same compliance coverage.
