-- Remove the abandoned Google patient auth/linking surface.
-- PouchCare now uses mobile OTP for all roles and email OTP for approved patient login.

update public.profiles
set
  google_provider_id = null,
  google_email = null,
  google_linked_at = null,
  email_verified_at = case when email_verification_method = 'google_oauth' then null else email_verified_at end,
  email_verification_method = case when email_verification_method = 'google_oauth' then null else email_verification_method end
where google_provider_id is not null
  or google_email is not null
  or google_linked_at is not null
  or email_verification_method = 'google_oauth';

drop index if exists public.profiles_google_provider_id_unique_idx;
drop index if exists public.profiles_google_email_unique_idx;

alter table public.profiles
  drop constraint if exists profiles_email_verification_method_check;

alter table public.profiles
  add constraint profiles_email_verification_method_check
  check (
    email_verification_method is null
    or email_verification_method in ('supabase_email_otp', 'admin_verified')
  );

alter table public.profiles
  drop column if exists google_provider_id,
  drop column if exists google_email,
  drop column if exists google_linked_at;
