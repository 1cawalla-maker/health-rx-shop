import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

import { useAuth } from '@/hooks/useAuth';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';
import { useCart } from '@/contexts/CartContext';
import { allowanceUtils } from '@/lib/allowanceUtils';
import { shopifyCheckoutService } from '@/services/shopifyCheckoutService';

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)} AUD`;
}

export default function PatientShopCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const {
    hasActivePrescription,
    allowedStrengthMg,
    totalCansAllowed,
    remainingCans,
    isLoading: prescriptionLoading,
  } = usePrescriptionStatus();

  const [isRedirecting, setIsRedirecting] = useState(false);

  const totalAllowance = totalCansAllowed ?? 0;
  const remainingBeforeCart = remainingCans ?? 0;
  const usedBeforeCart = Math.max(0, totalAllowance - remainingBeforeCart);
  const remainingAfterCart = Math.max(0, remainingBeforeCart - cart.totalCans);
  const allowancePercentUsed = totalAllowance > 0
    ? Math.min(100, ((usedBeforeCart + cart.totalCans) / totalAllowance) * 100)
    : 0;

  const disallowedItems = useMemo(() => {
    if (!allowedStrengthMg) return [];
    return cart.items.filter((item) => !allowanceUtils.isVariantAllowed(item.strengthMg, allowedStrengthMg));
  }, [allowedStrengthMg, cart.items]);

  const cartExceedsAllowance = cart.totalCans > remainingBeforeCart;
  const canContinue =
    !prescriptionLoading &&
    hasActivePrescription &&
    totalAllowance > 0 &&
    cart.items.length > 0 &&
    !cartExceedsAllowance &&
    disallowedItems.length === 0 &&
    !isRedirecting;

  const handleContinueToPayment = async () => {
    if (!canContinue) return;

    setIsRedirecting(true);

    try {
      if (cart.totalCans > remainingBeforeCart) {
        toast.error('Your cart exceeds your remaining prescription allowance. Please reduce items.');
        setIsRedirecting(false);
        return;
      }

      const { checkoutUrl } = await shopifyCheckoutService.createCheckoutUrlFromCartItems(cart.items);
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error('ShopCheckout: failed to start Shopify checkout', error);
      const message = error instanceof Error && error.message
        ? error.message
        : 'Failed to start secure checkout. Please try again.';
      toast.error(message);
      setIsRedirecting(false);
    }
  };

  if (!prescriptionLoading && cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button asChild variant="ghost" className="gap-2 px-0">
          <Link to="/patient/shop">
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>
        </Button>

        <Card>
          <CardHeader className="text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <CardTitle>Your cart is empty</CardTitle>
            <CardDescription>Add products before continuing to checkout.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/patient/shop">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" className="gap-2 px-0">
            <Link to="/patient/shop">
              <ArrowLeft className="h-4 w-4" />
              Back to shop
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">Review your order</h1>
          <p className="text-muted-foreground">
            Review your PouchCare order first. Shopify securely handles the final payment and shipping details.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>{cart.totalCans} {cart.totalCans === 1 ? 'can' : 'cans'} in this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl border bg-card p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        {item.strengthMg}mg
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium leading-tight text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.flavor} • {item.strengthMg}mg • 20 pouches per can</p>
                        <p className="mt-1 text-sm font-medium">{formatMoney(item.priceCents)} / can</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">{formatMoney(item.priceCents * item.qtyCans)}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.qtyCans - 1)}
                          disabled={isRedirecting}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">{item.qtyCans}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.qtyCans + 1)}
                          disabled={isRedirecting || cart.totalCans >= remainingBeforeCart}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                        disabled={isRedirecting}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-primary/5">
            <CardContent className="flex gap-3 pt-6">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">Secure Shopify handoff</p>
                  <p className="text-muted-foreground">
                    PouchCare validates your prescription, strength limit, and remaining prescription allowance before Shopify opens for payment and shipping.
                  </p>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <div className="rounded-lg bg-background/70 p-3">1. Review your order on PouchCare</div>
                  <div className="rounded-lg bg-background/70 p-3">2. Enter payment and shipping in Shopify</div>
                  <div className="rounded-lg bg-background/70 p-3">3. Return to PouchCare after ordering</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
              <CardDescription>Final shipping is calculated in Shopify checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatMoney(cart.subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated next</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total today</span>
                <span>{formatMoney(cart.subtotalCents)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Before shipping and any Shopify checkout adjustments.</p>

              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Allowance</span>
                  <span className={cartExceedsAllowance ? 'text-destructive' : 'text-muted-foreground'}>
                    {usedBeforeCart + cart.totalCans} / {totalAllowance || '—'} cans used
                  </span>
                </div>
                <Progress value={allowancePercentUsed} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {usedBeforeCart} already ordered • {cart.totalCans} in cart • {remainingAfterCart} remaining after this order
                </p>
              </div>

              {!prescriptionLoading && !hasActivePrescription && (
                <Alert variant="destructive">
                  <AlertDescription>A valid PouchCare prescription is required before checkout.</AlertDescription>
                </Alert>
              )}

              {cartExceedsAllowance && (
                <Alert variant="destructive">
                  <AlertDescription>Your cart exceeds your remaining prescription allowance. Remove {cart.totalCans - remainingBeforeCart} cans to continue.</AlertDescription>
                </Alert>
              )}

              {!prescriptionLoading && hasActivePrescription && totalAllowance <= 0 && (
                <Alert variant="destructive">
                  <AlertDescription>Your prescription allowance could not be read. Please upload your prescription again or contact support.</AlertDescription>
                </Alert>
              )}

              {disallowedItems.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Your cart contains items stronger than your prescription allows. Remove the higher-strength items to continue.
                  </AlertDescription>
                </Alert>
              )}

              <Button className="w-full" size="lg" onClick={handleContinueToPayment} disabled={!canContinue}>
                {isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Shopify checkout…
                  </>
                ) : (
                  <>
                    Continue to Shopify secure checkout
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Payment and shipping are completed securely through Shopify for your PouchCare order.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
