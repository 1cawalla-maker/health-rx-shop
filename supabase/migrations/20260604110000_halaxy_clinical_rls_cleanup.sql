-- Halaxy consultation source-of-truth cleanup.
-- Halaxy owns consultation booking/payment; PouchCare owns clinical workflow,
-- notes, prescriptions, audit trail, and shop access.

-- Patients must be able to see doctor-issued prescriptions that unlock the shop.
-- Recreate explicitly because later doctor-MVP migrations changed doctor policies
-- and some linked environments no longer show this patient SELECT policy.
drop policy if exists "Patients can view own issued prescriptions" on public.doctor_issued_prescriptions;
create policy "Patients can view own issued prescriptions"
on public.doctor_issued_prescriptions
for select
to authenticated
using (auth.uid() = patient_id);

-- Remove legacy consultation_notes policy names that assumed
-- consultation_notes.doctor_id = auth.users.id. Current schema stores
-- public.doctors.id in doctor_id; newer policies join doctors.user_id.
drop policy if exists "Doctors can manage own notes" on public.consultation_notes;
drop policy if exists consultation_notes_doctor_select_own_legacy on public.consultation_notes;
drop policy if exists consultation_notes_doctor_insert_own_legacy on public.consultation_notes;
drop policy if exists consultation_notes_doctor_update_own_legacy on public.consultation_notes;

-- Make the Halaxy ownership boundary explicit in database documentation.
comment on column public.consultations.booking_provider is
  'Consultation booking owner. halaxy means appointment booking/payment are owned by Halaxy; PouchCare stores clinical workflow state only.';
comment on column public.consultations.booking_status is
  'Mirrored appointment/booking state for patient and doctor workflow. Do not use for PouchCare consultation payment gating when booking_provider = halaxy.';
comment on column public.consultations.halaxy_payment_status is
  'Deprecated for PouchCare clinical workflow. Halaxy owns consultation payment state; retain only for legacy/null-safe compatibility until cleanup.';
comment on column public.consultations.halaxy_invoice_id is
  'Deprecated for PouchCare clinical workflow. Halaxy owns consultation invoices/payments.';
comment on column public.consultations.halaxy_payment_transaction_id is
  'Deprecated for PouchCare clinical workflow. Halaxy owns consultation payment transactions.';
comment on column public.consultations.halaxy_charge_item_definition_id is
  'Deprecated for PouchCare clinical workflow. Halaxy owns consultation charge/payment configuration.';

-- Optional Halaxy practitioner mapping. Populate this for each PouchCare doctor
-- once their Halaxy practitioner id is known; the webhook then assigns
-- consultations.doctor_id automatically.
alter table public.doctors
  add column if not exists halaxy_practitioner_id text null;

create unique index if not exists doctors_halaxy_practitioner_id_key
  on public.doctors(halaxy_practitioner_id)
  where halaxy_practitioner_id is not null;

comment on column public.doctors.halaxy_practitioner_id is
  'Halaxy Practitioner resource id used to map appointment webhooks back to public.doctors.id.';

-- Doctor privacy hardening: doctors should only see/update assigned clinical
-- consultations. Unassigned Halaxy/manual-review rows are admin/ops concerns,
-- not a shared doctor pool containing patient clinical data.
drop policy if exists "Doctors can view assigned consultations" on public.consultations;
create policy "Doctors can view assigned consultations"
on public.consultations
for select
to authenticated
using (
  public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    where d.user_id = auth.uid()
      and consultations.doctor_id = d.id
  )
);

drop policy if exists "Doctors can update assigned consultations" on public.consultations;
create policy "Doctors can update assigned consultations"
on public.consultations
for update
to authenticated
using (
  public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    where d.user_id = auth.uid()
      and consultations.doctor_id = d.id
  )
)
with check (
  public.has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    where d.user_id = auth.uid()
      and consultations.doctor_id = d.id
  )
);

-- Same hardening for clinical notes/events/history: no patient clinical data
-- from unassigned rows in generic doctor sessions.
drop policy if exists consultation_notes_doctor_select_patient_history on public.consultation_notes;
create policy consultation_notes_doctor_select_patient_history
on public.consultation_notes
for select
to authenticated
using (
  internal_only = true
  and note_type = 'clinical'
  and exists (
    select 1
    from public.consultations note_consultation
    join public.consultations active_consultation
      on active_consultation.patient_id = note_consultation.patient_id
    join public.doctors d on d.user_id = auth.uid()
    where note_consultation.id = consultation_notes.booking_id
      and active_consultation.doctor_id = d.id
  )
);

