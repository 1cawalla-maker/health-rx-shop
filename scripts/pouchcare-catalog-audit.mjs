#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'src/services/catalogService.ts');
const checkoutPath = path.join(root, 'src/services/shopifyCheckoutService.ts');

const catalog = fs.readFileSync(catalogPath, 'utf8');
const checkout = fs.readFileSync(checkoutPath, 'utf8');

const dynamicShopifyCatalog = /products\(first:/.test(catalog) && /ProductVariant/.test(catalog);
const variantIds = [...catalog.matchAll(/id:\s*'([^']+)'\s*,\s*strengthMg:\s*(\d+)/g)]
  .map((m) => ({ variantId: m[1], strengthMg: Number(m[2]) }));
const mappedIds = new Map([...checkout.matchAll(/'([^']+)':\s*'gid:\/\/shopify\/ProductVariant\/(\d+)'/g)]
  .map((m) => [m[1], m[2]]));

const productBlocks = catalog.split(/\n\s*\{\n/).filter((block) => /id:\s*'prod-/.test(block));
const products = productBlocks.map((block) => ({
  productId: block.match(/id:\s*'([^']+)'/)?.[1] || 'unknown',
  name: block.match(/name:\s*'([^']+)'/)?.[1] || 'unknown',
  brand: block.match(/brand:\s*'([^']+)'/)?.[1] || 'unknown',
  description: block.match(/description:\s*'([^']+)'/)?.[1] || '',
}));

const findings = [];

if (!dynamicShopifyCatalog) {
for (const v of variantIds) {
  if (!mappedIds.has(v.variantId)) {
    findings.push({ severity: 'BLOCKER', area: 'catalog mapping', message: `${v.variantId} has no Shopify ProductVariant GID mapping` });
  }
  if (![3, 6, 9].includes(v.strengthMg)) {
    findings.push({ severity: 'WARN', area: 'strength', message: `${v.variantId} uses unexpected strength ${v.strengthMg}mg` });
  }
}

for (const [variantId] of mappedIds) {
  if (!variantIds.some((v) => v.variantId === variantId)) {
    findings.push({ severity: 'WARN', area: 'catalog mapping', message: `${variantId} is mapped to Shopify but not present in mock catalog` });
  }
}
}

for (const p of products) {
  if (/NicoBrand/i.test(p.brand)) {
    findings.push({ severity: 'LAUNCH_TODO', area: 'product copy', message: `${p.productId} still uses placeholder brand "${p.brand}"` });
  }
}

if (!dynamicShopifyCatalog && !/imageUrl\s*:/.test(catalog)) {
  findings.push({ severity: 'LAUNCH_TODO', area: 'product images', message: 'Mock catalog has no product imageUrl values; product cards will show placeholders/skeletons.' });
}

if (dynamicShopifyCatalog) {
  if (!/featuredImage/.test(catalog) || !/images/.test(catalog)) {
    findings.push({ severity: 'WARN', area: 'product images', message: 'Live Shopify catalog fetch does not request product images.' });
  }
  if (!/vendor/.test(catalog)) {
    findings.push({ severity: 'WARN', area: 'product copy', message: 'Live Shopify catalog fetch does not request vendor/brand.' });
  }
}

const summary = {
  checkedAt: new Date().toISOString(),
  catalogMode: dynamicShopifyCatalog ? 'shopify-live' : 'mock-local',
  products: products.length,
  variants: variantIds.length,
  mappedShopifyVariants: mappedIds.size,
  blockers: findings.filter((f) => f.severity === 'BLOCKER').length,
  warnings: findings.filter((f) => f.severity === 'WARN').length,
  launchTodos: findings.filter((f) => f.severity === 'LAUNCH_TODO').length,
  findings,
};

console.log(JSON.stringify(summary, null, 2));

if (summary.blockers > 0) process.exitCode = 1;
