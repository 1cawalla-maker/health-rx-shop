import { ENABLE_PRESCRIPTION_PDF } from '@/config/features';

// Phase 1 stub: NO uploads, NO signed URLs, NO network calls.
// Phase 2: replace internals with Supabase Storage + signed URLs.

class PrescriptionFileService {
  async getPrescriptionFileUrl(_prescriptionId: string): Promise<string | null> {
    if (ENABLE_PRESCRIPTION_PDF) {
      // Phase 2 implementation will go here.
      console.warn('[PrescriptionFileService] ENABLE_PRESCRIPTION_PDF=true but no Phase 2 implementation is wired yet.');
    }
    return null;
  }

  async uploadPrescriptionFile(_file: File, _userId: string): Promise<never> {
    console.warn('[Phase 1] Prescription PDF upload not available');
    throw new Error('Prescription upload will be enabled in Phase 2');
  }

  async deletePrescriptionFile(_prescriptionId: string): Promise<void> {
    // no-op in Phase 1
    return;
  }
}

export const prescriptionFileService = new PrescriptionFileService();
