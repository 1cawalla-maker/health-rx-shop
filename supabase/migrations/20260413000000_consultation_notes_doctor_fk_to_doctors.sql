-- 2026-04-13
-- Align consultation_notes.doctor_id to reference public.doctors(id)
-- Current prod reality (observed): consultation_notes.doctor_id -> auth.users(id)
-- Frontend + other tables treat doctor_id as doctors.id, so migrate + fix FK.

begin;

-- 1) Backfill doctor_id values from auth uid -> doctors.id
-- Safety: only update rows where there is a matching doctors.user_id
update public.consultation_notes cn
set doctor_id = d.id
from public.doctors d
where d.user_id = cn.doctor_id
  and cn.doctor_id is not null;

-- 2) Drop old FK (to auth.users)
alter table public.consultation_notes
  drop constraint if exists consultation_notes_doctor_id_fkey;

-- 3) Add new FK to public.doctors(id)
alter table public.consultation_notes
  add constraint consultation_notes_doctor_id_fkey
  foreign key (doctor_id)
  references public.doctors(id)
  on delete cascade;

-- 4) Optional: helpful index for doctor-scoped queries
create index if not exists consultation_notes_doctor_id_idx
  on public.consultation_notes(doctor_id);

commit;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
