-- Store Shopify checkout mapping for internal catalogue variants.
-- Internal products remain the patient-facing catalogue source; these nullable
-- fields let checkout bridge each internal variant to the Shopify ProductVariant
-- used for secure payment/shipping while that remains the checkout provider.

alter table public.products
  add column if not exists shopify_product_gid text;

alter table public.product_variants
  add column if not exists shopify_variant_gid text;

create index if not exists products_shopify_product_gid_idx
  on public.products(shopify_product_gid)
  where shopify_product_gid is not null;

create index if not exists product_variants_shopify_variant_gid_idx
  on public.product_variants(shopify_variant_gid)
  where shopify_variant_gid is not null;
