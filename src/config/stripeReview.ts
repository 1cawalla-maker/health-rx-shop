export const STRIPE_REVIEWER_EMAIL = 'stripetest@pouchcare.com.au';

export function isStripeReviewerEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === STRIPE_REVIEWER_EMAIL;
}
