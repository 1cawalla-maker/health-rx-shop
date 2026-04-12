-- 2026-04-12
-- Persist doctor consultation outcomes (UI-driven Phase 2)
-- - Issued prescriptions (doctor portal list) moved from localStorage -> Supabase
-- - Consultation notes already have a table in production DB (consultation_notes), so we only ensure RLS + policies if needed

-- =============================
-- Issued prescriptions (doctor-facing audit trail)
-- =============================

create extension if not exists pgcrypto;

create table if not exists public.issued_prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  patient_id uuid not null,
  max_strength_mg int not null check (max_strength_mg in (3, 6, 9)),
  issued_at timestamptz not null default now()
);

-- A consultation can only have one issued prescription record (prevents double-issue duplicates)
create unique index if not exists issued_prescriptions_consultation_id_uniq
  on public.issued_prescriptions(consultation_id);

create index if not exists issued_prescriptions_doctor_issued_at
  on public.issued_prescriptions(doctor_id, issued_at desc);

create index if not exists issued_prescriptions_patient_issued_at
  on public.issued_prescriptions(patient_id, issued_at desc);

alter table public.issued_prescriptions enable row level security;

-- Doctors: can read their own issued prescriptions
drop policy if exists issued_prescriptions_doctor_select_own on public.issued_prescriptions;
create policy issued_prescriptions_doctor_select_own
on public.issued_prescriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.doctors d
    where d.id = issued_prescriptions.doctor_id
      and d.user_id = auth.uid()
  )
);

-- Patients: can read their own issued prescriptions
drop policy if exists issued_prescriptions_patient_select_own on public.issued_prescriptions;
create policy issued_prescriptions_patient_select_own
on public.issued_prescriptions
for select
to authenticated
using (issued_prescriptions.patient_id = auth.uid());

-- Doctors: can create issued prescription records for consultations they own
drop policy if exists issued_prescriptions_doctor_insert_own on public.issued_prescriptions;
create policy issued_prescriptions_doctor_insert_own
on public.issued_prescriptions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.doctors d
    where d.id = issued_prescriptions.doctor_id
      and d.user_id = auth.uid()
  )
);

-- No updates/deletes for now (append-only audit trail)


-- =============================
-- Consultation notes (already exists in production DB)
-- =============================
-- If consultation_notes already has correct RLS + policies in your project, this is a no-op.

alter table public.consultation_notes enable row level security;

-- Doctors can manage (select/insert/update) their own notes.
-- NOTE: This assumes consultation_notes.doctor_id references doctors.id.

drop policy if exists consultation_notes_doctor_select_own on public.consultation_notes;
create policy consultation_notes_doctor_select_own
on public.consultation_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.doctors d
    where d.id = consultation_notes.doctor_id
      and d.user_id = auth.uid()
  )
);

drop policy if exists consultation_notes_doctor_insert_own on public.consultation_notes;
create policy consultation_notes_doctor_insert_own
on public.consultation_notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.doctors d
    where d.id = consultation_notes.doctor_id
      and d.user_id = auth.uid()
  )
);

drop policy if exists consultation_notes_doctor_update_own on public.consultation_notes;
create policy consultation_notes_doctor_update_own
on public.consultation_notes
for update
to authenticated
using (
  exists (
    select 1
    from public.doctors d
    where d.id = consultation_notes.doctor_id
      and d.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.doctors d
    where d.id = consultation_notes.doctor_id
      and d.user_id = auth.uid()
  )
);

-- Patients can read non-internal notes for their own booking.
-- NOTE: consultation_notes.booking_id maps to consultations.id in the doctor workspace.

drop policy if exists consultation_notes_patient_select_non_internal on public.consultation_notes;
create policy consultation_notes_patient_select_non_internal
on public.consultation_notes
for select
to authenticated
using (
  internal_only = false
  and exists (
    select 1
    from public.consultations c
    where c.id = consultation_notes.booking_id
      and c.patient_id = auth.uid()
  )
);
