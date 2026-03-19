// Doctor identity profile service — localStorage-backed
// Phase 2: swap internals to Supabase update — interface unchanged

export interface DoctorProfile {
  fullName: string;
  ahpraNumber: string;
  providerNumber: string;
  phone: string;
  practiceLocation: string;
  updatedAt: string;
}

const KEY_PREFIX = 'doctor:';
const KEY_SUFFIX = ':profile';

function profileKey(uid: string): string {
  return `${KEY_PREFIX}${uid}${KEY_SUFFIX}`;
}

function readProfile(uid: string): DoctorProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as DoctorProfile;
  } catch {
    return null;
  }
}

function writeProfile(uid: string, profile: DoctorProfile): void {
  localStorage.setItem(profileKey(uid), JSON.stringify(profile));
}

export const doctorProfileService = {
  getProfile(uid: string): DoctorProfile | null {
    if (!uid) return null;
    return readProfile(uid);
  },

  upsertProfile(uid: string, patch: Partial<DoctorProfile>): void {
    if (!uid) return;
    const existing = readProfile(uid) || {
      fullName: '',
      ahpraNumber: '',
      providerNumber: '',
      phone: '',
      practiceLocation: '',
      updatedAt: new Date().toISOString(),
    };
    writeProfile(uid, {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * One-time hydration from Supabase data. Only writes if no local profile exists.
   */
  hydrateFromRemote(uid: string, data: Partial<DoctorProfile>): void {
    if (!uid) return;
    const existing = readProfile(uid);
    if (existing) return; // already hydrated
    writeProfile(uid, {
      fullName: data.fullName || '',
      ahpraNumber: data.ahpraNumber || '',
      providerNumber: data.providerNumber || '',
      phone: data.phone || '',
      practiceLocation: data.practiceLocation || '',
      updatedAt: new Date().toISOString(),
    });
  },
};
