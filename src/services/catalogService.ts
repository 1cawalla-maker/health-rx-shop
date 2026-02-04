// Catalog Service - Abstraction layer for future Shopify integration
// MVP: Returns mock data
// Future: Fetch from Shopify Storefront API

import type { Product, ProductVariant } from '@/types/shop';

// Mock products structured as Flavour (Product) with Variants (strength options)
const mockCatalog: Product[] = [
  {
    id: 'prod-mint',
    shopifyId: null,
    name: 'Mint',
    brand: 'NicoBrand',
    flavor: 'Mint',
    canSizePouches: 20,
    description: 'Refreshing mint flavor nicotine pouches',
    variants: [
      { id: 'var-mint-3', strengthMg: 3, priceCents: 2299, currency: 'AUD', available: true },
      { id: 'var-mint-6', strengthMg: 6, priceCents: 2499, currency: 'AUD', available: true },
      { id: 'var-mint-9', strengthMg: 9, priceCents: 2699, currency: 'AUD', available: true },
    ],
  },
  {
    id: 'prod-spearmint',
    shopifyId: null,
    name: 'Spearmint',
    brand: 'NicoBrand',
    flavor: 'Spearmint',
    canSizePouches: 20,
    description: 'Light and refreshing spearmint flavor',
    variants: [
      { id: 'var-spearmint-3', strengthMg: 3, priceCents: 2299, currency: 'AUD', available: true },
      { id: 'var-spearmint-6', strengthMg: 6, priceCents: 2499, currency: 'AUD', available: true },
      { id: 'var-spearmint-9', strengthMg: 9, priceCents: 2699, currency: 'AUD', available: true },
    ],
  },
  {
    id: 'prod-black-cherry',
    shopifyId: null,
    name: 'Black Cherry',
    brand: 'NicoBrand',
    flavor: 'Black Cherry',
    canSizePouches: 20,
    description: 'Sweet black cherry flavor nicotine pouches',
    variants: [
      { id: 'var-cherry-3', strengthMg: 3, priceCents: 2299, currency: 'AUD', available: true },
      { id: 'var-cherry-6', strengthMg: 6, priceCents: 2499, currency: 'AUD', available: true },
      { id: 'var-cherry-9', strengthMg: 9, priceCents: 2699, currency: 'AUD', available: true },
    ],
  },
];

class CatalogService {
  async listProducts(): Promise<Product[]> {
    // MVP: Return mock data
    // Future: Fetch from Shopify Storefront API
    return mockCatalog;
  }

  async getProduct(productId: string): Promise<Product | null> {
    return mockCatalog.find(p => p.id === productId) || null;
  }

  async getVariant(variantId: string): Promise<{ product: Product; variant: ProductVariant } | null> {
    for (const product of mockCatalog) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        return { product, variant };
      }
    }
    return null;
  }

  // Filter products/variants by max allowed strength
  async getProductsWithAllowedVariants(maxStrengthMg: number): Promise<Product[]> {
    return mockCatalog.map(product => ({
      ...product,
      variants: product.variants.filter(v => v.strengthMg <= maxStrengthMg),
    })).filter(p => p.variants.length > 0);
  }
}

export const catalogService = new CatalogService();
