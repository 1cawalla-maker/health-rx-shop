-- Payments + doctor payouts (Stripe Connect scaffolding)

-- 1) Consultation payments ledger (separate from consultations to keep scheduling model clean)
create table if not exists public.consultation_payments (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,

  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 100000),
  currency text not null default 'aud',

  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),

  stripe_checkout_session_id text null,
  stripe_payment_intent_id text null,

  created_at timestamptz not null default now(),
  paid_at timestamptz null,
  updated_at timestamptz not null default now()
);

create unique index if not exists consultation_payments_consultation_id_key
  on public.consultation_payments(consultation_id);

create index if not exists consultation_payments_patient_id_idx
  on public.consultation_payments(patient_id);

-- updated_at trigger (reuse if you already have one)
do $do$
begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    create function public.set_updated_at() returns trigger as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$ language plpgsql;
  end if;
end $do$;

drop trigger if exists trg_consultation_payments_updated_at on public.consultation_payments;
create trigger trg_consultation_payments_updated_at
before update on public.consultation_payments
for each row execute function public.set_updated_at();


-- 2) Doctor Stripe Connect accounts
create table if not exists public.doctor_stripe_accounts (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,

  stripe_account_id text not null,
  onboarding_complete boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists doctor_stripe_accounts_doctor_id_key
  on public.doctor_stripe_accounts(doctor_id);

create unique index if not exists doctor_stripe_accounts_stripe_account_id_key
  on public.doctor_stripe_accounts(stripe_account_id);

drop trigger if exists trg_doctor_stripe_accounts_updated_at on public.doctor_stripe_accounts;
create trigger trg_doctor_stripe_accounts_updated_at
before update on public.doctor_stripe_accounts
for each row execute function public.set_updated_at();


-- 3) Doctor payouts ledger
create table if not exists public.doctor_payouts (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,

  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 100000),
  currency text not null default 'aud',

  status text not null default 'pending' check (status in ('pending','paid','failed')),
  stripe_transfer_id text null,

  created_at timestamptz not null default now(),
  paid_at timestamptz null,
  updated_at timestamptz not null default now()
);

create unique index if not exists doctor_payouts_consultation_id_key
  on public.doctor_payouts(consultation_id);

create index if not exists doctor_payouts_doctor_id_idx
  on public.doctor_payouts(doctor_id);

drop trigger if exists trg_doctor_payouts_updated_at on public.doctor_payouts;
create trigger trg_doctor_payouts_updated_at
before update on public.doctor_payouts
for each row execute function public.set_updated_at();


-- RLS
alter table public.consultation_payments enable row level security;
alter table public.doctor_stripe_accounts enable row level security;
alter table public.doctor_payouts enable row level security;

-- consultation_payments: patient can read their own payment record
drop policy if exists consultation_payments_select_own on public.consultation_payments;
create policy consultation_payments_select_own
  on public.consultation_payments
  for select
  using (patient_id = auth.uid());

-- allow service role inserts/updates (handled by Edge Functions). No direct insert/update policy.

-- doctor_stripe_accounts: doctors can read their own stripe account mapping
drop policy if exists doctor_stripe_accounts_select_own on public.doctor_stripe_accounts;
create policy doctor_stripe_accounts_select_own
  on public.doctor_stripe_accounts
  for select
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_stripe_accounts.doctor_id
      and d.user_id = auth.uid()
  ));

-- doctor_payouts: doctors can read payouts for themselves
drop policy if exists doctor_payouts_select_own on public.doctor_payouts;
create policy doctor_payouts_select_own
  on public.doctor_payouts
  for select
  using (exists (
    select 1 from public.doctors d
    where d.id = doctor_payouts.doctor_id
      and d.user_id = auth.uid()
  ));
