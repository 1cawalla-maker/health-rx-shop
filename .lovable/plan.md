

# Phase 1: Hardening + Shipping Method Mock (Standard/Express + Free Express at 60 cans) -- Rev 2

---

## Problem

The checkout currently uses a hardcoded shipping cost calculation on line 41 of `Checkout.tsx`. There is no user-facing shipping method selector, no promo logic for 60-can orders, and the shipping draft does not persist a selected method. The shipping cost rule does not match the business requirements (Standard $20 / Express $40 / Express free at exactly 60 cans).

---

## Hard Constraints

- Phase 1: mock/localStorage only. No Supabase queries, no Stripe/Shopify wiring.
- No new dependencies.
- UI must not touch localStorage directly (services/hooks only).
- Keep money in integer cents in state/storage.

---

## Design Decisions

1. **ShippingQuote includes `isFree: boolean`**: Explicit flag for UI rendering ("Free" badge, strikethrough) without requiring `costCents === 0` checks scattered across components.

2. **Type-guard `validateShippingMethod`**: A proper TypeScript type-guard (`method is ShippingMethod`) that narrows `unknown` to `ShippingMethod`. Invalid/missing values normalize to `'standard'` with a `console.warn`.

3. **Order stores both `shippingMethod` and `shippingCostCents`**: The `Order` type gains both fields so Phase 2 migration to Supabase/Stripe/Shopify is a direct column mapping (no re-derivation needed).

4. **Free Express rule is strictly `totalCans === 60`**: Not `>= 60`. If a user orders 59 or 61 cans, Express is $40.

5. **Single source of truth for pricing**: `shippingService.ts` owns all cost logic. No component computes shipping costs directly.

---

## File-by-File Changes

### A. `src/types/shop.ts` -- Add shipping types + extend Order

Add new types after the existing `ShippingAddress` interface (around line 65):

```typescript
export type ShippingMethod = 'standard' | 'express';

export interface ShippingQuote {
  method: ShippingMethod;
  label: string;
  costCents: number;
  isFree: boolean;
  description?: string;
}
```

Extend the `Order` interface (line 76) to add both fields:

```typescript
export interface Order {
  // ... existing fields ...
  shippingMethod?: ShippingMethod;
  // shippingCents already exists (line 83) -- no change needed
}
```

Note: `shippingCents` already exists on `Order` (line 83), so the cost is already persisted. We only need to add `shippingMethod`.

---

### B. `src/services/shippingService.ts` -- NEW file, pure shipping logic

```typescript
import type { ShippingMethod, ShippingQuote } from '@/types/shop';

const STANDARD_COST_CENTS = 2000;
const EXPRESS_COST_CENTS = 4000;
const FREE_EXPRESS_CAN_THRESHOLD = 60;

// Type-guard: narrows unknown to ShippingMethod
export function validateShippingMethod(
  method: unknown
): method is ShippingMethod {
  if (method === 'standard' || method === 'express') return true;
  if (method !== undefined && method !== null) {
    console.warn(
      `Invalid shipping method "${String(method)}", defaulting to "standard"`
    );
  }
  return false;
}

// Normalize unknown to safe ShippingMethod
export function safeShippingMethod(method: unknown): ShippingMethod {
  return validateShippingMethod(method) ? method : 'standard';
}

export function getAvailableShippingQuotes(totalCans: number): ShippingQuote[] {
  const expressIsFree = totalCans === FREE_EXPRESS_CAN_THRESHOLD;
  return [
    {
      method: 'standard',
      label: 'Standard Shipping',
      costCents: STANDARD_COST_CENTS,
      isFree: false,
      description: '5-7 business days',
    },
    {
      method: 'express',
      label: 'Express Shipping',
      costCents: expressIsFree ? 0 : EXPRESS_COST_CENTS,
      isFree: expressIsFree,
      description: expressIsFree
        ? 'Free for 60-can orders — 1-3 business days'
        : '1-3 business days',
    },
  ];
}

export function getShippingCostCents(
  totalCans: number,
  method: ShippingMethod
): number {
  const quotes = getAvailableShippingQuotes(totalCans);
  const quote = quotes.find(q => q.method === method);
  return quote?.costCents ?? STANDARD_COST_CENTS;
}
```

