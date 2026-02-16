import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAudFromCents } from '@/lib/money';
import { DOCTOR_FEE_CENTS_PER_CONSULT } from '@/config/fees';
import { doctorPayoutService } from '@/services/doctorPayoutService';
import { DollarSign } from 'lucide-react';

export function PaymentsCard(props: { doctorId: string; bookingId: string }) {
  const { doctorId, bookingId } = props;

  const isPaid = doctorPayoutService.isBookingPaid(doctorId, bookingId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Payment (Mock)
        </CardTitle>
        <CardDescription>Phase 1: tracked locally; Phase 2 will use Stripe payouts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Consult fee</span>
          <span className="font-medium">{formatAudFromCents(DOCTOR_FEE_CENTS_PER_CONSULT)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Payout status</span>
          <Badge variant={isPaid ? 'default' : 'outline'}>{isPaid ? 'Paid' : 'Pending'}</Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (isPaid) doctorPayoutService.markBookingUnpaid(doctorId, bookingId);
            else doctorPayoutService.markBookingPaid(doctorId, bookingId);
          }}
        >
          Toggle paid/pending
        </Button>
      </CardContent>
    </Card>
  );
}
