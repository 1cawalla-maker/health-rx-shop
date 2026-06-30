import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';
import { halaxyConsultationService } from '@/services/halaxyConsultationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, ShoppingBag, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { HalaxyConsultationSummary } from '@/types/halaxy';

interface OutletContext {
  hasActivePrescription: boolean;
  hasPendingPrescription: boolean;
}

function consultStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'sent_to_booking': return 'Booking link ready';
    case 'booking_in_progress': return 'Booking in progress';
    case 'webhook_pending': return 'Waiting for booking confirmation';
    case 'booked': return 'Booked';
    case 'completed': return 'Consult completed';
    case 'manual_review': return 'Support review';
    case 'cancelled': return 'Cancelled';
    default: return 'Not started';
  }
}

function badgeVariant(status: string | null | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'booked' || status === 'completed' || status === 'active') return 'default';
  if (status === 'cancelled' || status === 'rejected' || status === 'failed') return 'destructive';
  if (status === 'manual_review' || status === 'webhook_pending' || status === 'pending_review') return 'secondary';
  return 'outline';
}

function prescriptionLabel(status: string | null | undefined, ocrStatus: string | null | undefined) {
  if (status === 'active') return 'Active';
  if (status === 'rejected') return 'Needs review';
  if (status === 'expired') return 'Expired';
  if (ocrStatus === 'processing' || ocrStatus === 'not_started') return 'Reading prescription';
  if (ocrStatus === 'needs_review') return 'Being reviewed';
  if (ocrStatus === 'failed') return 'Needs review';
  if (status === 'pending_review') return 'Pending review';
  return 'Not received';
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { hasActivePrescription } = useOutletContext<OutletContext>();
  const prescriptionStatus = usePrescriptionStatus();
  const [consults, setConsults] = useState<HalaxyConsultationSummary[]>([]);
  const [consultsLoading, setConsultsLoading] = useState(true);

  const latestConsult = useMemo(() => consults[0] || null, [consults]);
  const latestUpload = prescriptionStatus.latestUpload;
  const loading = consultsLoading || prescriptionStatus.isLoading;

  const loadConsults = useCallback(async () => {
    if (!user?.id) return;
    setConsultsLoading(true);
    try {
      const rows = await halaxyConsultationService.listForPatient(user.id);
      setConsults(rows);
    } catch (error) {
      console.error('Failed to load patient consultations:', error);
      setConsults([]);
    } finally {
      setConsultsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void loadConsults(); }, [loadConsults]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your consultation, prescription, and shop status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/patient/start-consult"><Calendar className="h-6 w-6 text-primary" /><span>Start Consultation</span></Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/patient/consultations"><FileText className="h-6 w-6 text-primary" /><span>Consultation Status</span></Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2" disabled={!hasActivePrescription}>
          <Link to="/patient/shop"><ShoppingBag className="h-6 w-6 text-primary" /><span>Shop Products</span></Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Latest consultation
              {latestConsult && <Badge variant={badgeVariant(latestConsult.bookingStatus)}>{consultStatusLabel(latestConsult.bookingStatus)}</Badge>}
            </CardTitle>
            <CardDescription>Your latest consultation booking status.</CardDescription>
          </CardHeader>
          <CardContent>
            {consultsLoading ? <div className="h-20 bg-muted animate-pulse rounded" /> : latestConsult ? (
              <div className="space-y-3 text-sm">
                <p><strong>Time:</strong> {latestConsult.scheduledAt ? format(new Date(latestConsult.scheduledAt), 'PPp') : 'Waiting for appointment details'}</p>
                <p><strong>Practitioner:</strong> {latestConsult.practitionerName || 'To be confirmed'}</p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" asChild><Link to="/patient/consultations">View details</Link></Button>
                  {latestConsult.halaxyBookingUrl && ['sent_to_booking', 'booking_in_progress', 'webhook_pending'].includes(latestConsult.bookingStatus) && (
                    <Button size="sm" variant="outline" asChild><a href={latestConsult.halaxyBookingUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Continue booking</a></Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>No consultation started yet.</p>
                <Button size="sm" asChild><Link to="/patient/start-consult">Start consultation</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Prescription status
              {latestUpload && <Badge variant={badgeVariant(latestUpload.status)}>{prescriptionLabel(latestUpload.status, latestUpload.ocr_status)}</Badge>}
            </CardTitle>
            <CardDescription>Your prescription controls shop access and ordering limits.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-20 bg-muted animate-pulse rounded" /> : latestUpload ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {prescriptionStatus.hasActivePrescription ? <CheckCircle className="h-5 w-5 text-green-500" /> : prescriptionStatus.hasPendingPrescription ? <Clock className="h-5 w-5 text-yellow-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
                  <span>{prescriptionLabel(latestUpload.status, latestUpload.ocr_status)}</span>
                </div>
                {prescriptionStatus.hasActivePrescription && (
                  <p>
                    Max strength: {prescriptionStatus.allowedStrengthMg}mg · {prescriptionStatus.remainingCans ?? 0} of {prescriptionStatus.totalCansAllowed ?? '—'} cans remaining
                  </p>
                )}
                {(latestUpload.review_reason || latestUpload.ocr_error) && (
                  <p className="text-muted-foreground">{latestUpload.review_reason || latestUpload.ocr_error}</p>
                )}
                <Button size="sm" asChild disabled={!hasActivePrescription}><Link to="/patient/shop">Go to shop</Link></Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>No prescription received in PouchCare yet. Your doctor or our team will add it after review.</p>
                <Button size="sm" variant="outline" asChild><Link to="/patient/consultations">View consultation status</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
