import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { orderService } from '@/services/orderService';
import type { Order } from '@/types/shop';

export default function PatientOrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const loadedOrder = await orderService.getOrder(orderId);
        setOrder(loadedOrder);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-8">
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button asChild>
              <Link to="/patient/shop">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 mx-auto">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your order. We've received your order and will begin processing it shortly.
        </p>
      </div>

      {/* Order Number */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Order Number</p>
          <p className="text-2xl font-bold text-primary font-mono">{order.orderNumber}</p>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>Summary of your purchase ({order.totalCans} cans)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.flavor}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.strengthMg}mg • Qty: {item.qtyCans} cans
                  </p>
                </div>
                <p className="font-medium">${((item.unitPriceCents * item.qtyCans) / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${(order.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{order.shippingCents === 0 ? 'Free' : `$${(order.shippingCents / 100).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${(order.totalCents / 100).toFixed(2)} AUD</span>
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          <div>
            <p className="font-medium mb-2">Shipping Address</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.addressLine1}<br />
              {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
              {order.shippingAddress.suburb}, {order.shippingAddress.state} {order.shippingAddress.postcode}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Alerts */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>What's next?</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• You'll receive an email confirmation shortly</li>
            <li>• We'll send shipping updates as your order progresses</li>
            <li>• Estimated delivery: 3-5 business days</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link to="/patient/orders">
            <Package className="h-4 w-4 mr-2" />
            View My Orders
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/patient/shop">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
