/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { halaxyConsultationService } from '@/services/halaxyConsultationService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarClock, ExternalLink, FileText, Loader2, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import type { HalaxyConsultationSummary } from '@/types/halaxy';
import { usePrescriptionStatus } from '@/hooks/usePrescriptionStatus';

type PrescriptionRow = {
  id: string;
  consultation_id: string | null;
  status: string | null;
  ocr_status: string | null;
  created_at: string;
};

function statusCopy(status: string | null | undefined) {
  switch (status) {
    case 'sent_to_booking': return 'Continue booking';
    case 'booking_in_progress': return 'Waiting for booking confirmation';
    case 'webhook_pending': return 'Waiting for booking confirmation';
    case 'booked': return 'Booked';
    case 'completed': return 'Consult completed';
    case 'cancelled': return 'Cancelled';
    case 'manual_review': return 'Manual review';
    case 'failed': return 'Needs support';
    default: return 'Started';
  }
}

function statusVariant(status: string | null | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'booked' || status === 'completed') return 'default';
  if (status === 'cancelled' || status === 'failed') return 'destructive';
  if (status === 'manual_review' || status === 'webhook_pending') return 'secondary';
  return 'outline';
}

export default function PatientConsultations() {
  const { user } = useAuth();
  const [consults, setConsults] = useState<HalaxyConsultationSummary[]>([]);
  const [prescriptions, setPrescriptions] = useState<Record<string, PrescriptionRow>>({});
  const [loading, setLoading] = useState(true);
  const prescriptionStatus = usePrescriptionStatus();

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const rows = await halaxyConsultationService.listForPatient(user.id);
      setConsults(rows);

      const { data: rxRows } = await (supabase as any)
        .from('prescriptions')
        .select('id,consultation_id,status,ocr_status,created_at')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });
      const byConsult: Record<string, PrescriptionRow> = {};
      for (const rx of ((rxRows || []) as PrescriptionRow[])) {
        if (rx.consultation_id && !byConsult[rx.consultation_id]) byConsult[rx.consultation_id] = rx;
      }
      setPrescriptions(byConsult);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const latest = useMemo(() => consults[0] || null, [consults]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Consultation status</h1>
          <p className="text-muted-foreground mt-1">Your consultation booking and prescription pathway.</p>
        </div>
        <Button asChild><Link to="/start-consult">Start another consult</Link></Button>
      </div>

      {!latest && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No consultation started yet</CardTitle>
            <CardDescription>Start a consultation so we can guide you through booking and prescription review.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center"><Button asChild><Link to="/start-consult">Start consultation</Link></Button></CardContent>
        </Card>
      )}

      {latest && !prescriptions[latest.id] && ['booked', 'completed'].includes(latest.bookingStatus) && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Your booking is linked. Once the doctor uploads your prescription, PouchCare will read it and update your shop access.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {consults.map((consult) => {
          const rx = prescriptions[consult.id];
          const hasActiveEntitlement = prescriptionStatus.hasActivePrescription;
          return (
            <Card key={consult.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>GP consultation</CardTitle>
                    <CardDescription>
                      {consult.scheduledAt ? format(new Date(consult.scheduledAt), 'PPp') : 'Booking time pending'} · {consult.timezone || 'Australia/Brisbane'}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant(consult.bookingStatus)}>{statusCopy(consult.bookingStatus)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <p><strong>Appointment reference:</strong> {consult.halaxyAppointmentId || 'Pending'}</p>
                  <p><strong>Appointment status:</strong> {consult.halaxyAppointmentStatus || 'Pending'}</p>
                  <p><strong>Practitioner:</strong> {consult.practitionerName || 'Pending'}</p>
                  <p><strong>Location:</strong> {consult.locationName || 'Pending'}</p>
                </div>

                {rx ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    Prescription received · status: <strong>{rx.status || 'pending'}</strong> · OCR: <strong>{rx.ocr_status || 'not started'}</strong>
                  </div>
                ) : hasActiveEntitlement ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <ShoppingBag className="mt-0.5 h-4 w-4 text-primary" />
                      <span>You have active shop access from a prescription on file.</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Prescription status pending. We’ll update your shop access once a prescription is received and reviewed.
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  {consult.halaxyBookingUrl && ['sent_to_booking', 'booking_in_progress', 'webhook_pending'].includes(consult.bookingStatus) && (
                    <Button asChild><a href={consult.halaxyBookingUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Continue booking</a></Button>
                  )}
                  {consult.halaxyManageUrl && (
                    <Button variant="outline" asChild><a href={consult.halaxyManageUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Manage booking</a></Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <CalendarClock className="h-3 w-3" /> Reference ID: {consult.id}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
