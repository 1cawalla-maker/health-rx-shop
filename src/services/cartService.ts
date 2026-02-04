// Cart Service - Abstraction layer for future Shopify integration
// MVP: Uses localStorage
// Future: Replace with Shopify Cart API

import type { Cart, CartItem, Product, ProductVariant } from '@/types/shop';

const CART_STORAGE_KEY = 'nicopatch_cart';

class CartService {
  private getStoredCart(): Cart {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure new fields exist
        return {
          items: parsed.items || [],
          subtotalCents: parsed.subtotalCents ?? (parsed.subtotal ? Math.round(parsed.subtotal * 100) : 0),
          totalCans: parsed.totalCans ?? parsed.itemCount ?? 0,
          subtotal: parsed.subtotal ?? (parsed.subtotalCents ? parsed.subtotalCents / 100 : 0),
          itemCount: parsed.itemCount ?? parsed.totalCans ?? 0,
        };
      }
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
    }
    return { items: [], subtotalCents: 0, totalCans: 0, subtotal: 0, itemCount: 0 };
  }

  private saveCart(cart: Cart): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
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
