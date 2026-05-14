 // Canonical localStorage keys for shop data
 // Phase 1: localStorage
 // Phase 2: Map to backend tables
 
 export const STORAGE_KEYS = {
   prescriptions: 'pouchcare_mock_prescriptions',
   orders: 'pouchcare_orders',
   cart: 'pouchcare_cart',
   shippingDraft: 'pouchcare_shipping_draft',
 } as const;
 
 export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];