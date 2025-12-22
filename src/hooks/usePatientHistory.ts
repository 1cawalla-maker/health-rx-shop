import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PatientWithHistory } from '@/types/database';

export function usePatientHistory() {
  const [patient, setPatient] = useState<PatientWithHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPatientHistory = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch patient profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, date_of_birth')
        .eq('user_id', patientId)
        .single();

      if (profileError) throw profileError;

      // Fetch all bookings for the patient
      const { data: bookings } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false });

      // Fetch all intake forms for the patient
      const { data: intakeForms } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      // Fetch all consultation notes for patient's bookings (non-internal only for patients)
      const bookingIds = bookings?.map(b => b.id) || [];
      let consultationNotes: any[] = [];
      if (bookingIds.length > 0) {
        const { data: notes } = await supabase
          .from('consultation_notes')
          .select('*')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: false });
        consultationNotes = notes || [];
      }

      // Fetch all files for the patient
      const { data: files } = await supabase
        .from('booking_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });

      setPatient({
        user_id: profile.user_id,
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        bookings: (bookings || []) as any,
        intake_forms: (intakeForms || []).map(form => ({
          ...form,
          answers: (form.answers || {}) as Record<string, any>
        })),
        consultation_notes: consultationNotes as any,
        booking_files: (files || []) as any
      });
    } catch (err) {
      setError(err as Error);
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { patient, loading, error, fetchPatientHistory };
}
