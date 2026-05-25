# Current Nicotine Pouch Use Quiz Implementation Audit

Date: 2026-05-25

## Scope

Audit and implementation plan for adding current nicotine pouch use details to the PouchCare pre-consultation questionnaire and GP/doctor-facing views.

Requested additions:

1. Confirm whether the patient currently uses nicotine pouches.
2. If yes, capture what mg strength they currently use.

Additional clinically useful context added in the same conditional branch:

3. Approximate number of nicotine pouches used per day.

## Current state before this change

### Quiz UI

File: `src/pages/EligibilityQuiz.tsx`

The quiz already asked:

- `What is your current nicotine use?`

Options included:

- Cigarettes
- Nicotine vaping
- Nicotine pouches
- Recently quit smoking or vaping
- I do not currently use nicotine

So the quiz already captured whether the patient currently uses nicotine pouches.

### Missing clinical detail

The quiz did not ask:

- what mg pouch strength the patient currently uses; or
- how many pouches per day they use.

The only current intensity field was broad:

- low
- moderate
- high

That is useful but not specific enough for the GP when considering current exposure and previous tolerance.

### Storage

File: `supabase/migrations/20260522090000_eligibility_quiz_sessions.sql`

Quiz answers are stored in `public.eligibility_quiz_sessions.answers` as `jsonb`.

Because this is JSONB, no Supabase schema migration is required for adding new answer keys. New answers will be included inside the existing `answers` payload.

### Doctor display

Doctor-facing quiz data is displayed in:

- `src/components/doctor/EligibilityQuizCard.tsx`
- `src/components/doctor/PatientEligibilitySummary.tsx`

Before this change, the doctor could see current nicotine use and broad intensity, but not pouch mg strength or daily pouch volume.

## Implementation decisions

### Conditional question flow

The strength and daily use questions should only appear when:

```ts
answers.nicotine_use === 'nicotine_pouches'
```

This avoids asking irrelevant pouch-specific questions to cigarette/vape-only users.

### Added answer fields

Added to `EligibilityAnswers`:

```ts
current_pouch_strength?: CurrentPouchStrength;
current_pouch_strength_other?: string;
current_pouch_daily_use?: CurrentPouchDailyUse;
```

### Strength options

```text
3 mg per pouch
6 mg per pouch
9 mg per pouch
12 mg per pouch
Other strength
I’m not sure
```

### Daily use options

```text
1–5 pouches per day
6–10 pouches per day
11–20 pouches per day
More than 20 pouches per day
I’m not sure
```

### Doctor-facing placement

The new fields are shown near the top of the doctor review information, immediately after current nicotine use, because this is clinically useful consultation context.

## Files changed

- `src/types/eligibility.ts`
  - Added `CurrentPouchStrength` and `CurrentPouchDailyUse` types.
  - Added optional pouch strength/daily-use answer fields.
  - Added conditional question support via `showWhen`.
  - Added summary labels for doctor display.

- `src/services/eligibilityService.ts`
  - Added conditional pouch strength question.
  - Added conditional pouch daily-use question.

- `src/pages/EligibilityQuiz.tsx`
  - Quiz now filters questions based on `showWhen`.
  - If the user changes away from `nicotine_pouches`, stale pouch-specific answers are cleared.
  - Submission includes pouch fields only when current nicotine use is `nicotine_pouches`.

- `src/components/doctor/EligibilityQuizCard.tsx`
  - Displays current pouch strength and daily use when applicable.

- `src/components/doctor/PatientEligibilitySummary.tsx`
  - Adds pouch strength and pouches/day to the quick summary and expanded response view.

## Supabase impact

No migration required.

Reason: `eligibility_quiz_sessions.answers` is JSONB and already stores the full answer object.

Existing rows remain compatible because the new fields are optional and doctor display falls back to `Not specified`/hidden when not applicable.

## Compliance/UX guardrails

- The patient-facing quiz remains neutral and does not imply approval or eligibility.
- The new fields are presented as information to help the doctor, not as a prescribing rule.
- `not_sure` is allowed so patients are not blocked if they cannot identify exact strength.
- `other` strength supports real-world pouch strengths outside the standard product list.

## Recommended doctor workspace use

Show these fields in the GP consultation workspace patient snapshot:

```text
Current nicotine use: Nicotine pouches
Current pouch strength: 6 mg
Current pouch use: 6–10 pouches/day
```

This should sit above or beside:

- broad nicotine intensity
- previous NRT use
- current medicines/products
- risk flags

## Verification required

Run:

```bash
npm run build
```

Optional manual test:

1. Visit `/eligibility`.
2. Accept notice.
3. Select `Nicotine pouches` for current use.
4. Confirm the strength and daily-use questions appear.
5. Go back and change current use to `Nicotine vaping`.
6. Confirm pouch-specific questions disappear and stale answers are not submitted.
7. Complete quiz and confirm doctor views display pouch details.
