import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorPortalService } from '@/services/doctorPortalService';
import { consultationsSupabaseService } from '@/services/consultationsSupabaseService';
import { callAttemptsSupabaseService } from '@/services/callAttemptsSupabaseService';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { supabase } from '@/integrations/supabase/client';
import { getTimezoneAbbr } from '@/lib/datetime';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EligibilityQuizCard } from '@/components/doctor/EligibilityQuizCard';
import { MedicationGuideCard } from '@/components/doctor/MedicationGuideCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calendar, Clock, Phone, Plus, CheckCircle, XCircle, AlertCircle, FileText, PhoneOff, Copy, User } from 'lucide-react';
import { format } from 'date-fns';
import type { BookingStatus, MockBooking } from '@/types/telehealth';

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
  return <Badge className={`${s.bg} ${s.text}`}>{s.label}</Badge>;
};

function formatPhoneDisplay(phoneE164: string): string {
  // Expect +614XXXXXXXX or 04XXXXXXXX or raw digits
  const digits = phoneE164.replace(/\D/g, '');
  if (digits.startsWith('61') && digits.length >= 11) {
    const local = digits.slice(2);
    return `+61 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+61 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 9 && digits.startsWith('4')) {
    return `+61 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phoneE164;
}

export default function DoctorConsultationView() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<MockBooking | null>(null);
  const [consultSource, setConsultSource] = useState<'mock' | 'supabase' | null>(null);
  const [callNote, setCallNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [maxStrength, setMaxStrength] = useState<3 | 6 | 9>(6);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [prescriptionIssued, setPrescriptionIssued] = useState(false);

  const doctorTz = useMemo(() => user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane', [user?.id]);

  const reload = async () => {
    if (!id) return;

    // Phase 2: load from Supabase consultations first.
    // IMPORTANT: The patient booking flow uses mockBookingService to generate an id that is also
    // used as the Supabase consultation id. That means the same id may exist in localStorage,
    // but with a mock doctorId (e.g. "mock-doc-1") which would incorrectly fail doctor access.
    try {
      const row = await consultationsSupabaseService.getById(id);
      if (row) {
        const scheduled = new Date(String(row.scheduled_at).includes('T') ? String(row.scheduled_at) : String(row.scheduled_at).replace(' ', 'T'));
        const yyyy = scheduled.getFullYear();
        const mm = String(scheduled.getMonth() + 1).padStart(2, '0');
        const dd = String(scheduled.getDate()).padStart(2, '0');
        const hh = String(scheduled.getHours()).padStart(2, '0');
        const min = String(scheduled.getMinutes()).padStart(2, '0');

        // Map consultation_status to BookingStatus-like string used by this page.
        const status = ((): any => {
          if (row.status === 'cancelled') return 'cancelled';
          if (row.status === 'completed') return 'completed';
          if (row.status === 'confirmed') return 'booked';
          if (row.status === 'called') return 'in_progress';
          return 'pending_payment';
        })();

        // Load call attempts (Supabase)
        let callAttempts: any[] = [];
        try {
          const attempts = await callAttemptsSupabaseService.listForConsultation(row.id);
          callAttempts = (attempts || []).map((a) => ({
            id: a.id,
            attemptNumber: a.attempt_number,
            attemptedAt: a.attempted_at,
            answered: Boolean(a.answered),
            notes: a.notes ?? undefined,
          }));
        } catch (e) {
          console.error('Failed to load call attempts from Supabase:', e);
          callAttempts = [];
        }

        setBooking({
          id: row.id,
          patientId: row.patient_id,
          doctorId: row.doctor_id,
          doctorName: null,
          scheduledDate: `${yyyy}-${mm}-${dd}`,
          timeWindowStart: `${hh}:${min}`,
          timeWindowEnd: `${hh}:${min}`,
          utcTimestamp: scheduled.toISOString(),
          displayTimezone: row.timezone || 'Australia/Brisbane',
          status,
          amountPaid: null,
          paidAt: null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          reservationId: null,
          callAttempts,
        } as any);
        setConsultSource('supabase');
        return;
      }
    } catch (err) {
      console.error('Failed to load consultation from Supabase:', err);
      // fall through to local
    }

    // Phase 1 fallback: local mock booking (only if no Supabase row exists)
    const local = doctorPortalService.getBooking(id);
    if (local) {
      setBooking(local);
      setConsultSource('mock');
      return;
    }

    setBooking(null);
    setConsultSource(null);
    return;
  };

  useEffect(() => { void reload(); }, [id]);

  // Load consult notes on mount
  useEffect(() => {
    if (id) setConsultNotes(doctorPortalService.getConsultNotes(id));
  }, [id]);

  // Access rules:
  // - If a consultation is already assigned (doctorId set), only that doctor can open it.
  // - If it's unassigned (doctorId null), allow any authenticated doctor to open it (queue triage).
  const isDoctor = userRole?.role === 'doctor';
  const hasAccess = Boolean(user?.id && booking && isDoctor && (!booking.doctorId || booking.doctorId === user.id));
  const isTerminal = booking ? TERMINAL.includes(booking.status) : false;

  const [patientProfile, setPatientProfile] = useState<{
    fullName: string | null;
    phoneE164: string | null;
    dateOfBirth: string | null;
  } | null>(null);

  const [intakePhone, setIntakePhone] = useState<string | null>(null);

  // Patient identity + phone (Supabase)
  useEffect(() => {
    const run = async () => {
      if (!booking?.patientId) {
        setPatientProfile(null);
        setIntakePhone(null);
        return;
      }

      // 1) Core identity from profiles (name/phone/dob)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, date_of_birth')
          .eq('user_id', booking.patientId)
          .maybeSingle();

        if (error) throw error;

        setPatientProfile({
          fullName: (data as any)?.full_name ?? null,
          phoneE164: (data as any)?.phone ?? null,
          dateOfBirth: (data as any)?.date_of_birth ?? null,
        });
      } catch (err) {
        console.error('Failed to load patient profile:', err);
        setPatientProfile(null);
      }

      // 2) Fallback phone from intake (often captured earlier than profile phone)
      try {
        if (!id) { setIntakePhone(null); return; }
        const { data, error } = await supabase
          .from('intake_forms')
          .select('phone_number')
          .eq('booking_id', id)
          .maybeSingle();

        if (error) throw error;
        setIntakePhone((data as any)?.phone_number ?? null);
      } catch (err) {
        console.error('Failed to load intake phone:', err);
        setIntakePhone(null);
      }
    };

    void run();
  }, [booking?.patientId, id]);

  const scheduledAt = useMemo(() => {
    if (!booking) return null;
    return new Date(`${booking.scheduledDate}T${booking.timeWindowStart}:00`);
  }, [booking]);

  const activeRx = useMemo(() => {
    if (!booking) return null;
    return shopPrescriptionService.getActivePrescription(booking.patientId);
  }, [booking]);

  const unansweredCount = (booking?.callAttempts || []).filter((a) => !a.answered).length;
  const canMarkNoShow = unansweredCount >= 3;

  const isSupabaseConsult = useCallback(() => consultSource === 'supabase', [consultSource]);

  // Status progression buttons removed: status is advanced only after issuing/declining.

  const doStatus = async (status: BookingStatus) => {
    if (!id) return;

    // If this consultation exists only in Supabase, update there.
    const local = doctorPortalService.getBooking(id);
    if (!local) {
      try {
        // Map BookingStatus-like UI states to consultation_status enum.
        const mapped: ConsultationStatus = ((): any => {
          if (status === 'cancelled') return 'cancelled';
          if (status === 'completed') return 'completed';
          if (status === 'in_progress') return 'called';
          if (status === 'booked') return 'confirmed';
          if (status === 'no_answer') return 'cancelled';
          return 'requested';
        })();

        await consultationsSupabaseService.updateStatus(id, mapped);
        toast.success(`Status → ${status.replace('_', ' ')}`);
        await reload();
        return;
      } catch (err: any) {
        console.error('Failed to update consultation status in Supabase:', err);
        toast.error(err?.message || 'Could not update status');
        return;
      }
    }

    // Otherwise fallback to Phase 1 localStorage implementation.
    const updated = doctorPortalService.setBookingStatus(id, status);
    if (!updated) { toast.error('Could not update status'); return; }
    toast.success(`Status → ${status.replace('_', ' ')}`);
    await reload();
  };

  const doAddAttempt = async () => {
    if (!id) return;

    try {
      if (consultSource === 'supabase') {
        if (!user?.id) throw new Error('Not authenticated');
        await callAttemptsSupabaseService.addAttempt({
          consultationId: id,
          doctorUserId: user.id,
          notes: callNote.trim() || undefined,
        });
        setCallNote('');
        toast.success('Call attempt logged');
        await reload();
        return;
      }

      const updated = doctorPortalService.addCallAttempt(id, { notes: callNote.trim() || undefined });
      setCallNote('');
      if (!updated) toast.error('Could not log attempt');
      else { toast.success('Call attempt logged'); reload(); }
    } catch (err: any) {
      console.error('Failed to log call attempt:', err);
      toast.error(err?.message || 'Could not log call attempt');
    }
  };

  const doToggleAnswered = async (attemptId: string, answered: boolean) => {
    if (!id) return;

    try {
      if (consultSource === 'supabase') {
        await callAttemptsSupabaseService.setAnswered({ attemptId, answered });
        await reload();
        return;
      }

      doctorPortalService.markCallAnswered(id, attemptId, answered);
      reload();
    } catch (err: any) {
      console.error('Failed to update call attempt answered:', err);
      toast.error(err?.message || 'Could not update call attempt');
    }
  };

  const doIssue = () => {
    if (!booking || !id) return;
    // Save notes before issuing
    doctorPortalService.setConsultNotes(id, consultNotes);
    doctorPortalService.issuePrescription({ doctorId: booking.doctorId, patientId: booking.patientId, maxStrengthMg: maxStrength });
    toast.success(`Prescription issued (max ${maxStrength}mg)`);

    // Don't auto-complete the consultation.
    // Completing is an explicit action after issuing to avoid accidental lock-outs.
    setPrescriptionIssued(true);
  };

  const doCompleteConsultation = async () => {
    if (!id) return;
    await doStatus('completed');
    navigate('/doctor/consultations');
  };

  const doDecline = () => {
    if (!id || !declineReason.trim()) { toast.error('Please provide a reason'); return; }
    // Save notes before declining
    doctorPortalService.setConsultNotes(id, consultNotes);
    doctorPortalService.declinePrescription(id, declineReason);
    toast.success('Completed without prescription');
    navigate('/doctor/consultations');
  };

  const doCancel = () => {
    if (!id || !cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    const result = doctorPortalService.cancelBooking(id, cancelReason);
    if (result) { toast.success('Consultation cancelled'); setCancelOpen(false); reload(); }
    else toast.error('Could not cancel');
  };

  const handleSaveNotes = useCallback(() => {
    if (!id) return;
    doctorPortalService.setConsultNotes(id, consultNotes);
    toast.success('Notes saved');
  }, [id, consultNotes]);

  const handleCopyPhone = useCallback(() => {
    const phone = patientProfile?.phoneE164 || intakePhone;
    if (!phone) return;
    navigator.clipboard.writeText(phone).then(() => toast.success('Phone number copied'));
  }, [patientProfile, intakePhone]);

  if (!booking || !hasAccess) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Consultation Not Found</h2>
          <p className="text-muted-foreground mb-4">We couldn't find this consultation or you don't have access.</p>
          <Button onClick={() => navigate('/doctor/consultations')}>Back to Consultations</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Consultation Workspace</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {scheduledAt && (
              <>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(scheduledAt, 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{format(scheduledAt, 'h:mm a')} {getTimezoneAbbr(scheduledAt, doctorTz)}</span>
              </>
            )}
            {statusBadge(booking.status)}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/doctor/consultations')}>Back</Button>
      </div>

      {/* Patient Details */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Patient Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Full Name</p>
              <p className="font-medium">{patientProfile?.fullName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
              <p className="font-medium">{patientProfile?.dateOfBirth || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold tracking-wide text-primary">
                  {(patientProfile?.phoneE164 || intakePhone) ? formatPhoneDisplay((patientProfile?.phoneE164 || intakePhone) as string) : 'Not provided'}
                </p>
                {(patientProfile?.phoneE164 || intakePhone) && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyPhone}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">ID: {booking.patientId}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Controls (simplified) */}
          {!isTerminal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>Cancel Consultation</Button>

                  <Button size="sm" variant="outline" onClick={() => doStatus('no_answer')} disabled={!canMarkNoShow}
                    title={canMarkNoShow ? 'Mark as no-show' : `Need ${3 - unansweredCount} more unanswered attempt(s)`}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Mark No-Show
                  </Button>
                </div>
                {!canMarkNoShow && (
                  <p className="text-xs text-muted-foreground mt-2">
                    No-show requires 3 unanswered call attempts ({unansweredCount}/3 logged).
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Call Attempts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Call Attempts</CardTitle>
              <CardDescription>Log each phone call attempt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isTerminal && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="callNote">Notes (optional)</Label>
                    <Textarea id="callNote" value={callNote} onChange={(e) => setCallNote(e.target.value)} placeholder="e.g. Left voicemail" />
                  </div>
                  <Button onClick={() => void doAddAttempt()} variant="outline" size="sm">Log Attempt</Button>
                </>
              )}

              {(booking.callAttempts?.length ?? 0) > 0 ? (
                <div className="pt-2 space-y-2">
                  {booking.callAttempts!.map((a, i) => (
                    <div key={a.id || i} className="text-sm border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Attempt #{a.attemptNumber}</p>
                          <Badge variant={a.answered ? 'default' : 'outline'} className="text-xs">
                            {a.answered ? 'Answered' : 'No Answer'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-muted-foreground">{format(new Date(a.attemptedAt), 'dd MMM, h:mm a')}</p>
                          {!isTerminal && (
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`ans-${a.id}`} className="text-xs text-muted-foreground">Answered</Label>
                              <Switch id={`ans-${a.id}`} checked={a.answered} onCheckedChange={(v) => doToggleAnswered(a.id!, v)} />
                            </div>
                          )}
                        </div>
                      </div>
                      {a.notes && <p className="mt-1 text-muted-foreground">{a.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No call attempts logged yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Prescription Decision (always expanded) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Prescription Decision</CardTitle>
              <CardDescription>Issue or decline a prescription for this patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Consultation Notes */}
              <div className="space-y-2">
                <Label htmlFor="consultNotes">Consultation Notes</Label>
                <Textarea
                  id="consultNotes"
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  onBlur={() => id && doctorPortalService.setConsultNotes(id, consultNotes)}
                  placeholder="Record consultation notes here…"
                  className="min-h-[100px]"
                />
                <Button variant="outline" size="sm" onClick={handleSaveNotes}>Save Notes</Button>
              </div>

              <div className="border-t pt-4" />

              {activeRx ? (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">Existing active prescription</p>
                  <p className="font-medium">Max strength: {activeRx.maxStrengthMg}mg</p>
                  <p className="text-sm text-muted-foreground">Allowance: {activeRx.totalCansAllowed} cans</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active prescription for this patient.</p>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max strength (mg)</Label>
                  <Select value={String(maxStrength)} onValueChange={(v) => setMaxStrength(Number(v) as 3 | 6 | 9)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3mg (Light)</SelectItem>
                      <SelectItem value="6">6mg (Moderate)</SelectItem>
                      <SelectItem value="9">9mg (Heavy)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Patient may step down but not exceed this strength.</p>
                </div>
                <div className="flex items-end">
                  <Button onClick={doIssue} className="w-full" disabled={isTerminal || prescriptionIssued}>
                    <CheckCircle className="h-4 w-4 mr-2" />{prescriptionIssued ? 'Prescription Issued' : 'Issue Prescription'}
                  </Button>
                </div>
              </div>

              {prescriptionIssued && !isTerminal && (
                <div className="pt-2">
                  <Button className="w-full" onClick={doCompleteConsultation}>
                    Complete consultation
                  </Button>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <Label>Decline reason</Label>
                <Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason for not issuing" />
                <Button variant="outline" onClick={doDecline} disabled={isTerminal}>
                  <XCircle className="h-4 w-4 mr-2" />Complete Without Prescription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <EligibilityQuizCard patientId={booking.patientId} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Past consultations and prescriptions for this patient will appear here.</p>
            </CardContent>
          </Card>

          <MedicationGuideCard />
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Consultation</DialogTitle>
            <DialogDescription>Provide a reason. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancelReasonWs">Reason</Label>
            <Textarea id="cancelReasonWs" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g. Patient requested reschedule" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Back</Button></DialogClose>
            <Button variant="destructive" onClick={doCancel} disabled={!cancelReason.trim()}>Confirm Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
