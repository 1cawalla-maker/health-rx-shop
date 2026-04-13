import { supabase } from '@/integrations/supabase/client';

export type PatientIssuedPrescription = {
  id: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  maxStrengthMg: 3 | 6 | 9;
  issuedAt: string;
};

class PatientIssuedPrescriptionsSupabaseService {
  async getLatestForPatient(patientId: string): Promise<PatientIssuedPrescription | null> {
    if (!patientId) return null;

    const { data, error } = await supabase
      .from('issued_prescriptions')
      .select('id,consultation_id,doctor_id,patient_id,max_strength_mg,issued_at')
      .eq('patient_id', patientId)
      .order('issued_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    const row = (data && data[0]) as any;
    if (!row) return null;

    return {
      id: String(row.id),
      consultationId: String(row.consultation_id),
      doctorId: String(row.doctor_id),
      patientId: String(row.patient_id),
      maxStrengthMg: row.max_strength_mg,
      issuedAt: String(row.issued_at),
    };
  }
}

export const patientIssuedPrescriptionsSupabaseService = new PatientIssuedPrescriptionsSupabaseService();
