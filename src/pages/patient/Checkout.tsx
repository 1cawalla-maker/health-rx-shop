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
import { allowanceUtils } from '@/lib/allowanceUtils';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { OrderReview } from '@/components/checkout/OrderReview';
import { PaymentPlaceholder } from '@/components/checkout/PaymentPlaceholder';
import type { ShippingAddress, ShippingMethod } from '@/types/shop';
import { getShippingCostCents } from '@/services/shippingService';
import { shippingFormService } from '@/services/shippingFormService';
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
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');

  // Restore shipping method from draft on mount
  useEffect(() => {
    if (user?.id) {
      setShippingMethod(shippingFormService.getSelectedMethod(user.id));
    }
  }, [user?.id]);

  // Calculate amounts in cents — shipping derived from service
  const subtotalCents = cart.subtotalCents;
  const shippingCostCents = getShippingCostCents(cart.totalCans, shippingMethod);
  const totalCents = subtotalCents + shippingCostCents;

  // Calculate remaining allowance using centralized utils (for display - recalculated at submit)
  const remainingCans = allowanceUtils.remainingAtCheckout(cansOrdered);
  const cartExceedsAllowance = allowanceUtils.cartExceedsAllowance(cansOrdered, cart.totalCans);

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

    // RECALC FROM SCRATCH at submit using allowanceUtils
    const freshCansOrdered = await orderService.getTotalCansOrdered(user.id);

    if (allowanceUtils.cartExceedsAllowance(freshCansOrdered, cart.totalCans)) {
      const freshRemainingCans = allowanceUtils.remainingAtCheckout(freshCansOrdered);
      toast.error(`Cart (${cart.totalCans} cans) exceeds remaining allowance (${freshRemainingCans} cans)`);
      return;
    }

    setIsProcessing(true);

    try {
      // FRESH RECOMPUTE: derive shipping cost immediately before placing order
      const freshShippingCents = getShippingCostCents(cart.totalCans, shippingMethod);

      // ATOMIC: Order persists first
      const order = await orderService.placeOrder({
        userId: user.id,
        cart,
        shippingAddress,
        shippingCents: freshShippingCents,
        prescriptionId,
        shippingMethod,
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
  const methodLabel = shippingMethod === 'express' ? 'Express' : 'Standard';

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
                  userId={user?.id}
                  initialData={shippingAddress}
                  onSubmit={handleShippingSubmit}
                  totalCans={cart.totalCans}
                  selectedMethod={shippingMethod}
                  onMethodChange={setShippingMethod}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'review' && shippingAddress && (
            <OrderReview
              cart={cart}
              shippingAddress={shippingAddress}
              shippingCostCents={shippingCostCents}
              totalCents={totalCents}
              shippingMethod={shippingMethod}
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
              totalCents={totalCents}
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
                  <span>
                    {typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0
                      ? `$${((item.priceCents * item.qtyCans) / 100).toFixed(2)}`
                      : (() => {
                          console.warn('Checkout sidebar: item has invalid priceCents:', {
                            id: item.id, name: item.name, flavor: item.flavor,
                            strengthMg: item.strengthMg, priceCents: item.priceCents,
                            normalizationAttempted: true,
                          });
                          return '—';
                        })()}
                  </span>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${(subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping ({methodLabel})</span>
                  <span>{shippingCostCents === 0 ? 'Free' : `$${(shippingCostCents / 100).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${(totalCents / 100).toFixed(2)} AUD</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Order exactly 60 cans for free Express shipping
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
