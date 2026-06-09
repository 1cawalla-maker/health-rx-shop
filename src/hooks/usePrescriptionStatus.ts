// usePrescriptionStatus hook
// MVP shop source of truth: active uploaded/OCR prescription entitlement in Supabase.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { shopifyOrderMirrorService } from '@/services/shopifyOrderMirrorService';
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
      const { data: uploaded, error: uploadedError } = await (supabase as any)
        .from('prescriptions')
        .select('id,allowed_strength_max,total_units_allowed,created_at')
        .eq('patient_id', user.id)
        .eq('prescription_type', 'uploaded')
        .eq('status', 'active')
        .not('allowed_strength_max', 'is', null)
        .not('total_units_allowed', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (uploadedError) throw uploadedError;

      const activeUpload = uploaded?.[0];
      const allowedStrengthMg = Number(activeUpload?.allowed_strength_max ?? 0);
      const totalCansAllowed = Number(activeUpload?.total_units_allowed ?? 0);

      if (activeUpload?.id && allowedStrengthMg > 0 && totalCansAllowed > 0) {
        const cansUsed = await shopifyOrderMirrorService.getPaidCansOrdered(user.id, String(activeUpload.id));

        setStatus({
          hasActivePrescription: true,
          isExpired: false,
          allowedStrengthMg,
          prescriptionId: String(activeUpload.id),
          expiresAt: undefined,
          totalCansAllowed,
          remainingCans: Math.max(0, totalCansAllowed - cansUsed),
          referenceId: String(activeUpload.id),
        });
      } else {
        setStatus({ hasActivePrescription: false, isExpired: false });
      }
    } catch (e) {
      console.error('Failed to load uploaded prescription status from Supabase:', e);
      setStatus({ hasActivePrescription: false, isExpired: false });
    } finally {
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
