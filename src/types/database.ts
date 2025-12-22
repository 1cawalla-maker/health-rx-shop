// Extended types for the telehealth platform

export type BookingStatus = 
  | 'requested' 
  | 'confirmed' 
  | 'intake_pending' 
  | 'ready_for_call' 
  | 'called' 
  | 'script_uploaded' 
  | 'completed' 
  | 'cancelled';

export interface Booking {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  scheduled_at: string;
  end_time: string | null;
  timezone: string;
  status: BookingStatus;
  consultation_type: 'video' | 'phone';
  reason_for_visit: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithPatient extends Booking {
  patient_profile?: {
    full_name: string | null;
    phone: string | null;
  };
  intake_form?: IntakeForm | null;
}

export interface Doctor {
  id: string;
  user_id: string;
  provider_number: string | null;
  specialties: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorWithProfile extends Doctor {
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  is_available: boolean;
}

export interface IntakeForm {
  id: string;
  booking_id: string;
  patient_id: string;
  symptoms: string | null;
  medical_history: string | null;
  allergies: string | null;
  current_medications: string | null;
  phone_number: string;
  preferred_pharmacy: string | null;
  consent_given: boolean;
  answers: Record<string, any>;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationNote {
  id: string;
  booking_id: string;
  doctor_id: string;
  notes: string;
  internal_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingFile {
  id: string;
  booking_id: string;
  patient_id: string;
  doctor_id: string | null;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  uploaded_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PatientWithHistory {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  bookings: BookingWithPatient[];
  intake_forms: IntakeForm[];
  consultation_notes: ConsultationNote[];
  booking_files: BookingFile[];
}
