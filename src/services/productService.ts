// Product Service - Abstraction layer for future Shopify integration
// MVP: Returns mock data
// Future: Fetch from Shopify Storefront API

import type { Product } from '@/types/shop';

// Mock products - structured to match future Shopify product format
const mockProducts: Product[] = [
  {
    id: 'prod-001',
    shopifyId: null,
    name: 'Mint Fresh',
    brand: 'NicoBrand',
    flavor: 'Mint',
    strength: 6,
    packSize: 20,
    price: 24.99,
    imageUrl: undefined,
    description: 'Refreshing mint flavor nicotine pouches',
    inStock: true,
  },
  {
    id: 'prod-002',
    shopifyId: null,
    name: 'Cool Berry',
    brand: 'NicoBrand',
    flavor: 'Berry',
    strength: 6,
    packSize: 20,
    price: 24.99,
    imageUrl: undefined,
    description: 'Sweet berry blend nicotine pouches',
    inStock: true,
  },
  {
    id: 'prod-003',
    shopifyId: null,
    name: 'Strong Mint',
    brand: 'NicoBrand',
    flavor: 'Mint',
    strength: 12,
    packSize: 20,
    price: 27.99,
    imageUrl: undefined,
    description: 'Extra strength mint nicotine pouches',
    inStock: true,
  },
  {
    id: 'prod-004',
    shopifyId: null,
    name: 'Citrus Burst',
    brand: 'NicoBrand',
    flavor: 'Citrus',
    strength: 6,
    packSize: 20,
    price: 24.99,
    imageUrl: undefined,
    description: 'Zesty citrus flavor nicotine pouches',
    inStock: true,
  },
  {
    id: 'prod-005',
    shopifyId: null,
    name: 'Coffee Original',
    brand: 'NicoBrand',
    flavor: 'Coffee',
    strength: 9,
    packSize: 20,
    price: 26.99,
    imageUrl: undefined,
    description: 'Rich coffee flavor nicotine pouches',
    inStock: true,
  },
  {
    id: 'prod-006',
    shopifyId: null,
    name: 'Wintergreen',
    brand: 'NicoBrand',
    flavor: 'Wintergreen',
    strength: 12,
    packSize: 20,
    price: 27.99,
    imageUrl: undefined,
    description: 'Classic wintergreen nicotine pouches',
    inStock: true,
  },
  {
    id: 'prod-007',
    shopifyId: null,
    name: 'Spearmint Light',
    brand: 'NicoBrand',
    flavor: 'Spearmint',
    strength: 3,
    packSize: 20,
    price: 22.99,
    imageUrl: undefined,
    description: 'Light spearmint nicotine pouches',
    inStock: true,
  },
  {
    id: 'prod-008',
    shopifyId: null,
    name: 'Tropical Mix',
    brand: 'NicoBrand',
    flavor: 'Tropical',
    strength: 6,
    packSize: 20,
    price: 25.99,
    imageUrl: undefined,
    description: 'Exotic tropical fruit blend',
    inStock: true,
  },
];

class ProductService {
  async getProducts(): Promise<Product[]> {
    // MVP: Return mock data
    // Future: Fetch from Shopify Storefront API
    return mockProducts;
  }

  async getProduct(productId: string): Promise<Product | null> {
    // MVP: Return mock data
    // Future: Fetch from Shopify Storefront API
    return mockProducts.find(p => p.id === productId) || null;
  }

  async getProductsByStrength(maxStrength: number): Promise<Product[]> {
    // Filter products by prescription-allowed strength
    // MVP: Filter mock data
    // Future: Use Shopify collection or filter
    return mockProducts.filter(p => p.strength <= maxStrength);
  }
}

export const productService = new ProductService();
