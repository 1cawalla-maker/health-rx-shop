

# Phase 1: Legacy Cart Normalization (Preserve qty + price)

---

## Problem

The Rev 2 self-healing normalization fixed `$NaN / can` for known field names, but it only handles numeric `qtyCans`/`quantity` and `priceCents`/`price`/`totalPriceCents`. Legacy cart data stored with **string values** (e.g., `qtyCans: "59"`, `unitPrice: "24.99"`), alternative field names (`unitPriceCents`, `unitPrice`, `qty`, `totalPrice`), or other unexpected shapes will collapse to `qtyCans=1` and `priceCents=0`, silently losing user intent.

---

## Hard Constraints

- Phase 1: mock/localStorage only, no backend
- No new dependencies
- UI components must not access localStorage directly (services only)
- Migration-ready: keep cents as integers; canonical shapes map cleanly to future backend tables

---

## Design Decisions

1. **Canonical persisted shape** (per item): `{ id, productId, variantId, name, brand, flavor, strengthMg, qtyCans, priceCents, totalPriceCents }`. The field `totalPriceCents` is always `priceCents * qtyCans` and is stored for read convenience but never trusted on load (always recomputed).

2. **Canonical cart shape**: `{ items: CartItem[], subtotalCents, totalCans, itemCount }`. Legacy fields (`subtotal`, `price`, `quantity`, `strength`) are written back for backward compatibility but never read for display.

3. **Parse-then-validate strategy**: All incoming raw values are first coerced via `parseFloat`/`parseInt` (to handle strings like `"59"` or `"24.99"`), then validated as finite and non-negative. This is the key change from Rev 2 which only checked `typeof === 'number'`.

4. **Drop vs keep**: An item is dropped (filtered out) only if `qtyCans <= 0` after all parsing attempts AND no valid price can be derived. If qty is recoverable but price is not, keep the item with `priceCents = 0` (visible to user as `$0.00/can`). If price is recoverable but qty is not, default qty to 1.

5. **UI display rule unchanged**: All UI renders per-can price from `priceCents` only. Defensive fallback shows "—" if somehow invalid post-normalization.

---

## File-by-File Changes

### A. `src/types/shop.ts` -- Add `totalPriceCents` to CartItem

Add optional `totalPriceCents` to the `CartItem` interface (line 38, after `qtyCans`):

```typescript
export interface CartItem {
  // ... existing fields ...
  qtyCans: number;
  totalPriceCents?: number; // Derived: priceCents * qtyCans (convenience field)
  // ...
}
```

This keeps the type compatible with existing code (optional field) while allowing the service to persist it.

---

### B. `src/services/cartService.ts` -- Expand normalization coverage

**B1. Expand `StoredCartItem` type** (lines 13-18) to cover all known legacy shapes:

```typescript
type StoredCartItem = Partial<CartItem> & {
  // Legacy price fields (any could be string or number)
  price?: string | number;           // dollars (e.g., 9.95 or "9.95")
  unitPrice?: string | number;       // dollars (alias)
  unitPriceCents?: string | number;  // cents (alias for priceCents)
  totalPriceCents?: string | number; // line total in cents
  totalPrice?: string | number;      // line total in dollars
  // Legacy qty fields
  quantity?: string | number;        // alias for qtyCans
  qty?: string | number;             // alias for qtyCans
  // Legacy strength
  strength?: string | number;        // alias for strengthMg
};
```

**B2. Replace `normalizeCartItem()`** (lines 25-81) with expanded parsing logic:

Helper: `safeParseNumber(val): number | null` -- attempts `parseFloat(String(val))`, returns the result only if `isFinite()` and `>= 0`, else `null`.

Qty cascade (all via `safeParseNumber`, then `Math.round`):
1. `raw.qtyCans`
2. `raw.quantity`
3. `raw.qty`
4. Default: `1` (minimum safe value)
5. Post-check: if result `<= 0`, set to `1`

Price cascade (all via `safeParseNumber`):
1. `raw.priceCents` -- use directly (already cents)
2. `raw.unitPriceCents` -- use directly (alias)
3. `raw.price` -- `Math.round(val * 100)` (dollars to cents)
4. `raw.unitPrice` -- `Math.round(val * 100)` (dollars to cents)
5. `raw.totalPriceCents` with `qtyCans > 0` -- `Math.round(val / qtyCans)`
6. `raw.totalPrice` with `qtyCans > 0` -- `Math.round(parseFloat(val) * 100 / qtyCans)`
7. Else: `0`, log `console.error` with full raw item dump

After deriving `priceCents` and `qtyCans`:
- `totalPriceCents = priceCents * qtyCans` (always recomputed)

Return the full `CartItem` with all canonical fields set, plus legacy compat fields (`price`, `quantity`, `strength`) written from canonical values.

**B3. Update `getStoredCart()`** (lines 83-114):

After normalizing all items, filter out any with `qtyCans <= 0` (should not happen after defaulting to 1, but safety net). Recalculate totals. Write back to storage (self-healing, already present). Add `totalPriceCents` to each item in the persisted shape.

