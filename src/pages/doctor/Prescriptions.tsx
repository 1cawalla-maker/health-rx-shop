import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorPrescriptions() {
  return (
    <DoctorPhase1Stub
      title="My Issued Prescriptions"
      description="Phase 1: PDF generation and prescription storage are disabled"
      notes={[
        'No Supabase reads/writes from the doctor prescriptions portal in Phase 1.',
        'PDF generate/view/download is Phase 2 (Supabase Storage + signed URLs + RLS).',
      ]}
    />
  );
}
