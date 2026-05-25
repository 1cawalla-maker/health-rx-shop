# Step 1 — patient prescreen quiz requirements

**Status:** research / product requirements only. Not legal advice, not clinical advice, and not a final clinical protocol. Must be reviewed by the responsible doctor/medical director and Australian health/privacy lawyer before launch.

**Scope:** PouchCare website step one: patient prescreen quiz before nurse prescreening. This is for a phone-first online clinic workflow. The quiz must collect useful clinical and compliance information, but must not approve treatment or generate a prescription by itself.

---

## 1. Core position

The prescreen quiz should be treated as **clinical intake**, not as an eligibility engine that decides whether someone gets prescribed.

The quiz should:

- identify whether the patient can safely proceed to nurse prescreening
- collect the minimum necessary identity, contact, consent and clinical history
- flag risk issues for the nurse/doctor
- prepare a clean case file for doctor review
- make clear that a doctor decides suitability after a real-time consultation

The quiz should not:

- say the patient is “approved”
- guarantee a prescription
- substitute for the doctor consultation
- hide risk answers from the doctor
- collect irrelevant lifestyle/commercial data
- send clinical answers into Shopify, Stripe, ordinary email or analytics

---

## 2. What comparable nicotine/vape telehealth clinics collect publicly

Public-facing Australian nicotine/vape telehealth clinics generally describe the first step as an online assessment/questionnaire that collects:

- smoking history
- vaping history
- medical history
- age/identity verification
- eligibility for nicotine prescription
- doctor review
- telehealth consultation or doctor contact

Examples found:

1. **Quit Clinics** says its online process starts with “Medical & Smoking History” and a secure questionnaire that asks individualised questions related to medical and smoking history, then age verification, then Australian doctor review and a doctor call within 24 hours.
2. **Quit Clinics product page** says it asks quick questions about health and smoking history, confirms the patient is over 18, requires ID verification and doctor review.
3. **Smokefree Clinic** describes phone telehealth consultation with TGA-authorised prescribers, nicotine vaping prescriptions if eligible, and treatment options including NVPs, NRT, prescribed medications and counselling/behavioural therapy.
4. **Quit Hero** describes account creation, online assessment asking about smoking/vaping and medical history, medical team review, and pharmacy access after review.

These examples support the pattern: **online intake → age/ID → clinician/doctor review → prescription only if eligible/appropriate**.

However, PouchCare should not copy any clinic’s questionnaire blindly. The safer structure should be based on regulator/clinical sources.

---

## 3. Mandatory vs useful information before nurse prescreen

### 3.1 Mandatory for compliance / safe triage

These should be required before the nurse call:

1. **Privacy and sensitive-health consent**
   - Patient confirms they understand health information is being collected.
   - Patient consents to collection/use/disclosure for clinical assessment, prescribing support, records, fulfilment and compliance.

2. **Prescription-not-guaranteed acknowledgement**
   - Patient confirms they understand the quiz does not guarantee treatment or supply.
   - Doctor makes the final decision.

3. **Identity and contact**
   - Legal first and last name.
   - Date of birth.
   - Phone number.
   - Email.
   - Residential address.
   - Shipping address if different.

4. **Age confirmation**
   - Confirm 18+.
   - If under 18: hard stop or separate specialist pathway only after legal/clinical review. For current MVP: exclude under 18.

5. **Location / jurisdiction**
   - Confirm patient is in Australia / Australian patient pathway.
   - Capture state/territory because prescribing/supply rules can vary.

6. **Reason for seeking treatment**
   - Smoking cessation.
   - Vaping cessation.
   - Management of nicotine dependence.
   - Other — requires nurse/doctor review.

7. **Current tobacco/vape/nicotine use**
   - Current smoker, ex-smoker, current vaper, dual user, nicotine pouch user, other nicotine use.
   - Frequency and quantity.
   - Time to first nicotine use after waking.

8. **Nicotine dependence indicators**
   - Cravings.
   - Withdrawal symptoms.
   - Failed quit attempts.
   - Difficulty delaying first use.
   - Use despite harm or desire to stop.

