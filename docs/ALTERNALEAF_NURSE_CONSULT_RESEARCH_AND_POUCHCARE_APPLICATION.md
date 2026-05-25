# Alternaleaf nurse consult research and PouchCare application

**Status:** research / product planning only. Alternaleaf’s exact private nurse call script is not public; this document uses public Alternaleaf pages and official regulator/clinical context to infer the likely scope. Not legal advice or a clinical protocol.

---

## 1. What Alternaleaf publicly says the nurse consult covers

### Source: Alternaleaf process page

URL: https://www.alternaleaf.com.au/process

Publicly stated nurse consult preparation:

- patient may be asked about **health history**
- patient may be asked about **current medications**
- patient should have ready:
  - concession card, if any
  - list of current medications and dosages
  - discharge letter if switching from another clinic
  - questions or notes they want to raise

Publicly visible pre-screen questions include:

1. whether the patient has a medical condition lasting longer than 3 months
2. whether they have previously attempted to treat the condition
3. whether previous treatment failed to provide full relief or caused unwanted side effects
4. whether they are pregnant, breastfeeding or trying to conceive
5. whether they have history of psychosis, schizophrenia, or bipolar type 1 or 2

Alternaleaf also states these questions help assess eligibility for a nurse consultation and that being deemed eligible does **not** mean the patient will be prescribed medication.

### Source: Alternaleaf pricing page

URL: https://www.alternaleaf.com.au/pricing

Publicly stated nurse consult positioning:

- complimentary nurse assessment before doctor consult
- 20-minute call
- purpose is to understand the patient’s health needs
- safe/supportive space to talk
- patient can ask questions
- separate paid doctor consultation decides whether treatment is right

Publicly stated doctor consult:

- 10-minute doctor call
- doctor assesses whether treatment is right
- doctor guides care and treatment options

---

## 2. What we can infer, without pretending to know their exact script

Alternaleaf’s nurse call is probably not just “verify quiz answers”. Based on their public pages, it likely does four things:

1. **Clarifies eligibility basics**
   - chronic condition duration
   - prior treatment attempted
   - prior treatment failed / caused side effects
   - pregnancy/breastfeeding exclusion
   - psychosis/bipolar/schizophrenia risk exclusion

2. **Collects clean information for the doctor**
   - health history
   - current medications and dosages
   - prior clinic/discharge letter if transferring
   - patient questions/notes

3. **Sets expectations**
   - nurse consult does not guarantee prescription
   - doctor makes decision
   - doctor may ask for GP/specialist letters, test results or referrals

4. **Improves patient readiness/conversion**
   - supportive first touchpoint
   - explains what to prepare
   - reduces wasted doctor time
   - lets patient ask basic process questions before paying for doctor consult

---

## 3. What PouchCare should copy conceptually

PouchCare should not copy cannabis-specific questions directly. Nicotine pouches are a different product and risk profile.

But the *structure* is useful:

- short nurse call
- verify/clarify key risk answers
- collect clean medication/history details
- answer process questions
- prepare doctor summary
- no promise of approval

For PouchCare, the nurse does **not** need to repeat all 34 quiz questions.

The nurse should only cover:

1. identity/privacy
2. changed or inconsistent quiz answers
3. key risk answers
4. missing information
5. patient questions
6. doctor handover summary

---

## 4. Recommended PouchCare nurse call scope

### A. Opening and identity

- Confirm full legal name
- Confirm DOB
- Confirm residential address
- Confirm current state/territory location
- Confirm privacy: “Are you somewhere private to discuss health information?”
- Confirm consent to document call
- State: “This call does not guarantee a prescription. The doctor makes the final decision after consultation.”

### B. Verify only the important quiz answers

The nurse should not read the whole quiz back. Instead:

- “I’m just going to confirm a few important answers from your form.”
- “Has anything changed since you completed it?”
- “Did you complete the form yourself and answer honestly?”

Then only verify high-value items:

1. Current smoking/vaping/nicotine use
2. Product being requested / intended use
3. Current medications
4. Allergies/adverse reactions
5. Major medical conditions
6. Mental health concerns
7. Pregnancy/breastfeeding/trying to conceive
8. Oral-health issues relevant to pouches
9. Prior quit attempts / first-line therapies tried
10. Importation/personal-use understanding

### C. Clarify nicotine-specific clinical context

Ask:

- “What nicotine products do you currently use?”
- “How often do you use them?”
- “How soon after waking do you use nicotine?”
- “Have you had cravings or withdrawal symptoms when reducing or stopping?”
- “What have you tried before to quit or reduce?”
- “Have you tried patches, gum, lozenges, spray, Quitline, GP or pharmacist support?”

### D. Medication and interaction screen

Ask:

- “Can you confirm all current medications and doses?”
- “Any allergies or bad reactions?”
- “Are you taking any mental health medicines, heart medicines, diabetes medicines, blood thinners, or specialist medicines?”

Flag for doctor if:

- clozapine
- olanzapine
- theophylline
- insulin/diabetes medicines
- flecainide or rhythm medicines
- warfarin/anticoagulants
- heavy caffeine use with smoking reduction
- other specialist medicines

Reason: smoking cessation can change metabolism of some drugs due to tobacco smoke interactions, even though nicotine itself is not usually the CYP interaction driver.

### E. Red flag screen

Ask only the major safety gates:

- “Any recent heart attack, stroke, unstable angina, severe arrhythmia or serious heart issue?”
- “Any current severe chest pain, shortness of breath, fainting, or urgent symptoms?”
- “Any current thoughts of self-harm or feeling unsafe?”
- “Are you pregnant, breastfeeding, or trying to conceive?”
- “Any history of severe reaction to nicotine products?”
- “Any mouth ulcers, gum disease, oral infection, unexplained bleeding, oral lesions, or recent oral surgery?”

### F. Expectations and process questions

- “Do you understand the doctor may approve, decline, ask for more information, or recommend another option?”
- “Do you understand this is not guaranteed?”
- “Do you have any questions you want the doctor to address?”

---

## 5. Recommended call length

For PouchCare, the nurse call should be shorter than Alternaleaf unless there is a flagged issue.

Suggested model:

- **Clean case:** no nurse call; straight to doctor review/consult.
- **Flagged case:** 5–10 minute nurse clarification call.
- **Complex case:** 10–15 minute nurse prescreen, then doctor priority review.

Do not build a 20-minute nurse call as default unless the business model needs nurse-first patient conversion.

---

## 6. Recommended nurse outcome statuses

- `nurse_clarification_completed_doctor_review_required`
- `missing_information_before_doctor_review`
- `priority_doctor_review_required`
- `doctor_to_confirm_specific_risk`
- `in_person_or_gp_review_recommended`
- `urgent_care_recommended`
- `identity_unverified`
- `patient_withdrew`

Avoid:

- `approved`
- `eligible_for_prescription`
- `script_ready`
- `nurse_approved`

---

## 7. Bottom line for PouchCare

PouchCare’s nurse call should mostly be a **risk and clarification call**, not a second full questionnaire.

Recommended wording:

> Some patients may receive a short nurse call before the doctor consultation. The nurse may confirm your details, clarify your answers, check important safety information, and help prepare your file for the doctor. This does not guarantee a prescription. The doctor makes the final clinical decision after consultation.

This gives PouchCare the operational benefit of nurse triage without adding unnecessary friction for every patient.
