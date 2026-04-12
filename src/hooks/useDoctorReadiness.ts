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

  // IMPORTANT: default to "loading" until we've performed at least one readiness check.
  // Otherwise DoctorLayout can redirect to /doctor/onboarding on the first render after login
  // (before useEffect has a chance to set `checking=true`).
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Reset when auth user changes
    setHasChecked(false);
    setReady(false);

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
        setHasChecked(true);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isLoading = loading || checking || !user?.id || !hasChecked;

  if (isLoading) {
    return { ready: false, loading: true };
  }

  return { ready, loading: false };
}
