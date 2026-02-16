import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorDashboard() {
  return (
    <DoctorPhase1Stub
      title="Doctor Dashboard"
      description="Phase 1: doctor portal is UI-only"
      notes={['Doctor KPIs, booking queues, and patient data will be wired in Phase 2 (Supabase + RLS).']}
    />
  );
}
