/** Australian IANA timezone identifiers */
export const AU_TIMEZONES = [
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Hobart',
  'Australia/Darwin',
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

/**
 * UI display labels for timezone selector.
 *
 * "Canberra (Sydney)" is a convenience label that stores as Australia/Sydney.
 * There is NO Australia/Canberra IANA zone — Canberra observes the same
 * rules as Sydney (AEST/AEDT). We intentionally exclude Australia/Canberra
 * from AU_TIMEZONES and map the UI option to Australia/Sydney instead.
 */
export const AU_TIMEZONE_OPTIONS: { value: AuTimezone; label: string }[] = [
  { value: 'Australia/Brisbane', label: 'Brisbane' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Australia/Sydney', label: 'Canberra (Sydney)' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'Australia/Perth', label: 'Perth' },
  { value: 'Australia/Adelaide', label: 'Adelaide' },
  { value: 'Australia/Hobart', label: 'Hobart' },
  { value: 'Australia/Darwin', label: 'Darwin' },
];

/** Human-readable label for a timezone */
export function timezoneLabel(tz: string): string {
  return tz.replace('Australia/', '');
}
