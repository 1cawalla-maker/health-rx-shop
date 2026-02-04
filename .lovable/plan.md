

# Phase 1: Clean Mock Prescription Key for Shop Gating (Rev 2)

---

## Hard Constraints (Phase 1)

- **Mock/localStorage ONLY**. NO Supabase querying or fallback anywhere (especially in `usePrescriptionStatus.ts`).
- NO Stripe/Shopify/backend integration.
- NO database changes/migrations.
- NO new dependencies.
- **UI must NOT read/write localStorage directly**; only via services/hooks.

---

## Storage Contracts (Authoritative, Phase 1)

| Data | localStorage Key | JSON Shape |
|------|------------------|------------|
| **Prescriptions (canonical)** | `healthrx_mock_prescriptions` | `MockPrescription[]` |
| **Orders (canonical)** | `nicopatch_orders` | `Order[]` |
| **Cart (canonical)** | `nicopatch_cart` | `Cart` |

**Confirmed**: The cart key `nicopatch_cart` is defined in `src/services/cartService.ts` line 7 as `const CART_STORAGE_KEY = 'nicopatch_cart'`.

**Confirmed**: The orders key `nicopatch_orders` is defined in `src/services/orderService.ts` line 7 as `const ORDERS_STORAGE_KEY = 'nicopatch_orders'`.

---

## User Identity Source (Required)

**All `userId` values come from `useAuth().user.id`.**

If `user` is `null`, all prescription/order methods return empty/null and **Shop remains locked**.

---

## Allowance Scoping (Required)

**Phase 1 allowance is per-user:**

```
cansOrdered = sum(orders.filter(o => o.userId === userId).map(o => o.totalCans))
remainingCans = 60 - cansOrdered - currentCartTotalCans
```

**prescriptionId handling:**
- Phase 1 **ignores** `prescriptionId` when calculating allowance (allowance is user-scoped only)
- Orders MAY include `prescriptionId` for audit purposes
- Phase 2 may optionally scope allowance by `prescriptionId`

---

## Problem Summary

1. **Supabase coupling in Phase 1**: `usePrescriptionStatus.ts` queries Supabase tables (`doctor_issued_prescriptions`, `prescriptions`) which shouldn't happen in Phase 1 (mock-only)
2. **Orders key undocumented**: Uses `nicopatch_orders` but schema not explicitly defined for allowance calculations
3. **Non-atomic order placement**: If cart clear fails after order succeeds (or vice versa), state becomes inconsistent
4. **Allowance calculation gaps**: Remaining cans computed differently in Shop vs Checkout, vulnerable to localStorage manipulation
5. **Dev toggle visibility**: Missing URL param support
6. **Strength gating scattered**: `isVariantAllowed()` is inline in Shop.tsx rather than in a service

---

## Solution Overview

1. Remove ALL Supabase references from `usePrescriptionStatus.ts`
2. Document explicit localStorage keys and schemas
3. Make `placeOrder()` atomic with try/catch protection
4. Enforce allowance recalculation from scratch at both add-to-cart AND checkout
5. Add URL param support to dev toggle
6. Move strength gating logic to `shopPrescriptionService`

---

## File-by-File Plan

### 1. `src/types/shop.ts`

**Change**: Add `updatedAt` field to `MockPrescription` interface (lines 96-104)

```typescript
// AFTER
export interface MockPrescription {
  id: string;
  userId: string;
  status: 'active' | 'expired' | 'revoked';
  maxStrengthMg: 3 | 6 | 9;
  totalCansAllowed: 60;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;  // Added for migration-readiness
}
```

---

### 2. `src/services/shopPrescriptionService.ts`

**Change**: Full rewrite with new storage key and explicit methods

**Storage key**: `const PRESCRIPTION_STORAGE_KEY = 'healthrx_mock_prescriptions'` (documented at top)

**Method signatures**:

