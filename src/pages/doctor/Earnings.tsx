import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Loader2,
  FileText
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface EarningsSummary {
  currentMonth: number;
  lastMonth: number;
  totalConsultations: number;
  pendingPayout: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  consultationCount: number;
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'processing' | 'paid';
  paidAt?: string;
}

const CONSULTATION_FEE = 49; // Base fee per consultation
const DOCTOR_SHARE = 35; // Doctor's share per consultation

export default function DoctorEarnings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary>({
    currentMonth: 0,
    lastMonth: 0,
    totalConsultations: 0,
    pendingPayout: 0
  });
  const [payouts] = useState<PayoutRecord[]>([
    // Placeholder data - would come from Supabase
  ]);

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    if (!user) return;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Fetch completed consultations for current month
    const { data: currentMonthData } = await supabase
      .from('consultations')
      .select('id')
      .eq('doctor_id', user.id)
      .in('status', ['completed', 'script_uploaded'])
      .gte('scheduled_at', currentMonthStart.toISOString())
      .lte('scheduled_at', currentMonthEnd.toISOString());

    // Fetch completed consultations for last month
    const { data: lastMonthData } = await supabase
      .from('consultations')
      .select('id')
      .eq('doctor_id', user.id)
      .in('status', ['completed', 'script_uploaded'])
      .gte('scheduled_at', lastMonthStart.toISOString())
      .lte('scheduled_at', lastMonthEnd.toISOString());

    // Fetch total consultations
    const { count: totalCount } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .in('status', ['completed', 'script_uploaded']);

    const currentMonthConsults = currentMonthData?.length || 0;
    const lastMonthConsults = lastMonthData?.length || 0;

    setSummary({
      currentMonth: currentMonthConsults * DOCTOR_SHARE,
      lastMonth: lastMonthConsults * DOCTOR_SHARE,
      totalConsultations: totalCount || 0,
      pendingPayout: currentMonthConsults * DOCTOR_SHARE
    });

    setLoading(false);
  };

  const getStatusBadge = (status: PayoutRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Processing</Badge>;
      case 'paid':
        return <Badge className="bg-success/10 text-success border-success/20">Paid</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground mt-1">Track your consultation earnings and payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${summary.currentMonth.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(summary.currentMonth / DOCTOR_SHARE)} consultations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${summary.lastMonth.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(summary.lastMonth / DOCTOR_SHARE)} consultations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalConsultations}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">${summary.pendingPayout.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Current period</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
          <CardDescription>
            How earnings and payouts work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Consultation Rate</h4>
              <p className="text-sm text-muted-foreground">
                You earn <strong>${DOCTOR_SHARE} AUD</strong> per completed consultation, 
                regardless of the prescription outcome.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Payment Schedule</h4>
              <p className="text-sm text-muted-foreground">
                Payouts are processed on the 1st and 15th of each month for the 
                previous period's completed consultations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your recent payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No payout records yet</p>
              <p className="text-sm">Complete consultations to start earning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map(payout => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {format(new Date(payout.periodStart), 'MMM d')} - {format(new Date(payout.periodEnd), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payout.consultationCount} consultations
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${payout.amount.toFixed(2)}</p>
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
