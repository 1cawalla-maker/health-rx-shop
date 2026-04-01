import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orderService';
import type { Order } from '@/types/shop';

function addBusinessDays(start: Date, businessDays: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }
  return d;
}

function getEstimatedArrivalRange(order: Order): { start: Date; end: Date } | null {
  if (order.status === 'cancelled' || order.status === 'delivered') return null;

  const created = new Date(order.createdAt);

  // Phase 1 heuristic ETA ranges (business days). Phase 2 will be wired to Shopify fulfilment/carrier estimates.
  if (order.status === 'processing') {
    return { start: addBusinessDays(created, 3), end: addBusinessDays(created, 7) };
  }

  // shipped
  return { start: addBusinessDays(created, 2), end: addBusinessDays(created, 5) };
}

function OrderTracking({ order }: { order: Order }) {
  const eta = getEstimatedArrivalRange(order);

  const steps = [
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Arrived' },
  ] as const;

  const activeIndex = (() => {
    switch (order.status) {
      case 'processing':
        return 0;
      case 'shipped':
        return 1;
      case 'delivered':
        return 2;
      case 'cancelled':
        return -1;
    }
  })();

  if (order.status === 'cancelled') {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        This order was cancelled.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Order tracking</p>
        {eta && (
          <p className="text-xs text-muted-foreground">
            Estimated arrival: {format(eta.start, 'MMM d')} – {format(eta.end, 'MMM d')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 items-start gap-3">
        {steps.map((s, idx) => {
          const isDone = activeIndex >= idx;
          const isActive = activeIndex === idx;
          return (
            <div key={s.key} className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className={
                    'h-3 w-3 rounded-full border ' +
                    (isDone ? 'bg-primary border-primary' : 'bg-background border-border')
                  }
                  aria-hidden
                />
                <span className={
                  'text-xs ' + (isActive ? 'text-foreground font-medium' : 'text-muted-foreground')
                }>
                  {s.label}
                </span>
              </div>
              {/* connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={
                    'mt-2 h-px w-full ' + (activeIndex > idx ? 'bg-primary/60' : 'bg-border')
                  }
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Status updates appear here as your order progresses.
      </p>
    </div>
  );
}

export default function PatientOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const loadedOrders = await orderService.getOrders(user.id);
        setOrders(loadedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Truck className="h-3 w-3 mr-1" />
            Shipped
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            Cancelled
          </Badge>
        );
    }
  };

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
          <p className="text-muted-foreground mt-1">Track and manage your orders</p>
        </div>
        <Button asChild>
          <Link to="/patient/shop">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Once you have an active prescription, you can order products from our shop.
            </p>
            <Button asChild>
              <Link to="/patient/shop">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                    <CardDescription>
                      Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')} • {order.totalCans} {order.totalCans === 1 ? 'can' : 'cans'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.flavor} ({item.strengthMg}mg)
                        </span>
                        <span className="text-muted-foreground">
                          x{item.qtyCans} {item.qtyCans === 1 ? 'can' : 'cans'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <OrderTracking order={order} />

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="font-medium">Total: ${(order.totalCents / 100).toFixed(2)} AUD</span>
                    <div className="flex gap-2">
                      {order.status === 'shipped' && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href="https://auspost.com.au/track"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Track Package
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="pt-4 border-t space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <strong>Shipping to:</strong> {order.shippingAddress.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.addressLine1}
                    </p>
                    {order.shippingAddress.addressLine2 && (
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress.addressLine2}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.suburb}, {order.shippingAddress.state} {order.shippingAddress.postcode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
