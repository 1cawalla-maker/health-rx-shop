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

export type IssuedPrescriptionStatus = 'active' | 'expired' | 'revoked' | 'declined';

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
  heavy: 'Heavy (≤20/day)',
};

export const usageTierDailyMax: Record<UsageTier, number> = {
  light: 5,
  moderate: 10,
  heavy: 20,
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
  callAttempts?: LegacyCallAttempt[];
  intakeForm?: IntakeFormData | null;
}

// Call attempt types - Option A-ready (stable interface for Supabase migration)
export type CallAttemptOutcome = 'no_answer' | 'answered';

export interface CallAttempt {
  id: string;
  consultationId: string;
  attemptNumber: number;
  outcome: CallAttemptOutcome;
  attemptedAtIso: string;
}

export interface CallAttemptRepository {
  list(consultationId: string): Promise<CallAttempt[]>;
  add(params: { consultationId: string; outcome: CallAttemptOutcome }): Promise<CallAttempt>;
  canMarkNoShow(attempts: CallAttempt[]): boolean;
}

// Legacy type for mock bookings (to be removed when migrating to Supabase)
export interface LegacyCallAttempt {
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

// 5-minute slot booking types
export interface FiveMinuteSlot {
  time: string;           // Local time "09:05"
  date: string;           // "2025-02-05"
  utcTimestamp: string;   // ISO string for absolute time
  doctorIds: string[];    // Doctors available at this time
  isAvailable: boolean;   // At least one doctor available
  displayTimezone: string; // e.g., "Australia/Brisbane"
  timezoneAbbr: string;   // "AEST" or "AEDT"
}

export interface BookingReservation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  utcTimestamp: string;
  expiresAt: string;      // ISO string, 10 min from creation
}

export interface MockBooking {
  id: string;
  patientId: string;
  doctorId: string | null;
  doctorName: string | null;
  scheduledDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  utcTimestamp: string;
  displayTimezone: string;
  status: BookingStatus;
  amountPaid: number | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  reservationId?: string;
  callAttempts: MockCallAttempt[];
}

export interface MockCallAttempt {
  attemptNumber: number;
  attemptedAt: string;
  notes: string | null;
  answered: boolean;
}

// Re-export for backward compatibility
export type { CallAttempt as CallAttemptRecord };

export interface MockAvailabilityBlock {
  id: string;
  doctorId: string;
  doctorName: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  isRecurring: boolean;
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
