import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CartButton } from '@/components/shop/CartButton';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ShopExpiredOverlay } from '@/components/shop/ShopExpiredOverlay';
import { ShopLockedOverlay } from '@/components/shop/ShopLockedOverlay';
import { ShopPendingOverlay } from '@/components/shop/ShopPendingOverlay';
import { catalogService } from '@/services/catalogService';
import { shopifyOrderMirrorService } from '@/services/shopifyOrderMirrorService';
import { allowanceUtils } from '@/lib/allowanceUtils';
import { useCart } from '@/contexts/CartContext';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';
import { useAuth } from '@/hooks/useAuth';
import type { Product, ProductVariant } from '@/types/shop';
import { PRESCRIPTION_TOTAL_CANS } from '@/types/shop';
import { toast } from 'sonner';

interface OutletContext {
  hasActivePrescription: boolean;
  hasPendingPrescription: boolean;
  checkActivePrescription: () => void;
}

function clampInt(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export default function PatientProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const outletContext = useOutletContext<OutletContext>();
  const { user } = useAuth();
  const { cart, addToCart } = useCart();

  const {
    hasActivePrescription: rxHasActive,
    allowedStrengthMg,
    isExpired,
    expiredAt,
  } = usePrescriptionStatus();

  const hasActivePrescription = rxHasActive || outletContext.hasActivePrescription;
  const hasPendingPrescription = !rxHasActive && outletContext.hasPendingPrescription;
  const maxStrengthMg = allowedStrengthMg || 0;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cansOrdered, setCansOrdered] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const remainingCans = useMemo(() => {
    return allowanceUtils.remainingForAddToCart(cansOrdered, cart.totalCans);
  }, [cansOrdered, cart.totalCans]);

  useEffect(() => {
    const load = async () => {
      if (!productId) {
        navigate('/patient/shop');
        return;
      }

      setLoading(true);
      try {
        const p = await catalogService.getProduct(productId);
        setProduct(p);
        if (!p) return;

        // Default the selection to the strongest allowed variant (if any)
        const allowed = p.variants
          .filter(v => v.available)
          .filter(v => allowanceUtils.isVariantAllowed(v.strengthMg, maxStrengthMg))
          .sort((a, b) => b.strengthMg - a.strengthMg);

        setSelectedVariant(allowed[0] || null);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, maxStrengthMg]);

  useEffect(() => {
    const loadCansOrdered = async () => {
      if (!user) return;
      const total = await shopifyOrderMirrorService.getPaidCansOrdered(user.id);
      setCansOrdered(total);
    };
    loadCansOrdered();
  }, [user?.id]);

  // Keep qty within bounds if allowance changes
  useEffect(() => {
    const maxQty = Math.max(1, remainingCans);
    setQty((q) => clampInt(q, 1, maxQty));
  }, [remainingCans]);

  const canBuyAnything = hasActivePrescription && remainingCans > 0;

  const isVariantAllowed = (variant: ProductVariant) => {
    return allowanceUtils.isVariantAllowed(variant.strengthMg, maxStrengthMg);
  };

  const handleMinus = () => {
    setQty((q) => clampInt(q - 1, 1, Math.max(1, remainingCans)));
  };

  const handlePlus = () => {
    setQty((q) => clampInt(q + 1, 1, Math.max(1, remainingCans)));
  };

  const handleQtyInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setQty(1);
      return;
    }
    setQty(clampInt(parseInt(digits, 10), 1, Math.max(1, remainingCans)));
  };

  const handleAdd = async () => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    if (!product || !selectedVariant) {
      toast.error('Please select a strength');
      return;
    }

    if (!hasActivePrescription) {
      toast.error('A prescription is required to order');
      return;
    }

    // Recalc allowance fresh before mutation
    setAdding(true);
    try {
      const freshCansOrdered = await shopifyOrderMirrorService.getPaidCansOrdered(user.id);
      const freshRemaining = allowanceUtils.remainingForAddToCart(freshCansOrdered, cart.totalCans);
      if (freshRemaining <= 0) {
        toast.error('No remaining allowance - you have used your full prescription');
        return;
      }

      const qtyToAdd = clampInt(qty, 1, freshRemaining);
      await addToCart(product, selectedVariant, qtyToAdd);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Loading product…</CardTitle>
            <CardDescription>Please wait</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button asChild variant="ghost" className="gap-2 w-fit">
          <Link to="/patient/shop">
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Product not found</CardTitle>
            <CardDescription>Please go back and choose another item.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" className="gap-2 px-0">
            <Link to="/patient/shop">
              <ArrowLeft className="h-4 w-4" />
              Back to shop
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">{product.name}</h1>
          <p className="text-muted-foreground">{product.description}</p>
        </div>

        {hasActivePrescription && <CartButton />}
      </div>

      <div className="relative">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />
              )}
            </div>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <p className="font-display text-2xl font-bold text-foreground">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <p className="text-xs text-muted-foreground">{product.canSizePouches} pouches per can</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select strength</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {product.variants
                      .slice()
                      .sort((a, b) => a.strengthMg - b.strengthMg)
                      .map((variant) => {
                        const allowed = variant.available && isVariantAllowed(variant);
                        const selected = selectedVariant?.id === variant.id;
                        return (
                          <Button
                            key={variant.id}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            disabled={!allowed}
                            onClick={() => setSelectedVariant(variant)}
                            className="h-auto py-2 flex-col"
                          >
                            <span className="font-semibold">{variant.strengthMg}mg</span>
                            <span className="text-xs opacity-80 font-normal">${(variant.priceCents / 100).toFixed(2)}</span>
                            {!allowed && (
                              <span className="text-[10px] text-destructive">Not allowed</span>
                            )}
                          </Button>
                        );
                      })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quantity (cans)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleMinus}
                      disabled={!canBuyAnything || qty <= 1 || adding}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <Input
                      value={String(qty)}
                      onChange={(e) => handleQtyInput(e.target.value)}
                      inputMode="numeric"
                      className="text-center"
                      disabled={!canBuyAnything || adding}
                      aria-label="Quantity"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handlePlus}
                      disabled={!canBuyAnything || qty >= remainingCans || adding}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {hasActivePrescription && (
                    <p className="text-xs text-muted-foreground">
                      {remainingCans} of {PRESCRIPTION_TOTAL_CANS} cans remaining (including items already in your cart)
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleAdd}
                  size="lg"
                  className="w-full gap-2"
                  disabled={!canBuyAnything || !selectedVariant || adding}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {adding ? 'Adding…' : 'Add to cart'}
                </Button>

                {!hasActivePrescription && (
                  <p className="text-xs text-muted-foreground">
                    A prescription is required before you can add items to your cart.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product details</CardTitle>
              <CardDescription>What you’re ordering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Flavour</span>
                <span className="font-medium">{product.flavor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pouches per can</span>
                <span className="font-medium">{product.canSizePouches}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Max strength allowed</span>
                <span className="font-medium">{hasActivePrescription ? `${maxStrengthMg}mg` : '—'}</span>
              </div>
            </CardContent>
          </Card>
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
