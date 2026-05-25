-- Track patient mobile verification after Supabase Auth SMS OTP confirmation.

alter table public.profiles
  add column if not exists phone_verified_at timestamptz,
  add column if not exists phone_verification_method text;

create index if not exists profiles_phone_verified_at_idx
  on public.profiles(phone_verified_at);
