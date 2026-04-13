-- 2026-04-13
-- Allow doctors to view issued prescription history for patients they have consultations with.

alter table public.issued_prescriptions enable row level security;

drop policy if exists issued_prescriptions_doctor_select_patient_history on public.issued_prescriptions;
create policy issued_prescriptions_doctor_select_patient_history
on public.issued_prescriptions
for select
to authenticated
using (
  -- caller is a doctor (exists in doctors table)
  exists (
    select 1 from public.doctors d
    where d.user_id = auth.uid()
  )
  and
  -- caller has (at least one) consultation with this patient
  exists (
    select 1
    from public.consultations c
    where c.patient_id = issued_prescriptions.patient_id
      and c.doctor_id = auth.uid()
  )
);
