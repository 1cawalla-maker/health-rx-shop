import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorEarningsService, type EarningsLineItem } from '@/services/doctorEarningsService';
import { doctorPayoutService } from '@/services/doctorPayoutService';
import { doctorPayoutProfileService } from '@/services/doctorPayoutProfileService';
import { userProfileService } from '@/services/userProfileService';
import { formatAudFromCents } from '@/lib/money';
import { formatAbn } from '@/lib/abnValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Calendar, DollarSign, Clock, Landmark, ArrowRight, X } from 'lucide-react';

/* ── Week helpers ── */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // shift to Mon start
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
  const ws = getWeekStart(date);
  return ws.toISOString().slice(0, 10);
}

function formatRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function isCurrentWeek(ws: Date): boolean {
  const now = new Date();
  const currentWs = getWeekStart(now);
  return ws.getTime() === currentWs.getTime();
}

/* ── Types ── */
type WeekGroup = {
  weekStart: Date;
  weekEnd: Date;
  label: string;
  lines: (EarningsLineItem & { isPaid: boolean })[];
  paidCents: number;
  pendingCents: number;
  paidCount: number;
  pendingCount: number;
};

function maskAccount(acc: string): string {
  if (!acc || acc.length < 3) return acc;
  return '•'.repeat(acc.length - 3) + acc.slice(-3);
}

export default function DoctorEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<EarningsLineItem[]>([]);
  const [summary, setSummary] = useState({ totalCents: 0, pendingCents: 0, paidCents: 0, pendingCount: 0, paidCount: 0 });
  const [drawerWeek, setDrawerWeek] = useState<string | null>(null);

  const refresh = () => {
    if (!user?.id) return;
    const earnings = doctorEarningsService.getEarnings(user.id);
    setLines(earnings.lines);
    setSummary(doctorPayoutService.getPayoutSummary(user.id));
  };

  useEffect(() => { refresh(); }, [user?.id]);

  /* ── Group lines by week ── */
  const weeks = useMemo((): WeekGroup[] => {
    if (!user?.id) return [];
    const map = new Map<string, WeekGroup>();
    for (const l of lines) {
      const d = new Date(l.scheduledAtIso);
      const key = weekKey(d);
      if (!map.has(key)) {
        const ws = getWeekStart(d);
        const we = getWeekEnd(ws);
        map.set(key, {
          weekStart: ws,
          weekEnd: we,
          label: formatRange(ws, we),
          lines: [],
          paidCents: 0,
          pendingCents: 0,
          paidCount: 0,
          pendingCount: 0,
        });
      }
      const g = map.get(key)!;
      const isPaid = doctorPayoutService.isBookingPaid(user.id, l.bookingId);
      g.lines.push({ ...l, isPaid });
      if (isPaid) { g.paidCents += l.feeCents; g.paidCount++; }
      else { g.pendingCents += l.feeCents; g.pendingCount++; }
    }
    return Array.from(map.values()).sort(
      (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
    );
  }, [lines, user?.id]);

  const currentWeek = weeks.find((w) => isCurrentWeek(w.weekStart));
  const activeDrawerWeek = drawerWeek ? weeks.find((w) => weekKey(w.weekStart) === drawerWeek) : null;

  /* ── Payout profile ── */
  const payout = useMemo(() => {
    if (!user?.id) return null;
    return doctorPayoutProfileService.getProfile(user.id);
  }, [user?.id]);

  /* ── Patient name resolution ── */
  const resolvePatientName = (patientId: string): string => {
    const profile = userProfileService.getProfile(patientId);
    return profile?.fullName || patientId.slice(0, 8);
  };

  /* ── Drawer actions ── */
  const markWeekPaid = () => {
    if (!user?.id || !activeDrawerWeek) return;
    for (const l of activeDrawerWeek.lines) {
      if (!l.isPaid) doctorPayoutService.markBookingPaid(user.id, l.bookingId);
    }
    refresh();
  };

  const markWeekPending = () => {
    if (!user?.id || !activeDrawerWeek) return;
    for (const l of activeDrawerWeek.lines) {
      if (l.isPaid) doctorPayoutService.markBookingUnpaid(user.id, l.bookingId);
    }
    refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground mt-1">Weekly payouts · Track paid and pending consultations</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentWeek ? (
              <>
                <p className="text-2xl font-bold">{formatAudFromCents(currentWeek.paidCents + currentWeek.pendingCents)}</p>
                <p className="text-xs text-muted-foreground">
                  {currentWeek.lines.length} consult(s) · {formatAudFromCents(currentWeek.pendingCents)} pending
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No consultations this week</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAudFromCents(summary.pendingCents)}</p>
            <p className="text-xs text-muted-foreground">{summary.pendingCount} consult(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAudFromCents(summary.paidCents)}</p>
            <p className="text-xs text-muted-foreground">{summary.paidCount} consult(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Weekly List ── */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Breakdown</CardTitle>
          <CardDescription>Click a week to view individual consultations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {weeks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billable consultations yet.</p>
          ) : (
            weeks.map((w) => {
              const key = weekKey(w.weekStart);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium">
                      {w.label}
                      {isCurrentWeek(w.weekStart) && (
                        <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                      )}
                    </p>
                    <p className="text-muted-foreground">
                      {w.lines.length} consult(s) · Paid {formatAudFromCents(w.paidCents)} · Pending {formatAudFromCents(w.pendingCents)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setDrawerWeek(key)}
                  >
                    View details
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── Payout Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            Payout Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payout ? (
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">ABN:</span> <span className="font-medium">{formatAbn(payout.abn)}</span></div>
              <div><span className="text-muted-foreground">Entity:</span> <span className="font-medium">{payout.entityName}</span></div>
              <div><span className="text-muted-foreground">Remittance Email:</span> <span className="font-medium">{payout.remittanceEmail}</span></div>
              <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">BSB {payout.bsb} · Acc {maskAccount(payout.accountNumber)}</span></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payout details saved.</p>
          )}
          <Button
            variant="link"
            size="sm"
            className="mt-2 px-0"
            onClick={() => navigate('/doctor/account')}
          >
            Edit payout details →
          </Button>
        </CardContent>
      </Card>

      {/* ── Week Details Drawer ── */}
      <Drawer open={!!drawerWeek} onOpenChange={(open) => { if (!open) setDrawerWeek(null); }}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-start justify-between">
            <div>
              <DrawerTitle>{activeDrawerWeek?.label ?? 'Week Details'}</DrawerTitle>
              <DrawerDescription>
                {activeDrawerWeek
                  ? `${activeDrawerWeek.lines.length} consultation(s) · ${formatAudFromCents(activeDrawerWeek.paidCents + activeDrawerWeek.pendingCents)} total`
                  : ''}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Actions */}
            {activeDrawerWeek && activeDrawerWeek.lines.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={markWeekPaid}>Mark all as paid</Button>
                <Button size="sm" variant="outline" onClick={markWeekPending}>Mark all as pending</Button>
              </div>
            )}

            {/* Consult rows */}
            <div className="space-y-2">
              {activeDrawerWeek?.lines.map((l) => (
                <div key={l.bookingId} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium">{resolvePatientName(l.patientId)}</p>
                    <p className="text-muted-foreground">
                      {new Date(l.scheduledAtIso).toLocaleString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <Badge variant="outline" className="text-xs capitalize">{l.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-medium">{formatAudFromCents(l.feeCents)}</p>
                    <Badge variant={l.isPaid ? 'default' : 'outline'}>{l.isPaid ? 'Paid' : 'Pending'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
