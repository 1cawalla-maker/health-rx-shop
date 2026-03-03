/** Shared validation utilities for DOB and phone inputs */

export function validateDob(day: string, month: string, year: string): { valid: boolean; error?: string; date?: Date } {
  const dd = parseInt(day, 10);
  const mm = parseInt(month, 10);
  const yyyy = parseInt(year, 10);

  if (!day || !month || !year) return { valid: false, error: 'Please enter your full date of birth' };
  if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return { valid: false, error: 'Date of birth must be numeric' };
  if (mm < 1 || mm > 12) return { valid: false, error: 'Month must be between 1 and 12' };
  if (dd < 1 || dd > 31) return { valid: false, error: 'Day must be between 1 and 31' };
  const currentYear = new Date().getFullYear();
  if (yyyy < 1900 || yyyy > currentYear) return { valid: false, error: `Year must be between 1900 and ${currentYear}` };

  const constructed = new Date(yyyy, mm - 1, dd);
  if (constructed.getDate() !== dd || constructed.getMonth() !== mm - 1 || constructed.getFullYear() !== yyyy) {
    return { valid: false, error: 'Invalid date (e.g. 31/02 does not exist)' };
  }

  const today = new Date();
  let age = today.getFullYear() - yyyy;
  const monthDiff = today.getMonth() - (mm - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dd)) age--;
  if (age < 18) return { valid: false, error: 'You must be at least 18 years old' };

  return { valid: true, date: constructed };
}

export function formatDobForStorage(day: string, month: string, year: string): string {
  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** Parse a yyyy-MM-dd string into { day, month, year } strings */
export function parseDobFromStorage(dob: string | null | undefined): { day: string; month: string; year: string } {
  if (!dob) return { day: '', month: '', year: '' };
  const parts = dob.split('-');
  if (parts.length !== 3) return { day: '', month: '', year: '' };
  return {
    year: parts[0],
    month: parts[1].replace(/^0/, ''),
    day: parts[2].replace(/^0/, ''),
  };
}

/** Validate Australian mobile: 9 digits starting with '4' */
export function validateAuPhone(digits: string): string | null {
  if (digits.length !== 9) return 'Phone number must be exactly 9 digits';
  if (!digits.startsWith('4')) return 'Phone number must start with 4';
  return null;
}

/** Strip +61 prefix from E.164 phone for display */
export function stripAuPrefix(phone: string | null | undefined): string {
  if (!phone) return '';
  if (phone.startsWith('+61')) return phone.slice(3);
  return phone;
}
