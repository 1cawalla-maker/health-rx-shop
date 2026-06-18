-- Halaxy consultation booking scaffold.
-- Adds non-destructive fields so Halaxy-owned booking/payment state can live beside
-- the existing PouchCare/Stripe consultation flow during rollout.

create extension if not exists pgcrypto;

-- Patient-to-Halaxy linkage. Keep nullable until the first successful sync.
alter table public.profiles
  add column if not exists halaxy_patient_id text null,
  add column if not exists halaxy_patient_synced_at timestamptz null;

create unique index if not exists profiles_halaxy_patient_id_key
  on public.profiles(halaxy_patient_id)
  where halaxy_patient_id is not null;

-- Halaxy sends patients to booking before PouchCare knows the scheduled time.
-- Existing PouchCare-created consults still provide scheduled_at immediately.
alter table public.consultations
  alter column scheduled_at drop not null;

alter table public.consultations
  add column if not exists booking_provider text not null default 'pouchcare',
  add column if not exists booking_status text not null default 'not_started',
  add column if not exists halaxy_patient_id text null,
  add column if not exists halaxy_appointment_id text null,
  add column if not exists halaxy_invoice_id text null,
  add column if not exists halaxy_payment_transaction_id text null,
  add column if not exists halaxy_document_reference_id text null,
  add column if not exists halaxy_appointment_status text null,
  add column if not exists halaxy_payment_status text null,
  add column if not exists halaxy_booking_url text null,
  add column if not exists halaxy_manage_url text null,
  add column if not exists halaxy_practitioner_id text null,
  add column if not exists halaxy_practitioner_name text null,
  add column if not exists halaxy_practitioner_role_id text null,
  add column if not exists halaxy_location_id text null,
  add column if not exists halaxy_location_name text null,
  add column if not exists halaxy_healthcare_service_id text null,
  add column if not exists halaxy_charge_item_definition_id text null,
  add column if not exists halaxy_last_webhook_at timestamptz null,
  add column if not exists booking_return_token uuid null,
  add column if not exists booking_metadata jsonb not null default '{}'::jsonb;

alter table public.consultations
  drop constraint if exists consultations_booking_provider_check,
  add constraint consultations_booking_provider_check
    check (booking_provider in ('pouchcare', 'halaxy'));

alter table public.consultations
  drop constraint if exists consultations_booking_status_check,
  add constraint consultations_booking_status_check
    check (booking_status in (
      'not_started',
      'intake_complete',
      'sent_to_booking',
      'booking_in_progress',
      'webhook_pending',
      'booked',
      'payment_pending',
      'paid',
      'payment_failed',
      'cancelled',
      'cancelled_by_patient',
      'cancelled_by_practitioner',
      'completed',
      'failed',
      'manual_review'
    ));

create index if not exists consultations_booking_provider_status_idx
  on public.consultations(booking_provider, booking_status, created_at desc);

create index if not exists consultations_halaxy_patient_id_idx
  on public.consultations(halaxy_patient_id)
  where halaxy_patient_id is not null;

create unique index if not exists consultations_halaxy_appointment_id_key
  on public.consultations(halaxy_appointment_id)
  where halaxy_appointment_id is not null;

create unique index if not exists consultations_booking_return_token_key
  on public.consultations(booking_return_token)
  where booking_return_token is not null;

-- Webhook event inbox for idempotency and audit. The Edge Function can record the
-- raw event first, then reconcile linked consultation rows later.
create table if not exists public.halaxy_webhook_events (
  id uuid primary key default gen_random_uuid(),
  halaxy_event_id text not null,
  resource_type text null,
  resource_reference text null,
  action text null,
  consultation_id uuid null references public.consultations(id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz null,
  processing_status text not null default 'received' check (processing_status in ('received','processed','failed','ignored','manual_review')),
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists halaxy_webhook_events_halaxy_event_id_key
  on public.halaxy_webhook_events(halaxy_event_id);

create index if not exists halaxy_webhook_events_resource_idx
  on public.halaxy_webhook_events(resource_type, resource_reference);

create index if not exists halaxy_webhook_events_consultation_idx
  on public.halaxy_webhook_events(consultation_id, created_at desc);

alter table public.halaxy_webhook_events enable row level security;

-- Admin read-only visibility for troubleshooting. Writes are service-role only.
drop policy if exists halaxy_webhook_events_admin_select on public.halaxy_webhook_events;
create policy halaxy_webhook_events_admin_select
  on public.halaxy_webhook_events
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Keep updated_at fresh if the shared trigger exists.
do $do$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists trg_halaxy_webhook_events_updated_at on public.halaxy_webhook_events;
    create trigger trg_halaxy_webhook_events_updated_at
    before update on public.halaxy_webhook_events
    for each row execute function public.set_updated_at();
  end if;
end $do$;
