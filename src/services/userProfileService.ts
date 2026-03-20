export interface UserProfile {
  fullName: string;
  /**
   * Patient-managed contact email (Phase 1: local-only). In Phase 2, service internals can persist this to Supabase.
   * This is intentionally separate from the Supabase Auth login email.
   */
  contactEmail: string;
  dateOfBirth: string | null;
  phoneE164: string;
  timezone: string;
  updatedAt: string;
}

const KEY_PREFIX = 'user:';
const KEY_SUFFIX = ':profile';

function profileKey(uid: string): string {
  return `${KEY_PREFIX}${uid}${KEY_SUFFIX}`;
}

function readProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function writeProfile(uid: string, profile: UserProfile): void {
  localStorage.setItem(profileKey(uid), JSON.stringify(profile));
}

export const userProfileService = {
  getProfile(uid: string): UserProfile | null {
    if (!uid) return null;
    return readProfile(uid);
  },

  upsertProfile(uid: string, patch: Partial<UserProfile>): void {
    if (!uid) return;
    const existing = readProfile(uid) || {
      fullName: '',
      contactEmail: '',
      dateOfBirth: null,
      phoneE164: '',
      timezone: 'Australia/Brisbane',
      updatedAt: new Date().toISOString(),
    };
    writeProfile(uid, {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  },
};
