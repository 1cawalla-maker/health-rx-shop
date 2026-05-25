-- Doctor payout MVP hardening: record Stripe fee/net amounts and remittance metadata.
-- Existing tables are extended in-place; no duplicate payout ledgers.

alter table public.consultation_payments
  add column if not exists stripe_charge_id text null,
  add column if not exists stripe_balance_transaction_id text null,
  add column if not exists stripe_fee_cents integer null,
  add column if not exists net_amount_cents integer null;

alter table public.consultation_payments
  drop constraint if exists consultation_payments_stripe_fee_cents_check,
  add constraint consultation_payments_stripe_fee_cents_check
    check (stripe_fee_cents is null or stripe_fee_cents >= 0),
  drop constraint if exists consultation_payments_net_amount_cents_check,
  add constraint consultation_payments_net_amount_cents_check
    check (net_amount_cents is null or net_amount_cents >= 0);

create index if not exists consultation_payments_stripe_payment_intent_id_idx
  on public.consultation_payments(stripe_payment_intent_id);

alter table public.doctor_payouts
  drop constraint if exists doctor_payouts_amount_cents_check,
  add constraint doctor_payouts_amount_cents_check
    check (amount_cents >= 0 and amount_cents <= 100000);

alter table public.doctor_payouts
  add column if not exists gross_amount_cents integer null,
  add column if not exists stripe_fee_cents integer null,
  add column if not exists stripe_balance_transaction_id text null,
  add column if not exists failure_message text null,
  add column if not exists payout_period_start timestamptz null,
  add column if not exists payout_period_end timestamptz null,
  add column if not exists remittance_pdf_path text null,
  add column if not exists remittance_email_sent_at timestamptz null;

alter table public.doctor_payouts
  drop constraint if exists doctor_payouts_gross_amount_cents_check,
  add constraint doctor_payouts_gross_amount_cents_check
    check (gross_amount_cents is null or (gross_amount_cents > 0 and gross_amount_cents <= 100000)),
  drop constraint if exists doctor_payouts_stripe_fee_cents_check,
  add constraint doctor_payouts_stripe_fee_cents_check
    check (stripe_fee_cents is null or stripe_fee_cents >= 0);

-- Doctors need to see payment rows attached to their own consults so the portal can show
-- pending earnings before a Sunday transfer exists in doctor_payouts.
drop policy if exists consultation_payments_select_doctor_assigned on public.consultation_payments;
create policy consultation_payments_select_doctor_assigned
  on public.consultation_payments
  for select
  using (exists (
    select 1
    from public.consultations c
    join public.doctors d on d.id = c.doctor_id
    where c.id = consultation_payments.consultation_id
      and d.user_id = auth.uid()
  ));
