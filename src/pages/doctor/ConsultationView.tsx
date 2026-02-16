import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorConsultationView() {
  return (
    <DoctorPhase1Stub
      title="Consultation View"
      description="Phase 1: consultation runtime tooling is disabled"
      notes={['Phase 2 will wire live consult tooling + notes + outcomes to Supabase with audit logging.']}
    />
  );
}
