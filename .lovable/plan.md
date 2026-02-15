

# Phase 1: Hardening + Shipping Method Mock -- Rev 3 (Implementation)

Based on the current codebase, the foundational pieces (types in `shop.ts`, `shippingService.ts`, `ShippingMethodSelector.tsx`, `orderService.ts`) are already in place. The remaining work is wiring them together.

---

## Changes Required

### 1. `src/services/shippingFormService.ts` -- Add write-back normalization

In `getDraft()` (line 33-45): after normalizing `shippingMethod`, check if it changed from what was stored. If so, write the corrected draft back to localStorage before returning.

In `getSelectedMethod()` (line 56-62): same write-back logic -- if the stored method was invalid/missing, persist the normalized `'standard'` back.

---

### 2. `src/components/checkout/ShippingForm.tsx` -- Integrate ShippingMethodSelector

- Add new props: `totalCans: number`, `selectedMethod: ShippingMethod`, `onMethodChange: (method: ShippingMethod) => void`
- Import `ShippingMethodSelector` and `getAvailableShippingQuotes`
- Render `ShippingMethodSelector` between the address fields and the "Continue to Review" button
- On method change, also call `handleFieldBlur()` to persist draft including the method
- Update `handleFieldBlur` to include `shippingMethod` in the saved draft

---

### 3. `src/components/checkout/OrderReview.tsx` -- Accept cents + method label

- Change prop `shippingCost: number` to `shippingCostCents: number`
- Add prop `shippingMethod: ShippingMethod`
- Display shipping line as: `Shipping (Standard)  $20.00` or `Shipping (Express)  Free`
- Change prop `total: number` to `totalCents: number`
- All formatting uses `(cents / 100).toFixed(2)`

---

### 4. `src/components/checkout/PaymentPlaceholder.tsx` -- Accept cents

- Change prop `total: number` to `totalCents: number`
- Format display as `(totalCents / 100).toFixed(2)`
- Update the button label accordingly

---

### 5. `src/pages/patient/Checkout.tsx` -- Wire shipping method state + fresh recompute

- Import `ShippingMethod`, `getShippingCostCents`, `shippingFormService`
- Add state: `const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard')`
- On mount: restore from `shippingFormService.getSelectedMethod(user.id)`
- Replace hardcoded `SHIPPING_COST_CENTS` (line 41) with `getShippingCostCents(cart.totalCans, shippingMethod)`
- Pass `totalCans`, `selectedMethod`, `onMethodChange` to `ShippingForm`
- Pass `shippingCostCents` and `shippingMethod` to `OrderReview` (cents, not dollars)
- Pass `totalCents` to `PaymentPlaceholder` (cents, not dollars)
- In `handlePlaceOrder`: recompute `shippingCents` fresh via `getShippingCostCents(cart.totalCans, shippingMethod)` immediately before calling `orderService.placeOrder()`
- Pass `shippingMethod` to `orderService.placeOrder()`
- Replace sidebar promo text (lines 293-297) with dynamic text: "Order exactly 60 cans for free Express shipping"
- Update sidebar shipping display to show method label and use the dynamic cost

---

## Implementation Order

1. `shippingFormService.ts` -- write-back normalization
2. `ShippingForm.tsx` -- integrate selector
3. `OrderReview.tsx` -- cents props + method label
4. `PaymentPlaceholder.tsx` -- cents prop
5. `Checkout.tsx` -- wire everything together

---

## Key Rev 3 Requirements Addressed

- **Strict promo**: `totalCans === 60` (already in `shippingService.ts` line 36)
- **Write-back normalization**: `getDraft()` and `getSelectedMethod()` persist corrected values
- **Fresh recompute**: `handlePlaceOrder` calls `getShippingCostCents()` immediately before `placeOrder()`
- **Both fields on Order**: `shippingMethod` + `shippingCents` (already in `orderService.ts`)
- **Edge-case test**: Select Express at 60 cans, remove 1 can, verify cost updates from $0 to $40

