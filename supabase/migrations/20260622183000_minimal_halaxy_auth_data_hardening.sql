-- Minimal Halaxy-first auth/data hardening.
-- PouchCare should not collect new clinical quiz/intake data when Halaxy owns intake.
-- Client-side role creation is limited to patient self-onboarding only; doctors/admins are service/admin-managed.

-- 1) Stop arbitrary client role creation while preserving patient self-onboarding after phone OTP.
drop policy if exists "Users can insert own role during signup" on public.user_roles;
drop policy if exists "Users can insert own patient role" on public.user_roles;
drop policy if exists "Users can update own patient role" on public.user_roles;

create policy "Users can insert own patient role"
on public.user_roles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and role = 'patient'
  and status = 'approved'
);

-- Allows /start-consult upsert to be idempotent for the patient's own patient role,
-- without allowing client-side doctor/admin escalation.
create policy "Users can update own patient role"
on public.user_roles
for update
to authenticated
using (
  auth.uid() = user_id
  and role = 'patient'
)
with check (
  auth.uid() = user_id
  and role = 'patient'
  and status = 'approved'
);

-- 2) Deprecate PouchCare clinical quiz writes. Historical rows remain readable by
-- patient/admin for audit, but new patient-facing writes should stop.
revoke insert, update, delete on table public.eligibility_quiz_sessions from anon, authenticated;

drop policy if exists eligibility_quiz_sessions_anon_insert on public.eligibility_quiz_sessions;
drop policy if exists eligibility_quiz_sessions_doctor_select_patient_history on public.eligibility_quiz_sessions;

-- 3) Deprecate PouchCare intake form writes. Halaxy owns clinical intake.
revoke insert, update, delete on table public.intake_forms from anon, authenticated;

drop policy if exists "Patients can manage own intake forms" on public.intake_forms;
drop policy if exists "Doctors can view intake for assigned bookings" on public.intake_forms;
drop policy if exists "Patients can view own intake forms" on public.intake_forms;

create policy "Patients can view own intake forms"
on public.intake_forms
for select
to authenticated
using (auth.uid() = patient_id);

-- Keep existing admin select policy for historical support/audit.
