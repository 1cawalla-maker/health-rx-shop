import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorPayslipService, type Payslip } from '@/services/doctorPayslipService';
import { doctorPayoutProfileService } from '@/services/doctorPayoutProfileService';
import { formatAudFromCents } from '@/lib/money';
import { formatAbn } from '@/lib/abnValidation';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PayslipPrint() {
  const { payslipId } = useParams<{ payslipId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [abn, setAbn] = useState('');

  useEffect(() => {
    if (!user?.id || !payslipId) return;
    const p = doctorPayslipService.getPayslip(user.id, payslipId);
    setPayslip(p);
    setDoctorName(user.user_metadata?.full_name || 'Doctor');

    const payout = doctorPayoutProfileService.getProfile(user.id);
    if (payout?.abn) setAbn(formatAbn(payout.abn));
  }, [user?.id, payslipId]);

  if (!payslip) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Payslip not found.</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/doctor/earnings')}>
          <ArrowLeft className="h-4 w-4" />Back to Earnings
        </Button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          body { margin: 0; padding: 0; }
          .print-page { box-shadow: none !important; border: none !important; padding: 2rem !important; }
        }
      `}</style>

      <div className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="print-hide max-w-3xl mx-auto mb-4 flex items-center justify-between">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/doctor/earnings')}>
            <ArrowLeft className="h-4 w-4" />Back
          </Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />Print
          </Button>
        </div>

        <div className="print-page max-w-3xl mx-auto bg-background rounded-xl border border-border shadow-sm p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-bold font-display">Payslip</h1>
              <p className="text-lg text-muted-foreground">{payslip.periodLabel}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Generated: {new Date(payslip.createdAtUtc).toLocaleDateString('en-AU')}</p>
            </div>
          </div>

          <div className="text-sm space-y-1">
            <p><span className="font-medium">Doctor:</span> {doctorName}</p>
            {abn && <p><span className="font-medium">ABN:</span> {abn}</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Fee</th>
                </tr>
              </thead>
              <tbody>
                {payslip.lines.map((line) => (
                  <tr key={line.bookingId} className="border-b border-border/50">
                    <td className="py-2">{new Date(line.scheduledAtIso).toLocaleDateString('en-AU')}</td>
                    <td className="py-2 font-mono text-xs">{line.bookingId.slice(0, 8)}</td>
                    <td className="py-2 font-mono text-xs">{line.patientId.slice(0, 8)}</td>
                    <td className="py-2 capitalize">{line.status.replace('_', ' ')}</td>
                    <td className="py-2 text-right">{formatAudFromCents(line.feeCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Total consultations: <span className="font-medium text-foreground">{payslip.consultCount}</span>
            </div>
            <div className="text-lg font-bold">
              Total: {formatAudFromCents(payslip.grossCents)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
