import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorPatientDetail() {
  return (
    <DoctorPhase1Stub
      title="Patient Detail"
      description="Phase 1: medical history and files are disabled"
      notes={[
        'Phase 2 will include patient history, notes, and files with strict per-doctor access controls.',
      ]}
    />
  );
}
