import { validateAbn } from '@/lib/abnValidation';

// TODO(phase2): replace localStorage with Supabase table doctor_payout_profiles (RLS: user_id = auth.uid())

export interface DoctorPayoutProfile {
  // Stripe Connect holds bank/payout routing details.
  // We only store business details needed for remittance/invoicing.
  abn: string;             // 11 digits
  entityName: string;      // Business/trading name
  gstRegistered: boolean;
  remittanceEmail: string;
  createdAtUtc: string;
  updatedAtUtc: string;
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

  upsertProfile(uid: string, profile: Omit<DoctorPayoutProfile, 'createdAtUtc' | 'updatedAtUtc'>): void {
    if (!uid) return;
    const existing = this.getProfile(uid);
    const now = new Date().toISOString();
    const full: DoctorPayoutProfile = {
      ...profile,
      createdAtUtc: existing?.createdAtUtc || now,
      updatedAtUtc: now,
    };
    localStorage.setItem(profileKey(uid), JSON.stringify(full));
  }

  isComplete(uid: string): boolean {
    const errors = this.validateProfile(this.getProfile(uid));
    return Object.keys(errors).length === 0;
  }

  /** Validate full profile and return errors map (empty = valid) */
  validateProfile(profile: Partial<DoctorPayoutProfile> | null): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!profile) return { _: 'No profile' };

    // ABN
    const abnResult = validateAbn(profile.abn || '');
    if (!abnResult.valid) errors.abn = abnResult.error || 'Invalid ABN';

    // Entity name
    if (!profile.entityName?.trim()) errors.entityName = 'Entity/business name is required';

    // Remittance email
    if (!profile.remittanceEmail?.trim()) {
      errors.remittanceEmail = 'Remittance email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.remittanceEmail.trim())) {
      errors.remittanceEmail = 'Invalid email address';
    }

    // Bank details are collected in Stripe Connect onboarding.
    return errors;
  }
}

export const doctorPayoutProfileService = new DoctorPayoutProfileService();
