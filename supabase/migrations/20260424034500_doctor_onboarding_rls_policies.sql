-- Ensure doctor onboarding tables are readable/writable by the owning doctor
-- (required for doctor portal readiness checks + onboarding upserts)

-- doctor_signatures
alter table public.doctor_signatures enable row level security;

drop policy if exists doctor_signatures_select_own on public.doctor_signatures;
create policy doctor_signatures_select_own
  on public.doctor_signatures
  for select
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_signatures.doctor_id
      and d.user_id = auth.uid()
  ));

drop policy if exists doctor_signatures_insert_own on public.doctor_signatures;
create policy doctor_signatures_insert_own
  on public.doctor_signatures
  for insert
  with check (exists (
    select 1 from public.doctors d
    where d.id = doctor_signatures.doctor_id
      and d.user_id = auth.uid()
  ));

drop policy if exists doctor_signatures_update_own on public.doctor_signatures;
create policy doctor_signatures_update_own
  on public.doctor_signatures
  for update
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_signatures.doctor_id
      and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.doctors d
    where d.id = doctor_signatures.doctor_id
      and d.user_id = auth.uid()
  ));

drop policy if exists doctor_signatures_delete_own on public.doctor_signatures;
create policy doctor_signatures_delete_own
  on public.doctor_signatures
  for delete
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_signatures.doctor_id
      and d.user_id = auth.uid()
  ));


-- doctor_payout_profiles
alter table public.doctor_payout_profiles enable row level security;

drop policy if exists doctor_payout_profiles_select_own on public.doctor_payout_profiles;
create policy doctor_payout_profiles_select_own
  on public.doctor_payout_profiles
  for select
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_payout_profiles.doctor_id
      and d.user_id = auth.uid()
  ));

drop policy if exists doctor_payout_profiles_insert_own on public.doctor_payout_profiles;
create policy doctor_payout_profiles_insert_own
  on public.doctor_payout_profiles
  for insert
  with check (exists (
    select 1 from public.doctors d
    where d.id = doctor_payout_profiles.doctor_id
      and d.user_id = auth.uid()
  ));

drop policy if exists doctor_payout_profiles_update_own on public.doctor_payout_profiles;
create policy doctor_payout_profiles_update_own
  on public.doctor_payout_profiles
  for update
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_payout_profiles.doctor_id
      and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.doctors d
    where d.id = doctor_payout_profiles.doctor_id
      and d.user_id = auth.uid()
  ));

drop policy if exists doctor_payout_profiles_delete_own on public.doctor_payout_profiles;
create policy doctor_payout_profiles_delete_own
  on public.doctor_payout_profiles
  for delete
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_payout_profiles.doctor_id
      and d.user_id = auth.uid()
  ));
