import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorOnboardingSupabaseService } from '@/services/doctorOnboardingSupabaseService';
import { supabase } from '@/integrations/supabase/client';

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

      let doctorId: string | null = null;
      let hasSignature = false;
      let hasPayoutProfile = false;
      let stripePayoutsEnabled = false;

      try {
        doctorId = await doctorOnboardingSupabaseService.getDoctorRowIdForUser(user.id);

        const sig = await doctorOnboardingSupabaseService.getSignatureRowForDoctor(doctorId);
        hasSignature = Boolean(sig?.storage_path);

        const business = await doctorOnboardingSupabaseService.getPayoutProfileForDoctor(doctorId);
        hasPayoutProfile = Boolean(business);

        const { data: stripeAcct, error: stripeErr } = await supabase
          .from('doctor_stripe_accounts' as any)
          .select('payouts_enabled')
          .eq('doctor_id', doctorId)
          .maybeSingle();
        if (stripeErr) throw stripeErr;

        stripePayoutsEnabled = Boolean((stripeAcct as any)?.payouts_enabled);

        const readyNow = hasSignature && hasPayoutProfile && stripePayoutsEnabled;
        setReady(readyNow);

        if (!readyNow) {
          console.warn('[DoctorReadiness] Not ready', {
            doctorId,
            hasSignature,
            hasPayoutProfile,
            stripePayoutsEnabled,
          });
        }
      } catch (e) {
        console.error('[DoctorReadiness] Failed to check doctor readiness', {
          doctorId,
          hasSignature,
          hasPayoutProfile,
          stripePayoutsEnabled,
          error: e,
        });
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
