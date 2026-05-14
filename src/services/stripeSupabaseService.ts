import { supabase } from '@/integrations/supabase/client';

export const stripeSupabaseService = {
  async createConsultationCheckout(params: { consultationId: string; amountCents: number; embedded?: boolean }) {
    const { data, error } = await supabase.functions.invoke('create-consultation-checkout', {
      body: params,
    });
    if (error) throw error;
    return data as { url?: string | null; clientSecret?: string | null; sessionId: string };
  },
};
