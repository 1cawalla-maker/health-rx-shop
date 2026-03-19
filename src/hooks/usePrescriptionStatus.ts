// usePrescriptionStatus hook
// Uses shopPrescriptionService for prescription status

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

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setStatus({ hasActivePrescription: false, isExpired: false });
      setIsLoading(false);
      return;
    }

    const prescription = shopPrescriptionService.getActivePrescription(user.id);

    if (prescription) {
      const allowance = await shopPrescriptionService.getRemainingAllowance(user.id);
      setStatus({
        hasActivePrescription: true,
        isExpired: false,
        allowedStrengthMg: prescription.maxStrengthMg,
        prescriptionId: prescription.id,
        expiresAt: prescription.expiresAt ? new Date(prescription.expiresAt) : undefined,
        totalCansAllowed: prescription.totalCansAllowed,
        remainingCans: allowance.remainingCans,
        referenceId: prescription.id,
      });
    } else {
      const { prescription: latest, isExpired } = 
        shopPrescriptionService.getLatestPrescription(user.id);
      
      setStatus({
        hasActivePrescription: false,
        isExpired,
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

  return {
    ...status,
    isLoading,
    refreshStatus,
  };
}
