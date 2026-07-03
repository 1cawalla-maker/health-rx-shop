-- Track PouchCare-side acknowledgements completed before handing a patient to Halaxy.
-- Halaxy should keep the GP clinical intake only; website stores legal/commercial/import/supplier gates.

alter table public.profiles
  add column if not exists pre_halaxy_acknowledged_at timestamptz null,
  add column if not exists pre_halaxy_acknowledgement_version text null,
  add column if not exists pre_halaxy_acknowledgements jsonb null;

create index if not exists profiles_pre_halaxy_acknowledged_idx
  on public.profiles(pre_halaxy_acknowledged_at)
  where pre_halaxy_acknowledged_at is not null;
