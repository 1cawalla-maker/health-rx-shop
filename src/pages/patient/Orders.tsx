import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, Clock, ExternalLink, Package, RefreshCw, ShoppingBag, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useAuth } from '@/hooks/useAuth';
import { shopifyOrderMirrorService, type ShopifyOrderRow, type ShopifyOrderItemRow } from '@/services/shopifyOrderMirrorService';

function currencyOrDefault(code: string | null | undefined) {
  return (code || 'AUD').toUpperCase();
}

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—';
  return `${Number(amount).toFixed(2)} ${currency}`;
}

function titleCaseStatus(status: string | null | undefined) {
  if (!status) return 'Pending';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusBadge(financialStatus: string | null, fulfillmentStatus: string | null) {
  const fin = (financialStatus || '').toLowerCase();
  const fulf = (fulfillmentStatus || '').toLowerCase();

  if (fin === 'paid' && fulf === 'fulfilled') {
    return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Shipped</Badge>;
  }

  if (fin === 'paid') {
    return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Paid • Preparing</Badge>;
  }

  if (fin) {
    return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">{titleCaseStatus(financialStatus)}</Badge>;
  }

  return <Badge variant="outline">Pending</Badge>;
}

function itemLabel(it: ShopifyOrderItemRow) {
  const title = it.title || 'Item';
  const variant = it.variant_title ? ` (${it.variant_title})` : '';
  return `${title}${variant}`;
}

function getTracking(order: ShopifyOrderRow) {
  const fulfillments = Array.isArray(order.raw?.fulfillments) ? order.raw.fulfillments : [];
  const first = fulfillments.find((f: any) => f?.tracking_number || f?.tracking_url) || null;

  return {
    number: first?.tracking_number || null,
    url: first?.tracking_url || null,
    company: first?.tracking_company || null,
  };
}

function getShippingAddress(order: ShopifyOrderRow) {
  const shipping = order.raw?.shipping_address || {};
  return [
    shipping.name,
    shipping.address1,
    shipping.address2,
    shipping.city,
    shipping.province_code || shipping.province,
    shipping.zip,
    shipping.country_code || shipping.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function OrderStep({ done, label, description }: { done: boolean; label: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function PatientOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<ShopifyOrderRow[]>([]);
  const [itemsByOrderId, setItemsByOrderId] = useState<Map<string, ShopifyOrderItemRow[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrders = async () => {
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
      console.error('Error loading orders:', e);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h1 className="font-display text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Track your PouchCare orders</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Track your order status, items and shipping updates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/patient/shop">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Shop
            </Link>
          </Button>
        </div>
      </div>

      {loadError && (
        <Card className="border-destructive/30">
          <CardContent className="py-6">
            <p className="text-sm font-medium text-destructive">Failed to load orders</p>
            <p className="text-sm text-muted-foreground mt-2">{loadError}</p>
          </CardContent>
        </Card>
      )}

      {ordersWithTotals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Once you complete payment, your order will appear here after payment is confirmed.
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
            const financialPaid = (order.financial_status || '').toLowerCase() === 'paid';
            const fulfilled = (order.fulfillment_status || '').toLowerCase() === 'fulfilled';
            const tracking = getTracking(order);
            const shippingAddress = getShippingAddress(order);

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">{order.order_name ? `Order ${order.order_name}` : 'Order'}</CardTitle>
                        {statusBadge(order.financial_status, order.fulfillment_status)}
                      </div>
                      <CardDescription className="mt-1">
                        {when ? `Placed ${format(when, 'd MMM yyyy')}` : 'Payment date pending'}
                        {totalCans ? ` • ${totalCans} ${totalCans === 1 ? 'can' : 'cans'}` : ''}
                      </CardDescription>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatMoney(order.total_price, currency)}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 p-5">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Items</p>
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Items syncing…</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((it) => (
                            <div key={it.id} className="flex justify-between rounded-lg border px-3 py-2 text-sm">
                              <span>{itemLabel(it)}</span>
                              <span className="text-muted-foreground">x{it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {shippingAddress && (
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-sm font-medium">Shipping address</p>
                          <p className="mt-1 text-sm text-muted-foreground">{shippingAddress}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border p-4 space-y-4">
                      <p className="text-sm font-semibold">Order progress</p>
                      <OrderStep
                        done={financialPaid}
                        label="Payment confirmed"
                        description={financialPaid ? 'Your order has been paid.' : 'Waiting for payment confirmation.'}
                      />
                      <OrderStep
                        done={financialPaid}
                        label="Prescription documents prepared"
                        description="PouchCare prepares the order documentation for fulfilment."
                      />
                      <OrderStep
                        done={fulfilled || Boolean(tracking.number)}
                        label="Shipped"
                        description={tracking.number ? 'Tracking has been added.' : 'Tracking will appear here when available.'}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Truck className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        {tracking.number ? (
                          <>
                            <p className="font-medium text-foreground">Tracking {tracking.number}</p>
                            <p>{tracking.company || 'Carrier details pending'}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-foreground">Tracking not available yet</p>
                            <p>We’ll show tracking here once the order is fulfilled.</p>
                          </>
                        )}
                      </div>
                    </div>

                    {tracking.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={tracking.url} target="_blank" rel="noopener noreferrer">
                          Track shipment
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    )}
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
