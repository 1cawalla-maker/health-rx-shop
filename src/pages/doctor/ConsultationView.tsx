import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorPortalService } from '@/services/doctorPortalService';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { getTimezoneAbbr } from '@/lib/datetime';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EligibilityQuizCard } from '@/components/doctor/EligibilityQuizCard';
import { PaymentsCard } from '@/components/doctor/PaymentsCard';
import { MedicationGuideCard } from '@/components/doctor/MedicationGuideCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calendar, Clock, Phone, Plus, CheckCircle, XCircle, AlertCircle, FileText, ChevronDown, PhoneOff } from 'lucide-react';
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

export default function DoctorConsultationView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<MockBooking | null>(null);
  const [callNote, setCallNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [maxStrength, setMaxStrength] = useState<3 | 6 | 9>(6);
  const [rxOpen, setRxOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const doctorTz = useMemo(() => user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane', [user?.id]);

  const reload = () => {
    if (!id) return;
    setBooking(doctorPortalService.getBooking(id));
  };

  useEffect(() => { reload(); }, [id]);

  const hasAccess = !!(user?.id && booking?.doctorId === user.id);
  const isTerminal = booking ? TERMINAL.includes(booking.status) : false;

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

  const doStatus = (status: BookingStatus) => {
    if (!id) return;
    const updated = doctorPortalService.setBookingStatus(id, status);
    if (!updated) { toast.error('Could not update status'); return; }
    toast.success(`Status → ${status.replace('_', ' ')}`);
    reload();
  };

  const doAddAttempt = () => {
    if (!id) return;
    const updated = doctorPortalService.addCallAttempt(id, { notes: callNote.trim() || undefined });
    setCallNote('');
    if (!updated) toast.error('Could not log attempt');
    else { toast.success('Call attempt logged'); reload(); }
  };

  const doToggleAnswered = (attemptId: string, answered: boolean) => {
    if (!id) return;
    doctorPortalService.markCallAnswered(id, attemptId, answered);
    reload();
  };

  const doIssue = () => {
    if (!booking) return;
    doctorPortalService.issuePrescription({ doctorId: booking.doctorId, patientId: booking.patientId, maxStrengthMg: maxStrength });
    toast.success(`Prescription issued (max ${maxStrength}mg)`);
    if (id) doctorPortalService.setBookingStatus(id, 'completed');
    reload();
  };

  const doDecline = () => {
    if (!id || !declineReason.trim()) { toast.error('Please provide a reason'); return; }
    doctorPortalService.declinePrescription(id, declineReason);
    toast.success('Completed without prescription');
    reload();
  };

  const doCancel = () => {
    if (!id || !cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    const result = doctorPortalService.cancelBooking(id, cancelReason);
    if (result) { toast.success('Consultation cancelled'); setCancelOpen(false); reload(); }
    else toast.error('Could not cancel');
  };

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
          <p className="mt-1 text-xs text-muted-foreground">Patient: {booking.patientId}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/doctor/consultations')}>Back</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />Status Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => doStatus('in_progress')} disabled={isTerminal}>Start Consult</Button>
                <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)} disabled={isTerminal}>Cancel</Button>
                <Button size="sm" onClick={() => doStatus('completed')} disabled={isTerminal}>Mark Completed</Button>
                <Button size="sm" variant="outline" onClick={() => doStatus('no_answer')} disabled={isTerminal || !canMarkNoShow}
                  title={canMarkNoShow ? 'Mark as no-show' : `Need ${3 - unansweredCount} more unanswered attempt(s)`}
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Mark No-Show
                </Button>
              </div>
              {!isTerminal && !canMarkNoShow && (
                <p className="text-xs text-muted-foreground mt-2">
                  No-show requires 3 unanswered call attempts ({unansweredCount}/3 logged).
                </p>
              )}
            </CardContent>
          </Card>

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
                  <Button onClick={doAddAttempt} variant="outline" size="sm">Log Attempt</Button>
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

          {/* Prescription Decision */}
          <Collapsible open={rxOpen} onOpenChange={setRxOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><FileText className="h-5 w-5" />Prescription Decision</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${rxOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                  <CardDescription>Issue or decline a prescription for this patient</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
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
                      <Button onClick={doIssue} className="w-full" disabled={isTerminal}>
                        <CheckCircle className="h-4 w-4 mr-2" />Issue Prescription
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <Label>Decline reason</Label>
                    <Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason for not issuing" />
                    <Button variant="outline" onClick={doDecline} disabled={isTerminal}>
                      <XCircle className="h-4 w-4 mr-2" />Complete Without Prescription
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div><span className="text-muted-foreground">Patient ID:</span> <span className="font-medium">{booking.patientId}</span></div>
              <p className="text-xs text-muted-foreground">Phase 2: will display name, phone, DOB from patient profile.</p>
            </CardContent>
          </Card>

          <EligibilityQuizCard patientId={booking.patientId} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Phase 2: will show past consultations and prescriptions for this patient.</p>
            </CardContent>
          </Card>

          {booking.doctorId && <PaymentsCard doctorId={booking.doctorId} bookingId={booking.id} />}

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
