import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorPatients() {
  return (
    <DoctorPhase1Stub
      title="Patients"
      description="Phase 1: patient list/history is disabled"
      notes={['Patient history and medical files access will be implemented in Phase 2 with strict RLS.']}
    />
  );
}
