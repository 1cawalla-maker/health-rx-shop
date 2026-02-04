# Phase 1: Clean Mock Prescription Key for Shop Gating (Rev 2)

**Status**: ✅ IMPLEMENTED

---

## Implementation Summary

Phase 1 has been implemented with mock/localStorage only. All Supabase references removed from `usePrescriptionStatus.ts`.

### Changes Made

1. **`src/types/shop.ts`**: Added `updatedAt` field to `MockPrescription` interface
2. **`src/services/shopPrescriptionService.ts`**: Full rewrite with new storage key `healthrx_mock_prescriptions`, includes `isVariantAllowed()` helper
3. **`src/hooks/usePrescriptionStatus.ts`**: Complete rewrite - removed ALL Supabase, uses only mock service
4. **`src/components/shop/DevPrescriptionToggle.tsx`**: Rewritten with strength-specific buttons (3mg, 6mg, 9mg) and URL param gate
5. **`src/pages/patient/Shop.tsx`**: Updated to use service for strength check, allowance recalc before add-to-cart
6. **`src/pages/patient/Checkout.tsx`**: Fresh allowance recalc at submit, atomic cart clear

---

## Storage Contracts (Authoritative, Phase 1)

| Data | localStorage Key | JSON Shape |
|------|------------------|------------|
| **Prescriptions (canonical)** | `healthrx_mock_prescriptions` | `MockPrescription[]` |
| **Orders (canonical)** | `nicopatch_orders` | `Order[]` |
| **Cart (canonical)** | `nicopatch_cart` | `Cart` |

---

## Manual Acceptance Tests

1. **No prescription → Shop locked**: Clear localStorage, navigate to `/patient/shop` → "Shop Locked" overlay
2. **Create 9mg prescription → All strengths enabled**: Click "9mg" in dev panel → shop unlocks, 3/6/9mg enabled
3. **Create 3mg prescription → Only 3mg enabled**: Click "3mg" → only 3mg enabled, 6/9mg show "Not allowed"
4. **Allowance enforcement**: Place orders totaling 60 cans → cart/checkout blocks adding more
5. **Page refresh persistence**: Create prescription, refresh → state persists
6. **Dev toggle visibility**: Hidden in prod unless `?dev=1` in URL
