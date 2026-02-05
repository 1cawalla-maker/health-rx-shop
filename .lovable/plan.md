

# Phase 1: UX Polish + Migration-Ready Seams (Shop/Checkout) — Rev 3

---

## Hard Constraints (Phase 1)

- **Mock/localStorage ONLY** — NO backend queries/imports anywhere in shop/prescription/order flow
- NO Stripe/Shopify/backend wiring. NO database changes/migrations. NO new dependencies
- **UI components MUST NOT read/write localStorage directly** — only via services/hooks
- **userId source**: Always `useAuth().user.id`. If `user` is `null` OR `userId` is falsy → shop locked, services return `null`/empty, services MUST NOT touch localStorage
- **Existing canonical keys**: `healthrx_mock_prescriptions`, `nicopatch_orders`, `nicopatch_cart`

---

## Explicit Invariant: UI/Storage Separation

```text
+------------------+     +------------------+     +------------------+
|  UI Components   | --> |  Hooks/Context   | --> |    Services      |
|  (Shop.tsx,      |     |  (usePrescription|     |  (*Service.ts)   |
|   Checkout.tsx,  |     |   Status,        |     |                  |
|   ShippingForm)  |     |   useCart, etc.) |     |  localStorage    |
+------------------+     +------------------+     +------------------+

UI NEVER imports localStorage. Services are the ONLY files that touch storage.
```

---

## Explicit userId Source Pattern

All services and hooks MUST obtain `userId` from `useAuth().user.id`:

```typescript
const { user } = useAuth();  // from src/hooks/useAuth.tsx
const userId = user?.id;     // string | undefined

// Guard pattern (REQUIRED in all services):
if (!userId) {
  // DO NOT read/write localStorage
  // Return null, [], or empty object as appropriate
  return null;
}
```

---

## ShippingAddress Type (Confirmed Location + Fields)

**Location**: `src/types/shop.ts` (lines 56-64)

**Fields** (existing, no changes):
```typescript
export interface ShippingAddress {
  fullName: string;      // Required
  phone: string;         // Required, Australian mobile format
  addressLine1: string;  // Required
  addressLine2?: string; // Optional
  suburb: string;        // Required
  state: string;         // Required, one of AUSTRALIAN_STATES
  postcode: string;      // Required, 4 digits
}
```

---

## Allowance Formulas (Explicit)

### Variables
- `totalAllowed` = 60 (constant: `PRESCRIPTION_TOTAL_CANS`)
- `orderedCans` = `sum(orders.filter(o => o.userId === userId).map(o => o.totalCans))`
  - **Phase 1 scope**: ALL historical orders per user (not per-prescription period)
  - **Phase 2 note**: May scope by prescriptionId or date window
- `cartCans` = `cart.totalCans`

### Formulas
```typescript
// For add-to-cart gating (includes current cart):
remainingForAddToCart = max(0, totalAllowed - orderedCans - cartCans)

// For checkout validation (cart becomes order, so exclude cart):
remainingAtCheckout = max(0, totalAllowed - orderedCans)
```

### Validation Rules
- **Add-to-cart**: Block if `remainingForAddToCart <= 0` OR if `qtyCans > remainingForAddToCart`
- **Checkout submit**: Block if `cartCans > remainingAtCheckout`

---

## Logout Mid-Cart Behavior (Decision)

**Strategy**: Clear cart on logout

**Rationale**: Current `cartService` uses a global key `nicopatch_cart` without userId scoping. Clearing on logout is simpler and prevents data leakage between users.

**Implementation**: 
- Update `useAuth().signOut` to call `cartService.clearCart()` before signing out
- Alternative (deferred to Phase 2): Make cart user-scoped with key pattern `nicopatch_cart_{userId}`

---

## Shipping Draft Persistence Frequency

**Strategy**: Save on blur (not on every keystroke)

**Rationale**: Reduces localStorage writes without adding debounce complexity or dependencies

**Implementation**: Each input field's `onBlur` handler triggers `shippingFormService.saveDraft(userId, formValues)`

---

## File-by-File Plan

### 1. NEW: `src/lib/storageKeys.ts`

**Purpose**: Centralize all localStorage key names — NO string literals scattered in services

```typescript
// Canonical localStorage keys for shop data
// Phase 1: localStorage
// Phase 2: Map to backend tables

export const STORAGE_KEYS = {
  prescriptions: 'healthrx_mock_prescriptions',
  orders: 'nicopatch_orders',
  cart: 'nicopatch_cart',
  shippingDraft: 'nicopatch_shipping_draft',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
```

