# PouchCare current-constraints implementation audit

Date: 2026-06-10

Scope: safe hardening that does not require final product/pricing/shipping decisions, Halaxy API assumptions, supplier API automation, or clinical/regulatory interpretation changes.

Branch/worktree: `safe/current-constraints-hardening` at `/tmp/health-rx-shop-safe-constraints`, based on `origin/main` commit `e0389c9`.

## Repo/deploy posture

- Main deployed source already includes the Shopify webhook idempotency fix from `e0389c9`.
- Dirty local repo remains separate and should not be deployed wholesale.
- This clean branch contains only current-constraints hardening/docs/audit additions.
- Build passes in this clean branch: `npm run build`.
- `npm ci` reports existing dependency audit issues: 17 vulnerabilities (8 moderate, 9 high). Do not auto-fix without a deliberate dependency review.

## Safe implementation completed in this pass

### 1. Added MVP regression guard script

File: `scripts/pouchcare-mvp-regression-guard.mjs`

Current result: 13/13 passing.

It guards these locked MVP behaviours at source level:

- active uploaded/OCR prescription required for checkout
- explicit max strength and total allowance required
- no usage-time expiry enforcement
- strength above prescription max is blocked
- backend derives strength from Shopify variant data, not frontend trust
- paid Shopify orders/items consume prescription allowance
- over-allowance fails before Shopify cart creation
- webhook mirrors `prescription_id`
- webhook mirrors Shopify line item id
- webhook upserts line items by `(shopify_order_id, shopify_line_item_id)`
- dedupe migration/unique index exists
- local/mock variant mappings are complete when local catalog mode is used
- MVP strengths remain expected values when local catalog mode is used

### 2. Hardened backend Shopify variant strength lookup

File: `supabase/functions/create-shopify-cart-and-checkout-url/index.ts`

Checkout now requests optional Shopify variant metafield:

- namespace: `pouchcare`
- key: `strength_mg`

Strength resolution now prefers that metafield when present, then falls back to variant options/title parsing such as `3mg`, `6mg`, `9mg`.

Why this is safe: it keeps Shopify as the backend product source of truth and does not trust frontend-provided strength. It also makes future product naming/copy changes less likely to break gating if metafields are configured later.

### 3. Added catalog audit script

File: `scripts/pouchcare-catalog-audit.mjs`

Current clean-branch result:

- catalog mode: `shopify-live`
- blockers: 0
- warnings: 0
- launch TODOs: 0 from static source audit

The script also supports older/mock local catalog mode and will flag missing mappings, unexpected strengths, placeholder brands, or missing image URLs when applicable.

### 4. Added order mirror / allowance SQL health audit

File: `supabase/sql/pouchcare_order_mirror_health.sql`

It checks:

- duplicate Shopify line-item rows
- paid uploaded/OCR prescription usage and remaining allowance
- paid orders missing mirrored item rows
- paid order items missing parsed strength

Use this before/after staging checkout tests.

### 5. Added staging regression runbook

File: `docs/runbooks/POUCHCARE_STAGING_REGRESSION_RUNBOOK.md`

Covers:

- Edge Function/secret pre-checks
- OCR happy/failure paths
- strength block
- allowance exceeded
- duplicate webhook delivery/idempotency
- admin supplier handoff checks

### 6. Added manual supplier handoff SOP

File: `docs/runbooks/POUCHCARE_MANUAL_SUPPLIER_HANDOFF_SOP.md`

Covers:

- what admin must verify before supplier handoff
- when not to send to supplier
- current MVP boundaries

### 7. Added Admin Orders “needs attention” warnings

File: `src/pages/admin/Orders.tsx`

The admin order page now flags paid/order mirror issues before supplier handoff:

- paid order has no mirrored item rows
- linked prescription could not be loaded
- linked prescription is missing a file path
- one or more order items are missing parsed strength
- synced paid orders exceed prescription allowance

## Current admin order handoff audit

`src/pages/admin/Orders.tsx` includes the core safe handoff requirements:

- Shopify order number/status/amount
- customer name/email/phone/address
- product/variant/quantity/strength
- linked prescription context
- prescription file button
- max strength
- total allowance
- used quantity
- remaining quantity
- copy fulfilment pack
- Shopify admin link
- needs-attention warnings for mirror/prescription issues

Recommended next UI polish, still safe under constraints:

- add filters for needs-attention orders
- add admin quick links from warning rows to the exact missing item/prescription/order area
- add a small “run SQL audit” admin/dev checklist link if useful

## Current product/catalog audit

`src/services/catalogService.ts` currently uses live Shopify Storefront catalog fetching:

- requests product vendor/brand
- requests featured/product images
- parses variants from selected options/title
- returns live Shopify product/variant IDs

Before launch, still confirm in Shopify admin:

- final product images are present
- product copy/prices are final
- variant names/metafields remain parseable as `3mg`, `6mg`, `9mg`
- shipping fees/zones are final

## Recommended next implementation order

1. Add admin filter/view for needs-attention orders.
2. Add a deeper runtime/integration-style staging regression around checkout + webhook replay if we can safely generate test orders.
3. Continue repo hygiene: split dirty local changes into reviewable branches before any broader deploy.
4. Leave product images/prices/shipping/final supplier decisions parked until Callum confirms.

## Do not do yet without Callum approval

- change shipping fees/pricing
- change product assumptions or strengths
- add clinical interpretation logic
- add monthly/refill/rolling-window enforcement
- integrate Halaxy before approval/docs
- automate supplier handoff/API
- enable/send new customer notification flows without copy review
