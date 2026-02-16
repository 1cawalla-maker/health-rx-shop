import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorPending() {
  return (
    <DoctorPhase1Stub
      title="Pending Approval"
      description="Phase 1: approval workflow is disabled"
      notes={['Phase 2 will wire doctor approval via secure admin workflow (no self-approval).']}
    />
  );
}
