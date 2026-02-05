import { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
import { DevPrescriptionToggle } from '@/components/shop/DevPrescriptionToggle';
import type { Product, ProductVariant } from '@/types/shop';
import { PRESCRIPTION_TOTAL_CANS } from '@/types/shop';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OutletContext {
  hasActivePrescription: boolean;
  hasPendingPrescription: boolean;
  checkActivePrescription: () => void;
}

export default function PatientShop() {
  const outletContext = useOutletContext<OutletContext>();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [cansOrdered, setCansOrdered] = useState(0);
  const { addToCart, cart } = useCart();
  
  const {
    hasActivePrescription: rxHasActive,
    allowedStrengthMg,
    referenceId,
    mockEnabled,
    setMockPrescription,
    refreshStatus,
    isLoading: isLoadingRx,
    isExpired,
    expiredAt,
  } = usePrescriptionStatus();

  // Combine context and hook - prefer mock/hook for Phase 1 testing
  const hasActivePrescription = mockEnabled || rxHasActive || outletContext.hasActivePrescription;
  const hasPendingPrescription = !mockEnabled && !rxHasActive && outletContext.hasPendingPrescription;

  // Use prescription strength or default to 9 for mock
  const maxStrengthMg = allowedStrengthMg || (mockEnabled ? 9 : 0);

  // Calculate remaining allowance using centralized utils
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

  // Load orders to calculate cans already ordered
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

  // ALLOWANCE CHECK: Recalc from scratch BEFORE add-to-cart mutation
  const handleAddToCart = async (product: Product, variant: ProductVariant) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }

    // RECALC FROM SCRATCH using allowanceUtils
    const freshCansOrdered = await orderService.getTotalCansOrdered(user.id);
    const freshRemainingCans = allowanceUtils.remainingForAddToCart(freshCansOrdered, cart.totalCans);

    if (freshRemainingCans <= 0) {
      toast.error('No remaining allowance - you have used your full prescription');
      return;
    }

    await addToCart(product, variant, 1);
  };

  // STRENGTH GATING: Use allowanceUtils helper
  const isVariantAllowed = (variant: ProductVariant): boolean => {
    return allowanceUtils.isVariantAllowed(variant.strengthMg, maxStrengthMg);
  };

  const canAddMore = remainingCans > 0;

  // Dev toggle handlers with strength support
  const handleCreatePrescription = (strength: 3 | 6 | 9) => {
    setMockPrescription(true, strength);
  };

  const handleClearPrescription = () => {
    setMockPrescription(false);
  };

  return (
    <div className="space-y-8">
      {/* Header with Cart Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Product Shop</h1>
          <p className="text-muted-foreground mt-1">Browse and order nicotine pouch products</p>
        </div>
        {hasActivePrescription && <CartButton />}
      </div>

      {/* Allowance Card */}
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
            <div className="text-xs text-muted-foreground mt-1">
              Max strength: {maxStrengthMg}mg
            </div>
            {referenceId && (
              <p className="text-xs text-muted-foreground mt-2">Prescription: {referenceId}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescription Warning Banner */}
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
        {/* Product Grid by Flavour */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingProducts ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardHeader className="pb-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                </CardContent>
                <CardFooter>
                  <div className="h-10 bg-muted rounded w-full" />
                </CardFooter>
              </Card>
            ))
          ) : (
            products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="font-display text-2xl font-bold text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                    <p className="text-xs text-muted-foreground mt-1">{product.canSizePouches} pouches per can</p>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  {/* Variant buttons */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Select Strength:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {product.variants.map((variant) => {
                        const allowed = isVariantAllowed(variant);
                        const available = variant.available && allowed && canAddMore;
                        
                        return (
                          <Button
                            key={variant.id}
                            variant={allowed ? "outline" : "ghost"}
                            size="sm"
                            className={`flex flex-col h-auto py-2 ${
                              !allowed ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => available && handleAddToCart(product, variant)}
                            disabled={!available}
                          >
                            <span className="font-semibold">{variant.strengthMg}mg</span>
                            <span className="text-xs text-muted-foreground">
                              ${(variant.priceCents / 100).toFixed(2)}
                            </span>
                            {!allowed && (
                              <span className="text-[10px] text-destructive">Not allowed</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Overlays */}
        {!hasActivePrescription && isExpired && <ShopExpiredOverlay expiredAt={expiredAt} />}
        {!hasActivePrescription && hasPendingPrescription && <ShopPendingOverlay />}
        {!hasActivePrescription && !hasPendingPrescription && !isExpired && <ShopLockedOverlay />}
      </div>

      {/* Active prescription info */}
      {hasActivePrescription && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">
              ✓ Your prescription is active. You can order products up to {maxStrengthMg}mg strength within your allowance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cart Drawer */}
      <CartDrawer remainingCans={remainingCans} />

      {/* Dev Toggle - with new props */}
      <DevPrescriptionToggle
        onCreatePrescription={handleCreatePrescription}
        onClearPrescription={handleClearPrescription}
        activePrescription={hasActivePrescription ? { maxStrengthMg } : null}
      />
    </div>
  );
}
