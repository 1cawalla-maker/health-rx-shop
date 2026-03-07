import { doctorEarningsService, type EarningsLineItem } from '@/services/doctorEarningsService';
import { userPreferencesService } from '@/services/userPreferencesService';
import type { BookingStatus } from '@/types/telehealth';

// TODO(phase2): payslips derived from Supabase ledger and linked to Xero via xeroReference

export interface PayslipLineItem {
  bookingId: string;
  patientId: string;
  scheduledAtIso: string;
  status: BookingStatus;
  feeCents: number;
}

export interface Payslip {
  id: string;               // e.g. "2026-W10"
  doctorId: string;
  periodLabel: string;       // e.g. "3 Mar – 9 Mar 2026"
  weekStartUtc: string;      // ISO Monday 00:00 UTC
  weekEndUtc: string;        // ISO Sunday 23:59 UTC
  consultCount: number;
  grossCents: number;
  status: 'draft' | 'paid';
  paidAtUtc: string | null;
  xeroReference: string | null;
  createdAtUtc: string;
  lines: PayslipLineItem[];
}

function storageKey(uid: string): string {
  return `doctor:${uid}:payslips`;
}

/** Get the Monday 00:00 UTC of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Get the Sunday 23:59:59.999 UTC of the week containing `date` */
function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function formatWeekId(weekStart: Date): string {
  const year = weekStart.getUTCFullYear();
  // ISO week number
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const daysSinceJan1 = Math.floor((weekStart.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((daysSinceJan1 + jan1.getUTCDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function formatPeriodLabel(weekStart: Date, weekEnd: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = weekStart.toLocaleDateString('en-AU', opts);
  const endStr = weekEnd.toLocaleDateString('en-AU', { ...opts, year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

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
   * Auto-derive weekly payslips from earnings data.
   * Creates any missing weeks. Called on page load — no manual "generate" button.
   */
  ensurePayslipsUpToDate(doctorId: string): void {
    const earnings = doctorEarningsService.getEarnings(doctorId);
    if (earnings.lines.length === 0) return;

    const existing = this.readAll(doctorId);
    const existingIds = new Set(existing.map(p => p.id));

    // Group lines by week
    const weekMap = new Map<string, { weekStart: Date; weekEnd: Date; lines: PayslipLineItem[] }>();

    for (const line of earnings.lines) {
      const date = new Date(line.scheduledAtIso);
      const weekStart = getWeekStart(date);
      const weekEnd = getWeekEnd(weekStart);
      const weekId = formatWeekId(weekStart);

      if (!weekMap.has(weekId)) {
        weekMap.set(weekId, { weekStart, weekEnd, lines: [] });
      }
      weekMap.get(weekId)!.lines.push(line);
    }

    let changed = false;
    for (const [weekId, data] of weekMap) {
      if (existingIds.has(weekId)) continue;

      const grossCents = data.lines.reduce((sum, l) => sum + l.feeCents, 0);
      const payslip: Payslip = {
        id: weekId,
        doctorId,
        periodLabel: formatPeriodLabel(data.weekStart, data.weekEnd),
        weekStartUtc: data.weekStart.toISOString(),
        weekEndUtc: data.weekEnd.toISOString(),
        consultCount: data.lines.length,
        grossCents,
        status: 'draft',
        paidAtUtc: null,
        xeroReference: null,
        createdAtUtc: new Date().toISOString(),
        lines: data.lines,
      };
      existing.push(payslip);
      changed = true;
    }

    if (changed) {
      this.writeAll(doctorId, existing);
    }
  }

  getPayslips(doctorId: string): Payslip[] {
    return this.readAll(doctorId).sort(
      (a, b) => b.weekStartUtc.localeCompare(a.weekStartUtc)
    );
  }

  getPayslip(doctorId: string, payslipId: string): Payslip | null {
    return this.readAll(doctorId).find((p) => p.id === payslipId) || null;
  }
}

export const doctorPayslipService = new DoctorPayslipService();
