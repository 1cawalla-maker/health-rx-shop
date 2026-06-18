import { supabase } from '@/integrations/supabase/client';
import type { PrepareHalaxyConsultResponse, HalaxyConsultationSummary, HalaxyBookingStatus } from '@/types/halaxy';

type RawConsultationRow = Record<string, unknown>;

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function requiredString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function mapBookingStatus(value: unknown): HalaxyBookingStatus {
  const status = typeof value === 'string' ? value : 'not_started';
  return status as HalaxyBookingStatus;
}

function mapHalaxyConsultation(row: RawConsultationRow): HalaxyConsultationSummary {
  return {
    id: requiredString(row.id),
    patientId: requiredString(row.patient_id),
    bookingProvider: 'halaxy',
    bookingStatus: mapBookingStatus(row.booking_status),
    scheduledAt: stringOrNull(row.scheduled_at),
    timezone: stringOrNull(row.timezone),
    halaxyPatientId: stringOrNull(row.halaxy_patient_id),
    halaxyAppointmentId: stringOrNull(row.halaxy_appointment_id),
    halaxyAppointmentStatus: stringOrNull(row.halaxy_appointment_status),
    halaxyBookingUrl: stringOrNull(row.halaxy_booking_url),
    halaxyManageUrl: stringOrNull(row.halaxy_manage_url),
    practitionerName: stringOrNull(row.halaxy_practitioner_name),
    locationName: stringOrNull(row.halaxy_location_name),
    createdAt: requiredString(row.created_at),
    updatedAt: requiredString(row.updated_at),
  };
}

export const halaxyConsultationService = {
  async prepareConsult(): Promise<PrepareHalaxyConsultResponse> {
    const { data, error } = await supabase.functions.invoke('halaxy-prepare-consult', {
      body: {},
    });

    if (error) throw error;
    return data as PrepareHalaxyConsultResponse;
  },

  async getConsultationStatus(consultationId: string): Promise<HalaxyConsultationSummary | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', consultationId)
      .filter('booking_provider', 'eq', 'halaxy')
      .maybeSingle();

    if (error) throw error;
    return data ? mapHalaxyConsultation(data as unknown as RawConsultationRow) : null;
  },

  async listForPatient(patientId: string): Promise<HalaxyConsultationSummary[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .filter('booking_provider', 'eq', 'halaxy')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => mapHalaxyConsultation(row as unknown as RawConsultationRow));
  },
};
