import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Upload, Eye, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type PrescriptionUploadRow = {
  id: string;
  patient_id: string;
  file_url: string | null;
  file_name?: string | null;
  status: 'pending_review' | 'active' | 'rejected' | 'expired';
  allowed_strength_max: number | null;
  max_units_per_order: number | null;
  max_units_per_month: number | null;
  total_units_allowed?: number | null;
  review_reason: string | null;
  expires_at: string | null;
  created_at: string;
  ocr_status?: 'not_started' | 'processing' | 'completed' | 'failed' | 'needs_review' | null;
  ocr_confidence?: number | null;
  ocr_error?: string | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusBadge(row: PrescriptionUploadRow) {
  if (row.status === 'active') return <Badge>Approved</Badge>;
  if (row.status === 'rejected' || row.status === 'expired') return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Reviewing prescription</Badge>;
}

function statusDescription(row: PrescriptionUploadRow) {
  if (row.status === 'active') return 'Approved. Ordering access is based on the prescription limits we can verify.';
  if (row.status === 'rejected' || row.status === 'expired') return row.review_reason || 'Rejected. This prescription could not be approved for ordering access.';
  return 'Reviewing prescription. This is usually completed within 24 hours.';
}

export default function UploadPrescription() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<PrescriptionUploadRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const loadUploads = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await (supabase as any)
      .from('prescriptions')
      .select('id,patient_id,file_url,file_name,status,allowed_strength_max,max_units_per_order,max_units_per_month,total_units_allowed,review_reason,expires_at,created_at,ocr_status,ocr_confidence,ocr_error')
      .eq('patient_id', user.id)
      .eq('prescription_type', 'uploaded')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load prescriptions:', error);
      toast.error('Could not load prescription uploads');
      return;
    }

    setUploads((data ?? []) as PrescriptionUploadRow[]);
  }, [user?.id]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF, JPG, or PNG file.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File is too large. Maximum size is 10 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'upload';
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${Date.now()}-${safeName || `prescription.${ext}`}`;

      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: row, error: insertError } = await (supabase as any)
        .from('prescriptions')
        .insert({
          patient_id: user.id,
          prescription_type: 'uploaded',
          status: 'pending_review',
          file_url: path,
          file_name: file.name,
          ocr_status: 'not_started',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast.success('Prescription uploaded. We will review it within 24 hours.');
      await loadUploads();

      const { error: ocrError } = await supabase.functions.invoke('extract-prescription-entitlement', {
        body: { prescriptionId: row.id },
      });

      if (ocrError) {
        console.error('OCR error:', ocrError);
        toast.success('Prescription uploaded. We will review it within 24 hours.');
      } else {
        toast.success('Prescription submitted for review.');
      }

      await loadUploads();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload prescription. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getSignedUrl = async (upload: PrescriptionUploadRow): Promise<string | null> => {
    if (!upload.file_url) return null;
    const { data, error } = await supabase.storage
      .from('prescriptions')
      .createSignedUrl(upload.file_url, 300);

    if (error || !data?.signedUrl) {
      toast.error('Could not load file');
      return null;
    }
    return data.signedUrl;
  };

  const handleView = async (upload: PrescriptionUploadRow) => {
    const url = await getSignedUrl(upload);
    if (url) window.open(url, '_blank');
  };

  const handleDownload = async (upload: PrescriptionUploadRow) => {
    const url = await getSignedUrl(upload);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = upload.file_name || upload.file_url?.split('/').pop() || 'prescription';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Upload prescription</h1>
        <p className="text-muted-foreground mt-1">Submit an existing prescription for review. If approved, ordering access is enabled according to your prescription limits.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload a prescription
          </CardTitle>
          <CardDescription>
            Upload a clear prescription PDF or image from your doctor. Accepted formats: PDF, JPG, PNG (max 10 MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'Uploading...' : 'Select file'}
          </Button>
        </CardContent>
      </Card>

      {uploads.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Your prescriptions
            </CardTitle>
            <CardDescription>{uploads.length} document{uploads.length !== 1 ? 's' : ''} uploaded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{upload.file_name || upload.file_url?.split('/').pop() || 'Prescription'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(upload.created_at), 'dd MMM yyyy, h:mm a')}
                    </span>
                    {statusBadge(upload)}
                  </div>
                  <p className={upload.status === 'rejected' || upload.status === 'expired' ? 'text-xs text-destructive mt-2' : 'text-xs text-muted-foreground mt-2'}>
                    {statusDescription(upload)}
                  </p>
                  {upload.status === 'active' && upload.allowed_strength_max != null && upload.total_units_allowed != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Approved limit: up to {upload.allowed_strength_max}mg, {upload.total_units_allowed} total units.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(upload)} title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(upload)} title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">No prescriptions uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload an existing prescription above, or start a consultation if you need a prescription.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/patient/start-consult">
                <Calendar className="h-4 w-4 mr-2" />
                Start consultation
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
