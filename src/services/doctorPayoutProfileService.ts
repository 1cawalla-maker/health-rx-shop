import { validateAbn } from '@/lib/abnValidation';

export interface DoctorPayoutProfile {
  abn: string;           // 11 digits
  bsb: string;           // 6 digits
  accountNumber: string; // 6-10 digits
  accountName: string;
  updatedAt: string;
}

function profileKey(uid: string): string {
  return `doctor:${uid}:payout_profile`;
}

class DoctorPayoutProfileService {
  getProfile(uid: string): DoctorPayoutProfile | null {
    if (!uid) return null;
    try {
      const raw = localStorage.getItem(profileKey(uid));
      if (!raw) return null;
      return JSON.parse(raw) as DoctorPayoutProfile;
    } catch {
      return null;
    }
  }

  saveProfile(uid: string, profile: Omit<DoctorPayoutProfile, 'updatedAt'>): void {
    if (!uid) return;
    const full: DoctorPayoutProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(profileKey(uid), JSON.stringify(full));
  }

  isComplete(uid: string): boolean {
    const profile = this.getProfile(uid);
    if (!profile) return false;

    // ABN valid
    const abnResult = validateAbn(profile.abn);
    if (!abnResult.valid) return false;

    // BSB: exactly 6 digits
    if (!/^\d{6}$/.test(profile.bsb)) return false;

    // Account number: 6-10 digits
    if (!/^\d{6,10}$/.test(profile.accountNumber)) return false;

    // Account name present
    if (!profile.accountName.trim()) return false;

    return true;
  }

  /** Validate individual fields and return errors */
  validate(profile: Partial<DoctorPayoutProfile>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (profile.abn !== undefined) {
      const abnResult = validateAbn(profile.abn);
      if (!abnResult.valid) errors.abn = abnResult.error || 'Invalid ABN';
    }

    if (profile.bsb !== undefined) {
      if (!/^\d{6}$/.test(profile.bsb)) {
        errors.bsb = 'BSB must be exactly 6 digits';
      }
    }

    if (profile.accountNumber !== undefined) {
      if (!/^\d{6,10}$/.test(profile.accountNumber)) {
        errors.accountNumber = 'Account number must be 6-10 digits';
      }
    }

    if (profile.accountName !== undefined) {
      if (!profile.accountName.trim()) {
        errors.accountName = 'Account name is required';
      }
    }

    return errors;
  }
}

export const doctorPayoutProfileService = new DoctorPayoutProfileService();
