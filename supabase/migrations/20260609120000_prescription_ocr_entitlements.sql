-- Prescription OCR entitlement support for Shopify gating MVP

-- Private prescription upload bucket used by patient/admin uploads.
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false)
on conflict (id) do nothing;

alter table public.prescriptions
  add column if not exists file_name text,
  add column if not exists ocr_status text not null default 'not_started'
    check (ocr_status in ('not_started', 'processing', 'completed', 'failed', 'needs_review')),
  add column if not exists ocr_raw_text text,
  add column if not exists ocr_extracted jsonb,
  add column if not exists ocr_confidence numeric,
  add column if not exists ocr_error text,
  add column if not exists ocr_processed_at timestamptz;

create index if not exists prescriptions_patient_active_idx
  on public.prescriptions (patient_id, status, expires_at)
  where prescription_type = 'uploaded';

create index if not exists prescriptions_ocr_status_idx
  on public.prescriptions (ocr_status)
  where prescription_type = 'uploaded';

-- Total can/unit allowance for this prescription. This is lifetime-per-prescription,
-- not monthly/rolling/calendar based.
alter table public.prescriptions
  add column if not exists total_units_allowed integer;

-- Link Shopify paid orders to the prescription entitlement consumed by checkout.
alter table public.shopify_orders
  add column if not exists prescription_id uuid references public.prescriptions(id) on delete set null;

create index if not exists shopify_orders_prescription_id_idx
  on public.shopify_orders (prescription_id);
