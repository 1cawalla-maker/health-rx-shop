import { DOCTOR_FEE_CENTS_PER_CONSULT } from '@/config/fees';
import { doctorPortalService } from '@/services/doctorPortalService';
import type { BookingStatus, MockBooking } from '@/types/telehealth';

export type EarningsLineItem = {
  bookingId: string;
  patientId: string;
  scheduledAtIso: string;
  status: BookingStatus;
  feeCents: number;
};

export type EarningsSummary = {
  consultCount: number;
  totalCents: number;
  lines: EarningsLineItem[];
};

/**
 * Billable consultation statuses.
 * Business rule: attempted consults (no_answer) are billable because
 * the doctor's time was allocated and the call was attempted.
 * To change this policy, update this constant.
 */
export const BILLABLE_CONSULT_STATUSES: BookingStatus[] = ['completed', 'no_answer'];

class DoctorEarningsService {
  getEarnings(doctorId: string): EarningsSummary {
    const bookings: MockBooking[] = doctorPortalService.getDoctorBookings(doctorId);

    const paid = bookings.filter((b) => BILLABLE_CONSULT_STATUSES.includes(b.status));

    const lines: EarningsLineItem[] = paid
      .map((b) => {
        const scheduled = new Date(`${b.scheduledDate}T${b.timeWindowStart}:00`);
        return {
          bookingId: b.id,
          patientId: b.patientId,
          scheduledAtIso: scheduled.toISOString(),
          status: b.status,
          feeCents: DOCTOR_FEE_CENTS_PER_CONSULT,
        };
      })
      .sort((a, b) => new Date(b.scheduledAtIso).getTime() - new Date(a.scheduledAtIso).getTime());

    const totalCents = lines.reduce((sum, l) => sum + l.feeCents, 0);

    return {
      consultCount: lines.length,
      totalCents,
      lines,
    };
  }
}

export const doctorEarningsService = new DoctorEarningsService();
