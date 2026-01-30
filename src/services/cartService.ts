// Cart Service - Abstraction layer for future Shopify integration
// MVP: Uses localStorage
// Future: Replace with Shopify Cart API

import type { Cart, CartItem, Product } from '@/types/shop';

const CART_STORAGE_KEY = 'nicopatch_cart';

class CartService {
  private getStoredCart(): Cart {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
    }
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  private saveCart(cart: Cart): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  private calculateTotals(items: CartItem[]): { subtotal: number; itemCount: number } {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, itemCount };
  }

  async getCart(): Promise<Cart> {
    // MVP: Read from localStorage
    // Future: Call Shopify Cart API
    return this.getStoredCart();
  }

  async addItem(product: Product, quantity: number = 1): Promise<Cart> {
    // MVP: Update localStorage
    // Future: Call Shopify Cart API
    const cart = this.getStoredCart();
    
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: `cart-item-${Date.now()}`,
        productId: product.id,
        name: product.name,
        brand: product.brand,
        flavor: product.flavor,
        strength: product.strength,
        packSize: product.packSize,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl,
      };
      cart.items.push(newItem);
    }

    const totals = this.calculateTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.itemCount = totals.itemCount;
    
    this.saveCart(cart);
    return cart;
  }

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    // MVP: Update localStorage
    // Future: Call Shopify Cart API
    const cart = this.getStoredCart();
    
    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
    }

    const totals = this.calculateTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.itemCount = totals.itemCount;
    
    this.saveCart(cart);
    return cart;
  }

  async removeItem(itemId: string): Promise<Cart> {
    // MVP: Update localStorage
    // Future: Call Shopify Cart API
    return this.updateQuantity(itemId, 0);
  }

  async clearCart(): Promise<Cart> {
    // MVP: Clear localStorage
    // Future: Call Shopify Cart API
    const emptyCart: Cart = { items: [], subtotal: 0, itemCount: 0 };
    this.saveCart(emptyCart);
    return emptyCart;
  }
}

export const cartService = new CartService();
