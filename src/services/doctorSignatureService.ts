const KEY = 'healthrx_mock_doctor_signatures';

export type DoctorSignature = {
  doctorId: string;
  signatureDataUrl: string; // PNG data URL
  createdAt: string;
};

class DoctorSignatureService {
  getSignature(doctorId: string): DoctorSignature | null {
    if (!doctorId) return null;
    try {
      const raw = localStorage.getItem(KEY);
      const all: DoctorSignature[] = raw ? JSON.parse(raw) : [];
      return all.find((s) => s.doctorId === doctorId) || null;
    } catch {
      return null;
    }
  }

  saveSignature(doctorId: string, signatureDataUrl: string): DoctorSignature {
    const sig: DoctorSignature = {
      doctorId,
      signatureDataUrl,
      createdAt: new Date().toISOString(),
    };

    const raw = localStorage.getItem(KEY);
    const all: DoctorSignature[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((s) => s.doctorId !== doctorId);
    filtered.push(sig);
    localStorage.setItem(KEY, JSON.stringify(filtered));

    return sig;
  }

  clearSignature(doctorId: string) {
    try {
      const raw = localStorage.getItem(KEY);
      const all: DoctorSignature[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(KEY, JSON.stringify(all.filter((s) => s.doctorId !== doctorId)));
    } catch {
      // ignore
    }
  }
}

export const doctorSignatureService = new DoctorSignatureService();