9. **Previous quit attempts and therapies**
   - Tried counselling/Quitline.
   - Tried NRT: patches, gum, lozenges, spray, inhaler.
   - Tried prescription medicines: varenicline, bupropion, others.
   - Tried vaping/NVPs or other nicotine products.
   - What worked / side effects / why stopped.

10. **Medical history and contraindication/risk screen**
   - Cardiovascular disease, recent heart attack, unstable angina, severe arrhythmia, recent stroke/TIA.
   - Respiratory disease or significant breathing symptoms.
   - Seizure history.
   - Significant mental health history, current severe anxiety/depression, psychosis, mania, self-harm/suicidal thoughts.
   - Pregnancy/breastfeeding/trying to conceive where relevant.
   - Diabetes, kidney/liver disease where relevant to medication choice.
   - Recent hospitalisation or serious acute illness.

11. **Current medicines and allergies**
   - Prescription medicines.
   - OTC medicines.
   - Supplements.
   - Allergies/adverse reactions.

12. **Urgent red flags**
   - Chest pain, severe shortness of breath, fainting, stroke-like symptoms, seizure, suicidal intent, severe allergic reaction.
   - If present: do not continue normal pathway; instruct urgent care / emergency call and flag for nurse/doctor.

13. **Telehealth readiness**
   - Can take a private phone call.
   - Can verify identity.
   - Has support person/interpreter needs.
   - Understands doctor may require video/in-person care.

### 3.2 Useful but not mandatory for every patient

These are useful for nurse/doctor review but can be optional or asked only where relevant:

- usual GP name/clinic
- permission to send GP summary
- Medicare number if PBS/Medicare billing is implemented; otherwise avoid by default
- photo ID upload; use only if identity verification requires it
- previous prescription upload
- pharmacy preference
- preferred appointment time
- preferred support method: phone/SMS/email/portal
- reason/motivation for quitting
- triggers: stress, alcohol, social situations, after meals, morning, driving
- confidence/readiness to quit scale
- target quit date
- preferred treatment style: NRT, prescription medicine, counselling, therapeutic vape/NVP, unsure
- prior adverse effects from nicotine products
- household child/pet exposure risk for nicotine poisoning education

---

## 4. Proposed quiz structure

### Screen 0 — clinical/service disclaimer

**Purpose:** prevent ecommerce/approval framing.

1. “I understand this questionnaire is for clinical intake only and does not guarantee a prescription or supply.”
   - Required: yes.
   - If no: stop.

2. “I understand a registered doctor must decide whether treatment is clinically appropriate after review and consultation.”
   - Required: yes.
   - If no: stop.

---

### Screen 1 — privacy and consent

1. “I consent to PouchCare collecting and using my personal and sensitive health information for eligibility screening, nurse prescreening, doctor assessment, prescriptions/written authorities if appropriate, clinical records, fulfilment and compliance.”
   - Required: yes.
   - If no: stop.

2. “I consent to relevant information being shared with authorised clinical/admin staff, the consulting doctor, and fulfilment/pharmacy/import partners only as needed.”
   - Required: yes.
   - If no: stop.

3. “I have read the collection notice / privacy policy.”
   - Required: yes.
   - Store privacy notice version and timestamp.

---

### Screen 2 — identity and contact

1. Legal first name.
2. Legal last name.
3. Date of birth.
4. Mobile number.
5. Email.
6. Residential address.
7. Shipping address, if different.
8. State/territory.
9. “Are you currently in Australia?”
10. “Are you 18 years or older?”

**Rules:**

- Under 18: hard stop for MVP.
- Outside Australia: stop or manual review depending final legal model.
- Missing phone/email/address: cannot proceed to nurse prescreen.

---

### Screen 3 — what help is the patient seeking?

1. “What are you seeking help with?”
   - Quit smoking cigarettes.
   - Quit vaping.
   - Manage nicotine dependence.
   - Reduce smoking/vaping.
   - Access a specific nicotine product.
   - Other.

