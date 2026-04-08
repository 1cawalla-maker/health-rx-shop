import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorOnboardingSupabaseService } from '@/services/doctorOnboardingSupabaseService';

/**
 * Centralized onboarding gate for doctors.
 * A doctor is "ready" only when:
 *   1) A digital signature has been saved (doctor_signatures + Storage).
 *   2) A payout profile exists (doctor_payout_profiles).
 *
 * Used by DoctorLayout to redirect incomplete profiles to /doctor/onboarding.
 */
export function useDoctorReadiness(): { ready: boolean; loading: boolean } {
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (loading || !user?.id) return;
      setChecking(true);
      try {
        const doctorId = await doctorOnboardingSupabaseService.getDoctorRowIdForUser(user.id);
        const sig = await doctorOnboardingSupabaseService.getSignatureRowForDoctor(doctorId);
        const payout = await doctorOnboardingSupabaseService.getPayoutProfileForDoctor(doctorId);
        setReady(Boolean(sig?.storage_path) && Boolean(payout));
      } catch (e) {
        console.error('Failed to check doctor readiness:', e);
        setReady(false);
      } finally {
        setChecking(false);
      }
    };

    void run();
  }, [user?.id, loading]);

  if (loading || checking || !user?.id) {
    return { ready: false, loading: loading || checking };
  }

  return { ready, loading: false };
}
