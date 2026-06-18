/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { halaxyConsultationService } from '@/services/halaxyConsultationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, ShoppingBag, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { HalaxyConsultationSummary } from '@/types/halaxy';

interface OutletContext {
  hasActivePrescription: boolean;
  checkActivePrescription: () => void;
}

type PrescriptionRow = {
  id: string;
  consultation_id: string | null;
  prescription_type: string | null;
  status: string | null;
  ocr_status: string | null;
  allowed_strength_max: number | null;
  total_units_allowed: number | null;
  created_at: string;
};

function consultStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'sent_to_booking': return 'Booking link ready';
    case 'booking_in_progress': return 'Booking in progress';
    case 'webhook_pending': return 'Waiting for Halaxy';
    case 'booked': return 'Booked';
    case 'completed': return 'Consult completed';
    case 'manual_review': return 'Manual review';
    case 'cancelled': return 'Cancelled';
    default: return 'Not started';
  }
}

function badgeVariant(status: string | null | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'booked' || status === 'completed' || status === 'active') return 'default';
  if (status === 'cancelled' || status === 'rejected') return 'destructive';
  if (status === 'manual_review' || status === 'webhook_pending' || status === 'pending_review') return 'secondary';
  return 'outline';
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { hasActivePrescription } = useOutletContext<OutletContext>();
  const [consults, setConsults] = useState<HalaxyConsultationSummary[]>([]);
  const [prescriptionStatus, setPrescriptionStatus] = useState<PrescriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const latestConsult = useMemo(() => consults[0] || null, [consults]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const rows = await halaxyConsultationService.listForPatient(user.id);
      setConsults(rows);

      const { data, error } = await (supabase as any)
        .from('prescriptions')
        .select('id,consultation_id,prescription_type,status,ocr_status,allowed_strength_max,total_units_allowed,created_at')
        .eq('patient_id', user.id)
        .eq('prescription_type', 'uploaded')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      setPrescriptionStatus(data?.[0] ?? null);
    } catch (error) {
      console.error('Failed to load patient dashboard:', error);
      setConsults([]);
      setPrescriptionStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your PouchCare consultation, prescription, and shop status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/start-consult"><Calendar className="h-6 w-6 text-primary" /><span>Start Consultation</span></Link>
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
            <CardDescription>Halaxy booking and PouchCare matching status.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-20 bg-muted animate-pulse rounded" /> : latestConsult ? (
              <div className="space-y-3 text-sm">
                <p><strong>Time:</strong> {latestConsult.scheduledAt ? format(new Date(latestConsult.scheduledAt), 'PPp') : 'Pending from Halaxy'}</p>
                <p><strong>Appointment:</strong> {latestConsult.halaxyAppointmentId || 'Pending'}</p>
                <p><strong>Practitioner:</strong> {latestConsult.practitionerName || 'Pending'}</p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" asChild><Link to="/patient/consultations">View details</Link></Button>
                  {latestConsult.halaxyBookingUrl && ['sent_to_booking', 'booking_in_progress', 'webhook_pending'].includes(latestConsult.bookingStatus) && (
                    <Button size="sm" variant="outline" asChild><a href={latestConsult.halaxyBookingUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Halaxy</a></Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>No consultation started yet.</p>
                <Button size="sm" asChild><Link to="/start-consult">Start consultation</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Prescription status
              {prescriptionStatus && <Badge variant={badgeVariant(prescriptionStatus.status)}>{prescriptionStatus.status}</Badge>}
            </CardTitle>
            <CardDescription>Prescription entitlement controls shop access.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-20 bg-muted animate-pulse rounded" /> : prescriptionStatus ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {prescriptionStatus.status === 'active' ? <CheckCircle className="h-5 w-5 text-green-500" /> : prescriptionStatus.status === 'pending_review' ? <Clock className="h-5 w-5 text-yellow-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
                  <span>OCR: {prescriptionStatus.ocr_status || 'not started'}</span>
                </div>
                {prescriptionStatus.allowed_strength_max && (
                  <p>Max strength: {prescriptionStatus.allowed_strength_max}mg{prescriptionStatus.total_units_allowed ? ` · ${prescriptionStatus.total_units_allowed} total cans/units` : ''}</p>
                )}
                <Button size="sm" asChild disabled={!hasActivePrescription}><Link to="/patient/shop">Go to shop</Link></Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>No prescription received in PouchCare yet. Your doctor/admin will upload it after the Halaxy consultation.</p>
                <Button size="sm" variant="outline" asChild><Link to="/patient/consultations">View consultation status</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