```typescript
class ShopPrescriptionService {
  // Get active prescription for specific user
  // Returns newest active, non-expired prescription or null
  getActivePrescription(userId: string): MockPrescription | null;
  
  // Calculate remaining allowance from persisted orders (user-scoped)
  // Formula: 60 - sum(orders.filter(o => o.userId).totalCans)
  getRemainingAllowance(userId: string): Promise<{
    totalCansAllowed: number;
    cansUsed: number;
    remainingCans: number;
  }>;
  
  // Create mock prescription for testing (dev helper)
  createMockPrescription(userId: string, maxStrengthMg: 3 | 6 | 9): MockPrescription;
  
  // Clear prescriptions for specific user only
  clearMockPrescriptionsForUser(userId: string): void;
  
  // STRENGTH GATING HELPER
  isVariantAllowed(variantStrengthMg: number, prescriptionMaxStrengthMg: number): boolean {
    return variantStrengthMg <= prescriptionMaxStrengthMg;
  }
}
```

---

### 3. `src/services/orderService.ts`

**Storage key**: Confirm existing `const ORDERS_STORAGE_KEY = 'nicopatch_orders'` (document at top of file)

**Change**: Make `placeOrder()` atomic with explicit error handling

**Atomicity guarantee**:
1. Build order object
2. Read existing orders from localStorage
3. Append new order to array
4. **Write orders back to localStorage**
5. **Only after successful write**, return order
6. **Cart clearing is caller's responsibility** (Checkout.tsx calls `clearCart()` after receiving order)
7. If write fails, throw error - cart remains unchanged, checkout shows error

```typescript
async placeOrder(data: CreateOrderData): Promise<Order> {
  const order: Order = { /* build order */ };

  // ATOMIC: Read → Append → Write
  try {
    const existingOrders = this.getStoredOrders();
    existingOrders.unshift(order);
    this.saveOrders(existingOrders);
    return order;
  } catch (error) {
    console.error('Failed to persist order:', error);
    throw new Error('Order placement failed - cart unchanged');
  }
}
```

---

### 4. `src/hooks/usePrescriptionStatus.ts`

**Change**: Complete rewrite - remove ALL Supabase references

**Key changes**:
- Remove `supabase` import entirely
- Remove all Supabase queries (`doctor_issued_prescriptions`, `prescriptions` tables)
- Use ONLY `shopPrescriptionService.getActivePrescription(user.id)`
- If `user` is null, return `{ hasActivePrescription: false }` immediately
- `setMockPrescription(enabled, maxStrengthMg)` calls service to persist

```typescript
export function usePrescriptionStatus() {
  const { user } = useAuth();
  
  // If no user, shop locked immediately
  if (!user) {
    return { hasActivePrescription: false, isLoading: false, ... };
  }
  
  // ONLY use mock service - NO Supabase
  const prescription = shopPrescriptionService.getActivePrescription(user.id);
  // ...
}
```

---

### 5. `src/components/shop/DevPrescriptionToggle.tsx`

**Change**: Rewrite with strength-specific buttons

**Visibility gate (explicit)**:
```typescript
const isDevVisible = import.meta.env.DEV || 
  new URLSearchParams(window.location.search).get('dev') === '1';

if (!isDevVisible) {
  return null;  // Never visible in prod
}
```

**Props**:
```typescript
interface DevPrescriptionToggleProps {
  onCreatePrescription: (maxStrengthMg: 3 | 6 | 9) => void;
  onClearPrescription: () => void;
  activePrescription?: { maxStrengthMg: number } | null;
}
```

**Buttons**: "3mg", "6mg", "9mg", "Clear Prescription"

---

### 6. `src/pages/patient/Shop.tsx`

**Changes**:
1. Use `shopPrescriptionService.isVariantAllowed()` for strength gating
2. **Add-to-cart allowance check**: Recalc remaining from scratch BEFORE mutation

```typescript
const handleAddToCart = async (product: Product, variant: ProductVariant) => {
  // RECALC FROM SCRATCH: persisted orders + current cart
  const freshCansOrdered = await orderService.getTotalCansOrdered(user.id);
  const freshRemainingCans = 60 - freshCansOrdered - cart.totalCans;
  
  if (freshRemainingCans <= 0) {
    toast.error('No remaining allowance');
    return;
  }
  
  await addToCart(product, variant, 1);
};
```

3. Update `DevPrescriptionToggle` with new props

---

### 7. `src/pages/patient/Checkout.tsx`

**Change**: Recalculate allowance from scratch at submit time

**Checkout submit allowance check**: Fresh recalc from localStorage to defend against manipulation

