-- Patient identity guardrails for future email-code and Google login.
-- This is additive only: it does not enable email or Google auth by itself.

alter table public.profiles
  add column if not exists google_provider_id text,
  add column if not exists google_email text,
  add column if not exists google_linked_at timestamptz,
  add column if not exists previous_phone text,
  add column if not exists phone_change_requested_at timestamptz,
  add column if not exists phone_change_verified_at timestamptz,
  add column if not exists phone_change_verification_method text;

-- One profile per email address. Email login/linking must resolve to this row,
-- not create a second patient profile for the same address.
create unique index if not exists profiles_email_unique_idx
  on public.profiles(lower(email))
  where email is not null and btrim(email) <> '';

-- Future Google OAuth linking must bind a Google subject to exactly one profile.
create unique index if not exists profiles_google_provider_id_unique_idx
  on public.profiles(google_provider_id)
  where google_provider_id is not null and btrim(google_provider_id) <> '';

-- Google email is not the strongest identifier, but keeping it unique avoids
-- obvious duplicate patient accounts during linking and recovery workflows.
create unique index if not exists profiles_google_email_unique_idx
  on public.profiles(lower(google_email))
  where google_email is not null and btrim(google_email) <> '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_email_verification_method_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_email_verification_method_check
      check (
        email_verification_method is null
        or email_verification_method in ('supabase_email_otp', 'google_oauth', 'admin_verified')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_change_verification_method_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_change_verification_method_check
      check (
        phone_change_verification_method is null
        or phone_change_verification_method in ('supabase_sms_otp', 'admin_verified')
      );
  end if;
end $$;
