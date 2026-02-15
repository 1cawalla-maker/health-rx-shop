// Shipping Service - Pure pricing logic (Phase 1 mock)
// Phase 2: Replace with async Shopify carrier rates or backend function

import type { ShippingMethod, ShippingQuote } from '@/types/shop';

const STANDARD_COST_CENTS = 2000; // $20.00
const EXPRESS_COST_CENTS = 4000;   // $40.00
const FREE_EXPRESS_CAN_THRESHOLD = 60;

/**
 * Type-guard: narrows unknown to ShippingMethod.
 * Warns on invalid non-null values.
 */
export function validateShippingMethod(
  method: unknown
): method is ShippingMethod {
  if (method === 'standard' || method === 'express') return true;
  if (method !== undefined && method !== null) {
    console.warn(
      `Invalid shipping method "${String(method)}", defaulting to "standard"`
    );
  }
  return false;
}

/** Normalize unknown to a safe ShippingMethod (defaults to 'standard'). */
export function safeShippingMethod(method: unknown): ShippingMethod {
  return validateShippingMethod(method) ? method : 'standard';
}

/**
 * Returns available shipping quotes given cart totalCans.
 * Free Express promo applies at exactly 60 cans.
 */
export function getAvailableShippingQuotes(totalCans: number): ShippingQuote[] {
  const expressIsFree = totalCans === FREE_EXPRESS_CAN_THRESHOLD;
  return [
    {
      method: 'standard',
      label: 'Standard Shipping',
      costCents: STANDARD_COST_CENTS,
      isFree: false,
      description: '5–7 business days',
    },
    {
      method: 'express',
      label: 'Express Shipping',
      costCents: expressIsFree ? 0 : EXPRESS_COST_CENTS,
      isFree: expressIsFree,
      description: expressIsFree
        ? 'Free for 60-can orders — 1–3 business days'
        : '1–3 business days',
    },
  ];
}

/** Get the shipping cost in cents for a given method and cart size. */
export function getShippingCostCents(
  totalCans: number,
  method: ShippingMethod
): number {
  const quotes = getAvailableShippingQuotes(totalCans);
  const quote = quotes.find(q => q.method === method);
  return quote?.costCents ?? STANDARD_COST_CENTS;
}
