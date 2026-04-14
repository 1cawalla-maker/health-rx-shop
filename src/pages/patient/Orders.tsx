import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ExternalLink, Package, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/hooks/useAuth';
import { shopifyOrderMirrorService, type ShopifyOrderRow, type ShopifyOrderItemRow } from '@/services/shopifyOrderMirrorService';

function currencyOrDefault(code: string | null | undefined) {
  return (code || 'AUD').toUpperCase();
}

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—';
  // Shopify REST payloads use string amounts; we store numbers.
  return `${Number(amount).toFixed(2)} ${currency}`;
}

function statusBadge(financialStatus: string | null, fulfillmentStatus: string | null) {
  const fin = (financialStatus || '').toLowerCase();
  const fulf = (fulfillmentStatus || '').toLowerCase();

  if (fin === 'paid') {
    if (fulf === 'fulfilled') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid • Fulfilled</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Paid</Badge>;
  }

  if (fin) {
    return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">{financialStatus}</Badge>;
  }

  return <Badge variant="outline">Pending</Badge>;
}

function itemLabel(it: ShopifyOrderItemRow) {
  const title = it.title || 'Item';
  const variant = it.variant_title ? ` (${it.variant_title})` : '';
  return `${title}${variant}`;
}

export default function PatientOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<ShopifyOrderRow[]>([]);
  const [itemsByOrderId, setItemsByOrderId] = useState<Map<string, ShopifyOrderItemRow[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const { orders, itemsByOrderId } = await shopifyOrderMirrorService.listOrdersForUser(user.id);
        setOrders(orders);
        setItemsByOrderId(itemsByOrderId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Error loading Shopify orders:', e);
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const ordersWithTotals = useMemo(() => {
    return orders.map((o) => {
      const items = itemsByOrderId.get(o.id) ?? [];
      const totalCans = items.reduce((sum, it) => sum + Number(it.quantity ?? 0), 0);
      return { order: o, items, totalCans };
    });
  }, [orders, itemsByOrderId]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-1">Track and manage your orders</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-1">Orders are synced from Shopify after payment</p>
        </div>
        <Button asChild>
          <Link to="/patient/shop">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {loadError && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">Failed to load orders: {loadError}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This usually means your Supabase RLS policies for <code>shopify_orders</code> / <code>shopify_order_items</code> aren’t allowing patient reads yet.
            </p>
          </CardContent>
        </Card>
      )}

      {ordersWithTotals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              After you complete payment in Shopify, your order will appear here.
            </p>
            <Button asChild>
              <Link to="/patient/shop">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordersWithTotals.map(({ order, items, totalCans }) => {
            const currency = currencyOrDefault(order.currency);
            const when = order.processed_at ? new Date(order.processed_at) : null;

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{order.order_name ? `Order ${order.order_name}` : 'Order'}</CardTitle>
                      <CardDescription>
                        {when ? `Paid on ${format(when, 'MMMM d, yyyy')}` : 'Payment date pending'}
                        {totalCans ? ` • ${totalCans} ${totalCans === 1 ? 'can' : 'cans'}` : ''}
                      </CardDescription>
                    </div>
                    {statusBadge(order.financial_status, order.fulfillment_status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Items syncing…</p>
                    ) : (
                      items.map((it) => (
                        <div key={it.id} className="flex justify-between text-sm">
                          <span>{itemLabel(it)}</span>
                          <span className="text-muted-foreground">x{it.quantity}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="font-medium">Total: {formatMoney(order.total_price, currency)}</span>
                    <div className="flex gap-2">
                      {/* Placeholder: if we later store a customer-facing status URL, link it here */}
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://auspost.com.au/track" target="_blank" rel="noopener noreferrer">
                          Track (AusPost)
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
