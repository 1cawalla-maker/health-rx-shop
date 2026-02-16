import { DoctorPhase1Stub } from '@/components/doctor/Phase1Stub';

export default function DoctorEarnings() {
  return (
    <DoctorPhase1Stub
      title="Earnings"
      description="Phase 1: payouts/earnings are disabled"
      notes={['Phase 2 will wire earnings to Stripe payout data.']}
    />
  );
}
