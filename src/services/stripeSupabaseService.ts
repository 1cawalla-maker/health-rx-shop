import { supabase } from '@/integrations/supabase/client';

export const stripeSupabaseService = {
  async createConsultationCheckout(params: { consultationId: string; amountCents: number }) {
    const { data, error } = await supabase.functions.invoke('create-consultation-checkout', {
      body: params,
    });
    if (error) throw error;
    return data as { url: string; sessionId: string };
  },
};
