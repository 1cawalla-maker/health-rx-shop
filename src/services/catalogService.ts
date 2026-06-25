import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductVariant } from '@/types/shop';

type ProductRow = {
  id: string;
  display_name: string;
  brand: string | null;
  flavour: string | null;
  description: string | null;
  image_url: string | null;
  can_size_pouches: number | null;
  sort_order: number | null;
  shopify_product_gid?: string | null;
  product_variants?: VariantRow[];
};

type VariantRow = {
  id: string;
  display_strength_mg: number | string;
  display_price_cents: number;
  currency: string | null;
  stock_status: string | null;
  visible: boolean | null;
  sort_order: number | null;
  shopify_variant_gid?: string | null;
  raw?: Record<string, unknown> | null;
};

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

function parseStrengthMg(variant: ShopifyVariantNode): number | null {
  const rawOptions = (variant.selectedOptions ?? [])
    .map((option) => `${option?.name ?? ''}: ${option?.value ?? ''}`)
    .join(' | ');

  const raw = [rawOptions, variant.title].filter(Boolean).join(' | ');
  const parsed = Number(raw.match(/(\d+(?:\.\d+)?)\s*mg/i)?.[1] ?? NaN);

  if (Number.isFinite(parsed) && parsed > 0) return parsed;
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

function rowToVariant(row: VariantRow): ProductVariant | null {
  const strengthMg = Number(row.display_strength_mg);
  const priceCents = Number(row.display_price_cents ?? 0);

  if (!Number.isFinite(strengthMg) || strengthMg <= 0) return null;
  if (!Number.isFinite(priceCents) || priceCents < 0) return null;

  return {
    id: row.id,
    shopifyId: row.shopify_variant_gid || (typeof row.raw?.shopify_variant_gid === 'string' ? row.raw.shopify_variant_gid : null),
    strengthMg,
    priceCents,
    currency: 'AUD',
    available: row.visible === true && row.stock_status !== 'out_of_stock',
  };
}

function rowToProduct(row: ProductRow): Product | null {
  const variants = (row.product_variants ?? [])
    .map(rowToVariant)
    .filter((variant): variant is ProductVariant => Boolean(variant))
    .sort((a, b) => a.strengthMg - b.strengthMg);

  if (!row.id || !row.display_name || variants.length === 0) return null;

  return {
    id: row.id,
    shopifyId: row.shopify_product_gid || (typeof (row as any).raw?.shopify_product_gid === 'string' ? (row as any).raw.shopify_product_gid : null),
    name: row.display_name,
    brand: row.brand || 'PouchCare',
    flavor: row.flavour || row.display_name,
    canSizePouches: 20,
    imageUrl: row.image_url || undefined,
    description: row.description || 'Nicotine pouch product',
    variants,
  };
}

function shopifyProductToCatalogProduct(node: ShopifyProductNode): Product | null {
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

async function listShopifyFallbackProducts(): Promise<Product[]> {
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
  return (data.products?.nodes ?? [])
    .map(shopifyProductToCatalogProduct)
    .filter((product): product is Product => Boolean(product));
}

class CatalogService {
  private cache: { products: Product[]; fetchedAt: number } | null = null;
  private readonly cacheTtlMs = 30_000;

  clearCache() {
    this.cache = null;
  }

  private async listInternalProducts(): Promise<Product[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select(`
        id,
        display_name,
        brand,
        flavour,
        description,
        image_url,
        can_size_pouches,
        sort_order,
        shopify_product_gid,
        product_variants (
          id,
          display_strength_mg,
          display_price_cents,
          currency,
          stock_status,
          visible,
          sort_order,
          shopify_variant_gid,
          raw
        )
      `)
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) throw new Error(`Failed to load internal product catalogue: ${error.message}`);

    return ((data ?? []) as ProductRow[])
      .map((product) => ({
        ...product,
        product_variants: (product.product_variants ?? [])
          .filter((variant) => variant.visible === true)
          .filter((variant) => variant.stock_status !== 'out_of_stock')
          .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)),
      }))
      .map(rowToProduct)
      .filter((product): product is Product => Boolean(product));
  }

  async listProducts(): Promise<Product[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < this.cacheTtlMs) {
      return this.cache.products;
    }

    let products: Product[] = [];
    try {
      products = await this.listInternalProducts();
    } catch (error) {
      // Transitional safety: the internal catalogue tables may not exist until the
      // migration is applied. Keep the existing Shopify catalogue live until cutover.
      console.warn('catalogService: internal catalogue unavailable, falling back to Shopify', error);
    }

    if (products.length === 0) {
      products = await listShopifyFallbackProducts();
    }

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
