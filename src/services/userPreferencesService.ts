import { validateAuTimezone, DEFAULT_AU_TIMEZONE, type AuTimezone } from '@/lib/timezones';

interface UserPrefs {
  timezone: string;
  updatedAt: string;
}

const KEY_PREFIX = 'user:prefs:';

function prefsKey(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

function readPrefs(uid: string): UserPrefs | null {
  try {
    const raw = localStorage.getItem(prefsKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as UserPrefs;
  } catch {
    return null;
  }
}

function writePrefs(uid: string, prefs: UserPrefs): void {
  localStorage.setItem(prefsKey(uid), JSON.stringify(prefs));
}

export const userPreferencesService = {
  /**
   * Get the user's timezone preference.
   * Validates against AU_TIMEZONES; returns DEFAULT if missing/invalid.
   */
  getTimezone(uid: string): AuTimezone {
    if (!uid) return DEFAULT_AU_TIMEZONE;
    const prefs = readPrefs(uid);
    return validateAuTimezone(prefs?.timezone);
  },

  /**
   * Set the user's timezone preference (validates before storing).
   */
  setTimezone(uid: string, tz: string): void {
    if (!uid) return;
    const validated = validateAuTimezone(tz);
    const existing = readPrefs(uid);
    writePrefs(uid, {
      ...(existing || {}),
      timezone: validated,
      updatedAt: new Date().toISOString(),
    });
  },
};