**B4. Update `addItem()` and `updateQuantity()`** (lines 134-198):

When creating or updating items, also set `totalPriceCents = item.priceCents * item.qtyCans` before saving so the persisted shape is always canonical.

---

### C. UI Components -- No changes needed

`CartDrawer.tsx`, `OrderReview.tsx`, and `Checkout.tsx` already use `priceCents` and `qtyCans` with defensive guards from Rev 2. No modifications required.

---

### D. `src/pages/patient/OrderSuccess.tsx` -- Verify only

Line 99 already uses `item.unitPriceCents * item.qtyCans` which references `OrderItem.unitPriceCents` (not `CartItem`). This is correct and unaffected since `orderService.ts` (line 59) maps `item.priceCents` to `unitPriceCents` at order creation time. No changes needed.

---

## Files Summary

| File | Change | Purpose |
|------|--------|---------|
| `src/types/shop.ts` | UPDATE | Add optional `totalPriceCents` to `CartItem` interface |
| `src/services/cartService.ts` | UPDATE | Expand `StoredCartItem` to cover string values and all legacy field aliases; rewrite `normalizeCartItem()` with `parseFloat`/`parseInt` coercion; set `totalPriceCents` on write paths |

---

## Implementation Order

1. Add `totalPriceCents` to `CartItem` in `shop.ts`
2. Expand `StoredCartItem` type in `cartService.ts`
3. Add `safeParseNumber()` helper in `cartService.ts`
4. Rewrite `normalizeCartItem()` with full cascade
5. Update `addItem()` and `updateQuantity()` to set `totalPriceCents`
6. Run manual acceptance tests

---

## Manual Acceptance Tests

### 1. Legacy cart with string qty and string unitPrice
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'str-test', productId: 'p1', variantId: 'v1',
    name: 'Mint', brand: 'B', flavor: 'Mint', strengthMg: 6,
    qtyCans: "59", unitPrice: "24.99"
  }]
}));
```
- Reload, open cart
- **Expected**: 59 cans, `$24.99 / can`, subtotal `$1,474.41`

### 2. Legacy cart with totalPriceCents, no unit price
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'total-test', productId: 'p1', variantId: 'v1',
    name: 'Cherry', brand: 'B', flavor: 'Cherry', strengthMg: 6,
    totalPriceCents: 5970, qtyCans: 6
  }]
}));
```
- Reload, open cart
- **Expected**: 6 cans, `$9.95 / can`, subtotal `$59.70`

### 3. Legacy cart with totalPrice (dollars string), no unit price
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'dollar-total', productId: 'p1', variantId: 'v1',
    name: 'Berry', brand: 'B', flavor: 'Berry', strengthMg: 3,
    totalPrice: "59.70", qty: "6"
  }]
}));
```
- Reload, open cart
- **Expected**: 6 cans, `$9.95 / can`

### 4. Malformed / unrecoverable cart
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [
    { id: '1', name: 'Good', priceCents: 995, qtyCans: 2,
      productId: 'p1', variantId: 'v1', brand: 'B', flavor: 'F', strengthMg: 3 },
    { id: '2', name: 'Bad' }
  ]
}));
```
- Reload, open cart
- **Expected**: "Good" shows `$9.95 / can` x 2. "Bad" shows `$0.00 / can` x 1 (kept with defaults), console error logged. No crash.

### 5. Normal UI flow: add item, +/- to 59
- Add 1 can of any product
- Click + repeatedly to 59 cans
- **Expected**: Per-can price never shows NaN; subtotal updates correctly each click

### 6. Page refresh persistence + self-healing
- After test 1, refresh page, open cart
- Inspect `localStorage.getItem('nicopatch_cart')` in console
- **Expected**: Stored data now has canonical `priceCents`, `qtyCans`, `totalPriceCents` fields (no more string values or legacy aliases)

### 7. priceCents explicitly null with price fallback
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'null-pc', productId: 'p1', variantId: 'v1',
    name: 'Spearmint', brand: 'B', flavor: 'Spearmint', strengthMg: 3,
    priceCents: null, price: 1.99, qtyCans: 10
  }]
}));
```
- Reload, open cart
- **Expected**: `$1.99 / can`, no NaN

### 8. Float precision
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'fp', productId: 'p1', variantId: 'v1', name: 'Test',
    brand: 'B', flavor: 'F', strengthMg: 3,
    price: 9.999
  }]
}));
```
- **Expected**: `$10.00 / can` (`Math.round(999.9) = 1000` cents)

---

## Migration-Ready Note

The canonical persisted shape maps directly to future backend columns:

```text
CartItem.priceCents      -> order_items.unit_price_cents
CartItem.totalPriceCents -> order_items.total_price_cents
CartItem.qtyCans         -> order_items.qty_cans
Cart.subtotalCents       -> orders.subtotal_cents
Cart.totalCans           -> orders.total_cans
```

All values are integers (cents), avoiding floating-point issues in both localStorage and future SQL columns.

---

**Awaiting approval.**