---

### C. `src/services/shippingFormService.ts` -- Extend draft to include shippingMethod

**C1.** Import types and validation:

```typescript
import type { ShippingAddress, ShippingMethod } from '@/types/shop';
import { safeShippingMethod } from '@/services/shippingService';
```

**C2.** Extend draft shape:

```typescript
type ShippingDraft = Partial<ShippingAddress> & {
  shippingMethod?: string; // stored as string, validated on read
};
type DraftStore = Record<string, ShippingDraft>;
```

**C3.** Update `getDraft()` return type to `ShippingDraft | null`. When returning, normalize `shippingMethod` via `safeShippingMethod(draft.shippingMethod)`.

**C4.** Update `saveDraft()` to accept `ShippingDraft`.

**C5.** Add convenience method:

```typescript
getSelectedMethod(userId: string): ShippingMethod {
  if (!userId) return 'standard';
  const draft = this.getDraft(userId);
  return safeShippingMethod(draft?.shippingMethod);
}
```

---

### D. `src/components/checkout/ShippingMethodSelector.tsx` -- NEW component

Props:

```typescript
interface ShippingMethodSelectorProps {
  quotes: ShippingQuote[];
  selectedMethod: ShippingMethod;
  onMethodChange: (method: ShippingMethod) => void;
}
```

Renders each quote as a Radix `RadioGroup` card showing:
- Method label (e.g., "Standard Shipping")
- Cost: `isFree ? "Free" : `$${(costCents / 100).toFixed(2)}``
- Description text
- Visual highlight on selected

---

### E. `src/components/checkout/ShippingForm.tsx` -- Integrate method selector

**E1.** Accept new props: `totalCans`, `selectedMethod`, `onMethodChange`.

**E2.** Render `ShippingMethodSelector` below address fields, passing quotes from `getAvailableShippingQuotes(totalCans)`.

**E3.** On method change, persist via `shippingFormService.saveDraft(userId, { ...address, shippingMethod })`.

**E4.** On mount, restore method from `shippingFormService.getSelectedMethod(userId)`.

---

### F. `src/pages/patient/Checkout.tsx` -- Wire shipping method state

**F1.** Replace hardcoded shipping cost (line 41):

```typescript
const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
// On mount: restore from draft
useEffect(() => {
  if (user?.id) setShippingMethod(shippingFormService.getSelectedMethod(user.id));
}, [user?.id]);

const shippingCostCents = getShippingCostCents(cart.totalCans, shippingMethod);
const totalCents = subtotalCents + shippingCostCents;
```

**F2.** Pass `totalCans`, `selectedMethod`, `onMethodChange` to `ShippingForm`.

**F3.** Pass `shippingCostCents` (cents) and `shippingMethod` to `OrderReview` and `PaymentPlaceholder`.

**F4.** Update sidebar promo text: replace "free shipping over $100" with dynamic text based on quotes (e.g., "Order 60 cans for free Express shipping").

**F5.** Pass `shippingMethod` to `orderService.placeOrder()`.

---

### G. `src/components/checkout/OrderReview.tsx` -- Cents props + method label

**G1.** Change `shippingCost` prop to `shippingCostCents: number`, add `shippingMethod: ShippingMethod`.

**G2.** Display method label alongside cost:

```
Shipping (Express)     Free
Shipping (Standard)    $20.00
```

**G3.** Use `isFree` logic: if `shippingCostCents === 0`, display "Free".

---

### H. `src/components/checkout/PaymentPlaceholder.tsx` -- Accept cents

**H1.** Change `total` prop to `totalCents: number`.

**H2.** Format as `(totalCents / 100).toFixed(2)`.

---

### I. `src/services/orderService.ts` -- Persist shippingMethod

**I1.** Update `CreateOrderData` to include `shippingMethod?: ShippingMethod`.

