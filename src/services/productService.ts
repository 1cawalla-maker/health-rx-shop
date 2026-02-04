// Product Service - DEPRECATED: Use catalogService instead
// Kept for backwards compatibility during migration

import type { Product, ProductVariant } from '@/types/shop';
import { catalogService } from './catalogService';

// Convert catalog products to legacy format for backwards compatibility
async function toLegacyProducts(): Promise<Product[]> {
  const products = await catalogService.listProducts();
  const legacyProducts: Product[] = [];

  for (const product of products) {
    for (const variant of product.variants) {
      legacyProducts.push({
        ...product,
        id: `${product.id}-${variant.strengthMg}`,
        strength: variant.strengthMg,
        packSize: 20,
        price: variant.priceCents / 100,
        inStock: variant.available,
      });
    }
  }

  return legacyProducts;
}

class ProductService {
  async getProducts(): Promise<Product[]> {
    // Return legacy format for backwards compatibility
    return toLegacyProducts();
  }

  async getProduct(productId: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === productId) || null;
  }

  async getProductsByStrength(maxStrength: number): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter(p => (p.strength || 0) <= maxStrength);
  }
}

export const productService = new ProductService();
