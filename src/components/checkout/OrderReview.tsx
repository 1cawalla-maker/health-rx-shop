import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { Cart, ShippingAddress } from '@/types/shop';

interface OrderReviewProps {
  cart: Cart;
  shippingAddress: ShippingAddress;
  shippingCost: number;
  total: number;
  prescriptionRef?: string;
  maxContainers?: number;
  agreedToTerms: boolean;
  onAgreeChange: (agreed: boolean) => void;
  onEditShipping: () => void;
  onProceedToPayment: () => void;
}

export function OrderReview({
  cart,
  shippingAddress,
  shippingCost,
  total,
  prescriptionRef,
  maxContainers,
  agreedToTerms,
  onAgreeChange,
  onEditShipping,
  onProceedToPayment,
}: OrderReviewProps) {
  return (
    <div className="space-y-6">
      {/* Shipping Address Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Shipping Address</CardTitle>
            <CardDescription>Where we'll deliver your order</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditShipping}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {shippingAddress.fullName}<br />
            {shippingAddress.phone}<br />
            {shippingAddress.addressLine1}<br />
            {shippingAddress.addressLine2 && <>{shippingAddress.addressLine2}<br /></>}
            {shippingAddress.suburb}, {shippingAddress.state} {shippingAddress.postcode}
          </p>
        </CardContent>
      </Card>

      {/* Order Items Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
          <CardDescription>{cart.itemCount} items in your order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                <span className="text-xs text-muted-foreground">{item.strengthMg}mg</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.flavor} • {item.strengthMg}mg</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0
                    ? `$${((item.priceCents * item.qtyCans) / 100).toFixed(2)}`
                    : (() => {
                        console.warn('OrderReview: item has invalid priceCents:', {
                          id: item.id, name: item.name, flavor: item.flavor,
                          strengthMg: item.strengthMg, priceCents: item.priceCents,
                          normalizationAttempted: true,
                        });
                        return '—';
                      })()}
                </p>
                <p className="text-sm text-muted-foreground">Qty: {item.qtyCans}</p>
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${(cart.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)} AUD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Reminder */}
      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            {prescriptionRef && (
              <p><strong>Prescription Reference:</strong> {prescriptionRef}</p>
            )}
            {maxContainers && (
              <p><strong>Allowed:</strong> Up to {maxContainers} containers as per your prescription</p>
            )}
            <p className="text-sm text-muted-foreground">
              This order is based on your active prescription. All orders must comply with prescription limits.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Terms Agreement */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => onAgreeChange(checked === true)}
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I understand that my order is based on my active prescription and that orders are final. 
              I confirm that all items in this order comply with my prescription limits.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={onProceedToPayment}
        disabled={!agreedToTerms}
      >
        Continue to Payment
      </Button>
    </div>
  );
}
