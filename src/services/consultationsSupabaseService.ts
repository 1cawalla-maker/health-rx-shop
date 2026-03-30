import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ConsultationStatus = Database['public']['Enums']['consultation_status'];

export type ConsultationRow = Database['public']['Tables']['consultations']['Row'];

export const consultationsSupabaseService = {
  async getById(id: string): Promise<ConsultationRow | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || null;
  },

  async listForDoctorQueue(): Promise<ConsultationRow[]> {
    // RLS already limits access; doctor policy currently allows select for any doctor.
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async listForPatient(patientId: string): Promise<ConsultationRow[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createRequested(params: {
    id: string;
    patientId: string;
    scheduledAtIso: string;
    timezone?: string | null;
  }): Promise<ConsultationRow> {
    const { data, error } = await supabase
      .from('consultations')
      .insert({
        id: params.id,
        patient_id: params.patientId,
        doctor_id: null,
        scheduled_at: params.scheduledAtIso,
        consultation_type: 'phone',
        status: 'requested',
        timezone: params.timezone || 'Australia/Brisbane',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: ConsultationStatus): Promise<ConsultationRow> {
    const { data, error } = await supabase
      .from('consultations')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
