-- Website-first PouchCare pouch intake questionnaire.
-- Stores structured questionnaire answers in eligibility_quiz_sessions.answers JSONB,
-- then links the row to the patient account after phone/account onboarding.
-- This restores the website-first intake architecture after the temporary Halaxy-only hardening.

alter table public.eligibility_quiz_sessions enable row level security;

grant insert on table public.eligibility_quiz_sessions to anon, authenticated;
grant select on table public.eligibility_quiz_sessions to authenticated;

-- Public pre-signup quiz submission. Anonymous users may insert an unlinked quiz
-- row only; they still cannot read questionnaire rows because there is no anon
-- SELECT policy.
drop policy if exists eligibility_quiz_sessions_anon_insert on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_anon_insert
on public.eligibility_quiz_sessions
for insert
to anon, authenticated
with check (patient_id is null and result = 'completed');

-- Patients can view their own linked quiz record.
drop policy if exists eligibility_quiz_sessions_patient_select_own on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_patient_select_own
on public.eligibility_quiz_sessions
for select
to authenticated
using (patient_id = auth.uid());

-- Doctors can view questionnaire rows only for patients assigned to them or
-- associated with consultations they are allowed to review.
drop policy if exists eligibility_quiz_sessions_doctor_select_patient_history on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_doctor_select_patient_history
on public.eligibility_quiz_sessions
for select
to authenticated
using (
  public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.consultations c
    left join public.doctors d on d.user_id = auth.uid()
    where c.patient_id = eligibility_quiz_sessions.patient_id
      and (c.doctor_id = auth.uid() or c.doctor_id = d.id)
  )
);

-- Admins can view all questionnaire rows for support/compliance review.
drop policy if exists eligibility_quiz_sessions_admin_select_all on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_admin_select_all
on public.eligibility_quiz_sessions
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
