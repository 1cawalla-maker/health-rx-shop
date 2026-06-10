import type { Product, ProductVariant } from '@/types/shop';

type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

type ShopifyVariantNode = {
  id: string;
  title?: string | null;
  availableForSale?: boolean | null;
  price?: ShopifyMoney | null;
  selectedOptions?: Array<{ name?: string | null; value?: string | null }> | null;
};

type ShopifyProductNode = {
  id: string;
  title?: string | null;
  handle?: string | null;
  description?: string | null;
  descriptionHtml?: string | null;
  vendor?: string | null;
  featuredImage?: { url?: string | null; altText?: string | null } | null;
  images?: { nodes?: Array<{ url?: string | null; altText?: string | null }> | null } | null;
  variants?: { nodes?: ShopifyVariantNode[] | null } | null;
};

type ShopifyProductsResponse = {
  products?: {
    nodes?: ShopifyProductNode[];
  };
};

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'pouchcare.myshopify.com';
const SHOPIFY_API_VERSION = '2026-04';

function parseStrengthMg(variant: ShopifyVariantNode): 3 | 6 | 9 | null {
  const rawOptions = (variant.selectedOptions ?? [])
    .map((option) => `${option?.name ?? ''}: ${option?.value ?? ''}`)
    .join(' | ');

  const raw = [rawOptions, variant.title].filter(Boolean).join(' | ');
  const parsed = Number(raw.match(/(3|6|9)\s*mg/i)?.[1] ?? NaN);

  if (parsed === 3 || parsed === 6 || parsed === 9) return parsed;
  return null;
}

function moneyToCents(money?: ShopifyMoney | null): number {
  const amount = Number(money?.amount ?? 0);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

function stripHtml(html?: string | null): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productToCatalogProduct(node: ShopifyProductNode): Product | null {
  const variants = (node.variants?.nodes ?? [])
    .map((variant): ProductVariant | null => {
      const strengthMg = parseStrengthMg(variant);
      if (!strengthMg) return null;

      return {
        id: variant.id,
        shopifyId: variant.id,
        strengthMg,
        priceCents: moneyToCents(variant.price),
        currency: 'AUD',
        available: Boolean(variant.availableForSale),
      };
    })
    .filter((variant): variant is ProductVariant => Boolean(variant))
    .sort((a, b) => a.strengthMg - b.strengthMg);

  if (!node.id || !node.handle || variants.length === 0) return null;

  const title = node.title || node.handle;
  const description = node.description || stripHtml(node.descriptionHtml) || 'Nicotine pouch product';
  const imageUrl = node.featuredImage?.url || node.images?.nodes?.[0]?.url || undefined;

  return {
    id: node.handle,
    shopifyId: node.id,
    name: title,
    brand: node.vendor || 'PouchCare',
    flavor: title,
    canSizePouches: 20,
    imageUrl,
    description,
    variants,
  };
}

async function storefrontFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Shopify Storefront HTTP ${response.status}`);
  }
  if (json.errors?.length) {
    throw new Error(`Shopify Storefront errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

class CatalogService {
  private cache: { products: Product[]; fetchedAt: number } | null = null;
  private readonly cacheTtlMs = 60_000;

  async listProducts(): Promise<Product[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < this.cacheTtlMs) {
      return this.cache.products;
    }

    const query = `
      query PouchCareProducts($first: Int!) {
        products(first: $first) {
          nodes {
            id
            title
            handle
            description
            descriptionHtml
            vendor
            featuredImage { url altText }
            images(first: 1) { nodes { url altText } }
            variants(first: 25) {
              nodes {
                id
                title
                availableForSale
                price { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
        }
      }
    `;

    const data = await storefrontFetch<ShopifyProductsResponse>(query, { first: 50 });
    const products = (data.products?.nodes ?? [])
      .map(productToCatalogProduct)
      .filter((product): product is Product => Boolean(product));

    this.cache = { products, fetchedAt: now };
    return products;
  }

  async getProduct(productId: string): Promise<Product | null> {
    const products = await this.listProducts();
    return products.find((p) => p.id === productId || p.shopifyId === productId) || null;
  }

  async getVariant(variantId: string): Promise<{ product: Product; variant: ProductVariant } | null> {
    const products = await this.listProducts();
    for (const product of products) {
      const variant = product.variants.find((v) => v.id === variantId || v.shopifyId === variantId);
      if (variant) return { product, variant };
    }
    return null;
  }

  async getProductsWithAllowedVariants(maxStrengthMg: number): Promise<Product[]> {
    const products = await this.listProducts();
    return products
      .map((product) => ({
        ...product,
        variants: product.variants.filter((variant) => variant.strengthMg <= maxStrengthMg),
      }))
      .filter((product) => product.variants.length > 0);
  }
}

export const catalogService = new CatalogService();
