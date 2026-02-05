import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { PRESCRIPTION_TOTAL_CANS } from '@/types/shop';

interface CartDrawerProps {
  remainingCans?: number;
  maxContainers?: number; // Legacy prop
}

export function CartDrawer({ remainingCans, maxContainers }: CartDrawerProps) {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();

  // Use remainingCans if provided, otherwise fall back to maxContainers for backwards compatibility
  const allowanceRemaining = remainingCans ?? (maxContainers ? maxContainers - cart.totalCans : undefined);
  const isOverLimit = allowanceRemaining !== undefined && allowanceRemaining < 0;
  const canCheckout = !isOverLimit && cart.items.length > 0;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({cart.totalCans} {cart.totalCans === 1 ? 'can' : 'cans'})
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => setIsCartOpen(false)}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            {/* Allowance indicator */}
            {allowanceRemaining !== undefined && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allowance used</span>
                  <span className={isOverLimit ? 'text-destructive' : ''}>
                    {cart.totalCans} / {cart.totalCans + (allowanceRemaining > 0 ? allowanceRemaining : 0)} cans
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (cart.totalCans / (cart.totalCans + Math.max(0, allowanceRemaining))) * 100)} 
                  className="h-2"
                />
              </div>
            )}

            {isOverLimit && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  Your cart exceeds your remaining prescription allowance. Please reduce items.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Product Image Placeholder */}
                  <div className="h-20 w-20 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                    <span className="text-xs text-muted-foreground text-center px-1">
                      {item.strengthMg}mg
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.flavor} • {item.strengthMg}mg</p>
<p className="text-sm font-semibold mt-1">
                      {typeof item.priceCents === 'number' && !isNaN(item.priceCents) && item.priceCents >= 0
                        ? `$${(item.priceCents / 100).toFixed(2)} / can`
                        : (() => {
                            console.warn('CartDrawer: item has invalid priceCents:', { id: item.id, name: item.name, priceCents: item.priceCents });
                            return '—';
                          })()}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.qtyCans - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.qtyCans}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.qtyCans + 1)}
                          disabled={allowanceRemaining !== undefined && allowanceRemaining <= 0}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <SheetFooter className="pt-4 flex-col gap-4 sm:flex-col">
              <div className="flex items-center justify-between w-full">
                <span className="text-lg font-medium">Subtotal</span>
                <span className="text-lg font-bold">${(cart.subtotalCents / 100).toFixed(2)} AUD</span>
              </div>

              <Button
                asChild={canCheckout}
                className="w-full"
                size="lg"
                disabled={!canCheckout}
              >
                {canCheckout ? (
                  <Link to="/patient/checkout" onClick={() => setIsCartOpen(false)}>
                    Proceed to Checkout
                  </Link>
                ) : (
                  <span>Proceed to Checkout</span>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Shipping calculated at checkout
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
