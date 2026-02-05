 // Allowance and strength gating utilities
 // Centralized formulas for prescription-based shop access
 
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