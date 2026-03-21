/**
 * Route prefixes accessible before doctor onboarding is complete.
 * Deny-by-default: any /doctor/* route not matching these prefixes
 * redirects to /doctor/onboarding.
 * Matching strategy: prefix match on pathname (startsWith).
 */
export const PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES = [
  '/doctor/onboarding',
  '/doctor/account',
  '/doctor/availability',
  '/doctor/earnings',
  '/doctor/info',
  // '/doctor/payslips', // removed (no payslip surfaces in Phase 1)
] as const;
