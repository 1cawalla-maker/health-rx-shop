import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/types/shop';

export type ShopifyLineItemInput = {
  merchandiseId: string;
  quantity: number;
  /** Strength in mg for UI/debug context; backend derives strength from Shopify variant data. */
  strengthMg: number;
};

function cartItemToMerchandiseGid(item: CartItem): string {
  const gid = item.shopifyVariantId || item.variantId;
  if (!gid?.startsWith('gid://shopify/ProductVariant/')) {
    throw new Error(`${item.name} ${item.strengthMg}mg is not ready for secure checkout yet. Please contact support before ordering.`);
  }
  return gid;
}

class ShopifyCheckoutService {
  async createCheckoutUrl(lineItems: ShopifyLineItemInput[]): Promise<{ checkoutUrl: string; cartId: string }> {
    const { data, error } = await supabase.functions.invoke('create-shopify-cart-and-checkout-url', {
      body: { lineItems },
    });

    if (error) {
      // Supabase-js wraps non-2xx Edge Function responses. Pull the JSON body out
      // when available so the UI/devtools show the real server-side reason.
      const context = (error as any)?.context;
      let serverMessage = '';
      if (context && typeof context.json === 'function') {
        try {
          const body = await context.json();
          serverMessage = String(body?.error || body?.message || '');
        } catch {
          // Ignore body parse failures and fall back to the wrapper message.
        }
      }
      throw new Error(serverMessage || error.message || 'Failed to start secure checkout');
    }

    if (!data?.checkoutUrl || !data?.cartId) {
      throw new Error('Invalid response from create-shopify-cart-and-checkout-url');
    }

    return { checkoutUrl: data.checkoutUrl, cartId: data.cartId };
  }

  async createCheckoutUrlFromCartItems(items: CartItem[]): Promise<{ checkoutUrl: string; cartId: string }> {
    const lineItems: ShopifyLineItemInput[] = items.map((it) => ({
      merchandiseId: cartItemToMerchandiseGid(it),
      quantity: it.qtyCans,
      strengthMg: it.strengthMg,
    }));

    return this.createCheckoutUrl(lineItems);
  }
}

export const shopifyCheckoutService = new ShopifyCheckoutService();