drop policy if exists consultation_events_doctor_select_own on public.consultation_events;
create policy consultation_events_doctor_select_own
on public.consultation_events
for select
to authenticated
using (
  exists (
    select 1
    from public.consultations c
    join public.doctors d on d.user_id = auth.uid()
    where c.id = consultation_events.consultation_id
      and c.doctor_id = d.id
  )
);

drop policy if exists consultation_events_doctor_insert_own on public.consultation_events;
create policy consultation_events_doctor_insert_own
on public.consultation_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.consultations c
    join public.doctors d on d.user_id = auth.uid()
    where c.id = consultation_events.consultation_id
      and c.doctor_id = d.id
  )
);

drop policy if exists "Doctors can view patient prescription history for consultations" on public.doctor_issued_prescriptions;
create policy "Doctors can view patient prescription history for consultations"
on public.doctor_issued_prescriptions
for select
to authenticated
using (
  has_role(auth.uid(), 'doctor'::app_role)
  and exists (
    select 1
    from public.consultations c
    join public.doctors d on d.user_id = auth.uid()
    where c.patient_id = doctor_issued_prescriptions.patient_id
      and c.doctor_id = d.id
  )
);

-- Align call_attempts with the current doctor consultation workspace.
-- Historical schema used consultation_bookings.booking_id and doctor_id = auth.users.id;
-- current clinical workflow uses consultations.id and doctor_id = public.doctors.id.
alter table public.call_attempts
  add column if not exists consultation_id uuid,
  add column if not exists doctor_user_id uuid,
  add column if not exists answered boolean not null default false;

-- Allow new consultation-based attempts to be inserted without the legacy booking id,
-- but only on older databases that still have the legacy column.
do $do$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'call_attempts'
      and column_name = 'booking_id'
  ) then
    alter table public.call_attempts
      alter column booking_id drop not null;
  end if;
end $do$;

-- Remove the legacy hard max of 3 attempts; product rule is at least 3 unanswered
-- attempts before no-show, not a storage cap.
alter table public.call_attempts
  drop constraint if exists valid_attempt_number;

do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'call_attempts_attempt_number_check'
      and conrelid = 'public.call_attempts'::regclass
  ) then
    alter table public.call_attempts
      add constraint call_attempts_attempt_number_check check (attempt_number >= 1);
  end if;
end $do$;

-- Add FK when possible. Existing legacy rows may have null consultation_id.
do $do$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'call_attempts_consultation_id_fkey'
  ) then
    alter table public.call_attempts
      add constraint call_attempts_consultation_id_fkey
      foreign key (consultation_id) references public.consultations(id) on delete cascade
      not valid;
  end if;
end $do$;

create index if not exists call_attempts_consultation_id_idx
  on public.call_attempts(consultation_id, attempt_number);

create index if not exists call_attempts_doctor_id_idx
  on public.call_attempts(doctor_id);

-- Replace legacy auth-user doctor policies with public.doctors.id policies.
drop policy if exists "Doctors can manage call attempts" on public.call_attempts;
drop policy if exists "Patients can view own booking attempts" on public.call_attempts;

create policy "Doctors can manage call attempts"
on public.call_attempts
for all
to authenticated
using (
  has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    left join public.consultations c on c.id = call_attempts.consultation_id
    where d.user_id = auth.uid()
      and call_attempts.doctor_id = d.id
      and (call_attempts.consultation_id is null or c.doctor_id = d.id)
  )
)
with check (
  has_role(auth.uid(), 'doctor')
  and exists (
    select 1
    from public.doctors d
    left join public.consultations c on c.id = call_attempts.consultation_id
    where d.user_id = auth.uid()
      and call_attempts.doctor_id = d.id
      and (call_attempts.consultation_id is null or c.doctor_id = d.id)
  )
);

create policy "Patients can view own consultation attempts"
on public.call_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.consultations c
    where c.id = call_attempts.consultation_id
      and c.patient_id = auth.uid()
  )
);

-- Twilio call logs should follow the same assigned-doctor privacy boundary.
drop policy if exists twilio_call_logs_doctor_select_own on public.twilio_call_logs;
create policy twilio_call_logs_doctor_select_own
on public.twilio_call_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.consultations c
    join public.doctors d on d.user_id = auth.uid()
    where c.id = twilio_call_logs.consultation_id
      and c.doctor_id = d.id
  )
);
