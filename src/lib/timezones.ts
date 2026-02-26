/** Australian IANA timezone identifiers */
export const AU_TIMEZONES = [
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Hobart',
  'Australia/Darwin',
  'Australia/Canberra',
] as const;

export type AuTimezone = typeof AU_TIMEZONES[number];

export const DEFAULT_AU_TIMEZONE: AuTimezone = 'Australia/Brisbane';

/** Validate a timezone string is an AU timezone; fallback to default */
export function validateAuTimezone(tz: string | null | undefined): AuTimezone {
  if (tz && (AU_TIMEZONES as readonly string[]).includes(tz)) {
    return tz as AuTimezone;
  }
  return DEFAULT_AU_TIMEZONE;
}

/** Human-readable label for a timezone */
export function timezoneLabel(tz: string): string {
  return tz.replace('Australia/', '');
}