---

### 2. NEW: `src/types/shopContracts.ts`

**Purpose**: Define storage-agnostic contracts for shop data operations

**Note**: Phase 1 implements these contracts using localStorage. Phase 2 may implement the same contracts via backend storage.

```typescript
// Storage-agnostic contracts for shop data operations
// Phase 1: Implemented with localStorage
// Phase 2: May implement the same contracts via backend storage

import type { 
  MockPrescription, 
  Order, 
  Cart, 
  ShippingAddress, 
  Product, 
  ProductVariant 
} from './shop';

// -----------------------------------
// Prescription Contract
// -----------------------------------
export interface PrescriptionServiceContract {
  /**
   * Get active prescription for user
   * MUST filter out expired prescriptions (expiresAt <= now)
   * @param userId - from useAuth().user.id; if falsy, return null
   * @returns Active prescription or null
   */
  getActivePrescription(userId: string): MockPrescription | null;

  /**
   * Get latest prescription even if expired (for UX messaging)
   * @param userId - from useAuth().user.id; if falsy, return { prescription: null, isExpired: false }
   */
  getLatestPrescription(userId: string): { 
    prescription: MockPrescription | null; 
    isExpired: boolean 
  };

  /**
   * Calculate remaining allowance for user
   * @param userId - if falsy, return zeros
   */
  getRemainingAllowance(userId: string): Promise<{
    totalCansAllowed: number;
    cansUsed: number;
    remainingCans: number;
  }>;

  /**
   * Check if variant strength is allowed by prescription
   */
  isVariantAllowed(variantStrengthMg: number, maxAllowedStrengthMg: number): boolean;
}

// -----------------------------------
// Order Contract
// -----------------------------------
export interface OrderServiceContract {
  placeOrder(data: {
    userId: string;  // Required, must be validated before calling
    cart: Cart;
    shippingAddress: ShippingAddress;
    shippingCents: number;
    prescriptionId?: string;
  }): Promise<Order>;

  /** @param userId - if falsy, return [] */
  getOrders(userId: string): Promise<Order[]>;
  
  /** @param userId - if falsy, return 0 */
  getTotalCansOrdered(userId: string): Promise<number>;
}

// -----------------------------------
// Cart Contract
// -----------------------------------
export interface CartServiceContract {
  getCart(): Promise<Cart>;
  addItem(product: Product, variant: ProductVariant, qtyCans: number): Promise<Cart>;
  updateQuantity(itemId: string, qtyCans: number): Promise<Cart>;
  removeItem(itemId: string): Promise<Cart>;
  clearCart(): Promise<Cart>;
}

// -----------------------------------
// Shipping Draft Contract
// -----------------------------------
export interface ShippingDraftServiceContract {
  /** @param userId - if falsy, return null (do not read localStorage) */
  getDraft(userId: string): ShippingAddress | null;
  
  /** @param userId - if falsy, no-op (do not write localStorage) */
  saveDraft(userId: string, address: Partial<ShippingAddress>): void;
  
  /** @param userId - if falsy, no-op */
  clearDraft(userId: string): void;
}
```

---

### 3. NEW: `src/services/shippingFormService.ts`

**Purpose**: Persist shipping form draft to localStorage

**Storage key**: `STORAGE_KEYS.shippingDraft` (`nicopatch_shipping_draft`)

**Data shape**: `{ [userId: string]: Partial<ShippingAddress> }`

**Null guard**: If `userId` is falsy, methods return `null` / no-op without touching localStorage

```typescript
import type { ShippingAddress } from '@/types/shop';
import { STORAGE_KEYS } from '@/lib/storageKeys';

type DraftStore = Record<string, Partial<ShippingAddress>>;

class ShippingFormService {
  private getAllDrafts(): DraftStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.shippingDraft);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveDrafts(drafts: DraftStore): void {
    try {
      localStorage.setItem(STORAGE_KEYS.shippingDraft, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error saving shipping draft:', error);
    }
  }

  getDraft(userId: string): ShippingAddress | null {
    // NULL GUARD: Do not read localStorage if no userId
    if (!userId) return null;
    
    const drafts = this.getAllDrafts();
    const draft = drafts[userId];
    if (!draft || !draft.fullName) return null;
    return draft as ShippingAddress;
  }

  saveDraft(userId: string, address: Partial<ShippingAddress>): void {
    // NULL GUARD: Do not write localStorage if no userId
    if (!userId) return;
    
    const drafts = this.getAllDrafts();
    drafts[userId] = address;
    this.saveDrafts(drafts);
  }

  clearDraft(userId: string): void {
    // NULL GUARD: No-op if no userId
    if (!userId) return;
    
    const drafts = this.getAllDrafts();
    delete drafts[userId];
    this.saveDrafts(drafts);
  }
}

export const shippingFormService = new ShippingFormService();
```

