import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { PrescriptionStatus } from '@/types/shop';

// Feature flag for mock mode - can be overridden
const MOCK_MODE = import.meta.env.VITE_MOCK_SHOP_DATA === 'true';

export function usePrescriptionStatus(forceMock?: boolean) {
  const { user } = useAuth();
  const [status, setStatus] = useState<PrescriptionStatus>({ hasActivePrescription: false });
  const [isLoading, setIsLoading] = useState(true);
  const [mockEnabled, setMockEnabled] = useState(false);

  // Dev toggle for simulating prescription
  const setMockPrescription = (enabled: boolean) => {
    setMockEnabled(enabled);
    if (enabled) {
      setStatus({
        hasActivePrescription: true,
        allowedStrengthMg: 12,
        maxContainers: 30,
        prescriptionId: 'mock-rx-001',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        referenceId: 'RX-MOCK-001',
      });
    }
  };

  useEffect(() => {
    if (mockEnabled) return; // Skip fetch if mock is enabled

    const fetchPrescriptionStatus = async () => {
      if (!user) {
        setStatus({ hasActivePrescription: false });
        setIsLoading(false);
        return;
      }

      // If force mock or env flag is set, return mock data
      if (forceMock || MOCK_MODE) {
        setStatus({
          hasActivePrescription: true,
          allowedStrengthMg: 12,
          maxContainers: 30,
          prescriptionId: 'mock-rx-001',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          referenceId: 'RX-MOCK-001',
        });
        setIsLoading(false);
        return;
      }

      try {
        // Check for doctor-issued prescriptions first
        const { data: issuedPrescriptions, error: issuedError } = await supabase
          .from('doctor_issued_prescriptions')
          .select('id, reference_id, nicotine_strength, containers_allowed, expires_at')
          .eq('patient_id', user.id)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1);

        if (!issuedError && issuedPrescriptions && issuedPrescriptions.length > 0) {
          const rx = issuedPrescriptions[0];
          const strengthMatch = rx.nicotine_strength.match(/(\d+)/);
          const strengthMg = strengthMatch ? parseInt(strengthMatch[1]) : 6;

          setStatus({
            hasActivePrescription: true,
            allowedStrengthMg: strengthMg,
            maxContainers: rx.containers_allowed,
            prescriptionId: rx.id,
            expiresAt: new Date(rx.expires_at),
            referenceId: rx.reference_id,
          });
          setIsLoading(false);
          return;
        }

        // Check for admin-approved uploaded prescriptions
        const { data: uploadedPrescriptions, error: uploadedError } = await supabase
          .from('prescriptions')
          .select('id, allowed_strength_max, max_units_per_order, expires_at')
          .eq('patient_id', user.id)
          .eq('status', 'active')
          .eq('prescription_type', 'uploaded')
          .or('expires_at.is.null,expires_at.gt.now()')
          .limit(1);

        if (!uploadedError && uploadedPrescriptions && uploadedPrescriptions.length > 0) {
          const rx = uploadedPrescriptions[0];
          setStatus({
            hasActivePrescription: true,
            allowedStrengthMg: rx.allowed_strength_max || 12,
            maxContainers: rx.max_units_per_order || 30,
            prescriptionId: rx.id,
            expiresAt: rx.expires_at ? new Date(rx.expires_at) : undefined,
          });
          setIsLoading(false);
          return;
        }

        // No active prescription found
        setStatus({ hasActivePrescription: false });
      } catch (error) {
        console.error('Error fetching prescription status:', error);
        setStatus({ hasActivePrescription: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptionStatus();
  }, [user, forceMock, mockEnabled]);

  return {
    ...status,
    isLoading,
    mockEnabled,
    setMockPrescription,
  };
}
