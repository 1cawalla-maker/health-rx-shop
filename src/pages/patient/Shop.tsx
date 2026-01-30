import { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';
import { productService } from '@/services/productService';
import { CartButton } from '@/components/shop/CartButton';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ShopLockedOverlay } from '@/components/shop/ShopLockedOverlay';
import { ShopPendingOverlay } from '@/components/shop/ShopPendingOverlay';
import { DevPrescriptionToggle } from '@/components/shop/DevPrescriptionToggle';
import type { Product } from '@/types/shop';
import { useOutletContext } from 'react-router-dom';

interface OutletContext {
  hasActivePrescription: boolean;
  hasPendingPrescription: boolean;
  checkActivePrescription: () => void;
}

export default function PatientShop() {
  const outletContext = useOutletContext<OutletContext>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const { addToCart, cart } = useCart();
  
  const {
    hasActivePrescription: rxHasActive,
    allowedStrengthMg,
    maxContainers,
    referenceId,
    mockEnabled,
    setMockPrescription,
    isLoading: isLoadingRx,
  } = usePrescriptionStatus();

  // Combine context and hook - prefer context for real-time updates, but allow mock override
  const hasActivePrescription = mockEnabled || outletContext.hasActivePrescription || rxHasActive;
  const hasPendingPrescription = !mockEnabled && outletContext.hasPendingPrescription;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const loadedProducts = await productService.getProducts();
        setProducts(loadedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Filter products by allowed strength if prescription exists
  const filteredProducts = hasActivePrescription && allowedStrengthMg
    ? products.filter(p => p.strength <= allowedStrengthMg)
    : products;

  const handleAddToCart = async (product: Product) => {
    await addToCart(product);
  };

  const isOverLimit = maxContainers !== undefined && cart.itemCount >= maxContainers;

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

      {/* Prescription Warning Banner */}
      {hasActivePrescription && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <strong>Important:</strong> All orders must strictly follow your doctor's prescription (strength and allowed quantity).
            {referenceId && <span className="ml-1">Prescription: {referenceId}</span>}
            {maxContainers && <span className="ml-1">• Max containers: {maxContainers}</span>}
            {allowedStrengthMg && <span className="ml-1">• Max strength: {allowedStrengthMg}mg</span>}
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        {/* Product Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingProducts ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
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
            filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="font-display text-lg font-bold text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.flavor}</CardDescription>
                    </div>
                    <Badge variant="outline">{product.strength}mg</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Pack of {product.packSize}</span>
                    <span className="font-semibold text-foreground">${product.price.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                    disabled={!hasActivePrescription || isOverLimit}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isOverLimit ? 'Cart Limit Reached' : 'Add to Cart'}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Overlays */}
        {!hasActivePrescription && hasPendingPrescription && <ShopPendingOverlay />}
        {!hasActivePrescription && !hasPendingPrescription && <ShopLockedOverlay />}
      </div>

      {/* Active prescription info */}
      {hasActivePrescription && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">
              ✓ Your prescription is active. You can order products within your prescription limits.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cart Drawer */}
      <CartDrawer maxContainers={maxContainers} />

      {/* Dev Toggle */}
      <DevPrescriptionToggle
        mockEnabled={mockEnabled}
        onToggle={setMockPrescription}
      />
    </div>
  );
}
