-- Add durable patient account email fields for future email-code and Google login linking.
alter table public.profiles
  add column if not exists email text,
  add column if not exists email_verified_at timestamptz,
  add column if not exists email_verification_method text;

create index if not exists profiles_email_idx
  on public.profiles(lower(email))
  where email is not null;

create index if not exists profiles_email_verified_at_idx
  on public.profiles(email_verified_at)
  where email_verified_at is not null;
