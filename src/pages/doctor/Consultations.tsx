import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorConsultations() {
  return (
    <DoctorPhase1Stub
      title="Consultations"
      description="Phase 1: consultation list is disabled"
      notes={['Phase 2 will wire consult list + notes + completion workflow.']}
    />
  );
}
