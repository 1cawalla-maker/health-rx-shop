// Telehealth system types and enums
// These mirror the database enums

export type NicotineStrength = '3mg' | '6mg' | '9mg' | '12mg';

export type UsageTier = 'light' | 'moderate' | 'heavy';

export type BookingStatus = 
  | 'pending_payment'
  | 'booked'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_answer';

export type AvailabilityType = 'recurring' | 'one_off' | 'blocked';

export type IssuedPrescriptionStatus = 'active' | 'expired' | 'revoked';

// Display labels
export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending_payment: 'Pending Payment',
  booked: 'Booked',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_answer: 'No Answer',
};

export const nicotineStrengthLabels: Record<NicotineStrength, string> = {
  '3mg': '3 mg',
  '6mg': '6 mg',
  '9mg': '9 mg',
  '12mg': '12 mg',
};

export const usageTierLabels: Record<UsageTier, string> = {
  light: 'Light (≤5/day)',
  moderate: 'Moderate (≤10/day)',
  heavy: 'Heavy (≤15/day)',
};

export const usageTierDailyMax: Record<UsageTier, number> = {
  light: 5,
  moderate: 10,
  heavy: 15,
};

// Calculate prescription quantities (mirrors database function)
export function calculatePrescriptionQuantities(usageTier: UsageTier) {
  const dailyMax = usageTierDailyMax[usageTier];
  const supplyDays = 90;
  const pouchesPerContainer = 20;
  
  const totalPouches = dailyMax * supplyDays;
  const containersAllowed = Math.ceil(totalPouches / pouchesPerContainer);
  
  return {
    dailyMaxPouches: dailyMax,
    totalPouches,
    containersAllowed,
    supplyDays,
  };
}

// Interfaces
export interface ConsultationBooking {
  id: string;
  patientId: string;
  doctorId: string | null;
  slotId: string | null;
  scheduledDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  timezone: string;
  status: BookingStatus;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
  amountPaid: number | null;
  paidAt: string | null;
  reasonForVisit: string | null;
  doctorNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  patientDob?: string;
  callAttempts?: CallAttempt[];
  intakeForm?: IntakeFormData | null;
}

export interface CallAttempt {
  id: string;
  bookingId: string;
  doctorId: string;
  attemptNumber: number;
  attemptedAt: string;
  notes: string | null;
}

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  availabilityType: AvailabilityType;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  maxBookings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssuedPrescription {
  id: string;
  bookingId: string;
  patientId: string;
  doctorId: string;
  nicotineStrength: NicotineStrength;
  usageTier: UsageTier;
  dailyMaxPouches: number;
  totalPouches: number;
  containersAllowed: number;
  supplyDays: number;
  status: IssuedPrescriptionStatus;
  pdfStoragePath: string | null;
  referenceId: string;
  issuedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  patientName?: string;
  doctorName?: string;
}

export interface IntakeFormData {
  id: string;
  bookingId: string;
  patientId: string;
  phoneNumber: string;
  symptoms: string | null;
  allergies: string | null;
  currentMedications: string | null;
  medicalHistory: string | null;
  preferredPharmacy: string | null;
  consentGiven: boolean;
  completedAt: string | null;
  answers: Record<string, unknown> | null;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  ahpraNumber: string | null;
  providerNumber: string | null;
  specialty: string | null;
  qualifications: string | null;
  bio: string | null;
  registrationComplete: boolean;
  isActive: boolean;
}

// Day of week helpers
export const dayOfWeekLabels: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
