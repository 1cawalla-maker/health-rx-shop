import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorBookingDetail() {
  return (
    <DoctorPhase1Stub
      title="Booking Detail"
      description="Phase 1: doctor booking management and prescription issuance are disabled"
      notes={[
        'No Supabase reads/writes from this screen in Phase 1.',
        'Prescription issuance + PDF generation will be enabled in Phase 2.',
      ]}
    />
  );
}
