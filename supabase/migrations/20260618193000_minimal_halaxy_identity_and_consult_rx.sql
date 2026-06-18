-- Minimal Halaxy-first consult identity support.
-- Keeps PouchCare initial collection small while preserving audit/consent and matching hooks.

alter table public.profiles
  add column if not exists age_attested_at timestamptz null,
  add column if not exists age_attestation_version text null,
  add column if not exists privacy_notice_accepted_at timestamptz null,
  add column if not exists privacy_policy_version text null,
  add column if not exists collection_notice_version text null,
  add column if not exists minimal_onboarding_completed_at timestamptz null;

create index if not exists profiles_phone_idx
  on public.profiles(phone)
  where phone is not null;

create index if not exists profiles_verified_phone_idx
  on public.profiles(phone, phone_verified_at)
  where phone is not null and phone_verified_at is not null;

-- Link prescription uploads back to the consultation that produced them when known.
alter table public.prescriptions
  add column if not exists consultation_id uuid null references public.consultations(id) on delete set null;

create index if not exists prescriptions_consultation_id_idx
  on public.prescriptions(consultation_id)
  where consultation_id is not null;
