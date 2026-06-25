import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePrescriptionStatus, type UploadedPrescriptionStatus } from '@/hooks/usePrescriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, ShoppingBag, Upload } from 'lucide-react';
import { format } from 'date-fns';

function statusBadge(row: UploadedPrescriptionStatus | null) {
  if (!row) return <Badge variant="outline">None</Badge>;
  if (row.status === 'active') return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
  if (row.status === 'rejected') return <Badge variant="destructive">Needs review</Badge>;
  if (row.status === 'expired') return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Expired</Badge>;
  if (row.ocr_status === 'processing' || row.ocr_status === 'not_started') return <Badge variant="secondary">Reading</Badge>;
  if (row.ocr_status === 'needs_review') return <Badge variant="secondary">Being reviewed</Badge>;
  if (row.ocr_status === 'failed') return <Badge variant="destructive">Needs review</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

function displayPrescriptionName(row: UploadedPrescriptionStatus, index: number) {
  const rawName = (row.file_name || '').trim();
  if (!rawName || /^manual-shop-access/i.test(rawName)) {
    return row.status === 'active' ? 'Prescription entitlement' : `Prescription document ${index + 1}`;
  }
  return rawName;
}

function statusMessage(row: UploadedPrescriptionStatus) {
  if (row.status === 'active') return 'This prescription is active and can unlock products within its limits.';
  if (row.status === 'rejected') return row.review_reason || 'This prescription needs review before it can unlock ordering.';
  if (row.ocr_status === 'failed') return row.ocr_error || 'We could not automatically read this prescription. Our team can review it manually.';
  if (row.ocr_status === 'needs_review') return 'We need to manually confirm the prescription limits before unlocking ordering.';
  if (row.ocr_status === 'processing' || row.ocr_status === 'not_started') return 'We are reading the prescription limits.';
  return 'This prescription is pending review.';
}

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const prescriptionStatus = usePrescriptionStatus();
  const [uploads, setUploads] = useState<UploadedPrescriptionStatus[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  const loadUploads = useCallback(async () => {
    if (!user?.id) return;
    setLoadingUploads(true);
    try {
      const { data, error } = await (supabase as any)
        .from('prescriptions')
        .select('id,status,ocr_status,allowed_strength_max,total_units_allowed,review_reason,ocr_error,file_name,created_at')
        .eq('patient_id', user.id)
        .eq('prescription_type', 'uploaded')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads((data ?? []) as UploadedPrescriptionStatus[]);
    } catch (error) {
      console.error('Failed to load uploaded prescriptions:', error);
      setUploads([]);
    } finally {
      setLoadingUploads(false);
    }
  }, [user?.id]);

  useEffect(() => { void loadUploads(); }, [loadUploads]);

  const latest = useMemo(() => uploads[0] ?? prescriptionStatus.latestUpload ?? null, [uploads, prescriptionStatus.latestUpload]);
  const isLoading = loadingUploads || prescriptionStatus.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Prescriptions</h1>
        <p className="text-muted-foreground mt-1">View prescription status and ordering limits.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            Current shop access
            {statusBadge(latest)}
          </CardTitle>
          <CardDescription>Your active prescription controls what you can order in the shop.</CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptionStatus.hasActivePrescription ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p><strong>Max strength:</strong> {prescriptionStatus.allowedStrengthMg}mg</p>
                  <p><strong>Total allowance:</strong> {prescriptionStatus.totalCansAllowed ?? '—'} cans</p>
                  <p><strong>Remaining:</strong> {prescriptionStatus.remainingCans ?? 0} cans</p>
                  <p><strong>Reference:</strong> {prescriptionStatus.prescriptionId}</p>
                </div>
              </div>
              <Button asChild size="sm"><Link to="/patient/shop"><ShoppingBag className="h-4 w-4 mr-2" />Go to shop</Link></Button>
            </div>
          ) : latest ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{statusMessage(latest)}</p>
              {(latest.review_reason || latest.ocr_error) && <p>{latest.review_reason || latest.ocr_error}</p>}
              <Button asChild size="sm" variant="outline"><Link to="/patient/consultations">View consultation status</Link></Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>No prescription received in PouchCare yet.</p>
              <Button asChild size="sm" variant="outline"><Link to="/patient/upload-prescription"><Upload className="h-4 w-4 mr-2" />Upload prescription</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>

      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded prescriptions</CardTitle>
            <CardDescription>{uploads.length} prescription document{uploads.length === 1 ? '' : 's'} on file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.map((upload, index) => (
              <div key={upload.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">{displayPrescriptionName(upload, index)}</p>
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Added {format(new Date(upload.created_at), 'MMM d, yyyy')}
                    </p>
                    {(upload.allowed_strength_max || upload.total_units_allowed) && (
                      <p className="text-muted-foreground">
                        {upload.allowed_strength_max ? `Up to ${upload.allowed_strength_max}mg` : 'Strength pending'}
                        {upload.total_units_allowed ? ` · ${upload.total_units_allowed} cans total` : ''}
                      </p>
                    )}
                    <p className="text-muted-foreground">{statusMessage(upload)}</p>
                  </div>
                  <div className="shrink-0">{statusBadge(upload)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
