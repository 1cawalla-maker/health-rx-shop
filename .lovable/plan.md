

# Phase 1: Fix Cart Price Display ($NaN per can) -- Rev 2 (Updated)

---

## Problem

Cart line items display `$NaN / can` or `$NaN` totals in up to three UI surfaces. The root cause is that stored cart items may lack valid `priceCents` due to legacy field naming (`price` in dollars) or corrupted data, and some UI components still reference legacy fields (`item.price`, `item.quantity`, `item.strength`) directly.

---

## Hard Constraints

- Phase 1: mock/localStorage only, no backend
- No new dependencies
- UI components must not access localStorage directly (services only)

---

## Design Decisions

1. **Canonical fields**: `priceCents` (per-can unit price in cents) and `qtyCans` are the source of truth on every `CartItem`. Line totals are computed as `priceCents * qtyCans`. Cart-level `subtotalCents` and `totalCans` are always derived from items.

2. **Single normalization point**: `cartService.getStoredCart()` normalizes every item via `normalizeCartItem()`. Legacy fields (`price`, `quantity`, `strength`) and missing/corrupted `priceCents` are all resolved here. Additional derivation: if `priceCents` and `price` are both missing but a `totalPriceCents` field exists with `qtyCans > 0`, derive `priceCents = Math.round(totalPriceCents / qtyCans)`. Always guard `qtyCans > 0` before division.

3. **Self-healing write-back**: After normalization, `getStoredCart()` persists the clean cart back to localStorage so subsequent reads never re-encounter corrupted data.

4. **UI display rule**: All UI surfaces display per-can price from `priceCents` only (`$${(item.priceCents / 100).toFixed(2)}`). No UI component may compute per-can by dividing subtotal/qty.

5. **Defensive fallback**: Every price render checks `typeof x === 'number' && !isNaN(x) && x >= 0`. If invalid, show "--" and log a warning with item id, name, flavor, strengthMg, and the received value.

---

## File-by-File Changes

### A. `src/services/cartService.ts`

**StoredCartItem type** (already exists at lines 13-17) -- add one more legacy field:

```typescript
type StoredCartItem = Partial<CartItem> & {
  price?: number;           // Legacy: dollars (e.g., 9.95)
  quantity?: number;        // Legacy: same as qtyCans
  strength?: number;        // Legacy: same as strengthMg
  totalPriceCents?: number; // Legacy: line total in cents
};
```

**normalizeCartItem()** (lines 24-75) -- add `totalPriceCents / qtyCans` derivation step. Updated cascade for `priceCents`:

```
1. If item.priceCents is valid number >= 0 --> use it
2. Else if item.price is valid number >= 0 --> Math.round(item.price * 100)
3. Else if item.totalPriceCents is valid number >= 0 AND qtyCans > 0
       --> Math.round(item.totalPriceCents / qtyCans)
4. Else --> 0, log console.error with { itemId, itemName, flavor, strengthMg, priceCents, price, totalPriceCents }
```

All numeric outputs use `Math.round()` to avoid float artifacts.

**getStoredCart()** (lines 77-104) -- add self-healing write-back after normalization:

```typescript
const normalizedCart: Cart = {
  items: normalizedItems,
  subtotalCents: freshTotals.subtotalCents,
  totalCans: freshTotals.totalCans,
  subtotal: freshTotals.subtotalCents / 100,
  itemCount: freshTotals.totalCans,
};
this.saveCart(normalizedCart); // Self-healing: persist clean data
return normalizedCart;
```

---

### B. `src/components/shop/CartDrawer.tsx`

**Lines 79-86**: Already has defensive guard. Update the `console.warn` to include flavor and strengthMg for debugging specificity:

```tsx
console.warn('CartDrawer: item has invalid priceCents:', {
  id: item.id,
  name: item.name,
  flavor: item.flavor,
  strengthMg: item.strengthMg,
  priceCents: item.priceCents,
  normalizationAttempted: true,
});
```

No other changes needed in this file.

---

### C. `src/components/checkout/OrderReview.tsx`

**Line 70**: Replace `item.strength` with `item.strengthMg`:
```tsx
<span className="text-xs text-muted-foreground">{item.strengthMg}mg</span>
```

**Line 74**: Replace `item.strength` with `item.strengthMg`:
```tsx
<p className="text-sm text-muted-foreground">{item.flavor} - {item.strengthMg}mg</p>
```

**Lines 77-78**: Replace legacy `item.price * item.quantity` with canonical fields + defensive guard:
```tsx
<p className="font-medium">
  {typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0
    ? `$${((item.priceCents * item.qtyCans) / 100).toFixed(2)}`
    : (() => {
        console.warn('OrderReview: item has invalid priceCents:', {
          id: item.id, name: item.name, flavor: item.flavor,
          strengthMg: item.strengthMg, priceCents: item.priceCents,
          normalizationAttempted: true,
        });
        return '--';
      })()}
</p>
<p className="text-sm text-muted-foreground">Qty: {item.qtyCans}</p>
```