2. “Are you requesting a specific product or treatment?”
   - No / unsure.
   - NRT.
   - prescription medicine.
   - therapeutic vape / nicotine vaping product.
   - nicotine pouch / oral nicotine product.
   - other.

3. “Do you understand the doctor may recommend a different option or decline prescribing?”
   - Required yes.

**Rule:** Product preference should be treated as patient preference, not an order.

---

### Screen 4 — current nicotine/tobacco use

1. “Do you currently smoke cigarettes?”
   - daily / some days / not currently / never.

2. “If yes, how many cigarettes per day?”
   - 1–5 / 6–10 / 11–20 / 21–30 / 31+ / free text.

3. “How soon after waking do you usually have your first cigarette or nicotine product?”
   - within 5 minutes / 6–30 minutes / 31–60 minutes / after 60 minutes / not applicable.

4. “Do you currently vape?”
   - daily / some days / not currently / never.

5. “If vaping, what do you use?”
   - nicotine vape / non-nicotine vape / unsure / other.

6. “How often do you vape?”
   - many times daily / daily / weekly / occasionally / not currently.

7. “Do you use nicotine pouches or other oral nicotine products?”
   - yes/no; details.

8. “Do you use more than one nicotine product?”
   - cigarettes + vape / cigarettes + pouch / vape + pouch / other.

**Reason:** identifies smoking/vaping status, dual use, nicotine dependence and treatment pathway.

---

### Screen 5 — dependence and withdrawal

1. “Do you get strong cravings for nicotine?”
2. “Do you feel irritable, anxious, restless, low mood or have trouble concentrating when you try to stop?”
3. “Have you tried to quit but could not stay stopped?”
4. “Do you continue using nicotine even though you want to stop or reduce?”
5. “Do you wake at night or early morning needing nicotine?”
6. “How important is quitting/reducing to you right now?” 0–10.
7. “How confident are you that you can quit/reduce with support?” 0–10.
8. “Do you have a target quit/reduction date?”

**Reason:** supports dependence assessment and helps nurse/doctor tailor support.

---

### Screen 6 — previous quit attempts and treatments

1. “Have you tried to quit or reduce before?”
   - yes/no.

2. “What have you tried?”
   - cold turkey.
   - Quitline/counselling/behavioural support.
   - nicotine patches.
   - nicotine gum/lozenges/spray/inhaler.
   - combination NRT.
   - varenicline.
   - bupropion.
   - therapeutic vaping/NVP.
   - other.

3. “What helped?”
4. “What did not help?”
5. “Any side effects or problems?”
6. “Why did you restart or continue nicotine?”
   - cravings, stress, social triggers, withdrawal, habit, weight/appetite, mental health, other.

**Reason:** RACGP recommends first-line approved pharmacotherapies and behavioural support; NVPs are later-line/shared-decision option after first-line therapy has failed and the patient remains motivated.

---

### Screen 7 — medical history / risk screen

Ask yes/no with details for yes:

1. Heart disease, heart attack, angina or heart rhythm problems.
2. Stroke/TIA or significant blood vessel disease.
3. High blood pressure not well controlled.
4. Severe breathing problems, COPD/asthma flare, recent pneumonia or unexplained shortness of breath.
5. Seizures or epilepsy.
6. Current cancer treatment or major immune suppression.
7. Diabetes.
8. Kidney or liver disease.
9. Current pregnancy, breastfeeding or trying to conceive.
10. Current severe anxiety/depression, bipolar disorder, psychosis, eating disorder or other significant mental health condition.
11. Thoughts of self-harm or suicide currently or recently.
12. Alcohol or other drug dependence/concerns.
13. Recent hospitalisation, surgery or major illness.
14. Any other medical condition the doctor should know about.

**Rules:**

- Acute chest pain/severe shortness of breath/stroke symptoms/seizure/suicidal intent: urgent care stop.
- Pregnancy/breastfeeding, recent MI/unstable angina/severe arrhythmia/recent stroke, severe mental health symptoms: proceed only as high-risk doctor review; nurse cannot reassure.

