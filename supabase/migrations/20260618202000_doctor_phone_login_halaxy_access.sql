-- Admin-created doctor accounts + assigned-consult-only doctor prescription access.

alter table public.doctors
  add column if not exists onboarding_invited_at timestamptz null,
  add column if not exists onboarding_completed_at timestamptz null;

create index if not exists doctors_user_id_idx on public.doctors(user_id);
create index if not exists consultations_doctor_halaxy_idx
  on public.consultations(doctor_id, booking_provider, scheduled_at desc)
  where doctor_id is not null;

-- Harden legacy broad doctor prescription policies. Doctors should only see or
-- create uploaded prescriptions for patients/consults assigned to their doctor row.
drop policy if exists "Doctors can view all prescriptions" on public.prescriptions;
drop policy if exists "Doctors can insert prescriptions" on public.prescriptions;
drop policy if exists "Doctors can update prescriptions" on public.prescriptions;
drop policy if exists "Doctors can insert prescriptions issued" on public.prescriptions;
drop policy if exists "Doctors can update own prescriptions" on public.prescriptions;
drop policy if exists "Doctors can update own issued prescriptions" on public.prescriptions;

create policy "Doctors can view assigned consultation prescriptions"
on public.prescriptions
for select
to authenticated
using (
  public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    join public.consultations c on c.doctor_id = d.id
    where d.user_id = auth.uid()
      and c.patient_id = prescriptions.patient_id
      and (
        prescriptions.consultation_id = c.id
        or prescriptions.consultation_id is null
      )
  )
);

create policy "Doctors can insert assigned consultation prescriptions"
on public.prescriptions
for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'doctor')
  and prescription_type = 'uploaded'
  and consultation_id is not null
  and exists (
    select 1
    from public.doctors d
    join public.consultations c on c.doctor_id = d.id
    where d.user_id = auth.uid()
      and c.id = prescriptions.consultation_id
      and c.patient_id = prescriptions.patient_id
  )
);

create policy "Doctors can update assigned consultation prescriptions"
on public.prescriptions
for update
to authenticated
using (
  public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    join public.consultations c on c.doctor_id = d.id
    where d.user_id = auth.uid()
      and c.id = prescriptions.consultation_id
      and c.patient_id = prescriptions.patient_id
  )
)
with check (
  public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    join public.consultations c on c.doctor_id = d.id
    where d.user_id = auth.uid()
      and c.id = prescriptions.consultation_id
      and c.patient_id = prescriptions.patient_id
  )
);