**Line 88**: Replace `cart.subtotal.toFixed(2)` with canonical:
```tsx
<span>${(cart.subtotalCents / 100).toFixed(2)}</span>
```

---

### D. `src/pages/patient/Checkout.tsx`

**Line 263**: Add defensive guard to order summary sidebar:
```tsx
<span>
  {typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0
    ? `$${((item.priceCents * item.qtyCans) / 100).toFixed(2)}`
    : (() => {
        console.warn('Checkout sidebar: item has invalid priceCents:', {
          id: item.id, name: item.name, flavor: item.flavor,
          strengthMg: item.strengthMg, priceCents: item.priceCents,
          normalizationAttempted: true,
        });
        return '--';
      })()}
</span>
```

---

## Files Summary

| File | Change | Purpose |
|------|--------|---------|
| `src/services/cartService.ts` | UPDATE | Add `totalPriceCents` to `StoredCartItem`; add derivation step 3 to `normalizeCartItem()`; add self-healing write-back in `getStoredCart()` |
| `src/components/shop/CartDrawer.tsx` | UPDATE | Enhance console.warn with flavor, strengthMg, normalizationAttempted |
| `src/components/checkout/OrderReview.tsx` | UPDATE | Replace legacy fields (`item.strength`, `item.price * item.quantity`, `cart.subtotal`) with canonical fields + defensive guards |
| `src/pages/patient/Checkout.tsx` | UPDATE | Add defensive guard on line 263 price display |

---

## Implementation Order

1. Update `StoredCartItem` type in `cartService.ts`
2. Update `normalizeCartItem()` with `totalPriceCents` derivation step
3. Add self-healing write-back in `getStoredCart()`
4. Update `CartDrawer.tsx` console.warn specificity
5. Migrate `OrderReview.tsx` from legacy to canonical fields
6. Add defensive guard in `Checkout.tsx` sidebar
7. Run all manual acceptance tests

---

## Manual Acceptance Tests

### 1. Fresh cart -- add single item
- Clear localStorage, add 1 can, open cart drawer
- **Expected**: `$X.XX / can` correct

### 2. Increase to 59 via +/- buttons
- Click + repeatedly to 59 cans
- **Expected**: Per-can price never shows NaN

### 3. Page refresh persistence
- Refresh page, reopen cart
- **Expected**: Prices correct; localStorage now contains normalized data (self-healing verified)

### 4. Legacy cart (price field only, no priceCents)
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'legacy-1', productId: 'p1', variantId: 'v1',
    name: 'Mint', brand: 'B', flavor: 'Mint', strengthMg: 6,
    price: 9.95, quantity: 5
  }],
  subtotal: 49.75, itemCount: 5
}));
```
- Refresh, open cart
- **Expected**: `$9.95 / can`, subtotal `$49.75`

### 5. Explicit legacy test: priceCents set to null
```javascript
// Add item at $1.99/can normally, then corrupt it:
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'null-test', productId: 'p1', variantId: 'v1',
    name: 'Spearmint', brand: 'B', flavor: 'Spearmint', strengthMg: 3,
    priceCents: null, price: 1.99, qtyCans: 10
  }]
}));
```
- Refresh, open cart
- **Expected**: `$1.99 / can` (normalized from legacy `price` fallback), no NaN

### 6. totalPriceCents derivation test
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'total-derive', productId: 'p1', variantId: 'v1',
    name: 'Cherry', brand: 'B', flavor: 'Cherry', strengthMg: 6,
    totalPriceCents: 5970, qtyCans: 6
    // No priceCents, no price -- should derive 5970/6 = 995
  }]
}));
```
- Refresh, open cart
- **Expected**: `$9.95 / can`

### 7. Division guard: totalPriceCents with qtyCans=0
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'div-zero', productId: 'p1', variantId: 'v1',
    name: 'Bad', brand: 'B', flavor: 'F', strengthMg: 3,
    totalPriceCents: 1000, qtyCans: 0
  }]
}));
```
- Refresh, open cart
- **Expected**: qtyCans normalizes to 1, priceCents falls through to 0 (totalPriceCents/qtyCans skipped because original qtyCans was invalid), console error logged

### 8. Corrupted data -- all fields missing
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{ id: '1', productId: 'p1', variantId: 'v1',
    name: 'Bad', brand: 'B', flavor: 'F', strengthMg: 3 }]
}));
```
- Refresh, open cart
- **Expected**: `$0.00 / can` (fallback 0), qtyCans = 1, console error logged with item details

### 9. Checkout order review
- Add items, proceed to checkout Review step
- **Expected**: OrderReview shows correct per-item totals using `strengthMg`, `priceCents`, `qtyCans` -- no NaN, no `undefined`mg

### 10. Price precision edge case
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: '1', productId: 'p1', variantId: 'v1', name: 'Test',
    brand: 'B', flavor: 'F', strengthMg: 3,
    price: 9.999
  }]
}));
```
- **Expected**: `$10.00 / can` (Math.round(999.9) = 1000 cents)

---

**Awaiting approval.**

