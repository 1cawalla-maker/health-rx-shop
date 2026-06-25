// usePrescriptionStatus hook
// MVP shop source of truth: active uploaded/OCR prescription entitlement in Supabase.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { shopifyOrderMirrorService } from '@/services/shopifyOrderMirrorService';
import type { PrescriptionStatus } from '@/types/shop';

export type UploadedPrescriptionStatus = {
  id: string;
  status: 'pending_review' | 'active' | 'rejected' | 'expired' | string;
  ocr_status: 'not_started' | 'processing' | 'completed' | 'failed' | 'needs_review' | string | null;
  allowed_strength_max: number | null;
  total_units_allowed: number | null;
  review_reason: string | null;
  ocr_error: string | null;
  file_name: string | null;
  created_at: string;
};

interface ExtendedPrescriptionStatus extends PrescriptionStatus {
  isExpired: boolean;
  expiredAt?: Date;
  latestPrescriptionId?: string;
  latestUpload?: UploadedPrescriptionStatus | null;
  hasPendingPrescription: boolean;
}

export function usePrescriptionStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ExtendedPrescriptionStatus>({
    hasActivePrescription: false,
    hasPendingPrescription: false,
    isExpired: false,
    latestUpload: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setStatus({
        hasActivePrescription: false,
        hasPendingPrescription: false,
        isExpired: false,
        latestUpload: null,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data: uploaded, error: uploadedError } = await (supabase as any)
        .from('prescriptions')
        .select('id,status,ocr_status,allowed_strength_max,total_units_allowed,review_reason,ocr_error,file_name,created_at')
        .eq('patient_id', user.id)
        .eq('prescription_type', 'uploaded')
        .order('created_at', { ascending: false });

      if (uploadedError) throw uploadedError;

      const uploads = (uploaded ?? []) as UploadedPrescriptionStatus[];
      const latestUpload = uploads[0] ?? null;
      const activeUpload = uploads.find((row) => {
        const allowedStrengthMg = Number(row.allowed_strength_max ?? 0);
        const totalCansAllowed = Number(row.total_units_allowed ?? 0);
        return row.status === 'active' && allowedStrengthMg > 0 && totalCansAllowed > 0;
      }) ?? null;

      const hasPendingPrescription = uploads.some((row) => (
        row.status === 'pending_review' ||
        row.ocr_status === 'processing' ||
        row.ocr_status === 'needs_review' ||
        row.ocr_status === 'not_started'
      ));

      const allowedStrengthMg = Number(activeUpload?.allowed_strength_max ?? 0);
      const totalCansAllowed = Number(activeUpload?.total_units_allowed ?? 0);

      if (activeUpload?.id && allowedStrengthMg > 0 && totalCansAllowed > 0) {
        const cansUsed = await shopifyOrderMirrorService.getPaidCansOrdered(user.id, String(activeUpload.id));

        setStatus({
          hasActivePrescription: true,
          hasPendingPrescription,
          isExpired: false,
          allowedStrengthMg,
          prescriptionId: String(activeUpload.id),
          latestPrescriptionId: String(latestUpload?.id ?? activeUpload.id),
          expiresAt: undefined,
          totalCansAllowed,
          remainingCans: Math.max(0, totalCansAllowed - cansUsed),
          referenceId: String(activeUpload.id),
          latestUpload,
        });
      } else {
        setStatus({
          hasActivePrescription: false,
          hasPendingPrescription,
          isExpired: latestUpload?.status === 'expired',
          latestPrescriptionId: latestUpload?.id,
          latestUpload,
        });
      }
    } catch (e) {
      console.error('Failed to load uploaded prescription status from Supabase:', e);
      setStatus({
        hasActivePrescription: false,
        hasPendingPrescription: false,
        isExpired: false,
        latestUpload: null,
      });
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
