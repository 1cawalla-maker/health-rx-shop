import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AlertTriangle, Package } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';

import { catalogService } from '@/services/catalogService';
import { orderService } from '@/services/orderService';

import { allowanceUtils } from '@/lib/allowanceUtils';

import { CartButton } from '@/components/shop/CartButton';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ShopLockedOverlay } from '@/components/shop/ShopLockedOverlay';
import { ShopPendingOverlay } from '@/components/shop/ShopPendingOverlay';
import { ShopExpiredOverlay } from '@/components/shop/ShopExpiredOverlay';

import type { Product } from '@/types/shop';
import { PRESCRIPTION_TOTAL_CANS } from '@/types/shop';

interface OutletContext {
  hasActivePrescription: boolean;
  hasPendingPrescription: boolean;
  checkActivePrescription: () => void;
}

export default function PatientShop() {
  const outletContext = useOutletContext<OutletContext>();
  const { user } = useAuth();
  const { cart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [cansOrdered, setCansOrdered] = useState(0);

  const {
    hasActivePrescription: rxHasActive,
    allowedStrengthMg,
    isExpired,
    expiredAt,
  } = usePrescriptionStatus();

  // Combine context and hook
  const hasActivePrescription = rxHasActive || outletContext.hasActivePrescription;
  const hasPendingPrescription = !rxHasActive && outletContext.hasPendingPrescription;

  const maxStrengthMg = allowedStrengthMg || 0;

  // Calculate remaining allowance
  const remainingCans = allowanceUtils.remainingForAddToCart(cansOrdered, cart.totalCans);
  const allowancePercentUsed = allowanceUtils.percentageUsed(cansOrdered, cart.totalCans);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const loadedProducts = await catalogService.listProducts();
        setProducts(loadedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

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
  }, [user?.id]);

  const productsForGrid = useMemo(() => {
    // In Phase 1 we show the full catalogue even if locked.
    // Strength gating happens on the product page.
    return products;
  }, [products]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Product Shop</h1>
          <p className="text-muted-foreground mt-1">Browse and order nicotine pouch products</p>
        </div>
        {hasActivePrescription && <CartButton />}
      </div>

      {hasActivePrescription && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-medium">Prescription Allowance</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {remainingCans} of {PRESCRIPTION_TOTAL_CANS} cans remaining
              </span>
            </div>
            <Progress value={allowancePercentUsed} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="font-medium">{cansOrdered} ordered</span>
              <span className="text-muted-foreground">|</span>
              <span className="font-medium">{cart.totalCans} in cart</span>
              <span className="text-muted-foreground">|</span>
              <span className="font-medium text-primary">{remainingCans} remaining</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Max strength: {maxStrengthMg}mg</div>
          </CardContent>
        </Card>
      )}

      {hasActivePrescription && remainingCans < 10 && remainingCans > 0 && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <strong>Low Allowance:</strong> You have {remainingCans} cans remaining on your prescription.
          </AlertDescription>
        </Alert>
      )}

      {hasActivePrescription && remainingCans === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Allowance Exhausted:</strong> You've used your full prescription allowance of {PRESCRIPTION_TOTAL_CANS} cans.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {isLoadingProducts
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <CardHeader className="pb-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </CardContent>
                </Card>
              ))
            : productsForGrid.map((product) => {
                const minPriceCents = Math.min(...product.variants.map(v => v.priceCents));
                return (
                  <Link key={product.id} to={`/patient/shop/${product.id}`} className="block">
                    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                      <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <div className="text-center p-3">
                          <p className="font-display text-xl font-bold text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base leading-tight">{product.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm font-medium">From ${(minPriceCents / 100).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </div>

        {/* Overlays */}
        {!hasActivePrescription && isExpired && <ShopExpiredOverlay expiredAt={expiredAt} />}
        {!hasActivePrescription && hasPendingPrescription && <ShopPendingOverlay />}
        {!hasActivePrescription && !hasPendingPrescription && !isExpired && <ShopLockedOverlay />}
      </div>

      <CartDrawer remainingCans={remainingCans} />
    </div>
  );
}