---

### 4. NEW: `src/lib/allowanceUtils.ts`

**Purpose**: Single source of truth for allowance and strength gating calculations

```typescript
import { PRESCRIPTION_TOTAL_CANS } from '@/types/shop';

export const allowanceUtils = {
  /**
   * Calculate remaining cans for add-to-cart operations
   * Formula: max(0, totalAllowed - orderedCans - cartCans)
   * 
   * Phase 1: orderedCans = ALL historical orders for user
   * Phase 2: May scope by prescriptionId or date window
   */
  remainingForAddToCart(orderedCans: number, cartCans: number): number {
    return Math.max(0, PRESCRIPTION_TOTAL_CANS - orderedCans - cartCans);
  },

  /**
   * Calculate remaining cans for checkout validation
   * Formula: max(0, totalAllowed - orderedCans)
   * Note: Cart excluded as it will become an order
   */
  remainingAtCheckout(orderedCans: number): number {
    return Math.max(0, PRESCRIPTION_TOTAL_CANS - orderedCans);
  },

  /**
   * Check if variant strength is allowed by prescription
   * Rule: variantStrengthMg <= maxAllowedStrengthMg
   */
  isVariantAllowed(variantStrengthMg: number, maxAllowedStrengthMg: number): boolean {
    return variantStrengthMg <= maxAllowedStrengthMg;
  },

  /**
   * Check if prescription is expired
   * Rule: expiresAt exists and expiresAt <= now
   */
  isExpired(expiresAt: string | undefined): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  },

  /**
   * Get percentage of allowance used (for progress bar)
   */
  percentageUsed(orderedCans: number, cartCans: number): number {
    return Math.min(100, ((orderedCans + cartCans) / PRESCRIPTION_TOTAL_CANS) * 100);
  },

  /**
   * Check if can add specific quantity to cart
   */
  canAddQuantity(orderedCans: number, cartCans: number, qtyCans: number): boolean {
    return qtyCans <= this.remainingForAddToCart(orderedCans, cartCans);
  },

  /**
   * Check if cart exceeds remaining allowance at checkout
   */
  cartExceedsAllowance(orderedCans: number, cartCans: number): boolean {
    return cartCans > this.remainingAtCheckout(orderedCans);
  },
};
```

---

### 5. UPDATE: `src/services/shopPrescriptionService.ts`

**Changes**:
1. Import `STORAGE_KEYS` and use instead of string literal
2. Add `getLatestPrescription(userId)` method with explicit null guard
3. Add explicit null guard to `getActivePrescription(userId)`
4. Clarify: existing expiration filter (line 43: `p.expiresAt > now`) is correct and stays

**Key additions**:
```typescript
import { STORAGE_KEYS } from '@/lib/storageKeys';

// Change line 9 from:
const PRESCRIPTION_STORAGE_KEY = 'healthrx_mock_prescriptions';
// to:
// Use STORAGE_KEYS.prescriptions directly

// Add null guard to getActivePrescription:
getActivePrescription(userId: string): MockPrescription | null {
  // NULL GUARD: If userId is falsy, return null (do not read localStorage)
  if (!userId) return null;
  
  // ... existing logic
}

// NEW METHOD:
getLatestPrescription(userId: string): { 
  prescription: MockPrescription | null; 
  isExpired: boolean 
} {
  // NULL GUARD: If userId is falsy, return safe default
  if (!userId) {
    return { prescription: null, isExpired: false };
  }
  
  const all = this.getAllPrescriptions();
  const userPrescriptions = all.filter(p => p.userId === userId);
  
  if (userPrescriptions.length === 0) {
    return { prescription: null, isExpired: false };
  }
  
  // Return newest by createdAt
  const latest = userPrescriptions.sort((a, b) => 
    b.createdAt.localeCompare(a.createdAt)
  )[0];
  
  // Check if expired (expiresAt <= now)
  const isExpired = latest.expiresAt 
    ? new Date(latest.expiresAt) <= new Date() 
    : false;
  
  return { prescription: latest, isExpired };
}
```

