import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorEarningsService } from '@/services/doctorEarningsService';
import { formatAudFromCents } from '@/lib/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';

export default function DoctorEarnings() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(() => ({ consultCount: 0, totalCents: 0, lines: [] as any[] }));

  useEffect(() => {
    if (!user?.id) return;
    setSummary(doctorEarningsService.getEarnings(user.id));
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Earnings (Mock)</h1>
        <p className="text-muted-foreground mt-1">Phase 1: derived from completed/no-answer bookings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            <CardTitle className="text-sm font-medium">Paid Consults</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{summary.consultCount}</p>
              <p className="text-xs text-muted-foreground">Completed + No Answer (paid)</p>
            </div>
            <Badge variant="outline">Mock</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Ledger (Mock)</CardTitle>
          <CardDescription>
            In Phase 2 this will be backed by Stripe payouts + an auditable ledger (Supabase).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No paid consults yet.</p>
          ) : (
            summary.lines.map((l) => (
              <div key={l.bookingId} className="flex items-center justify-between border rounded-lg p-3">
                <div className="text-sm">
                  <p className="font-medium">Booking {l.bookingId}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(l.scheduledAtIso).toLocaleString('en-AU')}
                  </p>
                  <p className="text-xs text-muted-foreground">Patient: {l.patientId}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatAudFromCents(l.feeCents)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{l.status}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
