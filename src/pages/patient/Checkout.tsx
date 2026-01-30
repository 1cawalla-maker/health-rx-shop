import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Truck, ClipboardList, CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';
import { orderService } from '@/services/orderService';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { OrderReview } from '@/components/checkout/OrderReview';
import { PaymentPlaceholder } from '@/components/checkout/PaymentPlaceholder';
import type { ShippingAddress } from '@/types/shop';
import { toast } from 'sonner';

type CheckoutStep = 'shipping' | 'review' | 'payment';

const steps: { id: CheckoutStep; label: string; icon: React.ElementType }[] = [
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'review', label: 'Review', icon: ClipboardList },
  { id: 'payment', label: 'Payment', icon: CreditCard },
];

export default function PatientCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const { prescriptionId, referenceId, maxContainers } = usePrescriptionStatus();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const SHIPPING_COST = cart.subtotal >= 100 ? 0 : 9.95;
  const total = cart.subtotal + SHIPPING_COST;

  // Redirect if cart is empty
  if (cart.items.length === 0 && !orderConfirmed) {
    return (
      <div className="space-y-8">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/patient/shop')}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleShippingSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
    setCurrentStep('review');
  };

  const handlePlaceOrder = async () => {
    if (!user || !shippingAddress) {
      toast.error('Missing required information');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms before placing your order');
      return;
    }

    setIsProcessing(true);

    try {
      const order = await orderService.createOrder({
        userId: user.id,
        items: cart.items,
        shippingAddress,
        subtotal: cart.subtotal,
        shipping: SHIPPING_COST,
        total,
        prescriptionId,
      });

      await clearCart();
      setOrderConfirmed(true);
      navigate(`/patient/order-success?orderId=${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (currentStep === 'shipping') {
              navigate('/patient/shop');
            } else if (currentStep === 'review') {
              setCurrentStep('shipping');
            } else {
              setCurrentStep('review');
            }
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>
          <p className="text-muted-foreground mt-1">Complete your order</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = step.id === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {currentStep === 'shipping' && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Details</CardTitle>
                <CardDescription>Enter your delivery address</CardDescription>
              </CardHeader>
              <CardContent>
                <ShippingForm
                  initialData={shippingAddress}
                  onSubmit={handleShippingSubmit}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'review' && shippingAddress && (
            <OrderReview
              cart={cart}
              shippingAddress={shippingAddress}
              shippingCost={SHIPPING_COST}
              total={total}
              prescriptionRef={referenceId}
              maxContainers={maxContainers}
              agreedToTerms={agreedToTerms}
              onAgreeChange={setAgreedToTerms}
              onEditShipping={() => setCurrentStep('shipping')}
              onProceedToPayment={() => setCurrentStep('payment')}
            />
          )}

          {currentStep === 'payment' && (
            <PaymentPlaceholder
              total={total}
              isProcessing={isProcessing}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setCurrentStep('review')}
            />
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{SHIPPING_COST === 0 ? 'Free' : `$${SHIPPING_COST.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)} AUD</span>
                </div>
              </div>

              {cart.subtotal < 100 && (
                <p className="text-xs text-muted-foreground">
                  Add ${(100 - cart.subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