---

### 6. UPDATE: `src/services/orderService.ts`

**Changes**:
1. Import `STORAGE_KEYS` and use instead of string literal
2. Add null guard to `getOrders(userId)` and `getTotalCansOrdered(userId)`

```typescript
import { STORAGE_KEYS } from '@/lib/storageKeys';

// Change line 7 from:
const ORDERS_STORAGE_KEY = 'nicopatch_orders';
// to use STORAGE_KEYS.orders

// Add null guard:
async getOrders(userId: string): Promise<Order[]> {
  if (!userId) return [];  // NULL GUARD
  const orders = this.getStoredOrders();
  return orders.filter(o => o.userId === userId);
}

async getTotalCansOrdered(userId: string): Promise<number> {
  if (!userId) return 0;  // NULL GUARD
  const orders = await this.getOrders(userId);
  return orders.reduce((sum, order) => sum + order.totalCans, 0);
}
```

---

### 7. UPDATE: `src/services/cartService.ts`

**Changes**:
1. Import `STORAGE_KEYS` and use instead of string literal

```typescript
import { STORAGE_KEYS } from '@/lib/storageKeys';

// Change line 7 from:
const CART_STORAGE_KEY = 'nicopatch_cart';
// to use STORAGE_KEYS.cart
```

---

### 8. UPDATE: `src/hooks/usePrescriptionStatus.ts`

**Changes**:
1. Add `isExpired` and `expiredAt` to return value
2. Call `getLatestPrescription()` when no active prescription found
3. Clarify: if `user` is null, `isExpired` returns `false` (not expired, just no user)

**Updated return interface**:
```typescript
{
  ...existingFields,
  isExpired: boolean;       // True ONLY if user HAD a prescription that expired
  expiredAt?: Date;         // When it expired (for messaging)
  latestPrescriptionId?: string;
}
```

**Logic update**:
```typescript
const refreshStatus = useCallback(async () => {
  // Null guard: if no user, return safe defaults
  if (!user) {
    setStatus({ hasActivePrescription: false, isExpired: false });
    setIsLoading(false);
    return;
  }

  const prescription = shopPrescriptionService.getActivePrescription(user.id);

  if (prescription) {
    // Active prescription found
    const allowance = await shopPrescriptionService.getRemainingAllowance(user.id);
    setStatus({
      hasActivePrescription: true,
      isExpired: false,  // Active means not expired
      // ... existing fields
    });
  } else {
    // No active prescription - check if expired for messaging
    const { prescription: latest, isExpired } = 
      shopPrescriptionService.getLatestPrescription(user.id);
    
    setStatus({
      hasActivePrescription: false,
      isExpired,  // True only if user had a prescription that expired
      expiredAt: isExpired && latest?.expiresAt 
        ? new Date(latest.expiresAt) 
        : undefined,
      latestPrescriptionId: latest?.id,
    });
  }

  setIsLoading(false);
}, [user]);
```

---

### 9. UPDATE: `src/hooks/useAuth.tsx`

**Changes**: 
Clear cart on logout (addresses logout mid-cart behavior)

```typescript
// Update signOut function (around line 251):
const signOut = async () => {
  // Clear cart before signing out to prevent data leakage
  await cartService.clearCart();
  
  await supabase.auth.signOut();
  setUser(null);
  setSession(null);
  setUserRole(null);
};
```

---

### 10. UPDATE: `src/pages/patient/Shop.tsx`

**Changes**:
1. Import and use `allowanceUtils` for calculations
2. Update allowance banner format: "**X ordered** | **Y in cart** | **Z remaining**"
3. Handle expired prescription state with new overlay
4. Use `allowanceUtils.remainingForAddToCart()` for add-to-cart blocking

**Allowance banner update**:
```tsx
<div className="flex justify-between mt-2 text-sm">
  <span className="font-medium">{cansOrdered} ordered</span>
  <span className="text-muted-foreground">|</span>
  <span className="font-medium">{cart.totalCans} in cart</span>
  <span className="text-muted-foreground">|</span>
  <span className="font-medium text-primary">
    {allowanceUtils.remainingForAddToCart(cansOrdered, cart.totalCans)} remaining
  </span>
</div>
```

