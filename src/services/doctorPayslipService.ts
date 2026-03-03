import { doctorEarningsService, type EarningsLineItem } from '@/services/doctorEarningsService';
import type { BookingStatus } from '@/types/telehealth';

export interface PayslipLineItem {
  bookingId: string;
  patientId: string;
  scheduledAtIso: string;
  status: BookingStatus;
  feeCents: number;
}

export interface Payslip {
  id: string;
  doctorId: string;
  periodLabel: string;     // e.g. "March 2026"
  periodStart: string;     // ISO date
  periodEnd: string;       // ISO date
  consultCount: number;
  totalCents: number;
  generatedAt: string;
  lines: PayslipLineItem[];
}

function storageKey(uid: string): string {
  return `doctor:${uid}:payslips`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

class DoctorPayslipService {
  private readAll(doctorId: string): Payslip[] {
    try {
      const raw = localStorage.getItem(storageKey(doctorId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeAll(doctorId: string, payslips: Payslip[]): void {
    localStorage.setItem(storageKey(doctorId), JSON.stringify(payslips));
  }

  /**
   * Generate a payslip for a given month. Idempotent — returns existing
   * payslip if one already exists for the same period.
   */
  generatePayslip(doctorId: string, year: number, month: number): Payslip {
    const existing = this.readAll(doctorId);
    const periodId = `${year}-${String(month).padStart(2, '0')}`;

    const found = existing.find((p) => p.id === periodId);
    if (found) return found;

    // Build period range
    const periodStart = new Date(year, month - 1, 1).toISOString();
    const periodEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Get all earnings and filter by month
    const earnings = doctorEarningsService.getEarnings(doctorId);
    const monthLines: PayslipLineItem[] = earnings.lines.filter((l: EarningsLineItem) => {
      const d = new Date(l.scheduledAtIso);
      return d.getFullYear() === year && d.getMonth() === month - 1;
    });

    const totalCents = monthLines.reduce((sum, l) => sum + l.feeCents, 0);

    const payslip: Payslip = {
      id: periodId,
      doctorId,
      periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      periodStart,
      periodEnd,
      consultCount: monthLines.length,
      totalCents,
      generatedAt: new Date().toISOString(),
      lines: monthLines,
    };

    existing.push(payslip);
    this.writeAll(doctorId, existing);

    return payslip;
  }

  getPayslips(doctorId: string): Payslip[] {
    return this.readAll(doctorId).sort(
      (a, b) => b.periodStart.localeCompare(a.periodStart)
    );
  }

  getPayslip(doctorId: string, payslipId: string): Payslip | null {
    return this.readAll(doctorId).find((p) => p.id === payslipId) || null;
  }
}

export const doctorPayslipService = new DoctorPayslipService();
