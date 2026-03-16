import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorEarningsService, type EarningsLineItem } from '@/services/doctorEarningsService';
import { doctorRemittanceService, type RemittanceEntry } from '@/services/doctorRemittanceService';
import { formatAudFromCents } from '@/lib/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, ExternalLink } from 'lucide-react';

/* ── Week helpers ── */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function weekKey(date: Date): string {
  return getWeekStart(date).toISOString().slice(0, 10);
}

function formatRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

/* ── Types ── */
type WeekRow = {
  weekStartKey: string;
  weekStart: Date;
  weekEnd: Date;
  label: string;
  totalCents: number;
  remittance: RemittanceEntry | null;
};

export default function DoctorEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<EarningsLineItem[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const earnings = doctorEarningsService.getEarnings(user.id);
    setLines(earnings.lines);
  }, [user?.id]);

  const weeks = useMemo((): WeekRow[] => {
    if (!user?.id) return [];
    const map = new Map<string, { ws: Date; we: Date; totalCents: number }>();
    for (const l of lines) {
      const d = new Date(l.scheduledAtIso);
      const key = weekKey(d);
      if (!map.has(key)) {
        const ws = getWeekStart(d);
        map.set(key, { ws, we: getWeekEnd(ws), totalCents: 0 });
      }
      map.get(key)!.totalCents += l.feeCents;
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({
        weekStartKey: key,
        weekStart: v.ws,
        weekEnd: v.we,
        label: formatRange(v.ws, v.we),
        totalCents: v.totalCents,
        remittance: doctorRemittanceService.getRemittance(user.id, key),
      }))
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [lines, user?.id]);

  const outstandingCents = useMemo(
    () => weeks.filter((w) => !w.remittance).reduce((sum, w) => sum + w.totalCents, 0),
    [weeks],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Earnings</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/doctor/account')}>
          View payout details
        </Button>
      </div>

      {/* Outstanding KPI */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Outstanding (owed)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatAudFromCents(outstandingCents)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Total across {weeks.filter((w) => !w.remittance).length} pending week(s)
          </p>
        </CardContent>
      </Card>

      {/* Weekly remittances */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Remittances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {weeks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billable consultations yet.</p>
          ) : (
            weeks.map((w) => (
              <div
                key={w.weekStartKey}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="text-sm space-y-0.5">
                  <p className="font-medium">{w.label}</p>
                  <p className="text-muted-foreground">{formatAudFromCents(w.totalCents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {w.remittance ? (
                    <>
                      <Badge variant="default">Paid</Badge>
                      <a
                        href={w.remittance.remittanceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View remittance
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline">Pending</Badge>
                      <span className="text-xs text-muted-foreground">Not issued yet</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
