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