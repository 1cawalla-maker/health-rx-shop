/**
 * Format an ISO date/time string (or Date) in a given IANA timezone.
 * Uses Intl.DateTimeFormat — no extra deps.
 */

export function formatDateTimeInTz(
  iso: string | Date,
  tz: string,
  opts?: Intl.DateTimeFormatOptions
): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const defaults: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  try {
    return new Intl.DateTimeFormat('en-AU', { ...defaults, ...opts }).format(date);
  } catch {
    // Fallback if timezone is invalid
    return date.toLocaleString('en-AU');
  }
}

/** Format date-only in a given timezone */
export function formatDateInTz(
  iso: string | Date,
  tz: string,
  opts?: Intl.DateTimeFormatOptions
): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const defaults: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  };
  try {
    return new Intl.DateTimeFormat('en-AU', { ...defaults, ...opts }).format(date);
  } catch {
    return date.toLocaleDateString('en-AU');
  }
}

/** Format time-only in a given timezone */
export function formatTimeInTz(
  iso: string | Date,
  tz: string,
  opts?: Intl.DateTimeFormatOptions
): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const defaults: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  try {
    return new Intl.DateTimeFormat('en-AU', { ...defaults, ...opts }).format(date);
  } catch {
    return date.toLocaleTimeString('en-AU');
  }
}

/** Get timezone abbreviation (e.g. AEST, AEDT, AWST) for a date in a given tz */
export function getTimezoneAbbr(date: Date, tz: string): string {
  try {
    return (
      new Intl.DateTimeFormat('en-AU', { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName')?.value || 'AEST'
    );
  } catch {
    return 'AEST';
  }
}