---

### Screen 8 — medicines and allergies

1. “List all current prescription medicines.”
2. “List over-the-counter medicines, supplements or nicotine products.”
3. “Do you have allergies or adverse reactions to medicines, nicotine products, adhesives/patches or vape ingredients?”
4. “Have you had side effects from nicotine replacement therapy, varenicline, bupropion, vaping products or pouches?”

**Reason:** doctor needs this for interactions, contraindications and treatment selection.

---

### Screen 9 — telehealth suitability

1. “Can you take a private phone call with a nurse/doctor?”
2. “Is there anyone you want present for the call?”
3. “Do you need an interpreter or communication support?”
4. “Do you have access to video if the doctor decides video is needed?”
5. “Do you understand you may be referred to GP/in-person/urgent care if telehealth is not appropriate?”

---

### Screen 10 — supporting documents

Optional uploads:

- existing prescription
- medication list
- GP/specialist letter
- relevant test results
- photo ID if required by verification process

Warning text:

> Only upload documents relevant to this assessment. Do not upload unrelated medical records.

---

### Screen 11 — final declaration

1. “The information I provided is accurate and complete to the best of my knowledge.”
2. “I understand withholding information may affect safe clinical assessment.”
3. “I understand the nurse may ask further questions and the doctor may decline, defer, or require video/in-person care.”
4. “I understand treatment options may include behavioural support, NRT, prescription medicines, no prescription, referral, or other care.”

---

## 5. Required outputs from the quiz

The quiz should output a structured case summary for nurse and doctor review:

- patient identity/contact block
- consent block
- current smoking/vaping/nicotine status
- dependence indicators
- previous quit attempts/treatments
- requested treatment/product preference
- medical risk flags
- medicine/allergy flags
- pregnancy/breastfeeding flag
- mental health/self-harm flag
- urgent care flag
- telehealth suitability flag
- missing information checklist
- recommended nurse prescreen questions

The output should use language like:

- “Risk flag: doctor review required”
- “Missing information: clarify during nurse call”
- “Urgent-care response triggered”

Avoid language like:

- “approved”
- “eligible for prescription”
- “script ready”
- “doctor should prescribe”

---

## 6. Hard stops and escalation rules

### Hard stop: cannot proceed

- refuses privacy/sensitive health consent
- refuses prescription-not-guaranteed acknowledgement
- under 18 for MVP
- cannot provide phone/contact details
- acute emergency symptoms reported
- currently outside supported jurisdiction/pathway, if final legal model requires Australia only

### Nurse call allowed but high-risk doctor review flagged

- pregnancy/breastfeeding/trying to conceive
- recent heart attack, unstable angina, severe arrhythmia or recent stroke/TIA
- uncontrolled high blood pressure
- severe mental health symptoms
- recent suicidality/self-harm history
- seizure history
- significant drug/alcohol dependence
- complex medication interactions
- prior serious adverse reaction to nicotine/treatment products
- unclear product request or non-cessation intent

### Normal nurse prescreen queue

- adult patient
- consented
- contactable
- no urgent red flags
- seeking smoking/vaping/nicotine-dependence support
- basic clinical information completed

---

## 7. Question list for build

### Mandatory questions

