import type { MockPrescription } from '@/types/shop';

const KEY = 'healthrx_mock_issued_prescriptions';

export type IssuedPrescriptionRecord = {
  id: string;
  doctorId: string;
  patientId: string;
  maxStrengthMg: MockPrescription['maxStrengthMg'];
  createdAt: string;
  signatureDataUrl?: string;
};

class IssuedPrescriptionService {
  listByDoctor(doctorId: string): IssuedPrescriptionRecord[] {
    if (!doctorId) return [];
    try {
      const raw = localStorage.getItem(KEY);
      const all: IssuedPrescriptionRecord[] = raw ? JSON.parse(raw) : [];
      return all
        .filter((r) => r.doctorId === doctorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }

  create(input: Omit<IssuedPrescriptionRecord, 'id' | 'createdAt'>): IssuedPrescriptionRecord {
    const rec: IssuedPrescriptionRecord = {
      id: `issued-rx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      ...input,
    };

    const raw = localStorage.getItem(KEY);
    const all: IssuedPrescriptionRecord[] = raw ? JSON.parse(raw) : [];
    all.push(rec);
    localStorage.setItem(KEY, JSON.stringify(all));
    return rec;
  }
}

export const issuedPrescriptionService = new IssuedPrescriptionService();
