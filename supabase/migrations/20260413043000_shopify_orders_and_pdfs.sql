-- Shopify orders + supplier-only PDFs (setup scaffolding)

-- 1) Supplier-only PDF storage bucket (private)
insert into storage.buckets (id, name, public)
values ('order-pdfs', 'order-pdfs', false)
on conflict (id) do nothing;

-- 2) Shopify order records (source of truth for allowance counting)
create table if not exists public.shopify_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Shopify identifiers
  shopify_order_id bigint not null,
  shopify_order_gid text,
  order_name text,

  -- Money (Shopify sends strings; we store numeric for aggregates)
  currency text,
  total_price numeric,
  subtotal_price numeric,
  total_tax numeric,

  financial_status text,
  fulfillment_status text,

  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  raw jsonb
);

create unique index if not exists shopify_orders_shopify_order_id_key
  on public.shopify_orders (shopify_order_id);

create index if not exists shopify_orders_user_id_idx
  on public.shopify_orders (user_id);

-- 3) Shopify order items (used for allowance counting)
create table if not exists public.shopify_order_items (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id uuid not null references public.shopify_orders(id) on delete cascade,

  -- Variant + quantity
  shopify_variant_id bigint,
  shopify_variant_gid text,
  title text,
  variant_title text,

  quantity integer not null check (quantity > 0),

  -- Strength captured redundantly for future-proofing
  strength_mg integer,

  created_at timestamptz not null default now(),

  raw jsonb
);

create index if not exists shopify_order_items_order_id_idx
  on public.shopify_order_items (shopify_order_id);

create index if not exists shopify_order_items_strength_mg_idx
  on public.shopify_order_items (strength_mg);

-- 4) Supplier-only PDFs (paths in order-pdfs bucket)
create table if not exists public.order_pdfs (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id uuid not null references public.shopify_orders(id) on delete cascade,

  kind text not null check (kind in ('prescription','packing_slip')),
  bucket text not null default 'order-pdfs',
  path text not null,

  created_at timestamptz not null default now()
);

create unique index if not exists order_pdfs_unique_kind_per_order
  on public.order_pdfs (shopify_order_id, kind);

-- RLS
alter table public.shopify_orders enable row level security;
alter table public.shopify_order_items enable row level security;
alter table public.order_pdfs enable row level security;

-- Patients can read their own orders/items (optional but useful for UI later)
create policy if not exists shopify_orders_select_own
  on public.shopify_orders
  for select
  using (user_id = auth.uid());

create policy if not exists shopify_order_items_select_own_via_order
  on public.shopify_order_items
  for select
  using (
    exists (
      select 1
      from public.shopify_orders o
      where o.id = shopify_order_items.shopify_order_id
        and o.user_id = auth.uid()
    )
  );

-- PDFs are supplier-only: no patient select policy.
-- (Service role bypasses RLS for Edge Functions/admin tooling.)

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_shopify_orders_updated_at on public.shopify_orders;
create trigger trg_shopify_orders_updated_at
before update on public.shopify_orders
for each row execute function public.set_updated_at();
