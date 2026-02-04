import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Truck, ClipboardList, CreditCard, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';
import { orderService } from '@/services/orderService';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { OrderReview } from '@/components/checkout/OrderReview';
import { PaymentPlaceholder } from '@/components/checkout/PaymentPlaceholder';
import type { ShippingAddress } from '@/types/shop';
import { PRESCRIPTION_TOTAL_CANS } from '@/types/shop';
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
  const { prescriptionId, referenceId } = usePrescriptionStatus();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cansOrdered, setCansOrdered] = useState(0);

  // Calculate amounts in cents
  const subtotalCents = cart.subtotalCents;
  const SHIPPING_COST_CENTS = subtotalCents >= 10000 ? 0 : 995; // Free shipping over $100
  const totalCents = subtotalCents + SHIPPING_COST_CENTS;

  // Calculate remaining allowance (display purposes - will be recalculated at submit)
  const remainingCans = Math.max(0, PRESCRIPTION_TOTAL_CANS - cansOrdered);
  const cartExceedsAllowance = cart.totalCans > remainingCans;

  // Load cans already ordered
  useEffect(() => {
    const loadCansOrdered = async () => {
      if (!user) return;
      try {
        const totalCans = await orderService.getTotalCansOrdered(user.id);
        setCansOrdered(totalCans);
      } catch (error) {
        console.error('Error loading cans ordered:', error);
      }
    };
    loadCansOrdered();
  }, [user]);

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

    // RECALC FROM SCRATCH at submit time - fresh read from localStorage
    // Defends against localStorage manipulation between add and checkout
    const freshCansOrdered = await orderService.getTotalCansOrdered(user.id);
    const freshRemainingCans = PRESCRIPTION_TOTAL_CANS - freshCansOrdered;

    if (cart.totalCans > freshRemainingCans) {
      toast.error(`Cart (${cart.totalCans} cans) exceeds remaining allowance (${freshRemainingCans} cans)`);
      return;
    }

    setIsProcessing(true);

    try {
      // ATOMIC: Order persists first
      const order = await orderService.placeOrder({
        userId: user.id,
        cart,
        shippingAddress,
        shippingCents: SHIPPING_COST_CENTS,
        prescriptionId,
      });

      // ONLY clear cart after successful order persistence
      await clearCart();
      setOrderConfirmed(true);
      navigate(`/patient/order-success?orderId=${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      // Cart remains unchanged on failure
      toast.error('Failed to place order. Your cart has not been modified.');
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

      {/* Allowance Warning */}
      {cartExceedsAllowance && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your cart ({cart.totalCans} cans) exceeds your remaining allowance ({remainingCans} cans). 
            Please remove items before proceeding.
          </AlertDescription>
        </Alert>
      )}

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
              shippingCost={SHIPPING_COST_CENTS / 100}
              total={totalCents / 100}
              prescriptionRef={referenceId}
              maxContainers={remainingCans}
              agreedToTerms={agreedToTerms}
              onAgreeChange={setAgreedToTerms}
              onEditShipping={() => setCurrentStep('shipping')}
              onProceedToPayment={() => setCurrentStep('payment')}
            />
          )}

          {currentStep === 'payment' && (
            <PaymentPlaceholder
              total={totalCents / 100}
              isProcessing={isProcessing}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setCurrentStep('review')}
              disabled={cartExceedsAllowance}
            />
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
              <CardDescription>{cart.totalCans} cans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} ({item.strengthMg}mg) x{item.qtyCans}
                  </span>
                  <span>${((item.priceCents * item.qtyCans) / 100).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${(subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{SHIPPING_COST_CENTS === 0 ? 'Free' : `$${(SHIPPING_COST_CENTS / 100).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${(totalCents / 100).toFixed(2)} AUD</span>
                </div>
              </div>

              {subtotalCents < 10000 && (
                <p className="text-xs text-muted-foreground">
                  Add ${((10000 - subtotalCents) / 100).toFixed(2)} more for free shipping
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
