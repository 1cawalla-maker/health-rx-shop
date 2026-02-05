// Order Service - Abstraction layer for future Supabase/Shopify integration
// MVP: Uses localStorage
// Future: Insert into Supabase orders table + sync with Shopify

import type { Order, OrderItem, Cart, ShippingAddress } from '@/types/shop';
import { STORAGE_KEYS } from '@/lib/storageKeys';

interface CreateOrderData {
  userId: string;
  cart: Cart;
  shippingAddress: ShippingAddress;
  shippingCents: number;
  prescriptionId?: string;
}

class OrderService {
  private getStoredOrders(): Order[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.orders);
      if (stored) {
        const orders = JSON.parse(stored) as Order[];
        // Ensure totalCans exists for legacy orders
        return orders.map(order => ({
          ...order,
          totalCans: order.totalCans ?? order.items.reduce((sum, item) => sum + (item.qtyCans || 0), 0),
        }));
      }
    } catch (error) {
      console.error('Error reading orders from localStorage:', error);
    }
    return [];
  }

  private saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving orders to localStorage:', error);
    }
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${random}`;
  }

  async placeOrder(data: CreateOrderData): Promise<Order> {
    const { userId, cart, shippingAddress, shippingCents, prescriptionId } = data;
    
    // Convert cart items to order items
    const orderItems: OrderItem[] = cart.items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      flavor: item.flavor,
      strengthMg: item.strengthMg,
      qtyCans: item.qtyCans,
      unitPriceCents: item.priceCents,
    }));

    const totalCans = cart.totalCans;
    const totalCents = cart.subtotalCents + shippingCents;

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: this.generateOrderNumber(),
      userId,
      items: orderItems,
      shippingAddress,
      subtotalCents: cart.subtotalCents,
      shippingCents,
      totalCents,
      totalCans,
      status: 'processing',
      createdAt: new Date().toISOString(),
      prescriptionId,
      shopifyOrderId: null,
      stripePaymentIntentId: null,
      // Legacy fields
      subtotal: cart.subtotalCents / 100,
      shipping: shippingCents / 100,
      total: totalCents / 100,
    };

    const orders = this.getStoredOrders();
    orders.unshift(order);
    this.saveOrders(orders);

    return order;
  }

  async getOrders(userId: string): Promise<Order[]> {
    // NULL GUARD: If userId is falsy, return empty array
    if (!userId) return [];
    
    const orders = this.getStoredOrders();
    return orders.filter(o => o.userId === userId);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const orders = this.getStoredOrders();
    return orders.find(o => o.id === orderId) || null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const orders = this.getStoredOrders();
    return orders.find(o => o.orderNumber === orderNumber) || null;
  }

  // Calculate total cans ordered by user (for allowance tracking)
  async getTotalCansOrdered(userId: string): Promise<number> {
    // NULL GUARD: If userId is falsy, return 0
    if (!userId) return 0;
    
    const orders = await this.getOrders(userId);
    return orders.reduce((sum, order) => sum + order.totalCans, 0);
  }
}

export const orderService = new OrderService();
