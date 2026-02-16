import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorAvailability() {
  return (
    <DoctorPhase1Stub
      title="Availability"
      description="Phase 1: doctor availability management is disabled"
      notes={['Phase 2 will wire schedule/availability to Supabase with per-doctor access controls.']}
    />
  );
}
