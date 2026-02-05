// usePrescriptionStatus hook - Phase 1: Mock/localStorage only
// NO Supabase querying - uses shopPrescriptionService exclusively

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';
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

  // Refresh function to reload from service
  const refreshStatus = useCallback(async () => {
    // Null guard: if no user, return safe defaults
    if (!user) {
      setStatus({ hasActivePrescription: false, isExpired: false });
      setIsLoading(false);
      return;
    }

    const prescription = shopPrescriptionService.getActivePrescription(user.id);

    if (prescription) {
      // Active prescription found
      const allowance = await shopPrescriptionService.getRemainingAllowance(user.id);
      setStatus({
        hasActivePrescription: true,
        isExpired: false,  // Active means not expired
        allowedStrengthMg: prescription.maxStrengthMg,
        prescriptionId: prescription.id,
        expiresAt: prescription.expiresAt ? new Date(prescription.expiresAt) : undefined,
        totalCansAllowed: prescription.totalCansAllowed,
        remainingCans: allowance.remainingCans,
        referenceId: prescription.id,
      });
    } else {
      // No active prescription - check if expired for messaging
      const { prescription: latest, isExpired } = 
        shopPrescriptionService.getLatestPrescription(user.id);
      
      setStatus({
        hasActivePrescription: false,
        isExpired,  // True only if user had a prescription that expired
        expiredAt: isExpired && latest?.expiresAt 
          ? new Date(latest.expiresAt) 
          : undefined,
        latestPrescriptionId: latest?.id,
      });
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Dev toggle - persists to localStorage via service
  // Accepts strength parameter for testing different strengths
  const setMockPrescription = useCallback((enabled: boolean, maxStrengthMg: 3 | 6 | 9 = 9) => {
    if (!user) return;

    if (enabled) {
      shopPrescriptionService.createMockPrescription(user.id, maxStrengthMg);
    } else {
      shopPrescriptionService.clearMockPrescriptionsForUser(user.id);
    }

    // Refresh status after change
    refreshStatus();
  }, [user, refreshStatus]);

  // Check if mock is currently active (for UI state)
  const mockEnabled = user ? !!shopPrescriptionService.getActivePrescription(user.id) : false;

  return {
    ...status,
    isLoading,
    mockEnabled,
    setMockPrescription,
    refreshStatus,
  };
}
