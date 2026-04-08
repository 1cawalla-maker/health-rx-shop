import { supabase } from '@/integrations/supabase/client';

export type CallAttemptRow = {
  id: string;
  consultation_id: string;
  doctor_user_id: string;
  attempt_number: number;
  attempted_at: string;
  answered: boolean;
  notes: string | null;
};

export const callAttemptsSupabaseService = {
  async listForConsultation(consultationId: string): Promise<CallAttemptRow[]> {
    const { data, error } = await supabase
      .from('call_attempts')
      .select('id,consultation_id,doctor_user_id,attempt_number,attempted_at,answered,notes')
      .eq('consultation_id', consultationId)
      .order('attempt_number', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
  },

  async addAttempt(params: { consultationId: string; doctorUserId: string; notes?: string }): Promise<void> {
    // Find the next attempt number.
    const { data: last, error: lastErr } = await supabase
      .from('call_attempts')
      .select('attempt_number')
      .eq('consultation_id', params.consultationId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (lastErr) throw lastErr;

    const next = ((last || [])[0]?.attempt_number ?? 0) + 1;

    const { error } = await supabase.from('call_attempts').insert({
      consultation_id: params.consultationId,
      doctor_user_id: params.doctorUserId,
      attempt_number: next,
      notes: params.notes || null,
      answered: false,
    } as any);

    if (error) throw error;
  },

  async setAnswered(params: { attemptId: string; answered: boolean }): Promise<void> {
    const { error } = await supabase
      .from('call_attempts')
      .update({ answered: params.answered } as any)
      .eq('id', params.attemptId);

    if (error) throw error;
  },
};
