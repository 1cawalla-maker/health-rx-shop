# PouchCare staging regression runbook

Run this after meaningful changes to prescription gating, Shopify checkout, webhook mirroring, or admin supplier handoff.

## Pre-checks

- Confirm deployed Supabase project: `vqfodbwvtkeduhmmmjtc`.
- Confirm Edge Functions are deployed:
  - `extract-prescription-entitlement`
  - `create-shopify-cart-and-checkout-url`
  - `shopify-orders-paid-webhook` with JWT disabled
- Confirm required secrets are present:
  - `OPENAI_API_KEY`
  - `PRESCRIPTION_OCR_MODEL`
  - `SHOPIFY_STORE_DOMAIN`
  - `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
  - `SHOPIFY_WEBHOOK_SECRET`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## App regression cases

1. Upload prescription with explicit max strength + total allowance.
   - Expected: active uploaded prescription.
2. Upload prescription with strength but no total allowance.
   - Expected: does not unlock checkout.
3. With 6mg max prescription, attempt 9mg checkout.
   - Expected: blocked before Shopify cart creation.
4. With total allowance 60 and 1 paid can already consumed, request 60 more cans.
   - Expected: `ALLOWANCE_EXCEEDED`, remaining 59.
5. Create/pay allowed Shopify checkout.
   - Expected: Shopify order mirrors with `prescription_id`.
6. Trigger/replay duplicate Shopify webhook delivery if possible.
   - Expected: no duplicate `shopify_order_items` rows and no double-counted allowance.

## SQL health audit

Run:

```sql
-- supabase/sql/pouchcare_order_mirror_health.sql
```

Expected:

- duplicate line-item query returns zero rows.
- paid uploaded/OCR prescription usage matches expected allowance math.
- paid orders missing mirrored item rows returns zero rows.
- paid items missing `strength_mg` returns zero rows or known reviewed exceptions.

## Admin supplier handoff check

For each test paid order, confirm Admin → Orders shows:

- order number
- customer details
- shipping address
- item/strength/quantity
- linked prescription
- prescription file button works
- max strength
- total allowance
- used quantity
- remaining quantity
- copy fulfilment pack works
- Shopify link opens the correct order
