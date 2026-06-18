export type HalaxyBookingProvider = 'halaxy';

export type HalaxyBookingStatus =
  | 'not_started'
  | 'intake_complete'
  | 'sent_to_booking'
  | 'booking_in_progress'
  | 'webhook_pending'
  | 'booked'
  | 'cancelled'
  | 'cancelled_by_patient'
  | 'cancelled_by_practitioner'
  | 'completed'
  | 'failed'
  | 'manual_review';

export interface HalaxyConsultationSummary {
  id: string;
  patientId: string;
  bookingProvider: HalaxyBookingProvider;
  bookingStatus: HalaxyBookingStatus;
  scheduledAt: string | null;
  timezone: string | null;
  halaxyPatientId: string | null;
  halaxyAppointmentId: string | null;
  halaxyAppointmentStatus: string | null;
  halaxyBookingUrl: string | null;
  halaxyManageUrl: string | null;
  practitionerName: string | null;
  locationName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrepareHalaxyConsultResponse {
  consultation: HalaxyConsultationSummary;
  bookingUrl: string | null;
  manageUrl: string | null;
  bookingReturnToken: string | null;
  requiresLiveHalaxyConfig: boolean;
  message?: string;
}