1. Do you understand this quiz does not guarantee a prescription or supply?
2. Do you understand a registered doctor decides whether treatment is appropriate?
3. Do you consent to collection/use of personal and sensitive health information for this clinical pathway?
4. Do you consent to relevant information being shared with authorised clinical/admin staff, doctor and fulfilment/pharmacy/import partners as needed?
5. Have you read the collection notice/privacy policy?
6. Legal first name.
7. Legal last name.
8. Date of birth.
9. Mobile phone number.
10. Email.
11. Residential address.
12. Shipping address, if different.
13. State/territory.
14. Are you currently in Australia?
15. Are you 18 or older?
16. What are you seeking help with: quit smoking, quit vaping, manage nicotine dependence, reduce use, access specific product, other?
17. Are you requesting a specific product/treatment? If yes, what?
18. Do you understand the doctor may recommend something different or decline prescribing?
19. Do you currently smoke cigarettes? Frequency?
20. How many cigarettes per day?
21. How soon after waking do you first use cigarettes/nicotine?
22. Do you currently vape? Frequency?
23. If vaping, nicotine/non-nicotine/unsure?
24. Do you use nicotine pouches or other oral nicotine products?
25. Do you use more than one nicotine product?
26. Do you get strong cravings?
27. Do you get withdrawal symptoms when stopping/reducing?
28. Have you tried to quit but could not stay stopped?
29. Do you continue nicotine despite wanting to stop/reduce?
30. Have you tried quitting/reducing before?
31. Which treatments/supports have you tried?
32. What helped?
33. What did not help or caused side effects?
34. Do you have heart disease, recent heart attack, angina, rhythm problems, stroke/TIA, or uncontrolled blood pressure?
35. Do you have serious breathing disease or severe/unexplained shortness of breath?
36. Do you have seizure history?
37. Are you pregnant, breastfeeding or trying to conceive?
38. Do you have significant mental health conditions or current severe symptoms?
39. Have you had recent thoughts of self-harm or suicide?
40. Do you have alcohol or other drug dependence/concerns?
41. Any recent hospitalisation, major illness or surgery?
42. Any other medical condition the doctor should know about?
43. List current prescription medicines.
44. List OTC medicines/supplements/nicotine products.
45. Any allergies/adverse reactions?
46. Any previous side effects from NRT, varenicline, bupropion, vaping products or pouches?
47. Can you take a private phone call with nurse/doctor?
48. Do you need interpreter/communication support?
49. Do you have video access if doctor requires it?
50. Do you understand telehealth may not be appropriate and GP/in-person/urgent care may be required?
51. Final declaration: information is accurate and complete.

### Useful optional questions

1. Usual GP name/clinic.
2. Consent to send GP summary if clinically warranted.
3. Preferred appointment time.
4. Preferred contact method.
5. Target quit/reduction date.
6. Importance of quitting/reducing, 0–10.
7. Confidence in quitting/reducing, 0–10.
8. Main triggers: stress, alcohol, social, meals, driving, morning, boredom, other.
9. Main motivation: health, family, cost, fitness, pregnancy/fertility, work, other.
10. Existing prescription upload.
11. Medication list upload.
12. GP/specialist letter upload.
13. Pharmacy preference.

---

## 8. Source mapping

- **Medical Board telehealth guidance:** supports the rule that quiz-only/asynchronous prescribing is not enough; real-time direct consultation by phone/video/in-person is required for new patients where the doctor has not previously spoken with the patient. Also supports identity confirmation, informed consent, secure clinical records, prescription handling, and telehealth-specific documentation.
- **OAIC APP 3 and APP 5:** supports asking only reasonably necessary information, obtaining consent for sensitive health information, and giving collection notices before/at collection.
- **TGA prescriber information for vapes:** supports collecting age, clinical need, complexity, informed consent, state/territory context, treatment purpose, and whether therapeutic vapes are clinically appropriate. Also states vapes are unapproved goods and prescribers should consider approved products, risks, informed consent and legal requirements.
- **TGA patient information for vapes:** supports collecting whether the patient is seeking smoking cessation/management of nicotine dependence, age, identity, medical complexity, product type/strength and state restrictions. It also states therapeutic vapes are not first-line treatment and personal importation of vapes from overseas is prohibited.
- **RACGP smoking cessation guideline / pharmacotherapy chapter:** supports collecting nicotine dependence, previous quit attempts, previous first-line therapy, patient preference, clinical suitability, contraindications, medication interactions, pregnancy, cardiovascular disease, mental health history, and need for behavioural support/follow-up. It specifically frames NVPs as a later option where first-line therapy has failed and the patient remains motivated, after shared decision-making.
- **Quit Clinics public workflow:** supports collecting medical and smoking history, age verification, identity details, doctor review and doctor call/contact before prescription.
- **Smokefree Clinic public workflow:** supports telehealth consultation with specialist prescriber, prescriptions only if eligible, and treatment options beyond vaping including NRT, prescribed medications and counselling/behavioural therapy.
- **Quit Hero public workflow:** supports account creation, online assessment about smoking/vaping and medical history, medical team review, and pharmacy access only after review.

