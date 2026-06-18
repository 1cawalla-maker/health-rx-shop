/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarClock, ExternalLink, FileText, Loader2, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ConsultRow = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  status: string | null;
  booking_status: string | null;
  scheduled_at: string | null;
  timezone: string | null;
  halaxy_patient_id: string | null;
  halaxy_appointment_id: string | null;
  halaxy_appointment_status: string | null;
  halaxy_manage_url: string | null;
  halaxy_practitioner_name: string | null;
  halaxy_location_name: string | null;
  created_at: string;
};

type ProfileRow = { user_id: string; full_name: string | null; phone: string | null };

type PrescriptionRow = { id: string; consultation_id: string | null; patient_id: string; status: string | null; ocr_status: string | null; created_at: string };

function statusVariant(status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'booked' || status === 'completed') return 'default';
  if (status === 'cancelled' || status === 'failed') return 'destructive';
  if (status === 'manual_review' || status === 'webhook_pending') return 'secondary';
  return 'outline';
}

export default function DoctorHalaxyConsults() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ConsultRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [prescriptions, setPrescriptions] = useState<Record<string, PrescriptionRow>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const pendingRxCount = useMemo(
    () => rows.filter((row) => !prescriptions[row.id] && ['booked', 'completed'].includes(row.booking_status || '')).length,
    [rows, prescriptions],
  );

  const loadRows = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('consultations')
        .select('id,patient_id,doctor_id,status,booking_status,scheduled_at,timezone,halaxy_patient_id,halaxy_appointment_id,halaxy_appointment_status,halaxy_manage_url,halaxy_practitioner_name,halaxy_location_name,created_at')
        .eq('booking_provider', 'halaxy')
        .order('scheduled_at', { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) throw error;

      const nextRows = (data || []) as ConsultRow[];
      setRows(nextRows);

      const patientIds = [...new Set(nextRows.map((row) => row.patient_id))];
      if (patientIds.length) {
        const { data: profileRows } = await (supabase as any)
          .from('profiles')
          .select('user_id,full_name,phone')
          .in('user_id', patientIds);
        setProfiles(Object.fromEntries(((profileRows || []) as ProfileRow[]).map((p) => [p.user_id, p])));

        const { data: rxRows } = await (supabase as any)
          .from('prescriptions')
          .select('id,consultation_id,patient_id,status,ocr_status,created_at')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false });
        const byConsult: Record<string, PrescriptionRow> = {};
        for (const rx of ((rxRows || []) as PrescriptionRow[])) {
          if (rx.consultation_id && !byConsult[rx.consultation_id]) byConsult[rx.consultation_id] = rx;
        }
        setPrescriptions(byConsult);
      } else {
        setProfiles({});
        setPrescriptions({});
      }
    } catch (error) {
      console.error('Failed to load doctor Halaxy consults:', error);
      toast.error(error instanceof Error ? error.message : 'Could not load assigned consults');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void loadRows(); }, [loadRows]);

  const uploadPrescription = async (row: ConsultRow, file: File | null | undefined) => {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Upload a PDF, JPG, or PNG prescription.');
      return;
    }

    const confirmed = window.confirm('Confirm this prescription belongs to this patient and consultation?');
    if (!confirmed) return;

    setUploadingFor(row.id);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${row.patient_id}/${row.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: prescription, error: insertError } = await (supabase as any)
        .from('prescriptions')
        .insert({
          patient_id: row.patient_id,
          consultation_id: row.id,
          prescription_type: 'uploaded',
          status: 'pending_review',
          file_url: path,
          file_name: file.name,
          ocr_status: 'not_started',
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      toast.success('Prescription uploaded. OCR is running.');
      const { error: ocrError } = await supabase.functions.invoke('extract-prescription-entitlement', {
        body: { prescriptionId: prescription.id },
      });
      if (ocrError) {
        console.error('OCR failed:', ocrError);
        toast.error('Uploaded, but OCR failed. Admin can review manually.');
      } else {
        toast.success('Prescription OCR complete.');
      }
      await loadRows();
    } catch (error) {
      console.error('Prescription upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Assigned Halaxy consults</h1>
          <p className="text-muted-foreground mt-1">Only consultations assigned to your PouchCare doctor account are shown.</p>
        </div>
        <Button variant="outline" onClick={loadRows} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Assigned consults</CardDescription><CardTitle>{rows.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Need prescription upload</CardDescription><CardTitle>{pendingRxCount}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Uploaded prescriptions</CardDescription><CardTitle>{Object.keys(prescriptions).length}</CardTitle></CardHeader></Card>
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Upload prescriptions only after confirming the patient identity during/after the Halaxy consultation. Do not upload prescriptions for unassigned patients.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No assigned Halaxy consultations yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const profile = profiles[row.patient_id];
            const rx = prescriptions[row.id];
            return (
              <Card key={row.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{profile?.full_name || 'Assigned patient'}</CardTitle>
                      <CardDescription>
                        {row.scheduled_at ? format(new Date(row.scheduled_at), 'PPp') : 'Time pending'} · {row.timezone || 'Australia/Brisbane'}
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariant(row.booking_status)}>{row.booking_status || 'unknown'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <p><strong>Patient mobile:</strong> {profile?.phone || 'Not visible'}</p>
                    <p><strong>Halaxy appointment:</strong> {row.halaxy_appointment_id || 'Pending'}</p>
                    <p><strong>Halaxy patient:</strong> {row.halaxy_patient_id || 'Pending'}</p>
                    <p><strong>Appointment status:</strong> {row.halaxy_appointment_status || 'Pending'}</p>
                    <p><strong>Practitioner:</strong> {row.halaxy_practitioner_name || 'Not supplied'}</p>
                    <p><strong>Location:</strong> {row.halaxy_location_name || 'Not supplied'}</p>
                  </div>

                  {rx ? (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      Prescription uploaded · status: <strong>{rx.status || 'pending'}</strong> · OCR: <strong>{rx.ocr_status || 'not started'}</strong>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFor === row.id ? 'Uploading...' : 'Upload prescription'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={uploadingFor === row.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.currentTarget.value = '';
                            void uploadPrescription(row, file);
                          }}
                        />
                      </Label>
                      {row.halaxy_manage_url && (
                        <Button variant="outline" asChild>
                          <a href={row.halaxy_manage_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Open Halaxy</a>
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarClock className="h-3 w-3" /> PouchCare consult ID: {row.id}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Button variant="outline" asChild><Link to="/doctor/consultations">View legacy consultation list</Link></Button>
    </div>
  );
}
