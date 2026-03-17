/**
 * Per-week remittance metadata service (localStorage-backed).
 * Each entry stores a URL pointing to an external remittance document.
 */

const STORAGE_KEY = 'healthrx_doctor_remittances';

export interface RemittanceEntry {
  weekStart: string;        // ISO YYYY-MM-DD (Monday)
  remittanceUrl: string;    // external link
  label?: string;           // optional display label
  attachedAtUtc: string;    // ISO timestamp
}

type Ledger = Record<string, RemittanceEntry[]>; // keyed by doctorId

function entryKey(weekStart: string): string {
  return weekStart;
}

class DoctorRemittanceService {
  private read(): Ledger {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private write(ledger: Ledger): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  }

  /** Get all remittance entries for a doctor, sorted descending by weekStart. */
  getRemittances(doctorId: string): RemittanceEntry[] {
    const ledger = this.read();
    return (ledger[doctorId] ?? []).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }

  /** Get a single remittance entry for a specific week. */
  getRemittance(doctorId: string, weekStart: string): RemittanceEntry | null {
    const entries = this.read()[doctorId] ?? [];
    return entries.find((e) => e.weekStart === entryKey(weekStart)) ?? null;
  }

  /** Attach a remittance URL to a week. Overwrites if exists. */
  attachRemittance(doctorId: string, weekStart: string, url: string, label?: string): void {
    const ledger = this.read();
    const entries = ledger[doctorId] ?? [];
    const idx = entries.findIndex((e) => e.weekStart === entryKey(weekStart));
    const entry: RemittanceEntry = {
      weekStart: entryKey(weekStart),
      remittanceUrl: url,
      label,
      attachedAtUtc: new Date().toISOString(),
    };
    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entries.push(entry);
    }
    ledger[doctorId] = entries;
    this.write(ledger);
  }

  /** Remove a remittance entry for a week. */
  removeRemittance(doctorId: string, weekStart: string): void {
    const ledger = this.read();
    const entries = ledger[doctorId] ?? [];
    ledger[doctorId] = entries.filter((e) => e.weekStart !== entryKey(weekStart));
    this.write(ledger);
  }
}

export const doctorRemittanceService = new DoctorRemittanceService();
