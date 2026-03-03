/**
 * ATO ABN (Australian Business Number) validation algorithm.
 *
 * Steps:
 * 1. Subtract 1 from the first digit.
 * 2. Multiply each of the 11 digits by its corresponding weight:
 *    [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
 * 3. Sum all products.
 * 4. Valid if sum % 89 === 0.
 */

const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19] as const;

export function validateAbn(abn: string): { valid: boolean; error?: string } {
  const digits = abn.replace(/\s/g, '');

  if (digits.length !== 11) {
    return { valid: false, error: 'ABN must be exactly 11 digits' };
  }

  if (!/^\d{11}$/.test(digits)) {
    return { valid: false, error: 'ABN must contain only digits' };
  }

  const nums = digits.split('').map(Number);
  nums[0] -= 1; // subtract 1 from first digit

  const sum = nums.reduce((acc, d, i) => acc + d * ABN_WEIGHTS[i], 0);

  if (sum % 89 !== 0) {
    return { valid: false, error: 'Invalid ABN (checksum failed)' };
  }

  return { valid: true };
}

/** Format ABN with spaces: XX XXX XXX XXX */
export function formatAbn(abn: string): string {
  const digits = abn.replace(/\s/g, '');
  if (digits.length !== 11) return abn;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
}
