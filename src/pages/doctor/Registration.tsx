import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorRegistration() {
  return (
    <DoctorPhase1Stub
      title="Doctor Registration"
      description="Phase 1: registration flow is disabled"
      notes={['Phase 2 will wire registration to Supabase with verification and approval workflow.']}
    />
  );
}