---

## 9. Source URLs

Official / clinical sources:

- Medical Board of Australia — Telehealth consultations with patients
  https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Telehealth-consultations-with-patients.aspx
- OAIC — APP 3 Collection of solicited personal information
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information
- OAIC — APP 5 Notification of collection
  https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information
- TGA — Vapes: information for prescribers
  https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/vapes-information-prescribers
- TGA — Vapes: information for individuals and patients
  https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/vapes-information-individuals-and-patients
- RACGP — Supporting smoking cessation: A guide for health professionals
  https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/supporting-smoking-cessation
- RACGP — Pharmacotherapy for smoking cessation
  https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/supporting-smoking-cessation/pharmacotherapy-for-smoking-cessation

Comparable clinic examples:

- Quit Clinics — How it works
  https://www.quitclinics.com/how-it-works/
- Quit Clinics — Apply for a vape prescription
  https://www.quitclinics.com/product/subscription/
- Smokefree Clinic
  https://smokefreeclinic.com.au/
- Quit Hero
  https://www.quithero.com.au/

---

## 10. Addendum — mouth/oral-health screen for pouch pathway

Because nicotine pouches sit against the oral mucosa/gums, the prescreen quiz should include a short oral-health screen. This should not be a dental diagnosis. It should identify irritation, lesions, dental/gum disease, swallowing risk and reasons for nurse/doctor review before recommending or prescribing an oral nicotine product.

### Recommended website quiz questions

Add these to the short website quiz if the patient requests or may be offered nicotine pouches/oral nicotine products:

1. Do you currently have any mouth ulcers, sores, cuts, bleeding gums, gum disease, dental infection, severe tooth pain, or unexplained mouth/throat pain?
2. Have you noticed any white/red patches, lumps, swelling, numbness, or non-healing areas in your mouth, lips, tongue, gums or throat?
3. Have you recently had dental/oral surgery, tooth extraction, gum treatment, or major dental work?
4. Do nicotine pouches, lozenges, gum, sprays or similar oral products cause burning, irritation, nausea, hiccups, mouth pain, rash or allergic-type reactions for you?
5. Do you have difficulty swallowing, choking risk, or a condition that makes it unsafe to keep a pouch in your mouth?

### Triage rules

- **Urgent / GP-dentist review before pouch pathway:** unexplained non-healing ulcer/patch/lump, significant swelling, severe infection symptoms, bleeding that is not minor, severe pain, difficulty swallowing/breathing, or suspected allergic reaction.
- **Nurse clarification + doctor review:** active gum disease, mouth irritation, recent dental work, prior intolerance to oral nicotine products, or uncertainty about safe pouch use.
- **Proceed to nurse prescreen:** no active mouth/oral-health issues and no prior intolerance.

### Why this belongs in the quiz

- It is directly relevant to product suitability because the product sits in the mouth.
- It supports data minimisation: ask a few targeted oral-health questions only when oral nicotine products are relevant.
- It helps the nurse/doctor decide whether pouches are appropriate, whether another cessation option is safer, or whether dental/GP review is needed first.
- It aligns with the broader TGA/RACGP safety logic: treatment choice should consider clinical suitability, risks, patient history, adverse effects and alternatives.

### Source note

The official TGA patient information for therapeutic vapes notes that nicotine/vaping products may have oral-health impacts, including gum inflammation and impaired gum healing. While that source is about vaping rather than pouches, it supports asking oral-health safety questions when nicotine products may affect the mouth. For pouches specifically, final wording should be reviewed by the responsible clinician/dentist because Australian regulator guidance on nicotine-pouch-specific clinical screening is less explicit than for smoking/vaping cessation generally.
