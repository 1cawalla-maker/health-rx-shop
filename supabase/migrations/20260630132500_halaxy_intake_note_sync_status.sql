-- Track website-intake summary sync into Halaxy clinical notes.

alter table public.consultations
  add column if not exists halaxy_intake_note_status text not null default 'not_started',
  add column if not exists halaxy_intake_note_synced_at timestamp with time zone null,
  add column if not exists halaxy_intake_note_error text null;

alter table public.consultations
  drop constraint if exists consultations_halaxy_intake_note_status_check;

alter table public.consultations
  add constraint consultations_halaxy_intake_note_status_check
  check (halaxy_intake_note_status in ('not_started', 'pending', 'synced', 'failed', 'skipped'));

comment on column public.consultations.halaxy_intake_note_status is
  'Website intake summary sync state for Halaxy DocumentReference clinical note.';
comment on column public.consultations.halaxy_intake_note_synced_at is
  'Timestamp when website intake summary was successfully pushed to Halaxy.';
comment on column public.consultations.halaxy_intake_note_error is
  'Last Halaxy intake note sync error, if any.';
