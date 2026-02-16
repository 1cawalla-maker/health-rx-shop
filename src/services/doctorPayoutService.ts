import { doctorEarningsService } from '@/services/doctorEarningsService';

// Phase 1 payout tracking (localStorage-only)
// We derive payable consults from bookings, then track which bookingIds have been marked as paid.
// Phase 2: replace with Stripe payout ledger + webhook-driven reconciliation.

const KEY = 'healthrx_mock_doctor_payouts';

type PaidLedger = {
  doctorId: string;
  paidBookingIds: string[];
  updatedAt: string;
};

export type PayoutSummary = {
  totalCents: number;
  pendingCents: number;
  paidCents: number;
  pendingCount: number;
  paidCount: number;
};

class DoctorPayoutService {
  private read(doctorId: string): PaidLedger {
    try {
      const raw = localStorage.getItem(KEY);
      const all: PaidLedger[] = raw ? JSON.parse(raw) : [];
      const found = all.find((x) => x.doctorId === doctorId);
      return found || { doctorId, paidBookingIds: [], updatedAt: new Date().toISOString() };
    } catch {
      return { doctorId, paidBookingIds: [], updatedAt: new Date().toISOString() };
    }
  }

  private write(next: PaidLedger): void {
    try {
      const raw = localStorage.getItem(KEY);
      const all: PaidLedger[] = raw ? JSON.parse(raw) : [];
      const filtered = all.filter((x) => x.doctorId !== next.doctorId);
      filtered.push({ ...next, updatedAt: new Date().toISOString() });
      localStorage.setItem(KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }

  isBookingPaid(doctorId: string, bookingId: string): boolean {
    const ledger = this.read(doctorId);
    return ledger.paidBookingIds.includes(bookingId);
  }

  markBookingPaid(doctorId: string, bookingId: string): void {
    const ledger = this.read(doctorId);
    if (!ledger.paidBookingIds.includes(bookingId)) {
      ledger.paidBookingIds.push(bookingId);
      this.write(ledger);
    }
  }

  markBookingUnpaid(doctorId: string, bookingId: string): void {
    const ledger = this.read(doctorId);
    ledger.paidBookingIds = ledger.paidBookingIds.filter((id) => id !== bookingId);
    this.write(ledger);
  }

  markAllPaid(doctorId: string): void {
    const earnings = doctorEarningsService.getEarnings(doctorId);
    const ledger = this.read(doctorId);
    const allIds = earnings.lines.map((l) => l.bookingId);
    ledger.paidBookingIds = Array.from(new Set([...ledger.paidBookingIds, ...allIds]));
    this.write(ledger);
  }

  getPayoutSummary(doctorId: string): PayoutSummary {
    const earnings = doctorEarningsService.getEarnings(doctorId);
    const ledger = this.read(doctorId);

    const paid = earnings.lines.filter((l) => ledger.paidBookingIds.includes(l.bookingId));
    const pending = earnings.lines.filter((l) => !ledger.paidBookingIds.includes(l.bookingId));

    const paidCents = paid.reduce((s, l) => s + l.feeCents, 0);
    const pendingCents = pending.reduce((s, l) => s + l.feeCents, 0);

    return {
      totalCents: paidCents + pendingCents,
      paidCents,
      pendingCents,
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }

  getLedger(doctorId: string) {
    return this.read(doctorId);
  }
}

export const doctorPayoutService = new DoctorPayoutService();
