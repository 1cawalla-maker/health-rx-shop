-- Make Shopify order item mirroring idempotent across duplicate/racing webhook deliveries.

alter table public.shopify_order_items
  add column if not exists shopify_line_item_id bigint;

update public.shopify_order_items
set shopify_line_item_id = nullif(raw->>'id', '')::bigint
where shopify_line_item_id is null
  and raw ? 'id'
  and (raw->>'id') ~ '^\d+$';

with ranked as (
  select
    id,
    row_number() over (
      partition by shopify_order_id, shopify_line_item_id
      order by created_at asc, id asc
    ) as rn
  from public.shopify_order_items
  where shopify_line_item_id is not null
)
delete from public.shopify_order_items i
using ranked r
where i.id = r.id
  and r.rn > 1;

create unique index if not exists shopify_order_items_order_line_item_key
  on public.shopify_order_items (shopify_order_id, shopify_line_item_id);
