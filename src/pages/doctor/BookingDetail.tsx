import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorPortalService } from '@/services/doctorPortalService';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EligibilityQuizCard } from '@/components/doctor/EligibilityQuizCard';
import { PaymentsCard } from '@/components/doctor/PaymentsCard';
import { MedicationGuideCard } from '@/components/doctor/MedicationGuideCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, Phone, Plus, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { BookingStatus } from '@/types/telehealth';

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Payment</Badge>;
    case 'booked':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Booked</Badge>;
    case 'in_progress':
      return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">In Progress</Badge>;
    case 'completed':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
    case 'no_answer':
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">No Answer</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DoctorBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const booking = useMemo(() => {
    if (!id) return null;
    return doctorPortalService.getBooking(id);
  }, [id]);

  const hasAccess = !!(user?.id && booking?.doctorId === user.id);

  const scheduledAt = useMemo(() => {
    if (!booking) return null;
    return new Date(`${booking.scheduledDate}T${booking.timeWindowStart}:00`);
  }, [booking]);

  const [callNote, setCallNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [maxStrength, setMaxStrength] = useState<3 | 6 | 9>(6);

  const setStatus = (status: BookingStatus) => {
    if (!id) return;
    const updated = doctorPortalService.setBookingStatus(id, status);
    if (!updated) toast.error('Could not update booking');
    else toast.success(`Status updated: ${status}`);
  };

  const addAttempt = () => {
    if (!id) return;
    const updated = doctorPortalService.addCallAttempt(id, { notes: callNote.trim() || undefined });
    setCallNote('');
    if (!updated) toast.error('Could not add call attempt');
    else toast.success('Call attempt logged');
  };

  const issuePrescription = () => {
    if (!booking) return;
    doctorPortalService.issuePrescription({ doctorId: booking.doctorId, patientId: booking.patientId, maxStrengthMg: maxStrength });
    toast.success(`Prescription issued (max strength ${maxStrength}mg)`);

    // Mark booking completed in Phase 1 when prescription is issued.
    if (id) doctorPortalService.setBookingStatus(id, 'completed');
  };

  const declinePrescription = () => {
    if (!id) return;
    if (!declineReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    doctorPortalService.declinePrescription(id, declineReason);
    toast.success('Consultation completed without prescription');
  };

  const activeRx = useMemo(() => {
    if (!booking) return null;
    return shopPrescriptionService.getActivePrescription(booking.patientId);
  }, [booking]);

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-4">We couldn't find this booking or you don't have access to it.</p>
          <Button onClick={() => navigate('/doctor/bookings')}>Back to Bookings</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Consultation Workspace</h1>
          <p className="text-muted-foreground mt-1">Phase 1: mock doctor workflow (localStorage)</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/doctor/bookings')}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Phone Consultation
          </CardTitle>
          <CardDescription>Booking ID: {booking.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {scheduledAt && (
              <>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(scheduledAt, 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(scheduledAt, 'h:mm a')}
                </span>
              </>
            )}
            {statusBadge(booking.status)}
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">Patient ID</p>
            <p className="font-medium">{booking.patientId}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setStatus('in_progress')}>Start Consult</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus('no_answer')}>No Answer</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus('cancelled')}>Cancel</Button>
            <Button size="sm" onClick={() => setStatus('completed')}>Mark Completed</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Call Attempts
          </CardTitle>
          <CardDescription>Log each phone call attempt for this booking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="callNote">Notes (optional)</Label>
            <Textarea id="callNote" value={callNote} onChange={(e) => setCallNote(e.target.value)} placeholder="e.g. Left voicemail" />
          </div>
          <Button onClick={addAttempt} variant="outline" size="sm">Log Attempt</Button>

          {booking.callAttempts?.length ? (
            <div className="pt-2 space-y-2">
              {booking.callAttempts.map((a) => (
                <div key={a.id} className="text-sm border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Attempt #{a.attemptNumber}</p>
                    <p className="text-muted-foreground">{format(new Date(a.attemptedAt), 'dd MMM, h:mm a')}</p>
                  </div>
                  {a.notes ? <p className="mt-1 text-muted-foreground">{a.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No call attempts logged yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prescription Decision
              </CardTitle>
              <CardDescription>
                Issuing a prescription sets the patient’s shop entitlement (max strength gates variants).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          {activeRx ? (
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">Existing active prescription</p>
              <p className="font-medium">Max strength: {activeRx.maxStrengthMg}mg</p>
              <p className="text-sm text-muted-foreground">Allowance: {activeRx.totalCansAllowed} cans</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active prescription found for this patient.</p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Max strength (mg)</Label>
              <Select value={String(maxStrength)} onValueChange={(v) => setMaxStrength(Number(v) as 3 | 6 | 9)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strength" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3mg</SelectItem>
                  <SelectItem value="6">6mg</SelectItem>
                  <SelectItem value="9">9mg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={issuePrescription} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Issue Prescription
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <Label>Decline reason</Label>
            <Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason for not issuing a prescription" />
            <Button variant="outline" onClick={declinePrescription}>
              <XCircle className="h-4 w-4 mr-2" />
              Complete Without Prescription
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>

        <div className="space-y-6">
          <EligibilityQuizCard patientId={booking.patientId} />
          <PaymentsCard doctorId={booking.doctorId} bookingId={booking.id} />
          <MedicationGuideCard />
        </div>
      </div>
    </div>
  );
}
