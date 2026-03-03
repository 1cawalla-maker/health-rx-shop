import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorEarningsService } from '@/services/doctorEarningsService';
import { doctorPayoutService } from '@/services/doctorPayoutService';
import { doctorPayslipService, type Payslip } from '@/services/doctorPayslipService';
import { formatAudFromCents } from '@/lib/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, CheckCircle2, FileText, ExternalLink } from 'lucide-react';

export default function DoctorEarnings() {
  const { user } = useAuth();
  const [lines, setLines] = useState(() => [] as ReturnType<typeof doctorEarningsService.getEarnings>['lines']);
  const [summary, setSummary] = useState(() => ({ totalCents: 0, pendingCents: 0, paidCents: 0, pendingCount: 0, paidCount: 0 }));
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  // Payslip generation
  const now = new Date();
  const [payslipYear, setPayslipYear] = useState(String(now.getFullYear()));
  const [payslipMonth, setPayslipMonth] = useState(String(now.getMonth() + 1));

  const refresh = () => {
    if (!user?.id) return;
    const earnings = doctorEarningsService.getEarnings(user.id);
    setLines(earnings.lines);
    setSummary(doctorPayoutService.getPayoutSummary(user.id));
    setPayslips(doctorPayslipService.getPayslips(user.id));
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

  const generatePayslip = () => {
    if (!user?.id) return;
    doctorPayslipService.generatePayslip(user.id, Number(payslipYear), Number(payslipMonth));
    refresh();
  };

  const MONTHS = [
    { v: '1', l: 'January' }, { v: '2', l: 'February' }, { v: '3', l: 'March' },
    { v: '4', l: 'April' }, { v: '5', l: 'May' }, { v: '6', l: 'June' },
    { v: '7', l: 'July' }, { v: '8', l: 'August' }, { v: '9', l: 'September' },
    { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Earnings</h1>
          <p className="text-muted-foreground mt-1">Paid per appointment. Payments are processed weekly.</p>
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
          <CardTitle>Payout Ledger</CardTitle>
          <CardDescription>
            Track payment status for each completed consultation.
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

      {/* Payslips section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payslips
          </CardTitle>
          <CardDescription>Generate and view monthly payslip summaries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Month</label>
              <Select value={payslipMonth} onValueChange={setPayslipMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Year</label>
              <Select value={payslipYear} onValueChange={setPayslipYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generatePayslip} variant="outline">Generate Payslip</Button>
          </div>

          {payslips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payslips generated yet.</p>
          ) : (
            <div className="space-y-2">
              {payslips.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="text-sm">
                    <p className="font-medium">{p.periodLabel}</p>
                    <p className="text-muted-foreground">{p.consultCount} consult(s) · {formatAudFromCents(p.totalCents)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => window.open(`/doctor/payslips/${p.id}/print`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