**I2.** In `placeOrder()`, set `order.shippingMethod = safeShippingMethod(data.shippingMethod)`.

`shippingCents` is already set from `data.shippingCents` (line 72 of current file), so both fields are persisted.

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/types/shop.ts` | UPDATE | Add `ShippingMethod`, `ShippingQuote` (with `isFree`); add `shippingMethod` to `Order` |
| `src/services/shippingService.ts` | ADD | Pure pricing logic + `validateShippingMethod` type-guard + `safeShippingMethod` |
| `src/services/shippingFormService.ts` | UPDATE | Extend draft to include `shippingMethod`; add `getSelectedMethod()` |
| `src/components/checkout/ShippingMethodSelector.tsx` | ADD | Radio-card UI for Standard/Express |
| `src/components/checkout/ShippingForm.tsx` | UPDATE | Integrate selector; persist method in draft |
| `src/pages/patient/Checkout.tsx` | UPDATE | Wire method state; replace hardcoded cost; pass cents to children |
| `src/components/checkout/OrderReview.tsx` | UPDATE | Accept `shippingCostCents` + `shippingMethod`; display method label |
| `src/components/checkout/PaymentPlaceholder.tsx` | UPDATE | Accept `totalCents` instead of dollars |
| `src/services/orderService.ts` | UPDATE | Persist `shippingMethod` via `safeShippingMethod()` |

---

## Implementation Order

1. Add types to `shop.ts`
2. Create `shippingService.ts` (pricing + type-guard)
3. Update `shippingFormService.ts` (extend draft)
4. Create `ShippingMethodSelector.tsx`
5. Update `ShippingForm.tsx` (integrate selector)
6. Update `OrderReview.tsx` (cents props + method label)
7. Update `PaymentPlaceholder.tsx` (cents prop)
8. Update `orderService.ts` (persist method)
9. Update `Checkout.tsx` (wire everything)

---

## Migration-Ready Notes

```text
ShippingQuote.method      -> orders.shipping_method (text/enum)
ShippingQuote.costCents   -> orders.shipping_cents (int, already exists)
ShippingQuote.isFree      -> derived at query time or stored as boolean
Order.shippingMethod      -> orders.shipping_method column
Order.shippingCents       -> orders.shipping_cents column (already exists)
```

In Phase 2, `shippingService.ts` becomes async (Shopify carrier rates or backend function). UI and draft persistence remain unchanged.

---

## Manual Acceptance Tests

### 1. Standard shipping default
- Go to checkout with any cart
- **Expected**: "Standard Shipping" pre-selected, sidebar shows "$20.00" shipping

### 2. Express shipping selection
- Select "Express Shipping"
- **Expected**: Sidebar shows "$40.00" shipping, total recalculates

### 3. Free Express at exactly 60 cans
- Set cart to exactly 60 cans
- **Expected**: Express shows "Free" with `isFree` badge/text, cost = $0, total = subtotal only

### 4. 59 cans: Express is NOT free
- Set cart to 59 cans, select Express
- **Expected**: Express shows "$40.00", no free promo

### 5. 61 cans: Express is NOT free
- Set cart to 61 cans (if allowance permits), select Express
- **Expected**: Express shows "$40.00", no free promo

### 6. Method persists across refresh
- Select Express, refresh, return to checkout
- **Expected**: Express still selected

### 7. Method persists on placed order
- Place order with Express
- Check `nicopatch_orders` in localStorage: latest order has `shippingMethod: 'express'` AND `shippingCents` matches selected cost

### 8. Legacy draft normalization
- Set draft in localStorage with `shippingMethod: "bogus"`
- Open checkout
- **Expected**: Defaults to Standard, `console.warn` logged

### 9. Invalid method type-guard
- Call `validateShippingMethod(42)` mentally / in console
- **Expected**: Returns `false`, warns, `safeShippingMethod(42)` returns `'standard'`

### 10. Cart normalization unchanged
- Inject legacy cart with string qty/price, reload
- **Expected**: No NaN, correct values (existing Rev 2 tests still pass)

---

**Awaiting approval.**

