import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/types/shop';

export type ShopifyLineItemInput = {
  merchandiseId: string;
  quantity: number;
};

// Phase 2 note:
// - Our catalog is still mock/local.
// - To create a real Shopify checkout we need ProductVariant GIDs.
// - While Online Store is password protected (Storefront locked), we map our mock variant ids
//   to Shopify ProductVariant IDs captured from Shopify Admin.
// - Replace this with real catalog fetch (Storefront API) once token/visibility is sorted.
const VARIANT_GID_BY_LOCAL_VARIANT_ID: Record<string, string> = {
  // Cool Mint (Shopify product 14964926939501)
  'var-mint-3': 'gid://shopify/ProductVariant/53218270413165',
  'var-mint-6': 'gid://shopify/ProductVariant/53218270445933',
  'var-mint-9': 'gid://shopify/ProductVariant/53218270478701',

  // Spearmint (Shopify product 14964927070573)
  'var-spearmint-3': 'gid://shopify/ProductVariant/53218271166829',
  'var-spearmint-6': 'gid://shopify/ProductVariant/53218271199597',
  'var-spearmint-9': 'gid://shopify/ProductVariant/53218271232365',

  // Black Cherry (Shopify product 14964927889773)
  'var-cherry-3': 'gid://shopify/ProductVariant/53218277556589',
  'var-cherry-6': 'gid://shopify/ProductVariant/53218277589357',
  'var-cherry-9': 'gid://shopify/ProductVariant/53218277622125',
};

function localVariantIdToMerchandiseGid(variantId: string): string {
  const gid = VARIANT_GID_BY_LOCAL_VARIANT_ID[variantId];
  if (!gid) {
    throw new Error(`No Shopify variant mapping for local variantId: ${variantId}`);
  }
  return gid;
}

class ShopifyCheckoutService {
  async createCheckoutUrl(lineItems: ShopifyLineItemInput[]): Promise<{ checkoutUrl: string; cartId: string }> {
    const { data, error } = await supabase.functions.invoke('create-shopify-cart-and-checkout-url', {
      body: { lineItems },
    });

    if (error) {
      // Supabase-js wraps function errors here.
      throw new Error(error.message || 'Failed to create Shopify checkout');
    }

    if (!data?.checkoutUrl || !data?.cartId) {
      throw new Error('Invalid response from create-shopify-cart-and-checkout-url');
    }

    return { checkoutUrl: data.checkoutUrl, cartId: data.cartId };
  }

  async createCheckoutUrlFromCartItems(items: CartItem[]): Promise<{ checkoutUrl: string; cartId: string }> {
    const lineItems: ShopifyLineItemInput[] = items.map((it) => ({
      merchandiseId: localVariantIdToMerchandiseGid(it.variantId),
      quantity: it.qtyCans,
    }));

    return this.createCheckoutUrl(lineItems);
  }
}

export const shopifyCheckoutService = new ShopifyCheckoutService();
