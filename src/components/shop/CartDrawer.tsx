import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';

interface CartDrawerProps {
  maxContainers?: number;
}

export function CartDrawer({ maxContainers }: CartDrawerProps) {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();

  const isOverLimit = maxContainers !== undefined && cart.itemCount > maxContainers;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
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
            {isOverLimit && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  Your prescription allows up to {maxContainers} containers. Please reduce your cart.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Product Image Placeholder */}
                  <div className="h-20 w-20 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                    <span className="text-xs text-muted-foreground text-center px-1">
                      {item.strength}mg
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.flavor} • {item.strength}mg</p>
                    <p className="text-sm font-semibold mt-1">${item.price.toFixed(2)}</p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                <span className="text-lg font-bold">${cart.subtotal.toFixed(2)} AUD</span>
              </div>

              <Button
                asChild
                className="w-full"
                size="lg"
                disabled={isOverLimit || cart.items.length === 0}
              >
                <Link to="/patient/checkout" onClick={() => setIsCartOpen(false)}>
                  Proceed to Checkout
                </Link>
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
