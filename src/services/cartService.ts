// Cart Service - Abstraction layer for future Shopify integration
// MVP: Uses localStorage
// Future: Replace with Shopify Cart API

import type { Cart, CartItem, Product, ProductVariant } from '@/types/shop';
import { STORAGE_KEYS } from '@/lib/storageKeys';

/**
 * Type for cart items as stored in localStorage
 * Includes legacy fields that may exist in older stored data
 * TODO Phase 2: Remove after migration to backend storage
 */
type StoredCartItem = Partial<CartItem> & {
  price?: number;           // Legacy: dollars (e.g., 9.95)
  quantity?: number;        // Legacy: same as qtyCans
  strength?: number;        // Legacy: same as strengthMg
  totalPriceCents?: number; // Legacy: line total in cents
};

class CartService {
  /**
   * Normalize a cart item from localStorage to ensure all required fields are valid numbers
   * Handles legacy fields (price, quantity, strength) for backward compatibility
   */
  private normalizeCartItem(item: StoredCartItem): CartItem {
    // Derive qtyCans first (needed for totalPriceCents derivation)
    let qtyCans: number;
    if (typeof item.qtyCans === 'number' && !isNaN(item.qtyCans) && item.qtyCans > 0) {
      qtyCans = item.qtyCans;
    } else if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
      qtyCans = item.quantity;
    } else {
      qtyCans = 1;
    }

    // Derive priceCents with cascade: priceCents -> price*100 -> totalPriceCents/qtyCans -> 0
    let priceCents: number;
    if (typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0) {
      priceCents = item.priceCents;
    } else if (typeof item.price === 'number' && !isNaN(item.price) && item.price >= 0) {
      priceCents = Math.round(item.price * 100);
    } else if (
      typeof item.totalPriceCents === 'number' && !isNaN(item.totalPriceCents) && item.totalPriceCents >= 0
      && qtyCans > 0
    ) {
      priceCents = Math.round(item.totalPriceCents / qtyCans);
    } else {
      console.error('CartItem missing valid priceCents, falling back to 0:', {
        itemId: item.id,
        itemName: item.name,
        flavor: item.flavor,
        strengthMg: item.strengthMg ?? item.strength,
        priceCents: item.priceCents,
        price: item.price,
        totalPriceCents: item.totalPriceCents,
      });
      priceCents = 0;
    }

    // Derive strengthMg: prefer strengthMg, fall back to legacy strength
    const strengthMg = (item.strengthMg ?? item.strength ?? 3) as 3 | 6 | 9;

    return {
      id: item.id || `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: item.productId || '',
      variantId: item.variantId || '',
      name: item.name || 'Unknown Product',
      brand: item.brand || '',
      flavor: item.flavor || '',
      strengthMg,
      priceCents,
      qtyCans,
      imageUrl: item.imageUrl,
      // Legacy fields maintained for backward compatibility only
      // TODO Phase 2: Remove after migration to backend storage
      strength: strengthMg,
      packSize: item.packSize ?? 20,
      price: priceCents / 100,
      quantity: qtyCans,
    };
  }

  private getStoredCart(): Cart {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.cart);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Normalize each item to ensure priceCents and qtyCans are valid numbers
        const normalizedItems = (parsed.items || []).map(
          (item: StoredCartItem) => this.normalizeCartItem(item)
        );
        
        // Always recalculate totals from normalized items (don't trust stored totals)
        const freshTotals = this.calculateTotals(normalizedItems);
        
        const normalizedCart: Cart = {
          items: normalizedItems,
          subtotalCents: freshTotals.subtotalCents,
          totalCans: freshTotals.totalCans,
          subtotal: freshTotals.subtotalCents / 100,
          itemCount: freshTotals.totalCans,
        };

        // Self-healing: persist normalized data back to storage
        this.saveCart(normalizedCart);

        return normalizedCart;
      }
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
    }
    return { items: [], subtotalCents: 0, totalCans: 0, subtotal: 0, itemCount: 0 };
  }

  private saveCart(cart: Cart): void {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  private calculateTotals(items: CartItem[]): { subtotalCents: number; totalCans: number } {
    const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.qtyCans, 0);
    const totalCans = items.reduce((sum, item) => sum + item.qtyCans, 0);
    return { subtotalCents, totalCans };
  }

  async getCart(): Promise<Cart> {
    return this.getStoredCart();
  }

  async addItem(product: Product, variant: ProductVariant, qtyCans: number = 1): Promise<Cart> {
    const cart = this.getStoredCart();
    
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === product.id && item.variantId === variant.id
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].qtyCans += qtyCans;
      // Also update legacy quantity
      cart.items[existingItemIndex].quantity = cart.items[existingItemIndex].qtyCans;
    } else {
      const newItem: CartItem = {
        id: `cart-item-${Date.now()}`,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        brand: product.brand,
        flavor: product.flavor,
        strengthMg: variant.strengthMg,
        priceCents: variant.priceCents,
        qtyCans,
        imageUrl: product.imageUrl,
        // Legacy fields
        strength: variant.strengthMg,
        packSize: 20,
        price: variant.priceCents / 100,
        quantity: qtyCans,
      };
      cart.items.push(newItem);
    }

    const totals = this.calculateTotals(cart.items);
    cart.subtotalCents = totals.subtotalCents;
    cart.totalCans = totals.totalCans;
    // Legacy fields
    cart.subtotal = totals.subtotalCents / 100;
    cart.itemCount = totals.totalCans;
    
    this.saveCart(cart);
    return cart;
  }

  async updateQuantity(itemId: string, qtyCans: number): Promise<Cart> {
    const cart = this.getStoredCart();
    
    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      if (qtyCans <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].qtyCans = qtyCans;
        cart.items[itemIndex].quantity = qtyCans;
      }
    }

    const totals = this.calculateTotals(cart.items);
    cart.subtotalCents = totals.subtotalCents;
    cart.totalCans = totals.totalCans;
    cart.subtotal = totals.subtotalCents / 100;
    cart.itemCount = totals.totalCans;
    
    this.saveCart(cart);
    return cart;
  }

  async removeItem(itemId: string): Promise<Cart> {
    return this.updateQuantity(itemId, 0);
  }

  async clearCart(): Promise<Cart> {
    const emptyCart: Cart = { 
      items: [], 
      subtotalCents: 0, 
      totalCans: 0,
      subtotal: 0,
      itemCount: 0,
    };
    this.saveCart(emptyCart);
    return emptyCart;
  }

  // Check if adding items would exceed allowance
  canAddToCart(cart: Cart, qtyCans: number, remainingAllowance: number): boolean {
    return (cart.totalCans + qtyCans) <= remainingAllowance;
  }
}

export const cartService = new CartService();
