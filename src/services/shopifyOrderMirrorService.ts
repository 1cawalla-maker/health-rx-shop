import { supabase } from '@/integrations/supabase/client';

export type ShopifyOrderRow = {
  id: string; // internal UUID in our DB
  user_id: string;
  shopify_order_id: number;
  order_name: string | null;
  currency: string | null;
  total_price: number | null;
  subtotal_price: number | null;
  total_tax: number | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  processed_at: string | null;
  raw: any;
};

export type ShopifyOrderItemRow = {
  id: string;
  shopify_order_id: string; // FK to shopify_orders.id (internal)
  shopify_variant_id: number | null;
  title: string | null;
  variant_title: string | null;
  quantity: number;
  raw: any;
};

export const shopifyOrderMirrorService = {
  async listOrdersForUser(userId: string): Promise<{ orders: ShopifyOrderRow[]; itemsByOrderId: Map<string, ShopifyOrderItemRow[]> }> {
    if (!userId) return { orders: [], itemsByOrderId: new Map() };

    const { data: orders, error } = await (supabase as any)
      .from('shopify_orders')
      .select('*')
      .eq('user_id', userId)
      .order('processed_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false });

    if (error) throw new Error(`Failed to load orders: ${error.message}`);

    const orderRows: ShopifyOrderRow[] = (orders ?? []) as ShopifyOrderRow[];
    const orderIds = orderRows.map((o) => o.id);

    const itemsByOrderId = new Map<string, ShopifyOrderItemRow[]>();
    if (orderIds.length === 0) return { orders: orderRows, itemsByOrderId };

    const { data: items, error: itemsErr } = await (supabase as any)
      .from('shopify_order_items')
      .select('*')
      .in('shopify_order_id', orderIds);

    if (itemsErr) throw new Error(`Failed to load order items: ${itemsErr.message}`);

    for (const it of (items ?? []) as ShopifyOrderItemRow[]) {
      const arr = itemsByOrderId.get(it.shopify_order_id) ?? [];
      arr.push(it);
      itemsByOrderId.set(it.shopify_order_id, arr);
    }

    return { orders: orderRows, itemsByOrderId };
  },

  async getPaidCansOrdered(userId: string): Promise<number> {
    if (!userId) return 0;

    // Match backend allowance logic: only PAID orders count.
    const { data: paidOrders, error: paidErr } = await (supabase as any)
      .from('shopify_orders')
      .select('id')
      .eq('user_id', userId)
      .eq('financial_status', 'paid');

    if (paidErr) {
      // Don’t hard-fail the UI; backend still enforces allowance.
      console.warn('getPaidCansOrdered: failed to load paid orders', paidErr);
      return 0;
    }

    const ids = (paidOrders ?? []).map((o: any) => o.id).filter(Boolean);
    if (ids.length === 0) return 0;

    const { data: items, error: itemsErr } = await (supabase as any)
      .from('shopify_order_items')
      .select('quantity')
      .in('shopify_order_id', ids);

    if (itemsErr) {
      console.warn('getPaidCansOrdered: failed to load paid order items', itemsErr);
      return 0;
    }

    return (items ?? []).reduce((sum: number, it: any) => sum + Number(it.quantity ?? 0), 0);
  },
};
