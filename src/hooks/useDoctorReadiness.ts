import { useAuth } from '@/hooks/useAuth';
import { doctorSignatureService } from '@/services/doctorSignatureService';
import { doctorPayoutProfileService } from '@/services/doctorPayoutProfileService';

/**
 * Centralized onboarding gate for doctors.
 * A doctor is "ready" only when:
 *   1. A digital signature has been saved.
 *   2. A valid payout profile (ABN, entity, bank, email) exists.
 *
 * Used by DoctorLayout to redirect incomplete profiles to /doctor/onboarding.
 */
export function useDoctorReadiness(): { ready: boolean; loading: boolean } {
  const { user, loading } = useAuth();

  if (loading || !user?.id) {
    return { ready: false, loading };
  }

  const hasSignature = doctorSignatureService.getSignature(user.id) !== null;
  const hasPayoutProfile = doctorPayoutProfileService.isComplete(user.id);

  return {
    ready: hasSignature && hasPayoutProfile,
    loading: false,
  };
}
