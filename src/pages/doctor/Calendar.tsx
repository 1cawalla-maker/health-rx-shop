import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorCalendar() {
  return (
    <DoctorPhase1Stub
      title="Calendar"
      description="Phase 1: calendar sync/view is disabled"
      notes={['Phase 2 will wire calendar view to doctor bookings with strict auth.']}
    />
  );
}
