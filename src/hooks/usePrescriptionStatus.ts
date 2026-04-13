// usePrescriptionStatus hook
// Phase 2: derives prescription status from Supabase-issued prescriptions (and falls back to mock localStorage).

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';
import { patientIssuedPrescriptionsSupabaseService } from '@/services/patientIssuedPrescriptionsSupabaseService';
import type { PrescriptionStatus } from '@/types/shop';

interface ExtendedPrescriptionStatus extends PrescriptionStatus {
  isExpired: boolean;
  expiredAt?: Date;
  latestPrescriptionId?: string;
}

export function usePrescriptionStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ExtendedPrescriptionStatus>({ 
    hasActivePrescription: false,
    isExpired: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setStatus({ hasActivePrescription: false, isExpired: false });
      setIsLoading(false);
      return;
    }

    try {
      // Primary source of truth: Supabase-issued prescriptions.
      const latest = await patientIssuedPrescriptionsSupabaseService.getLatestForPatient(user.id);

      if (latest) {
        // MVP rule: any issued prescription unlocks shop; allowance is always 60 cans.
        const totalCansAllowed = 60;
        const allowance = await shopPrescriptionService.getRemainingAllowance(user.id);

        setStatus({
          hasActivePrescription: true,
          isExpired: false,
          allowedStrengthMg: latest.maxStrengthMg,
          prescriptionId: latest.id,
          expiresAt: undefined,
          totalCansAllowed,
          remainingCans: allowance.remainingCans,
          referenceId: latest.id,
        });

        setIsLoading(false);
        return;
      }

      // No Supabase prescription: fall back to mock/local history (helps in dev).
      const mock = shopPrescriptionService.getActivePrescription(user.id);
      if (mock) {
        const allowance = await shopPrescriptionService.getRemainingAllowance(user.id);
        setStatus({
          hasActivePrescription: true,
          isExpired: false,
          allowedStrengthMg: mock.maxStrengthMg,
          prescriptionId: mock.id,
          expiresAt: mock.expiresAt ? new Date(mock.expiresAt) : undefined,
          totalCansAllowed: mock.totalCansAllowed,
          remainingCans: allowance.remainingCans,
          referenceId: mock.id,
        });
      } else {
        const { prescription: latestMock, isExpired } = shopPrescriptionService.getLatestPrescription(user.id);
        setStatus({
          hasActivePrescription: false,
          isExpired,
          expiredAt: isExpired && latestMock?.expiresAt ? new Date(latestMock.expiresAt) : undefined,
          latestPrescriptionId: latestMock?.id,
        });
      }

      setIsLoading(false);
    } catch (e) {
      console.error('Failed to load prescription status from Supabase:', e);
      // On any Supabase error, fall back to mock/local.
      const mock = shopPrescriptionService.getActivePrescription(user.id);
      if (mock) {
        const allowance = await shopPrescriptionService.getRemainingAllowance(user.id);
        setStatus({
          hasActivePrescription: true,
          isExpired: false,
          allowedStrengthMg: mock.maxStrengthMg,
          prescriptionId: mock.id,
          expiresAt: mock.expiresAt ? new Date(mock.expiresAt) : undefined,
          totalCansAllowed: mock.totalCansAllowed,
          remainingCans: allowance.remainingCans,
          referenceId: mock.id,
        });
      } else {
        setStatus({ hasActivePrescription: false, isExpired: false });
      }
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    ...status,
    isLoading,
    refreshStatus,
  };
}
