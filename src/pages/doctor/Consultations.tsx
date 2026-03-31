import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorPortalService } from '@/services/doctorPortalService';
import { consultationsSupabaseService } from '@/services/consultationsSupabaseService';
import type { Database } from '@/integrations/supabase/types';
import { userPreferencesService } from '@/services/userPreferencesService';
import { getTimezoneAbbr } from '@/lib/datetime';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Phone, ExternalLink } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { CountdownChip } from '@/components/bookings/CountdownChip';
import type { MockBooking, BookingStatus } from '@/types/telehealth';
import { toast } from 'sonner';

const TERMINAL: BookingStatus[] = ['completed', 'no_answer', 'cancelled'];

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending_payment: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Pending Payment' },
    booked: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Booked' },
    in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'In Progress' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Completed' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Cancelled' },
    no_answer: { bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'No Answer' },
  };
  const s = map[status];
  if (!s) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={`${s.bg} ${s.text} border-${s.text.replace('text-', '')}/20`}>{s.label}</Badge>;
};

export default function DoctorConsultations() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const doctorTz = useMemo(() => user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane', [user?.id]);

  type ConsultationRow = Database['public']['Tables']['consultations']['Row'];

  const refresh = async () => {
    if (!user?.id) return;

    try {
      // Phase 2: load from Supabase so bookings created by patients are visible.
      const rows: ConsultationRow[] = await consultationsSupabaseService.listForDoctorAssigned(user.id);

      // Map to existing MockBooking shape used by the UI.
      const mapped: MockBooking[] = rows.map((r) => {
        // scheduled_at is timestamptz. Supabase usually returns ISO, but be defensive.
        const scheduledIso = String(r.scheduled_at).includes('T')
          ? String(r.scheduled_at)
          : String(r.scheduled_at).replace(' ', 'T');
        const scheduled = new Date(scheduledIso);

        const yyyy = scheduled.getFullYear();
        const mm = String(scheduled.getMonth() + 1).padStart(2, '0');
        const dd = String(scheduled.getDate()).padStart(2, '0');
        const hh = String(scheduled.getHours()).padStart(2, '0');
        const min = String(scheduled.getMinutes()).padStart(2, '0');

        // Rough mapping: consultation_status -> booking_status-ish string for badges
        const status = ((): any => {
          if (r.status === 'cancelled') return 'cancelled';
          if (r.status === 'completed') return 'completed';
          if (r.status === 'confirmed') return 'booked';
          if (r.status === 'called' || r.status === 'ready_for_call') return 'in_progress';
          // requested/intake_pending/etc.
          return 'pending_payment';
        })();

        return {
          id: r.id,
          patientId: r.patient_id,
          doctorId: r.doctor_id,
          doctorName: null,
          scheduledDate: `${yyyy}-${mm}-${dd}`,
          timeWindowStart: `${hh}:${min}`,
          timeWindowEnd: `${hh}:${min}`,
          utcTimestamp: scheduled.toISOString(),
          displayTimezone: r.timezone || 'Australia/Brisbane',
          status,
          amountPaid: null,
          paidAt: null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          reservationId: null,
          callAttempts: [],
        } as any;
      });

      setBookings(mapped);
    } catch (err) {
      console.error('Failed to load consultations from Supabase:', err);
      if (import.meta.env.DEV) {
        setBookings(doctorPortalService.getDoctorBookings(user.id));
      } else {
        toast.error('Could not load consultations');
        setBookings([]);
      }
    }
  };

  useEffect(() => { void refresh(); }, [user?.id]);

  const rows = useMemo(() =>
    bookings.map((b) => ({
      ...b,
      scheduledAt: new Date(`${b.scheduledDate}T${b.timeWindowStart}:00`),
    })),
    [bookings]
  );

  const upcoming = rows
    .filter((r) => !isPast(r.scheduledAt) && !TERMINAL.includes(r.status))
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const past = rows
    .filter((r) => isPast(r.scheduledAt) || TERMINAL.includes(r.status))
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  const handleCancel = () => {
    if (!cancelTarget || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    const result = doctorPortalService.cancelBooking(cancelTarget, cancelReason);
    if (result) {
      toast.success('Consultation cancelled');
      setCancelTarget(null);
      setCancelReason('');
      refresh();
    } else {
      toast.error('Could not cancel — may already be in a terminal state');
    }
  };

  const ConsultCard = ({ b }: { b: typeof rows[0] }) => {
    const isTerminal = TERMINAL.includes(b.status);
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Phone Consultation</h3>
                  {statusBadge(b.status)}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(b.scheduledAt, 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(b.scheduledAt, 'h:mm a')} {getTimezoneAbbr(b.scheduledAt, doctorTz)}
                  </span>
                  {!isTerminal && <CountdownChip targetMs={b.scheduledAt.getTime()} />}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Patient ID: {b.patientId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/doctor/consultation/${b.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Link>
              </Button>
              {!isTerminal && (
                <Button variant="outline" size="sm" onClick={() => { setCancelTarget(b.id); setCancelReason(''); }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Consultations</h1>
        <p className="text-muted-foreground mt-1">Phone consultation queue · Times shown in {doctorTz}</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length ? (
            <div className="space-y-4">{upcoming.map((b) => <ConsultCard key={b.id} b={b} />)}</div>
          ) : (
            <Card><CardHeader className="text-center"><CardTitle className="text-lg">No upcoming consultations</CardTitle><CardDescription>Booked consultations will appear here.</CardDescription></CardHeader></Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {past.length ? (
            <div className="space-y-4">{past.map((b) => <ConsultCard key={b.id} b={b} />)}</div>
          ) : (
            <Card><CardHeader className="text-center"><CardTitle className="text-lg">No past consultations</CardTitle><CardDescription>Completed and cancelled consultations will appear here.</CardDescription></CardHeader></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Consultation</DialogTitle>
            <DialogDescription>Please provide a reason for cancelling this consultation. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancelReason">Reason</Label>
            <Textarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g. Patient requested reschedule" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Back</Button></DialogClose>
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason.trim()}>Confirm Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
