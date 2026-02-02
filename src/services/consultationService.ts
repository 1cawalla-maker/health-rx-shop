// Consultation Service - handles consultation booking and management
import { supabase } from '@/integrations/supabase/client';
import type { ConsultationBooking, BookingStatus, LegacyCallAttempt, IntakeFormData, MockBooking, MockCallAttempt } from '@/types/telehealth';
import { mockAvailabilityService } from './availabilityService';

// Constants
const MOCK_BOOKINGS_KEY = 'nicopatch_mock_bookings';

const MOCK_DOCTORS = [
  { id: 'mock-doc-1', name: 'Dr. Sarah Chen' },
  { id: 'mock-doc-2', name: 'Dr. Michael Thompson' },
  { id: 'mock-doc-3', name: 'Dr. Emily Patel' },
];

// Map database row to ConsultationBooking
function mapToBooking(row: any): ConsultationBooking {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    slotId: row.slot_id,
    scheduledDate: row.scheduled_date,
    timeWindowStart: row.time_window_start,
    timeWindowEnd: row.time_window_end,
    timezone: row.timezone,
    status: row.status,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    amountPaid: row.amount_paid,
    paidAt: row.paid_at,
    reasonForVisit: row.reason_for_visit,
    doctorNotes: row.doctor_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToLegacyCallAttempt(row: any): LegacyCallAttempt {
  return {
    id: row.id,
    bookingId: row.booking_id,
    doctorId: row.doctor_id,
    attemptNumber: row.attempt_number,
    attemptedAt: row.attempted_at,
    notes: row.notes,
  };
}

// Mock booking service for MVP (localStorage-based)
export const mockBookingService = {
  // Helper to add minutes to a time string
  addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m + minutes;
    return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  },

  // Get all bookings
  getBookings(): MockBooking[] {
    const stored = localStorage.getItem(MOCK_BOOKINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Get a single booking by ID
  getBooking(bookingId: string): MockBooking | null {
    return this.getBookings().find(b => b.id === bookingId) || null;
  },

  // Get patient's bookings
  getPatientBookings(patientId: string): MockBooking[] {
    return this.getBookings()
      .filter(b => b.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Create a booking with pending_payment status and reservation
  createBooking(
    patientId: string,
    date: string,
    time: string,
    utcTimestamp: string,
    displayTimezone: string,
    availableDoctorIds: string[]
  ): MockBooking {
    // Pick first available doctor (deterministic)
    const doctorId = availableDoctorIds[0];
    const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);
    
    // Create reservation to hold the slot
    const reservation = mockAvailabilityService.createReservation(
      patientId,
      doctorId,
      date,
      time,
      utcTimestamp
    );
    
    const endTime = this.addMinutes(time, 5);
    
    const booking: MockBooking = {
      id: crypto.randomUUID(),
      patientId,
      doctorId,
      doctorName: doctor?.name || null,
      scheduledDate: date,
      timeWindowStart: time,
      timeWindowEnd: endTime,
      utcTimestamp,
      displayTimezone,
      status: 'pending_payment',
      amountPaid: null,
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reservationId: reservation.id,
      callAttempts: [],
    };
    
    const bookings = this.getBookings();
    bookings.push(booking);
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    
    return booking;
  },

  // Confirm payment - converts reservation to confirmed booking
  confirmPayment(bookingId: string): MockBooking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return null;
    
    const booking = bookings[index];
    
    // Release reservation (slot is now permanently taken)
    if (booking.reservationId) {
      mockAvailabilityService.releaseReservation(booking.reservationId);
    }
    
    bookings[index] = {
      ...booking,
      status: 'booked',
      amountPaid: 4900, // $49.00 in cents
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reservationId: undefined,
    };
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    return bookings[index];
  },

  // Cancel booking (releases reservation if pending)
  cancelBooking(bookingId: string): void {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return;
    
    const booking = bookings[index];
    
    // Release reservation if exists
    if (booking.reservationId) {
      mockAvailabilityService.releaseReservation(booking.reservationId);
    }
    
    bookings[index] = {
      ...booking,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
  },

  // Log a call attempt
  logCallAttempt(bookingId: string, answered: boolean, notes?: string): MockCallAttempt | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return null;
    
    const booking = bookings[index];
    const attemptNumber = booking.callAttempts.length + 1;
    
    if (attemptNumber > 3) return null;
    
    const attempt: MockCallAttempt = {
      attemptNumber,
      attemptedAt: new Date().toISOString(),
      notes: notes || null,
      answered,
    };
    
    booking.callAttempts.push(attempt);
    booking.updatedAt = new Date().toISOString();
    
    // If answered, mark as in_progress
    if (answered) {
      booking.status = 'in_progress';
    }
    
    bookings[index] = booking;
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    
    return attempt;
  },

  // Mark as no-show (requires 3 failed attempts)
  markNoShow(bookingId: string): boolean {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return false;
    
    const booking = bookings[index];
    const failedAttempts = booking.callAttempts.filter(a => !a.answered);
    
    if (failedAttempts.length < 3) return false;
    
    booking.status = 'no_answer';
    booking.updatedAt = new Date().toISOString();
    bookings[index] = booking;
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    return true;
  },

  // Mark as completed
  markCompleted(bookingId: string): void {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return;
    
    bookings[index].status = 'completed';
    bookings[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
  },

  // Get doctor name by ID
  getDoctorName(doctorId: string): string {
    const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);
    return doctor?.name || 'Unknown Doctor';
  },
};

export const consultationService = {
  // Get doctor's bookings for today
  async getTodayBookings(doctorId: string): Promise<ConsultationBooking[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('scheduled_date', today)
      .in('status', ['booked', 'in_progress'])
      .order('time_window_start', { ascending: true });

    if (error) {
      console.error('Error fetching today bookings:', error);
      throw error;
    }

    return (data || []).map(mapToBooking);
  },

  // Get doctor's upcoming bookings
  async getUpcomingBookings(doctorId: string, limit: number = 10): Promise<ConsultationBooking[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .gte('scheduled_date', today)
      .in('status', ['booked', 'in_progress'])
      .order('scheduled_date', { ascending: true })
      .order('time_window_start', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming bookings:', error);
      throw error;
    }

    return (data || []).map(mapToBooking);
  },

  // Get bookings for this week
  async getThisWeekBookings(doctorId: string): Promise<ConsultationBooking[]> {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .lte('scheduled_date', endOfWeek.toISOString().split('T')[0])
      .in('status', ['booked', 'in_progress'])
      .order('scheduled_date', { ascending: true })
      .order('time_window_start', { ascending: true });

    if (error) {
      console.error('Error fetching this week bookings:', error);
      throw error;
    }

    return (data || []).map(mapToBooking);
  },

  // Get past consultations
  async getPastConsultations(doctorId: string, limit: number = 20): Promise<ConsultationBooking[]> {
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .in('status', ['completed', 'cancelled', 'no_answer'])
      .order('scheduled_date', { ascending: false })
      .order('time_window_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching past consultations:', error);
      throw error;
    }

    return (data || []).map(mapToBooking);
  },

  // Get single booking with patient details
  async getBookingWithDetails(bookingId: string): Promise<ConsultationBooking | null> {
    const { data: booking, error: bookingError } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      return null;
    }

    if (!booking) return null;

    // Get patient profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, date_of_birth')
      .eq('user_id', booking.patient_id)
      .single();

    // Get call attempts
    const { data: attempts } = await supabase
      .from('call_attempts')
      .select('*')
      .eq('booking_id', bookingId)
      .order('attempt_number', { ascending: true });

    // Get intake form
    const { data: intake } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    const result = mapToBooking(booking);
    result.patientName = profile?.full_name || 'Unknown';
    result.patientPhone = profile?.phone || '';
    result.patientDob = profile?.date_of_birth || '';
    result.callAttempts = (attempts || []).map(mapToLegacyCallAttempt);
    result.intakeForm = intake ? {
      id: intake.id,
      bookingId: intake.booking_id,
      patientId: intake.patient_id,
      phoneNumber: intake.phone_number,
      symptoms: intake.symptoms,
      allergies: intake.allergies,
      currentMedications: intake.current_medications,
      medicalHistory: intake.medical_history,
      preferredPharmacy: intake.preferred_pharmacy,
      consentGiven: intake.consent_given,
      completedAt: intake.completed_at,
      answers: intake.answers as Record<string, unknown> | null,
    } : null;

    return result;
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
    const { error } = await supabase
      .from('consultation_bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Assign doctor to booking
  async assignDoctor(bookingId: string, doctorId: string): Promise<void> {
    const { error } = await supabase
      .from('consultation_bookings')
      .update({ doctor_id: doctorId })
      .eq('id', bookingId);

    if (error) {
      console.error('Error assigning doctor:', error);
      throw error;
    }
  },

  // Log call attempt (legacy Supabase integration - not used by mock)
  async logCallAttempt(bookingId: string, doctorId: string, notes?: string): Promise<LegacyCallAttempt> {
    // Get current attempt count
    const { data: existing } = await supabase
      .from('call_attempts')
      .select('attempt_number')
      .eq('booking_id', bookingId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const nextAttempt = (existing?.[0]?.attempt_number || 0) + 1;

    if (nextAttempt > 3) {
      throw new Error('Maximum call attempts reached');
    }

    const { data, error } = await supabase
      .from('call_attempts')
      .insert({
        booking_id: bookingId,
        doctor_id: doctorId,
        attempt_number: nextAttempt,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging call attempt:', error);
      throw error;
    }

    return mapToLegacyCallAttempt(data);
  },

  // Get call attempts for booking (legacy Supabase integration)
  async getCallAttempts(bookingId: string): Promise<LegacyCallAttempt[]> {
    const { data, error } = await supabase
      .from('call_attempts')
      .select('*')
      .eq('booking_id', bookingId)
      .order('attempt_number', { ascending: true });

    if (error) {
      console.error('Error fetching call attempts:', error);
      throw error;
    }

    return (data || []).map(mapToLegacyCallAttempt);
  },

  // Mark as no answer after 3 attempts
  async markNoAnswer(bookingId: string): Promise<void> {
    const attempts = await this.getCallAttempts(bookingId);
    
    if (attempts.length < 3) {
      throw new Error('Must have 3 call attempts before marking as no answer');
    }

    await this.updateBookingStatus(bookingId, 'no_answer');
  },

  // Update doctor notes
  async updateDoctorNotes(bookingId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('consultation_bookings')
      .update({ doctor_notes: notes })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating doctor notes:', error);
      throw error;
    }
  },

  // Get bookings with patient info for list display
  async getBookingsWithPatientInfo(bookings: ConsultationBooking[]): Promise<ConsultationBooking[]> {
    if (bookings.length === 0) return [];

    const patientIds = [...new Set(bookings.map(b => b.patientId))];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone, date_of_birth')
      .in('user_id', patientIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    return bookings.map(booking => ({
      ...booking,
      patientName: profileMap.get(booking.patientId)?.full_name || 'Unknown',
      patientPhone: profileMap.get(booking.patientId)?.phone || '',
      patientDob: profileMap.get(booking.patientId)?.date_of_birth || '',
    }));
  },

  // Get next upcoming booking
  async getNextBooking(doctorId: string): Promise<ConsultationBooking | null> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('status', 'booked')
      .or(`scheduled_date.gt.${today},and(scheduled_date.eq.${today},time_window_start.gte.${currentTime})`)
      .order('scheduled_date', { ascending: true })
      .order('time_window_start', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching next booking:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const booking = mapToBooking(data[0]);
    const withPatientInfo = await this.getBookingsWithPatientInfo([booking]);
    return withPatientInfo[0] || null;
  },
};
