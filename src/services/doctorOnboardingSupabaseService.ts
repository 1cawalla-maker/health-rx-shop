import { supabase } from '@/integrations/supabase/client';

const SIGNATURE_BUCKET = 'doctor-signatures';

export type DoctorSignatureRow = {
  id: string;
  doctor_id: string;
  storage_bucket: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
};

export type DoctorPayoutProfileRow = {
  id: string;
  doctor_id: string;
  abn: string;
  entity_name: string;
  gst_registered: boolean;
  remittance_email: string;
  created_at: string;
  updated_at: string;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'application/octet-stream';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export const doctorOnboardingSupabaseService = {
  signatureBucket: SIGNATURE_BUCKET,

  async getDoctorRowIdForUser(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    const id = (data as any)?.id as string | undefined;
    if (!id) throw new Error('Doctor profile not found');
    return id;
  },

  async getSignatureRowForDoctor(doctorId: string): Promise<DoctorSignatureRow | null> {
    const { data, error } = await supabase
      .from('doctor_signatures')
      .select('id,doctor_id,storage_bucket,storage_path,created_at,updated_at')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (error) throw error;
    return (data as any) ?? null;
  },

  async getSignatureSignedUrl(storagePath: string, expiresInSeconds = 60 * 60): Promise<string> {
    const { data, error } = await supabase.storage
      .from(SIGNATURE_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) throw error;
    const url = (data as any)?.signedUrl as string | undefined;
    if (!url) throw new Error('Could not create signed URL');
    return url;
  },

  async saveSignatureForCurrentDoctor(params: { userId: string; signatureDataUrl: string }): Promise<void> {
    const doctorId = await this.getDoctorRowIdForUser(params.userId);

    // Store at a stable path so subsequent saves overwrite.
    const path = `${params.userId}/signature.png`;
    const blob = dataUrlToBlob(params.signatureDataUrl);

    const { error: uploadErr } = await supabase.storage
      .from(SIGNATURE_BUCKET)
      .upload(path, blob, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadErr) throw uploadErr;

    const { error: upsertErr } = await supabase
      .from('doctor_signatures')
      .upsert(
        {
          doctor_id: doctorId,
          storage_bucket: SIGNATURE_BUCKET,
          storage_path: path,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'doctor_id' }
      );

    if (upsertErr) throw upsertErr;
  },

  async removeSignatureForCurrentDoctor(params: { userId: string }): Promise<void> {
    const doctorId = await this.getDoctorRowIdForUser(params.userId);
    const existing = await this.getSignatureRowForDoctor(doctorId);

    if (existing?.storage_path) {
      await supabase.storage.from(SIGNATURE_BUCKET).remove([existing.storage_path]);
    }

    await supabase.from('doctor_signatures').delete().eq('doctor_id', doctorId);
  },

  async getPayoutProfileForDoctor(doctorId: string): Promise<DoctorPayoutProfileRow | null> {
    const { data, error } = await supabase
      .from('doctor_payout_profiles')
      .select(
        'id,doctor_id,abn,entity_name,gst_registered,remittance_email,created_at,updated_at'
      )
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (error) throw error;
    return (data as any) ?? null;
  },

  async upsertPayoutProfileForCurrentDoctor(params: {
    userId: string;
    abn: string;
    entityName: string;
    gstRegistered: boolean;
    remittanceEmail: string;
  }): Promise<void> {
    const doctorId = await this.getDoctorRowIdForUser(params.userId);
    const { error } = await supabase
      .from('doctor_payout_profiles')
      .upsert(
        {
          doctor_id: doctorId,
          abn: params.abn,
          entity_name: params.entityName,
          gst_registered: params.gstRegistered,
          remittance_email: params.remittanceEmail,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'doctor_id' }
      );

    if (error) throw error;
  },
};