**Expired prescription handling**:
```tsx
const { isExpired, expiredAt, hasActivePrescription } = usePrescriptionStatus();

// In render:
{!hasActivePrescription && isExpired && (
  <ShopExpiredOverlay expiredAt={expiredAt} />
)}
{!hasActivePrescription && !isExpired && (
  <ShopLockedOverlay />
)}
```

---

### 11. NEW: `src/components/shop/ShopExpiredOverlay.tsx`

**Purpose**: Show "Prescription Expired" message with date and CTAs

```tsx
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ShopExpiredOverlayProps {
  expiredAt?: Date;
}

export function ShopExpiredOverlay({ expiredAt }: ShopExpiredOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className="max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>Prescription Expired</CardTitle>
          <CardDescription>
            {expiredAt 
              ? `Your prescription expired on ${format(expiredAt, 'MMMM d, yyyy')}.`
              : 'Your prescription has expired.'}
            {' '}To continue ordering, please book a new consultation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link to="/patient/book">Book Consultation</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/patient/prescriptions">View Prescriptions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 12. UPDATE: `src/components/checkout/ShippingForm.tsx`

**Changes**:
1. Accept `userId` prop from parent
2. Load saved draft from `shippingFormService` on mount
3. Save draft **on blur** (not on every change) to reduce localStorage writes
4. Clear draft on successful submit
5. **CRITICAL**: Does NOT import localStorage — only uses `shippingFormService`

**Updated props**:
```typescript
interface ShippingFormProps {
  userId?: string;          // from useAuth().user.id
  initialData: ShippingAddress | null;
  onSubmit: (data: ShippingAddress) => void;
}
```

**Key logic**:
```typescript
import { shippingFormService } from '@/services/shippingFormService';

// Load saved draft on mount (if no initialData provided)
useEffect(() => {
  if (userId && !initialData) {
    const savedDraft = shippingFormService.getDraft(userId);
    if (savedDraft) {
      Object.entries(savedDraft).forEach(([key, value]) => {
        if (value) setValue(key as keyof ShippingAddress, value);
      });
    }
  }
}, [userId, initialData, setValue]);

// Save draft on blur (per-field)
const handleFieldBlur = () => {
  if (userId) {
    const currentValues = getValues();
    shippingFormService.saveDraft(userId, currentValues);
  }
};

// Add onBlur={handleFieldBlur} to each Input

// Clear draft on successful submit
const handleFormSubmit = (data: ShippingAddress) => {
  if (userId) {
    shippingFormService.clearDraft(userId);
  }
  onSubmit(data);
};
```

---

### 13. UPDATE: `src/pages/patient/Checkout.tsx`

**Changes**:
1. Pass `userId` to ShippingForm for draft persistence
2. Use `allowanceUtils.remainingAtCheckout()` explicitly
3. Use `allowanceUtils.cartExceedsAllowance()` for submit validation

```tsx
const { user } = useAuth();

<ShippingForm
  userId={user?.id}
  initialData={shippingAddress}
  onSubmit={handleShippingSubmit}
/>

// At submit time:
const freshOrderedCans = await orderService.getTotalCansOrdered(user!.id);
if (allowanceUtils.cartExceedsAllowance(freshOrderedCans, cart.totalCans)) {
  toast.error('Cart exceeds your remaining prescription allowance');
  return;
}
```

---

### 14. NEW: `docs/migration/supabase-phase2.md`

**Purpose**: Document intended backend tables and migration path

```markdown
# Phase 2: Backend Migration Plan

## Overview

Phase 1 uses localStorage for all shop data. Phase 2 migrates to backend storage.

## Storage Key Mapping

| localStorage Key | Backend Table | Notes |
|------------------|---------------|-------|
| `healthrx_mock_prescriptions` | `shop_prescriptions` | Or integrate with existing `doctor_issued_prescriptions` |
| `nicopatch_orders` | `shop_orders` + `shop_order_items` | Normalized schema |
| `nicopatch_cart` | Stay client-side | Cart doesn't need backend persistence |
| `nicopatch_shipping_draft` | Stay client-side | Draft data is transient |

## Allowance Scope (Phase 2)

Phase 1 counts ALL historical orders per user.
Phase 2 may scope by:
- prescriptionId (only orders linked to current prescription)
- Date window (e.g., last 3 months)

## Contract Compliance

