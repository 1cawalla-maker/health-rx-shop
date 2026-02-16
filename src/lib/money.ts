export function formatAudFromCents(cents: number): string {
  const value = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
