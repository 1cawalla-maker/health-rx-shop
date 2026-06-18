/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ExternalLink, RefreshCw, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const REVIEW_STATUSES = [
  'manual_review',
  'sent_to_booking',
  'booking_in_progress',
  'webhook_pending',
  'booked',
  'cancelled',
  'completed',
  'failed',
];

type HalaxyConsultRow = {
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
  halaxy_booking_url: string | null;
  halaxy_manage_url: string | null;
  halaxy_practitioner_id: string | null;
  halaxy_practitioner_name: string | null;
  halaxy_location_id: string | null;
  halaxy_location_name: string | null;
  halaxy_last_webhook_at: string | null;
  booking_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type Draft = {
  booking_status: string;
  scheduled_at: string;
  timezone: string;
  halaxy_patient_id: string;
  halaxy_appointment_id: string;
  halaxy_appointment_status: string;
  halaxy_manage_url: string;
  halaxy_practitioner_name: string;
  halaxy_location_name: string;
  admin_note: string;
};

function toDateTimeLocal(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function draftFrom(row: HalaxyConsultRow): Draft {
  const metadata = row.booking_metadata || {};
  return {
    booking_status: row.booking_status || 'manual_review',
    scheduled_at: toDateTimeLocal(row.scheduled_at),
    timezone: row.timezone || 'Australia/Brisbane',
    halaxy_patient_id: row.halaxy_patient_id || '',
    halaxy_appointment_id: row.halaxy_appointment_id || '',
    halaxy_appointment_status: row.halaxy_appointment_status || '',
    halaxy_manage_url: row.halaxy_manage_url || '',
    halaxy_practitioner_name: row.halaxy_practitioner_name || '',
    halaxy_location_name: row.halaxy_location_name || '',
    admin_note: typeof metadata.admin_note === 'string' ? metadata.admin_note : '',
  };
}

function statusVariant(status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'booked' || status === 'completed') return 'default';
  if (status === 'failed' || status?.startsWith('cancelled')) return 'destructive';
  if (status === 'manual_review' || status === 'webhook_pending') return 'secondary';
  return 'outline';
}

export default function AdminHalaxyConsults() {
  const [rows, setRows] = useState<HalaxyConsultRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingRxFor, setUploadingRxFor] = useState<string | null>(null);

  const manualCount = useMemo(
    () => rows.filter((row) => row.booking_status === 'manual_review' || row.booking_status === 'webhook_pending').length,
    [rows],
  );

  const loadRows = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('consultations')
        .select('id,patient_id,doctor_id,status,booking_status,scheduled_at,timezone,halaxy_patient_id,halaxy_appointment_id,halaxy_appointment_status,halaxy_booking_url,halaxy_manage_url,halaxy_practitioner_id,halaxy_practitioner_name,halaxy_location_id,halaxy_location_name,halaxy_last_webhook_at,booking_metadata,created_at,updated_at')
        .eq('booking_provider', 'halaxy')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      const nextRows = (data || []) as HalaxyConsultRow[];
      setRows(nextRows);
      setDrafts(Object.fromEntries(nextRows.map((row) => [row.id, draftFrom(row)])));
    } catch (error) {
      console.error('Failed to load Halaxy consults:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load Halaxy consults');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] || {} as Draft), ...patch },
    }));
  };

  const saveRow = async (row: HalaxyConsultRow) => {
    const draft = drafts[row.id];
    if (!draft) return;

    setSavingId(row.id);
    try {
      const bookingMetadata = {
        ...(row.booking_metadata || {}),
        admin_note: draft.admin_note || null,
        manual_admin_update_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('consultations')
        .update({
          booking_status: draft.booking_status,
          scheduled_at: fromDateTimeLocal(draft.scheduled_at),
          timezone: draft.timezone || 'Australia/Brisbane',
          halaxy_patient_id: draft.halaxy_patient_id || null,
          halaxy_appointment_id: draft.halaxy_appointment_id || null,
          halaxy_appointment_status: draft.halaxy_appointment_status || null,
          halaxy_manage_url: draft.halaxy_manage_url || null,
          halaxy_practitioner_name: draft.halaxy_practitioner_name || null,
          halaxy_location_name: draft.halaxy_location_name || null,
          booking_metadata: bookingMetadata,
        })
        .eq('id', row.id)
        .eq('booking_provider', 'halaxy');

      if (error) throw error;
      toast.success('Halaxy consult updated');
      await loadRows();
    } catch (error) {
      console.error('Failed to save Halaxy consult:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save Halaxy consult');
    } finally {
      setSavingId(null);
    }
  };

  const handlePrescriptionUpload = async (row: HalaxyConsultRow, file: File | null | undefined) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Upload a PDF, JPG, or PNG prescription.');
      return;
    }

    setUploadingRxFor(row.id);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${row.patient_id}/${Date.now()}-${safeName}`;

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

      toast.success('Prescription uploaded. Reading limits now...');
      const { error: ocrError } = await supabase.functions.invoke('extract-prescription-entitlement', {
        body: { prescriptionId: prescription.id },
      });

      if (ocrError) {
        console.error('OCR failed:', ocrError);
        toast.error('Prescription uploaded, but OCR failed. Review it manually in Prescription Uploads.');
      } else {
        toast.success('Prescription OCR complete. Check Prescription Uploads for review/status.');
      }
    } catch (error) {
      console.error('Prescription upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload prescription');
    } finally {
      setUploadingRxFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Halaxy consult queue</h1>
          <p className="text-muted-foreground mt-1">
            Manual fallback queue while Halaxy approval/API setup is pending.
          </p>
        </div>
        <Button variant="outline" onClick={loadRows} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Halaxy consults</CardDescription>
            <CardTitle>{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Needs manual attention</CardDescription>
            <CardTitle>{manualCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mode</CardDescription>
            <CardTitle className="text-base">Fallback/manual safe</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <CalendarClock className="h-10 w-10 mx-auto mb-3" />
            No Halaxy consult requests yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const draft = drafts[row.id] || draftFrom(row);
            return (
              <Card key={row.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-lg">Consult {row.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Patient {row.patient_id.slice(0, 8)} • Created {new Date(row.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusVariant(row.booking_status)}>{row.booking_status || 'unknown'}</Badge>
                      {row.halaxy_last_webhook_at && <Badge variant="outline">Webhook seen</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Booking status</Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={draft.booking_status}
                        onChange={(e) => updateDraft(row.id, { booking_status: e.target.value })}
                      >
                        {REVIEW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Scheduled at</Label>
                      <Input type="datetime-local" value={draft.scheduled_at} onChange={(e) => updateDraft(row.id, { scheduled_at: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Input value={draft.timezone} onChange={(e) => updateDraft(row.id, { timezone: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Halaxy patient ID</Label>
                      <Input value={draft.halaxy_patient_id} onChange={(e) => updateDraft(row.id, { halaxy_patient_id: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Halaxy appointment ID</Label>
                      <Input value={draft.halaxy_appointment_id} onChange={(e) => updateDraft(row.id, { halaxy_appointment_id: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Appointment status</Label>
                      <Input value={draft.halaxy_appointment_status} onChange={(e) => updateDraft(row.id, { halaxy_appointment_status: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Manage URL</Label>
                      <Input value={draft.halaxy_manage_url} onChange={(e) => updateDraft(row.id, { halaxy_manage_url: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Practitioner</Label>
                      <Input value={draft.halaxy_practitioner_name} onChange={(e) => updateDraft(row.id, { halaxy_practitioner_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={draft.halaxy_location_name} onChange={(e) => updateDraft(row.id, { halaxy_location_name: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Admin note</Label>
                    <Textarea
                      value={draft.admin_note}
                      onChange={(e) => updateDraft(row.id, { admin_note: e.target.value })}
                      placeholder="Manual booking notes, GP follow-up, Halaxy account status, etc."
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {row.halaxy_booking_url && <a className="inline-flex items-center gap-1 underline" href={row.halaxy_booking_url} target="_blank" rel="noreferrer">Booking URL <ExternalLink className="h-3 w-3" /></a>}
                      {row.halaxy_manage_url && <a className="inline-flex items-center gap-1 underline" href={row.halaxy_manage_url} target="_blank" rel="noreferrer">Manage URL <ExternalLink className="h-3 w-3" /></a>}
                      {row.halaxy_last_webhook_at && <span>Last webhook: {new Date(row.halaxy_last_webhook_at).toLocaleString()}</span>}
                    </div>
                    <Label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingRxFor === row.id ? 'Uploading...' : 'Upload prescription'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={uploadingRxFor === row.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.currentTarget.value = '';
                          void handlePrescriptionUpload(row, file);
                        }}
                      />
                    </Label>
                    <Button onClick={() => saveRow(row)} disabled={savingId === row.id}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingId === row.id ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
