import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorBookings() {
  return (
    <DoctorPhase1Stub
      title="Bookings"
      description="Phase 1: doctor booking queue is disabled"
      notes={['Phase 2 will wire booking queue + status updates via Supabase with correct authorization.']}
    />
  );
}
