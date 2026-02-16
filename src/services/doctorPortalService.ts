import { mockBookingService } from '@/services/consultationService';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';
import type { MockBooking, BookingStatus } from '@/types/telehealth';

// Phase 1 Doctor Portal Service
// - localStorage only
// - no Supabase, no PDFs
// Phase 2: replace internals with Supabase-backed implementation.

export type DoctorCallAttemptInput = {
  notes?: string;
};

export type IssuePrescriptionInput = {
  patientId: string;
  maxStrengthMg: 3 | 6 | 9;
};

class DoctorPortalService {
  getDoctorBookings(doctorId: string): MockBooking[] {
    if (!doctorId) return [];
    return mockBookingService
      .getBookings()
      .filter((b) => b.doctorId === doctorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getBooking(bookingId: string): MockBooking | null {
    return mockBookingService.getBooking(bookingId);
  }

  setBookingStatus(bookingId: string, status: BookingStatus): MockBooking | null {
    const booking = mockBookingService.getBooking(bookingId);
    if (!booking) return null;

    // Use existing service update helper if it exists; otherwise write-through here.
    // mockBookingService currently persists via localStorage on its own operations.
    // We implement a safe write-through by reading all bookings and updating the record.
    const all = mockBookingService.getBookings();
    const idx = all.findIndex((b) => b.id === bookingId);
    if (idx === -1) return null;

    all[idx] = {
      ...all[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('nicopatch_mock_bookings', JSON.stringify(all));
    return all[idx];
  }

  addCallAttempt(bookingId: string, input: DoctorCallAttemptInput = {}): MockBooking | null {
    const all = mockBookingService.getBookings();
    const idx = all.findIndex((b) => b.id === bookingId);
    if (idx === -1) return null;

    const booking = all[idx];
    const attempts = booking.callAttempts || [];

    attempts.push({
      id: crypto.randomUUID(),
      bookingId,
      doctorId: booking.doctorId,
      attemptNumber: attempts.length + 1,
      attemptedAt: new Date().toISOString(),
      notes: input.notes || null,
    });

    all[idx] = {
      ...booking,
      callAttempts: attempts,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('nicopatch_mock_bookings', JSON.stringify(all));
    return all[idx];
  }

  issuePrescription(input: IssuePrescriptionInput) {
    // Phase 1: issuing a prescription = create localStorage entitlement for patient.
    return shopPrescriptionService.createMockPrescription(input.patientId, input.maxStrengthMg);
  }

  declinePrescription(bookingId: string, reason: string): MockBooking | null {
    // Phase 1: record decline reason on booking notes (local only).
    const all = mockBookingService.getBookings();
    const idx = all.findIndex((b) => b.id === bookingId);
    if (idx === -1) return null;

    const booking = all[idx];
    all[idx] = {
      ...booking,
      updatedAt: new Date().toISOString(),
      // Store lightweight note; Phase 2 will store structured notes.
      doctorNotes: `Prescription declined: ${reason.trim()}`,
      status: 'completed',
    } as any;

    localStorage.setItem('nicopatch_mock_bookings', JSON.stringify(all));
    return all[idx];
  }
}

export const doctorPortalService = new DoctorPortalService();
