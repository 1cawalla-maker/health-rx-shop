import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';

import { shopifyCheckoutService } from '@/services/shopifyCheckoutService';
import { toast } from 'sonner';

/**
 * Shopify is the system-of-record for checkout (shipping address, shipping rates, payment).
 * This page exists only as a thin redirect shell.
 */
export default function PatientCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart } = useCart();

  useEffect(() => {
    const run = async () => {
      if (!user) return;

      if (cart.items.length === 0) {
        navigate('/patient/shop');
        return;
      }

      try {
        const { checkoutUrl } = await shopifyCheckoutService.createCheckoutUrlFromCartItems(cart.items);
        window.location.assign(checkoutUrl);
      } catch (error) {
        console.error('Error creating Shopify checkout:', error);
        toast.error('Failed to start secure checkout. Please try again.');
      }
    };

    run();
  }, [user, cart.items, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Secure checkout</h1>
        <p className="text-muted-foreground mt-1">Redirecting you to Shopify checkout…</p>
      </div>

      <Card>
        <CardContent className="py-10 space-y-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            If nothing happens, you can go back to the shop and try again.
          </p>
          <div className="flex items-center justify-center">
            <Button variant="outline" onClick={() => navigate('/patient/shop')}>Back to shop</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
