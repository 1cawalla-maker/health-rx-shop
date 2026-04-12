import { supabase } from '@/integrations/supabase/client';

export type ConsultationNoteRow = {
  id: string;
  booking_id: string;
  doctor_id: string;
  notes: string;
  internal_only: boolean;
  created_at: string;
  updated_at: string;
};

class ConsultationNotesSupabaseService {
  async getLatestInternalNote(params: { consultationId: string; doctorRowId: string }): Promise<ConsultationNoteRow | null> {
    const { data, error } = await supabase
      .from('consultation_notes')
      .select('*')
      .eq('booking_id', params.consultationId)
      .eq('doctor_id', params.doctorRowId)
      .eq('internal_only', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return (data && data[0] ? (data[0] as any) : null);
  }

  async upsertInternalNote(params: {
    consultationId: string;
    doctorRowId: string;
    notes: string;
  }): Promise<void> {
    // There may be multiple notes historically; for now we upsert a single "current" note per consultation+doctor.
    // Since we don't have a DB unique constraint, we implement this as:
    // - fetch latest
    // - update if present else insert
    const existing = await this.getLatestInternalNote({
      consultationId: params.consultationId,
      doctorRowId: params.doctorRowId,
    });

    if (existing?.id) {
      const { error } = await supabase
        .from('consultation_notes')
        .update({
          notes: params.notes,
          internal_only: true,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', existing.id);

      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from('consultation_notes')
      .insert({
        booking_id: params.consultationId,
        doctor_id: params.doctorRowId,
        notes: params.notes,
        internal_only: true,
      } as any);

    if (error) throw error;
  }

  async addInternalEventNote(params: {
    consultationId: string;
    doctorRowId: string;
    notes: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('consultation_notes')
      .insert({
        booking_id: params.consultationId,
        doctor_id: params.doctorRowId,
        notes: params.notes,
        internal_only: true,
      } as any);

    if (error) throw error;
  }
}

export const consultationNotesSupabaseService = new ConsultationNotesSupabaseService();
