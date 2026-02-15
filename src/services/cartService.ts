// Cart Service - Abstraction layer for future Shopify integration
// MVP: Uses localStorage
// Future: Replace with Shopify Cart API

import type { Cart, CartItem, Product, ProductVariant } from '@/types/shop';
import { STORAGE_KEYS } from '@/lib/storageKeys';

/**
 * Type for cart items as stored in localStorage.
 * Covers all known legacy shapes: string or number values, alternative field names.
 */
type StoredCartItem = Partial<CartItem> & {
  // Legacy price fields (any could be string or number)
  price?: string | number;           // dollars (e.g., 9.95 or "9.95")
  unitPrice?: string | number;       // dollars (alias)
  unitPriceCents?: string | number;  // cents (alias for priceCents)
  totalPriceCents?: string | number; // line total in cents
  totalPrice?: string | number;      // line total in dollars
  // Legacy qty fields
  quantity?: string | number;        // alias for qtyCans
  qty?: string | number;             // alias for qtyCans
  // Legacy strength
  strength?: string | number;        // alias for strengthMg
};

/**
 * Safely parse a value (string or number) into a non-negative finite number.
 * Returns null if the value is null, undefined, NaN, Infinity, or negative.
 */
function safeParseNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = parseFloat(String(val));
  return isFinite(n) && n >= 0 ? n : null;
}

class CartService {
  /**
   * Normalize a cart item from localStorage to ensure all required fields are valid numbers.
   * Handles legacy fields, string values, and alternative field names.
   */
  private normalizeCartItem(raw: StoredCartItem): CartItem {
    // --- Qty cascade ---
    let qtyCans =
      safeParseNumber(raw.qtyCans) ??
      safeParseNumber(raw.quantity) ??
      safeParseNumber(raw.qty) ??
      1;
    qtyCans = Math.round(qtyCans);
    if (qtyCans <= 0) qtyCans = 1;

    // --- Price cascade (unit price in cents) ---
    let priceCents: number;
    const pc = safeParseNumber(raw.priceCents);
    const upc = safeParseNumber(raw.unitPriceCents);
    const pDollars = safeParseNumber(raw.price);
    const upDollars = safeParseNumber(raw.unitPrice);
    const tpc = safeParseNumber(raw.totalPriceCents);
    const tpDollars = safeParseNumber(raw.totalPrice);

    if (pc !== null) {
      priceCents = Math.round(pc);
    } else if (upc !== null) {
      priceCents = Math.round(upc);
    } else if (pDollars !== null) {
      priceCents = Math.round(pDollars * 100);
    } else if (upDollars !== null) {
      priceCents = Math.round(upDollars * 100);
    } else if (tpc !== null && qtyCans > 0) {
      priceCents = Math.round(tpc / qtyCans);
    } else if (tpDollars !== null && qtyCans > 0) {
      priceCents = Math.round(tpDollars * 100 / qtyCans);
    } else {
      console.error('CartItem missing valid price, falling back to 0:', {
        itemId: raw.id,
        itemName: raw.name,
        flavor: raw.flavor,
        strengthMg: raw.strengthMg ?? raw.strength,
        raw: { priceCents: raw.priceCents, unitPriceCents: raw.unitPriceCents, price: raw.price, unitPrice: raw.unitPrice, totalPriceCents: raw.totalPriceCents, totalPrice: raw.totalPrice },
      });
      priceCents = 0;
    }

    const strengthMg = (Math.round(safeParseNumber(raw.strengthMg) ?? safeParseNumber(raw.strength) ?? 3)) as 3 | 6 | 9;
    const totalPriceCents = priceCents * qtyCans;

    return {
      id: raw.id || `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: raw.productId || '',
      variantId: raw.variantId || '',
      name: raw.name || 'Unknown Product',
      brand: raw.brand || '',
      flavor: raw.flavor || '',
      strengthMg,
      priceCents,
      qtyCans,
      totalPriceCents,
      imageUrl: raw.imageUrl,
      // Legacy compat fields (written from canonical values)
      strength: strengthMg,
      packSize: 20,
      price: priceCents / 100,
      quantity: qtyCans,
    };
  }

  private getStoredCart(): Cart {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.cart);
      if (stored) {
        const parsed = JSON.parse(stored);

        const normalizedItems = (parsed.items || [])
          .map((item: StoredCartItem) => this.normalizeCartItem(item))
          .filter((item: CartItem) => item.qtyCans > 0);

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
      cart.items[existingItemIndex].quantity = cart.items[existingItemIndex].qtyCans;
      cart.items[existingItemIndex].totalPriceCents = cart.items[existingItemIndex].priceCents * cart.items[existingItemIndex].qtyCans;
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
        totalPriceCents: variant.priceCents * qtyCans,
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
        cart.items[itemIndex].totalPriceCents = cart.items[itemIndex].priceCents * qtyCans;
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
