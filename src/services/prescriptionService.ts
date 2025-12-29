// Prescription Service - handles doctor-issued prescriptions
import { supabase } from '@/integrations/supabase/client';
import type { 
  IssuedPrescription, 
  NicotineStrength, 
  UsageTier, 
  IssuedPrescriptionStatus 
} from '@/types/telehealth';
import { calculatePrescriptionQuantities } from '@/types/telehealth';

// Generate unique reference ID
function generateReferenceId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RX-${timestamp}-${random}`;
}

// Map database row to IssuedPrescription
function mapToPrescription(row: any): IssuedPrescription {
  return {
    id: row.id,
    bookingId: row.booking_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    nicotineStrength: row.nicotine_strength,
    usageTier: row.usage_tier,
    dailyMaxPouches: row.daily_max_pouches,
    totalPouches: row.total_pouches,
    containersAllowed: row.containers_allowed,
    supplyDays: row.supply_days,
    status: row.status,
    pdfStoragePath: row.pdf_storage_path,
    referenceId: row.reference_id,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreatePrescriptionData {
  bookingId: string;
  patientId: string;
  doctorId: string;
  nicotineStrength: NicotineStrength;
  usageTier: UsageTier;
}

export const prescriptionService = {
  // Create a new doctor-issued prescription
  async createPrescription(data: CreatePrescriptionData): Promise<IssuedPrescription> {
    const quantities = calculatePrescriptionQuantities(data.usageTier);
    
    // Calculate expiry date (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const referenceId = generateReferenceId();

    const { data: prescription, error } = await supabase
      .from('doctor_issued_prescriptions')
      .insert({
        booking_id: data.bookingId,
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        nicotine_strength: data.nicotineStrength,
        usage_tier: data.usageTier,
        daily_max_pouches: quantities.dailyMaxPouches,
        total_pouches: quantities.totalPouches,
        containers_allowed: quantities.containersAllowed,
        supply_days: quantities.supplyDays,
        reference_id: referenceId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }

    return mapToPrescription(prescription);
  },

  // Get prescription by ID
  async getPrescriptionById(prescriptionId: string): Promise<IssuedPrescription | null> {
    const { data, error } = await supabase
      .from('doctor_issued_prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching prescription:', error);
      throw error;
    }

    return data ? mapToPrescription(data) : null;
  },

  // Get prescriptions by booking
  async getPrescriptionsByBooking(bookingId: string): Promise<IssuedPrescription[]> {
    const { data, error } = await supabase
      .from('doctor_issued_prescriptions')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prescriptions by booking:', error);
      throw error;
    }

    return (data || []).map(mapToPrescription);
  },

  // Get prescriptions by patient
  async getPatientPrescriptions(patientId: string): Promise<IssuedPrescription[]> {
    const { data, error } = await supabase
      .from('doctor_issued_prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching patient prescriptions:', error);
      throw error;
    }

    return (data || []).map(mapToPrescription);
  },

  // Get active prescription for patient
  async getActivePrescription(patientId: string): Promise<IssuedPrescription | null> {
    const { data, error } = await supabase
      .from('doctor_issued_prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('issued_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active prescription:', error);
      throw error;
    }

    return data && data.length > 0 ? mapToPrescription(data[0]) : null;
  },

  // Check if patient has active prescription
  async hasActivePrescription(patientId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('has_active_issued_prescription', { _patient_id: patientId });

    if (error) {
      console.error('Error checking active prescription:', error);
      return false;
    }

    return data === true;
  },

  // Get prescriptions issued by doctor
  async getDoctorIssuedPrescriptions(doctorId: string, limit: number = 50): Promise<IssuedPrescription[]> {
    const { data, error } = await supabase
      .from('doctor_issued_prescriptions')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('issued_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching doctor prescriptions:', error);
      throw error;
    }

    return (data || []).map(mapToPrescription);
  },

  // Update prescription PDF path
  async updatePdfPath(prescriptionId: string, pdfPath: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_issued_prescriptions')
      .update({ pdf_storage_path: pdfPath })
      .eq('id', prescriptionId);

    if (error) {
      console.error('Error updating PDF path:', error);
      throw error;
    }
  },

  // Revoke prescription
  async revokePrescription(prescriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_issued_prescriptions')
      .update({ status: 'revoked' as IssuedPrescriptionStatus })
      .eq('id', prescriptionId);

    if (error) {
      console.error('Error revoking prescription:', error);
      throw error;
    }
  },

  // Get prescription with patient and doctor names
  async getPrescriptionWithDetails(prescriptionId: string): Promise<IssuedPrescription | null> {
    const prescription = await this.getPrescriptionById(prescriptionId);
    if (!prescription) return null;

    // Get patient name
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', prescription.patientId)
      .single();

    // Get doctor name
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', prescription.doctorId)
      .single();

    return {
      ...prescription,
      patientName: patientProfile?.full_name || 'Unknown',
      doctorName: doctorProfile?.full_name || 'Unknown',
    };
  },
};
