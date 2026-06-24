import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AlertTriangle, Clock, FileText, Lock, Package, Upload, Calendar } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { useCart } from '@/contexts/CartContext';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';

import { catalogService } from '@/services/catalogService';
import { CartButton } from '@/components/shop/CartButton';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { Button } from '@/components/ui/button';

import type { Product } from '@/types/shop';

interface OutletContext {
  hasActivePrescription: boolean;
  hasPendingPrescription: boolean;
  checkActivePrescription: () => void;
}

export default function PatientShop() {
  const outletContext = useOutletContext<OutletContext>();
  const { cart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const {
    hasActivePrescription: rxHasActive,
    allowedStrengthMg,
    totalCansAllowed,
    remainingCans: remainingBeforeCart,
    isExpired,
    expiredAt,
    isLoading: isPrescriptionLoading,
  } = usePrescriptionStatus();

  // Combine context and hook
  const hasActivePrescription = rxHasActive || outletContext.hasActivePrescription;
  const hasPendingPrescription = !rxHasActive && outletContext.hasPendingPrescription;

  const maxStrengthMg = allowedStrengthMg || 0;

  // Calculate remaining allowance from the active prescription entitlement.
  const totalAllowance = totalCansAllowed ?? 0;
  const usedBeforeCart = Math.max(0, totalAllowance - (remainingBeforeCart ?? 0));
  const remainingCans = Math.max(0, (remainingBeforeCart ?? 0) - cart.totalCans);
  const allowancePercentUsed = totalAllowance > 0 ? Math.min(100, ((usedBeforeCart + cart.totalCans) / totalAllowance) * 100) : 0;

  useEffect(() => {
    if (!hasActivePrescription) {
      setProducts([]);
      setIsLoadingProducts(false);
      return;
    }

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
  }, [hasActivePrescription]);

  const productsForGrid = useMemo(() => products, [products]);

  if (isPrescriptionLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Product Shop</h1>
          <p className="text-muted-foreground mt-1">Checking prescription access…</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading access status</CardTitle>
            <CardDescription>Please wait while we confirm your account.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasActivePrescription) {
    const state = isExpired
      ? {
          icon: Clock,
          title: 'Prescription access unavailable',
          description: expiredAt ? `Your prescription expired on ${expiredAt.toLocaleDateString('en-AU')}. Please renew access before viewing the shop.` : 'Please renew access before viewing the shop.',
          tone: 'muted' as const,
        }
      : hasPendingPrescription
        ? {
            icon: FileText,
            title: 'Prescription under review',
            description: 'Your uploaded prescription is being reviewed. The product catalogue will unlock only after approval.',
            tone: 'amber' as const,
          }
        : {
            icon: Lock,
            title: 'Prescription required',
            description: 'Product listings are only shown after an approved prescription is active on your account.',
            tone: 'primary' as const,
          };
    const Icon = state.icon;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Product Shop</h1>
          <p className="text-muted-foreground mt-1">Prescription-gated ordering access</p>
        </div>

        <Card className={state.tone === 'amber' ? 'border-amber-500/30' : undefined}>
          <CardHeader className="text-center pb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{state.title}</CardTitle>
            <CardDescription className="text-base">{state.description}</CardDescription>
          </CardHeader>
          <CardContent className="mx-auto flex w-full max-w-md flex-col gap-3">
            {!hasPendingPrescription && (
              <Button asChild className="w-full" size="lg">
                <Link to="/patient/upload-prescription">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload existing prescription
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link to={hasPendingPrescription ? '/patient/prescriptions' : '/start-consult'}>
                {hasPendingPrescription ? <FileText className="h-4 w-4 mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                {hasPendingPrescription ? 'View prescription status' : 'Need a prescription? Start consultation'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {remainingCans} of {totalAllowance || '—'} cans remaining
              </span>
            </div>
            <Progress value={allowancePercentUsed} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="font-medium">{usedBeforeCart} ordered</span>
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
            <strong>Allowance Exhausted:</strong> You've used your full prescription allowance of {totalAllowance || '—'} cans.
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
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Hide broken images and let the skeleton show instead.
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />
                        )}
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
      </div>

      <CartDrawer remainingCans={remainingCans} totalCansAllowed={totalAllowance} />
    </div>
  );
}
