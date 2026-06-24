-- PouchCare internal commerce catalogue foundation
-- Replaces Shopify as the catalogue source while keeping prescription-gated access.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_catalog_items (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  external_product_id text,
  external_variant_id text,
  source_url text,
  raw_name text,
  raw_description text,
  raw_strength text,
  raw_price numeric,
  raw_stock text,
  raw_image_url text,
  raw jsonb not null default '{}'::jsonb,
  sync_status text not null default 'pending_review' check (sync_status in ('pending_review', 'mapped', 'ignored', 'error')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (supplier_id, external_product_id, external_variant_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_catalog_item_id uuid references public.supplier_catalog_items(id) on delete set null,
  display_name text not null,
  brand text not null default 'PouchCare',
  flavour text,
  description text,
  image_url text,
  can_size_pouches integer not null default 20 check (can_size_pouches > 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'hidden', 'archived')),
  requires_prescription boolean not null default true,
  sort_order integer not null default 0,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_catalog_item_id uuid references public.supplier_catalog_items(id) on delete set null,
  display_strength_mg numeric not null check (display_strength_mg > 0),
  display_price_cents integer not null check (display_price_cents >= 0),
  currency text not null default 'AUD',
  supplier_cost_cents integer check (supplier_cost_cents is null or supplier_cost_cents >= 0),
  stock_status text not null default 'unknown' check (stock_status in ('in_stock', 'out_of_stock', 'limited', 'unknown')),
  visible boolean not null default false,
  max_order_qty integer check (max_order_qty is null or max_order_qty > 0),
  supplier_sku text,
  supplier_url text,
  supplier_payment_url text,
  sort_order integer not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, display_strength_mg)
);

create index if not exists suppliers_status_idx on public.suppliers(status);
create index if not exists supplier_catalog_items_supplier_id_idx on public.supplier_catalog_items(supplier_id);
create index if not exists supplier_catalog_items_sync_status_idx on public.supplier_catalog_items(sync_status);
create index if not exists products_status_sort_idx on public.products(status, sort_order, display_name);
create index if not exists products_supplier_id_idx on public.products(supplier_id);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_visible_stock_idx on public.product_variants(visible, stock_status, display_strength_mg);

alter table public.suppliers enable row level security;
alter table public.supplier_catalog_items enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

-- Helper: admin role check for RLS.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
      and ur.status = 'approved'
  );
$$;

-- Helper: active uploaded/OCR prescription entitlement check for patient catalogue visibility.
create or replace function public.has_active_shop_entitlement()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescriptions p
    where p.patient_id = auth.uid()
      and p.prescription_type = 'uploaded'
      and p.status = 'active'
      and p.allowed_strength_max is not null
      and p.total_units_allowed is not null
      and p.allowed_strength_max > 0
      and p.total_units_allowed > 0
  );
$$;

-- Admins can manage all catalogue records.
drop policy if exists suppliers_admin_all on public.suppliers;
create policy suppliers_admin_all
  on public.suppliers
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists supplier_catalog_items_admin_all on public.supplier_catalog_items;
create policy supplier_catalog_items_admin_all
  on public.supplier_catalog_items
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists products_admin_all on public.products;
create policy products_admin_all
  on public.products
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists product_variants_admin_all on public.product_variants;
create policy product_variants_admin_all
  on public.product_variants
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Patients may only read active/visible catalogue rows after prescription entitlement is active.
drop policy if exists products_patient_select_active_with_entitlement on public.products;
create policy products_patient_select_active_with_entitlement
  on public.products
  for select
  to authenticated
  using (
    status = 'active'
    and requires_prescription = true
    and public.has_active_shop_entitlement()
  );

drop policy if exists product_variants_patient_select_visible_with_entitlement on public.product_variants;
create policy product_variants_patient_select_visible_with_entitlement
  on public.product_variants
  for select
  to authenticated
  using (
    visible = true
    and stock_status <> 'out_of_stock'
    and public.has_active_shop_entitlement()
    and exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.status = 'active'
        and p.requires_prescription = true
    )
  );

-- updated_at trigger helper and triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists trg_supplier_catalog_items_updated_at on public.supplier_catalog_items;
create trigger trg_supplier_catalog_items_updated_at
before update on public.supplier_catalog_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();
