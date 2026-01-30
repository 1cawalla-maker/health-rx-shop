// Order Service - Abstraction layer for future Supabase/Shopify integration
// MVP: Uses localStorage
// Future: Insert into Supabase orders table + sync with Shopify

import type { Order, CartItem, ShippingAddress } from '@/types/shop';

const ORDERS_STORAGE_KEY = 'nicopatch_orders';

interface CreateOrderData {
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
  prescriptionId?: string;
}

class OrderService {
  private getStoredOrders(): Order[] {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading orders from localStorage:', error);
    }
    return [];
  }

  private saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
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

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // MVP: Store in localStorage
    // Future: Insert into Supabase orders table
    const order: Order = {
      ...orderData,
      id: crypto.randomUUID(),
      orderNumber: this.generateOrderNumber(),
      status: 'processing',
      createdAt: new Date().toISOString(),
      shopifyOrderId: null,
      stripePaymentIntentId: null,
    };

    const orders = this.getStoredOrders();
    orders.unshift(order); // Add to beginning (newest first)
    this.saveOrders(orders);

    return order;
  }

  async getOrders(userId: string): Promise<Order[]> {
    // MVP: Read from localStorage
    // Future: Query Supabase orders table
    const orders = this.getStoredOrders();
    return orders.filter(o => o.userId === userId);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    // MVP: Read from localStorage
    // Future: Query Supabase orders table
    const orders = this.getStoredOrders();
    return orders.find(o => o.id === orderId) || null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    // MVP: Read from localStorage
    // Future: Query Supabase orders table
    const orders = this.getStoredOrders();
    return orders.find(o => o.orderNumber === orderNumber) || null;
  }
}

export const orderService = new OrderService();