Services must continue to implement contracts defined in `src/types/shopContracts.ts`.
Phase 2 swaps localStorage implementations for backend client calls while maintaining identical interfaces.
```

---

## Files Summary

| File | Change | Responsibility |
|------|--------|----------------|
| `src/lib/storageKeys.ts` | NEW | Centralize localStorage key names |
| `src/types/shopContracts.ts` | NEW | Storage-agnostic service contracts |
| `src/services/shippingFormService.ts` | NEW | Persist shipping draft (with null guards) |
| `src/lib/allowanceUtils.ts` | NEW | Centralized allowance/strength calculations |
| `src/services/shopPrescriptionService.ts` | UPDATE | Add `getLatestPrescription()`, use `STORAGE_KEYS`, add null guards |
| `src/services/orderService.ts` | UPDATE | Use `STORAGE_KEYS`, add null guards |
| `src/services/cartService.ts` | UPDATE | Use `STORAGE_KEYS` |
| `src/hooks/usePrescriptionStatus.ts` | UPDATE | Add `isExpired`, `expiredAt` fields |
| `src/hooks/useAuth.tsx` | UPDATE | Clear cart on logout |
| `src/pages/patient/Shop.tsx` | UPDATE | Improved banner, expired overlay, use `allowanceUtils` |
| `src/components/shop/ShopExpiredOverlay.tsx` | NEW | Expired prescription overlay |
| `src/components/checkout/ShippingForm.tsx` | UPDATE | Load/save draft via service (on blur) |
| `src/pages/patient/Checkout.tsx` | UPDATE | Pass `userId` to form, use `allowanceUtils` |
| `docs/migration/supabase-phase2.md` | NEW | Migration documentation |

---

## Storage Contracts (Authoritative, Phase 1)

| Data | localStorage Key (via `STORAGE_KEYS`) | JSON Shape |
|------|---------------------------------------|------------|
| Prescriptions | `healthrx_mock_prescriptions` | `MockPrescription[]` |
| Orders | `nicopatch_orders` | `Order[]` |
| Cart | `nicopatch_cart` | `Cart` |
| Shipping Draft | `nicopatch_shipping_draft` | `{ [userId]: Partial<ShippingAddress> }` |

---

## Manual Acceptance Tests

### 1. No prescription - Shop locked
- Clear localStorage
- Navigate to `/patient/shop`
- **Expected**: "Prescription Required" overlay with CTAs

### 2. Dev toggle 3mg - Only 3mg enabled
- Add `?dev=1` to URL
- Click "3mg" button in dev panel
- **Expected**: Shop unlocks, only 3mg variant buttons enabled, 6/9mg show "Not allowed"

### 3. Dev toggle 9mg - All strengths enabled
- Click "9mg" button in dev panel
- **Expected**: All variant buttons (3/6/9mg) enabled

### 4. Allowance decrements correctly
- Create 9mg prescription
- Add items to cart
- **Expected**: Banner shows "0 ordered | X in cart | (60-X) remaining"
- Complete checkout
- **Expected**: Banner shows "X ordered | 0 in cart | (60-X) remaining"

### 5. Exceed allowance - Block at add-to-cart
- Add 60 cans to cart
- Try to add one more
- **Expected**: Toast error "No remaining allowance" or similar

### 6. Exceed allowance - Block at checkout
- Add 50 cans to cart
- In another browser tab, manually add order with 20 cans to localStorage
- Return to original tab, try to checkout
- **Expected**: Error "Cart exceeds remaining allowance"

### 7. Expired prescription - Shop locks with message
- Create prescription via dev toggle
- Modify localStorage: set `expiresAt` to past date
- Refresh page
- **Expected**: "Prescription Expired" overlay showing expiry date and CTAs

### 8. Shipping form persists on refresh
- Go to checkout (`/patient/checkout`)
- Fill shipping form partially (e.g., name + phone)
- Click out of field (blur) to trigger save
- Refresh page
- Return to checkout
- **Expected**: Previously entered shipping data is restored

### 9. Logout clears cart
- Add items to cart
- Log out
- Log back in (same or different user)
- **Expected**: Cart is empty

### 10. Null user - Shop locked, no localStorage access
- Ensure user is logged out
- Navigate to `/patient/shop`
- Check browser console for localStorage errors
- **Expected**: Shop locked, no errors, no localStorage reads/writes

---

**Awaiting approval.**

