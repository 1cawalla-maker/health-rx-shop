 # Phase 2: Backend Migration Plan
 
 ## Overview
 
 Phase 1 uses localStorage for all shop data. Phase 2 migrates to backend storage.
 
 This document describes the intended table schemas, access policies, and mapping from localStorage keys.
 
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
 
 ## Intended Table Schemas
 
 ### shop_prescriptions
 
 | Column | Type | Notes |
 |--------|------|-------|
 | id | uuid | Primary key |
 | user_id | uuid | FK to auth.users |
 | status | enum | 'active', 'expired', 'revoked' |
 | max_strength_mg | int | 3, 6, or 9 |
 | total_cans_allowed | int | Default 60 |
 | expires_at | timestamptz | |
 | created_at | timestamptz | |
 | updated_at | timestamptz | |
 
 ### shop_orders
 
 | Column | Type | Notes |
 |--------|------|-------|
 | id | uuid | Primary key |
 | order_number | text | Unique, generated |
 | user_id | uuid | FK to auth.users |
 | prescription_id | uuid | FK to shop_prescriptions (optional) |
 | shipping_address | jsonb | Full address object |
 | subtotal_cents | int | |
 | shipping_cents | int | |
 | total_cents | int | |
 | total_cans | int | For allowance tracking |
 | status | enum | 'processing', 'shipped', 'delivered', 'cancelled' |
 | created_at | timestamptz | |
 
 ### shop_order_items
 
 | Column | Type | Notes |
 |--------|------|-------|
 | id | uuid | Primary key |
 | order_id | uuid | FK to shop_orders |
 | product_id | text | |
 | variant_id | text | |
 | flavor | text | |
 | strength_mg | int | |
 | qty_cans | int | |
 | unit_price_cents | int | |
 
 ## Access Policies (RLS)
 
 ### shop_prescriptions
 - SELECT: `auth.uid() = user_id`
 - INSERT: Admin/Doctor only (via service role)
 - UPDATE: Admin only
 - DELETE: Not allowed
 
 ### shop_orders
 - SELECT: `auth.uid() = user_id`
 - INSERT: `auth.uid() = user_id AND has_active_prescription(auth.uid())`
 - UPDATE: Admin only (status changes)
 - DELETE: Not allowed
 
 ## Migration Steps
 
 1. Create tables with schemas above
 2. Add RLS policies
 3. Create `has_active_prescription(user_id)` database function
 4. Update service implementations to use backend client
 5. Remove localStorage fallbacks
 6. Optional: One-time data migration script for existing users
 
 ## Contract Compliance
 
 Services must continue to implement contracts defined in `src/types/shopContracts.ts`.
 Phase 2 swaps localStorage implementations for backend client calls while maintaining identical interfaces.