import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorEarningsService } from '@/services/doctorEarningsService';
import { doctorPayoutService } from '@/services/doctorPayoutService';
import { formatAudFromCents } from '@/lib/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

export default function DoctorEarnings() {
  const { user } = useAuth();
  const [lines, setLines] = useState(() => [] as ReturnType<typeof doctorEarningsService.getEarnings>['lines']);
  const [summary, setSummary] = useState(() => ({ totalCents: 0, pendingCents: 0, paidCents: 0, pendingCount: 0, paidCount: 0 }));

  const refresh = () => {
    if (!user?.id) return;
    const earnings = doctorEarningsService.getEarnings(user.id);
    setLines(earnings.lines);
    setSummary(doctorPayoutService.getPayoutSummary(user.id));
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const rows = useMemo(() => {
    if (!user?.id) return [];
    return lines.map((l) => ({
      ...l,
      isPaid: doctorPayoutService.isBookingPaid(user.id, l.bookingId),
    }));
  }, [lines, user?.id]);

  const markAllPaid = () => {
    if (!user?.id) return;
    doctorPayoutService.markAllPaid(user.id);
    refresh();
  };

  const togglePaid = (bookingId: string, next: boolean) => {
    if (!user?.id) return;
    if (next) doctorPayoutService.markBookingPaid(user.id, bookingId);
    else doctorPayoutService.markBookingUnpaid(user.id, bookingId);
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Earnings (Mock)</h1>
          <p className="text-muted-foreground mt-1">Phase 1: paid per appointment; payouts tracked weekly (mock)</p>
        </div>
        <Button variant="outline" onClick={markAllPaid} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Mark all as paid
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{formatAudFromCents(summary.totalCents)}</p>
              <p className="text-xs text-muted-foreground">AUD</p>
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAudFromCents(summary.pendingCents)}</p>
            <p className="text-xs text-muted-foreground">{summary.pendingCount} consult(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAudFromCents(summary.paidCents)}</p>
            <p className="text-xs text-muted-foreground">{summary.paidCount} consult(s)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Ledger (Mock)</CardTitle>
          <CardDescription>
            Toggle paid/unpaid per consult. Phase 2 will be backed by Stripe payouts + an auditable ledger (Supabase).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No paid consults yet (completed + no answer are paid).</p>
          ) : (
            rows.map((l) => (
              <div key={l.bookingId} className="flex items-center justify-between border rounded-lg p-3">
                <div className="text-sm">
                  <p className="font-medium">Booking {l.bookingId}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(l.scheduledAtIso).toLocaleString('en-AU')}
                  </p>
                  <p className="text-xs text-muted-foreground">Patient: {l.patientId}</p>
                  <p className="text-xs text-muted-foreground capitalize">Status: {l.status}</p>
                </div>
                <div className="text-right space-y-2">
                  <p className="font-medium">{formatAudFromCents(l.feeCents)}</p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant={l.isPaid ? 'default' : 'outline'}>{l.isPaid ? 'Paid' : 'Pending'}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePaid(l.bookingId, !l.isPaid)}
                    >
                      Toggle
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
