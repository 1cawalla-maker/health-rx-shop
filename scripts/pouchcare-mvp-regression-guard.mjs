#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const files = {
  checkout: 'supabase/functions/create-shopify-cart-and-checkout-url/index.ts',
  webhook: 'supabase/functions/shopify-orders-paid-webhook/index.ts',
  migration: 'supabase/migrations/20260610112500_shopify_order_items_line_item_id_dedupe.sql',
  catalog: 'src/services/catalogService.ts',
  checkoutService: 'src/services/shopifyCheckoutService.ts',
};

const src = Object.fromEntries(Object.entries(files).map(([key, rel]) => [key, read(rel)]));
const checks = [];
const add = (name, pass, detail) => checks.push({ name, pass, detail });

// Locked MVP entitlement rules.
add(
  'checkout uses uploaded active prescriptions as entitlement source',
  /\.eq\("prescription_type",\s*"uploaded"\)/.test(src.checkout) && /\.eq\("status",\s*"active"\)/.test(src.checkout),
  'Must gate against active uploaded/OCR prescriptions only.',
);
add(
  'checkout requires explicit strength and total allowance before unlock',
  /allowed_strength_max/.test(src.checkout) && /total_units_allowed/.test(src.checkout) && /PRESCRIPTION_QUANTITY_REQUIRED/.test(src.checkout),
  'Must not unlock uploaded/OCR prescriptions missing total units/cans.',
);
add(
  'checkout has no usage-time expiry enforcement',
  /no usage-time expiry enforcement/i.test(src.checkout),
  'MVP rule is lifetime-per-prescription allowance only.',
);
add(
  'checkout blocks requested strength above prescription max',
  /STRENGTH_NOT_ALLOWED/.test(src.checkout) && /requestedStrengthMg/.test(src.checkout),
  'Backend must block 9mg when prescription max is 6mg.',
);
add(
  'checkout derives strength from Shopify variant data',
  /selectedOptions/.test(src.checkout) && /metafield\(namespace:\s*"pouchcare",\s*key:\s*"strength_mg"\)/.test(src.checkout),
  'Frontend strengthMg is not trusted for enforcement.',
);
add(
  'checkout counts paid Shopify order items for allowance consumption',
  /\.from\("shopify_orders"\)[\s\S]*\.eq\("financial_status",\s*"paid"\)/.test(src.checkout) && /shopify_order_items/.test(src.checkout),
  'Previous paid orders linked to the same prescription consume allowance.',
);
add(
  'checkout returns allowance exceeded with remaining cans',
  /ALLOWANCE_EXCEEDED/.test(src.checkout) && /remainingCans/.test(src.checkout),
  'Over-allowance attempts must fail before Shopify cart creation.',
);

// Webhook idempotency / mirror rules.
add(
  'webhook stores prescription_id from Shopify note attributes',
  /extractNoteAttribute\(order,\s*"prescription_id"\)/.test(src.webhook) && /prescription_id:\s*prescriptionId/.test(src.webhook),
  'Paid Shopify orders must mirror back to the prescription used at checkout.',
);
add(
  'webhook mirrors Shopify line item id',
  /shopify_line_item_id:\s*li\?\.id \? Number\(li\.id\) : null/.test(src.webhook),
  'Line item id is required for duplicate webhook idempotency.',
);
add(
  'webhook upserts items by order+line-item id',
  /upsert\(rows,\s*\{\s*onConflict:\s*"shopify_order_id,shopify_line_item_id"\s*\}\)/.test(src.webhook),
  'Duplicate/racing webhook deliveries must not double-count allowance.',
);
add(
  'dedupe migration exists with unique order+line-item index',
  /shopify_line_item_id bigint/.test(src.migration) && /shopify_order_items_order_line_item_key/.test(src.migration),
  'DB must enforce item mirror idempotency.',
);

// Catalog/checkout mapping guardrails.
const localVariants = [...src.catalog.matchAll(/id:\s*'([^']+)'\s*,\s*strengthMg:\s*(\d+)/g)].map((m) => ({ id: m[1], mg: Number(m[2]) }));
const mappedVariants = new Set([...src.checkoutService.matchAll(/'([^']+)':\s*'gid:\/\/shopify\/ProductVariant\/\d+'/g)].map((m) => m[1]));
const unmapped = localVariants.filter((v) => !mappedVariants.has(v.id)).map((v) => v.id);
const unexpectedStrengths = localVariants.filter((v) => ![3, 6, 9].includes(v.mg)).map((v) => `${v.id}:${v.mg}mg`);
add('all local catalog variants have Shopify GID mappings', unmapped.length === 0, unmapped.length ? `Missing: ${unmapped.join(', ')}` : 'All mapped.');
add('catalog strengths are expected MVP strengths', unexpectedStrengths.length === 0, unexpectedStrengths.length ? `Unexpected: ${unexpectedStrengths.join(', ')}` : 'Only 3mg, 6mg, 9mg.');

const failed = checks.filter((c) => !c.pass);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), total: checks.length, failed: failed.length, checks }, null, 2));
if (failed.length > 0) process.exitCode = 1;
