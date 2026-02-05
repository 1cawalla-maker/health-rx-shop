

# Phase 1: Fix Cart Price Display ($NaN per can) — Rev 2

---

## Problem

In the cart drawer, line items sometimes display `$NaN / can` instead of the actual unit price when:
- Cart data was stored with legacy field names (`price` instead of `priceCents`)
- Cart data was corrupted or partially saved
- `priceCents` is missing, undefined, or not a number

**Root Cause**: `getStoredCart()` (lines 9-27) normalizes cart-level fields but **does not normalize individual cart item fields**. The `items` array is returned as-is from localStorage.

---

## Hard Constraints (Phase 1)

- Mock/localStorage ONLY — no backend
- No new dependencies
- UI components must NOT access localStorage directly (services only)

---

## File-by-File Plan

### 1. UPDATE: `src/services/cartService.ts`

**Changes:**
1. Define `StoredCartItem` type for legacy field handling (type safety fix)
2. Add `normalizeCartItem()` method with validation and error logging
3. Update `getStoredCart()` to normalize all items and recalculate totals

**A. Add StoredCartItem type (after line 5):**

```typescript
/**
 * Type for cart items as stored in localStorage
 * Includes legacy fields that may exist in older stored data
 * TODO Phase 2: Remove after migration to backend storage
 */
type StoredCartItem = Partial<CartItem> & {
  price?: number;       // Legacy: dollars (e.g., 9.95)
  quantity?: number;    // Legacy: same as qtyCans
  strength?: number;    // Legacy: same as strengthMg
};
```

**B. Add normalizeCartItem() method (after line 41):**

```typescript
/**
 * Normalize a cart item from localStorage to ensure all required fields are valid numbers
 * Handles legacy fields (price, quantity, strength) for backward compatibility
 * 
 * @param item - Raw cart item from localStorage (may have legacy or missing fields)
 * @returns Fully normalized CartItem with guaranteed valid numeric fields
 */
private normalizeCartItem(item: StoredCartItem): CartItem {
  // Derive priceCents: prefer priceCents, fall back to legacy price * 100
  let priceCents: number;
  if (typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0) {
    priceCents = item.priceCents;
  } else if (typeof item.price === 'number' && !isNaN(item.price) && item.price >= 0) {
    // Legacy field: convert dollars to cents, round to avoid floating point issues
    priceCents = Math.round(item.price * 100);
  } else {
    // Corrupted data: log error and fall back to 0
    console.error('CartItem missing valid priceCents, falling back to 0:', {
      itemId: item.id,
      itemName: item.name,
      priceCents: item.priceCents,
      price: item.price,
    });
    priceCents = 0;
  }

  // Derive qtyCans: prefer qtyCans, fall back to legacy quantity, minimum 1
  let qtyCans: number;
  if (typeof item.qtyCans === 'number' && !isNaN(item.qtyCans) && item.qtyCans > 0) {
    qtyCans = item.qtyCans;
  } else if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
    qtyCans = item.quantity;
  } else {
    // Invalid quantity: default to 1 (minimum safe value)
    qtyCans = 1;
  }

  // Derive strengthMg: prefer strengthMg, fall back to legacy strength
  const strengthMg = (item.strengthMg ?? item.strength ?? 3) as 3 | 6 | 9;

  return {
    id: item.id || `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    productId: item.productId || '',
    variantId: item.variantId || '',
    name: item.name || 'Unknown Product',
    brand: item.brand || '',
    flavor: item.flavor || '',
    strengthMg,
    priceCents,
    qtyCans,
    imageUrl: item.imageUrl,
    // Legacy fields maintained for backward compatibility only
    // TODO Phase 2: Remove after migration to backend storage
    strength: strengthMg,
    packSize: item.packSize ?? 20,
    price: priceCents / 100,
    quantity: qtyCans,
  };
}
```

**C. Update getStoredCart() (replace lines 9-27):**

```typescript
private getStoredCart(): Cart {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.cart);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Normalize each item to ensure priceCents and qtyCans are valid numbers
      const normalizedItems = (parsed.items || []).map(
        (item: StoredCartItem) => this.normalizeCartItem(item)
      );
      
      // Always recalculate totals from normalized items (don't trust stored totals)
      const freshTotals = this.calculateTotals(normalizedItems);
      
      return {
        items: normalizedItems,
        subtotalCents: freshTotals.subtotalCents,
        totalCans: freshTotals.totalCans,
        // Legacy fields derived from fresh totals
        subtotal: freshTotals.subtotalCents / 100,
        itemCount: freshTotals.totalCans,
      };
    }
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
  }
  return { items: [], subtotalCents: 0, totalCans: 0, subtotal: 0, itemCount: 0 };
}
```

---

### 2. UPDATE: `src/components/shop/CartDrawer.tsx`

**Change:** Add defensive fallback for price display (line 79)

Even with service-level normalization, add UI-level safety net:

**Replace line 79:**
```tsx
<p className="text-sm font-semibold mt-1">${(item.priceCents / 100).toFixed(2)} / can</p>
```

**With:**
```tsx
<p className="text-sm font-semibold mt-1">
  {typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0
    ? `$${(item.priceCents / 100).toFixed(2)} / can`
    : (() => {
        console.warn('CartDrawer: item has invalid priceCents:', { id: item.id, name: item.name, priceCents: item.priceCents });
        return '—';
      })()}
