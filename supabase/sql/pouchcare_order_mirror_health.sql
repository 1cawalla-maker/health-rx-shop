-- PouchCare order mirror / allowance health audit
-- Run in Supabase SQL editor or psql against the target project.
-- Read-only except for temporary CTEs. Use before/after staging checkout tests.

-- 1) Duplicate Shopify line items: should return zero rows.
select
  shopify_order_id,
  shopify_line_item_id,
  count(*) as duplicate_rows,
  sum(quantity) as duplicated_quantity
from public.shopify_order_items
where shopify_line_item_id is not null
group by shopify_order_id, shopify_line_item_id
having count(*) > 1
order by duplicate_rows desc;

-- 2) Paid orders linked to uploaded/OCR prescriptions and their consumed allowance.
with paid_order_items as (
  select
    o.prescription_id,
    o.id as internal_order_id,
    o.order_name,
    o.financial_status,
    i.quantity,
    i.strength_mg,
    i.shopify_line_item_id
  from public.shopify_orders o
  left join public.shopify_order_items i on i.shopify_order_id = o.id
  where o.financial_status = 'paid'
    and o.prescription_id is not null
), usage_by_prescription as (
  select
    prescription_id,
    coalesce(sum(quantity), 0) as used_cans
  from paid_order_items
  group by prescription_id
)
select
  p.id as prescription_id,
  p.status,
  p.allowed_strength_max,
  p.total_units_allowed,
  coalesce(u.used_cans, 0) as used_cans,
  greatest(0, coalesce(p.total_units_allowed, 0) - coalesce(u.used_cans, 0)) as remaining_cans
from public.prescriptions p
left join usage_by_prescription u on u.prescription_id = p.id
where p.prescription_type = 'uploaded'
order by p.created_at desc;

-- 3) Paid Shopify orders missing mirrored item rows: should return zero rows.
select
  o.id,
  o.order_name,
  o.shopify_order_id,
  o.prescription_id,
  o.created_at
from public.shopify_orders o
left join public.shopify_order_items i on i.shopify_order_id = o.id
where o.financial_status = 'paid'
group by o.id, o.order_name, o.shopify_order_id, o.prescription_id, o.created_at
having count(i.id) = 0
order by o.created_at desc;

-- 4) Paid order items with missing strength parsing: review any rows before supplier handoff.
select
  o.order_name,
  i.title,
  i.variant_title,
  i.quantity,
  i.strength_mg,
  i.raw->>'name' as raw_name
from public.shopify_order_items i
join public.shopify_orders o on o.id = i.shopify_order_id
where o.financial_status = 'paid'
  and i.strength_mg is null
order by o.created_at desc;
