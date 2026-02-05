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