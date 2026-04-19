import { supabase } from '@/integrations/supabase/client';

export type IssuedPrescriptionRow = {
  id: string;
  consultation_id: string;
  doctor_id: string;
  patient_id: string;
  max_strength_mg: 3 | 6 | 9;
  issued_at: string;
};

class IssuedPrescriptionsSupabaseService {
  async listForDoctor(params: { doctorRowId: string }): Promise<IssuedPrescriptionRow[]> {
    const { data, error } = await supabase
      .from('issued_prescriptions')
      .select('*')
      .eq('doctor_id', params.doctorRowId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  }

  async listForPatient(params: { patientId: string }): Promise<IssuedPrescriptionRow[]> {
    const { data, error } = await supabase
      .from('issued_prescriptions')
      .select('*')
      .eq('patient_id', params.patientId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  }

  async issue(params: {
    consultationId: string;
    doctorRowId: string;
    patientId: string;
    maxStrengthMg: 3 | 6 | 9;
  }): Promise<void> {
    // One per consultation; ignore duplicates.
    const { error } = await (supabase as any)
      .from('issued_prescriptions')
      .upsert(
        {
          consultation_id: params.consultationId,
          doctor_id: params.doctorRowId,
          patient_id: params.patientId,
          max_strength_mg: params.maxStrengthMg,
        },
        {
          onConflict: 'consultation_id',
          ignoreDuplicates: true,
        }
      );

    if (error) throw error;

    // Best-effort email to patient (do not fail issuance)
    try {
      await (supabase as any).functions.invoke('send-prescription-active-email', {
        body: { consultationId: params.consultationId },
      });
    } catch {
      // non-fatal
    }
  }
}


export const issuedPrescriptionsSupabaseService = new IssuedPrescriptionsSupabaseService();
