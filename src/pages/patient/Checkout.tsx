import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Truck, 
  Shield, 
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  brand: string;
  strength: string;
  quantity: number;
  price: number;
}

export default function PatientCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // In a real app, this would come from a cart context/state
  const cartItems: CartItem[] = location.state?.items || [];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    suburb: '',
    state: '',
    postcode: '',
    phone: ''
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 9.95;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success('Order placed successfully!');
    navigate('/patient/orders');
    setIsSubmitting(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/patient/shop')}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>
        <p className="text-muted-foreground mt-1">Complete your order</p>
      </div>

      <Alert className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm">
          <strong>Important:</strong> All orders must strictly follow your doctor's prescription. 
          Orders outside prescribed strength or quantity are not permitted and may be rejected.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Shipping Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Address
              </CardTitle>
              <CardDescription>Where should we deliver your order?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={shippingDetails.fullName}
                  onChange={(e) => setShippingDetails(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={shippingDetails.addressLine1}
                  onChange={(e) => setShippingDetails(prev => ({ ...prev, addressLine1: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                <Input
                  id="addressLine2"
                  value={shippingDetails.addressLine2}
                  onChange={(e) => setShippingDetails(prev => ({ ...prev, addressLine2: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="suburb">Suburb</Label>
                  <Input
                    id="suburb"
                    value={shippingDetails.suburb}
                    onChange={(e) => setShippingDetails(prev => ({ ...prev, suburb: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g. NSW"
                    value={shippingDetails.state}
                    onChange={(e) => setShippingDetails(prev => ({ ...prev, state: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={shippingDetails.postcode}
                    onChange={(e) => setShippingDetails(prev => ({ ...prev, postcode: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={shippingDetails.phone}
                    onChange={(e) => setShippingDetails(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
              <CardDescription>Secure payment processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 text-center text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">
                  Payment integration will be configured with your preferred payment provider
                  (Stripe, Square, etc.)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.brand} • {item.strength} • Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)} AUD</span>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Place Order
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By placing this order, you confirm that all items comply with your prescription.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