</p>
```

---

## Files Summary

| File | Change | Purpose |
|------|--------|---------|
| `src/services/cartService.ts` | UPDATE | Add `StoredCartItem` type, `normalizeCartItem()` method, update `getStoredCart()` |
| `src/components/shop/CartDrawer.tsx` | UPDATE | Add defensive fallback for `priceCents` display |

---

## Runtime Invariants (Post-Implementation)

**Service-Level Guarantees:**
After `cartService.getCart()` completes:
- `cart.items.forEach(item => item.priceCents)` is always a non-negative number
- `cart.items.forEach(item => item.qtyCans)` is always a positive integer
- `cart.subtotalCents` is always recalculated from normalized items
- No `NaN` values exist in any cart field

**UI Defensive Checks:**
- CartDrawer displays `—` when priceCents is invalid (graceful degradation)
- Console warning logged when fallback triggered (aids debugging)

---

## Manual Acceptance Tests

### 1. Fresh cart - Add single item
- Clear localStorage (or use incognito)
- Add 1 can of any product
- Open cart drawer
- **Expected**: `$X.XX / can` displays correctly

### 2. Increase quantity via +/- buttons
- With item in cart, click + button repeatedly until 59 cans
- **Expected**: Per-can price remains correct (not NaN)

### 3. Page refresh persistence
- Add items to cart
- Refresh page
- Open cart drawer
- **Expected**: Per-can price displays correctly after reload

### 4. Legacy data migration (simulate)
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'test-1',
    productId: 'p1',
    variantId: 'v1',
    name: 'Test Product',
    brand: 'Brand',
    flavor: 'Mint',
    strengthMg: 6,
    price: 9.95,  // Legacy field only, no priceCents!
    quantity: 5   // Legacy field only, no qtyCans!
  }],
  subtotal: 49.75,
  itemCount: 5
}));
```
- Refresh page, open cart drawer
- **Expected**: Displays `$9.95 / can` (normalized from legacy `price`)

### 5. Corrupted data fallback
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: 'test-1',
    productId: 'p1',
    variantId: 'v1',
    name: 'Corrupted Item',
    brand: 'Brand',
    flavor: 'Mint',
    strengthMg: 6,
    priceCents: undefined,
    qtyCans: 3
  }],
  subtotalCents: 0,
  totalCans: 3
}));
```
- Refresh page, open cart drawer
- **Expected**: Displays `$0.00 / can` (fallback), console error logged

### 6. Empty cart edge case
- Clear localStorage entirely (`localStorage.removeItem('nicopatch_cart')`)
- Navigate to shop
- **Expected**: Cart drawer shows "Your cart is empty" (not error)

### 7. Mixed valid/invalid items
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [
    { id: '1', productId: 'p1', variantId: 'v1', name: 'Valid', 
      brand: 'B', flavor: 'F', strengthMg: 3, priceCents: 995, qtyCans: 2 },
    { id: '2', productId: 'p2', variantId: 'v2', name: 'Corrupted',
      brand: 'B', flavor: 'F', strengthMg: 6, priceCents: undefined, qtyCans: 3 }
  ]
}));
```
- Refresh page
- **Expected**:
  - First item shows `$9.95 / can`
  - Second item shows `$0.00 / can` (normalized) or `—` (if UI fallback triggers)
  - Subtotal = `$19.90` (valid) + `$0.00` (corrupted) = `$19.90`
  - Console error logged for corrupted item

### 8. Quantity edge cases
```javascript
// Test each separately:
{ qtyCans: 0 }      // → normalizes to 1
{ qtyCans: -5 }     // → normalizes to 1
{ qtyCans: "five" } // → normalizes to 1
```
- **Expected**: All normalize to `qtyCans: 1` (minimum safe value)

### 9. Price precision edge case
```javascript
localStorage.setItem('nicopatch_cart', JSON.stringify({
  items: [{
    id: '1', productId: 'p1', variantId: 'v1', name: 'Test',
    brand: 'B', flavor: 'F', strengthMg: 3,
    price: 9.999  // Should round to 1000 cents
  }]
}));
```
- **Expected**: Displays `$10.00 / can` (rounded correctly via `Math.round`)

### 10. Rapid cart mutations
- Add item, immediately click +5 times, immediately remove item
- **Expected**: No NaN appears during rapid state changes

---

## Implementation Order

1. **First**: Define `StoredCartItem` type in `cartService.ts`
2. **Second**: Add `normalizeCartItem()` method in `cartService.ts`
3. **Third**: Update `getStoredCart()` to use normalization
4. **Fourth**: Add defensive UI fallback in `CartDrawer.tsx`
5. **Last**: Run all 10 manual tests

---

## Verification Checklist

```bash
# Type check must pass:
npm run type-check

# After implementation, verify:
1. Clear localStorage
2. Add 10 items to cart
3. Refresh page 3 times
4. Confirm no NaN in CartDrawer
5. Console should only show warnings for corrupted data (if any)
```

---

**Awaiting approval.**