```typescript
const handlePlaceOrder = async () => {
  // RECALC FROM SCRATCH at submit time
  const freshCansOrdered = await orderService.getTotalCansOrdered(user.id);
  const freshRemainingCans = 60 - freshCansOrdered;
  
  if (cart.totalCans > freshRemainingCans) {
    toast.error(`Cart (${cart.totalCans} cans) exceeds remaining allowance (${freshRemainingCans} cans)`);
    return;
  }

  try {
    // Order persists first (atomic)
    const order = await orderService.placeOrder({ ... });
    
    // ONLY clear cart after successful order persistence
    await clearCart();
    navigate(`/patient/order-success?orderId=${order.id}`);
  } catch (error) {
    toast.error('Failed to place order. Your cart has not been modified.');
  }
};
```

---

## Enforcement Summary

| Invariant | Location | Implementation |
|-----------|----------|----------------|
| No Supabase in Phase 1 | `usePrescriptionStatus.ts` | Remove all `supabase` imports/queries |
| User identity | All services | `useAuth().user.id`; if null → locked |
| Strength gating | `shopPrescriptionService.isVariantAllowed()` | `variantStrengthMg <= prescriptionMaxStrengthMg` |
| Add-to-cart allowance | `Shop.tsx handleAddToCart()` | Recalc `60 - cansOrdered - cart.totalCans` BEFORE add |
| Checkout allowance | `Checkout.tsx handlePlaceOrder()` | Fresh recalc from `orderService.getTotalCansOrdered()` |
| Order atomicity | `orderService.placeOrder()` | Try/catch wrap; throw on failure; cart unchanged |
| Cart clear timing | `Checkout.tsx` | Only after `placeOrder()` returns successfully |
| Dev toggle visibility | `DevPrescriptionToggle.tsx` | `import.meta.env.DEV \|\| URLSearchParams.get('dev') === '1'` |
| Allowance scoping | Phase 1 | Per-user only; `prescriptionId` ignored |

---

## Manual Acceptance Tests

1. **No prescription → Shop locked**
   - Clear localStorage, navigate to `/patient/shop`
   - Verify "Shop Locked" overlay appears

2. **Create 9mg prescription → All strengths enabled**
   - Click "9mg" in dev panel
   - Verify shop unlocks, 3/6/9mg buttons all enabled

3. **Create 3mg prescription → Only 3mg enabled**
   - Click "3mg" in dev panel
   - Verify only 3mg buttons enabled, 6/9mg show "Not allowed"

4. **Allowance enforcement across orders**
   - Create prescription
   - Add 30 cans to cart, place order
   - Add 30 cans to cart, place order
   - Try to add 1 more can → Should be blocked

5. **Allowance recalculation at checkout**
   - Add 50 cans to cart
   - In another tab, manually edit localStorage to add an order with 20 cans
   - Try to checkout → Should fail with "exceeds allowance" error

6. **Page refresh persistence**
   - Create prescription, add items to cart
   - Refresh page
   - Verify prescription active, cart items present

7. **Dev toggle visibility in prod**
   - Check prod build (or set `import.meta.env.DEV = false`)
   - Verify dev panel hidden unless `?dev=1` in URL

8. **Order atomicity**
   - If `placeOrder()` fails, verify cart NOT cleared and error shown

---

## Files Modified Summary

| File | Change Type | Key Responsibility |
|------|-------------|-------------------|
| `src/types/shop.ts` | Update | Add `updatedAt` to `MockPrescription` |
| `src/services/shopPrescriptionService.ts` | Rewrite | New storage key `healthrx_mock_prescriptions`, `isVariantAllowed()` |
| `src/services/orderService.ts` | Update | Atomic `placeOrder()` with try/catch, document `ORDERS_STORAGE_KEY` |
| `src/hooks/usePrescriptionStatus.ts` | Rewrite | Remove ALL Supabase, mock-only via service |
| `src/components/shop/DevPrescriptionToggle.tsx` | Rewrite | Strength buttons, URL param gate |
| `src/pages/patient/Shop.tsx` | Update | Service for strength check, allowance recalc before add |
| `src/pages/patient/Checkout.tsx` | Update | Fresh allowance recalc at submit, atomic cart clear |

---

**Awaiting approval.**

