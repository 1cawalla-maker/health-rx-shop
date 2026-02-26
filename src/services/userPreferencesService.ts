import { validateAuTimezone, DEFAULT_AU_TIMEZONE, AU_TIMEZONES, type AuTimezone } from '@/lib/timezones';

interface UserPrefs {
  timezone: string;
  updatedAt: string;
}

export interface GetTimezoneResult {
  timezone: AuTimezone;
  /** True if the stored value was invalid and was cleared/reset to default */
  wasReset: boolean;
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
   * Validates against AU_TIMEZONES on EVERY read.
   * If stored value is invalid: console.warn, clear key, return default.
   */
  getTimezone(uid: string): AuTimezone {
    return this.getTimezoneWithMeta(uid).timezone;
  },

  /**
   * Same as getTimezone but also returns whether the preference was reset
   * due to an invalid stored value (so callers can show a toast/banner).
   */
  getTimezoneWithMeta(uid: string): GetTimezoneResult {
    if (!uid) return { timezone: DEFAULT_AU_TIMEZONE, wasReset: false };
    const prefs = readPrefs(uid);
    if (!prefs?.timezone) return { timezone: DEFAULT_AU_TIMEZONE, wasReset: false };

    // Validate stored value on every read
    if (!(AU_TIMEZONES as readonly string[]).includes(prefs.timezone)) {
      console.warn(
        `[userPreferencesService] Invalid stored timezone "${prefs.timezone}" for user ${uid}. Clearing preference and using default "${DEFAULT_AU_TIMEZONE}".`
      );
      localStorage.removeItem(prefsKey(uid));
      return { timezone: DEFAULT_AU_TIMEZONE, wasReset: true };
    }

    return { timezone: prefs.timezone as AuTimezone, wasReset: false };
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
