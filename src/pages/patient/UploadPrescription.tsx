import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { prescriptionBlobService, type PrescriptionBlob } from '@/services/prescriptionBlobService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Upload, Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPrescription() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<PrescriptionBlob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [objectUrls, setObjectUrls] = useState<Map<string, string>>(new Map());

  const loadUploads = useCallback(async () => {
    if (!user?.id) return;
    const list = await prescriptionBlobService.listBlobs(user.id);
    setUploads(list);
  }, [user?.id]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getObjectUrl = async (id: string): Promise<string | null> => {
    const existing = objectUrls.get(id);
    if (existing) return existing;

    const blob = await prescriptionBlobService.getBlob(id);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    setObjectUrls((prev) => new Map(prev).set(id, url));
    return url;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF, JPG, or PNG file.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File is too large. Maximum size is 10 MB.');
      return;
    }

    setIsUploading(true);
    try {
      await prescriptionBlobService.saveBlob(user.id, file);
      toast.success('Prescription uploaded successfully');
      await loadUploads();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload prescription. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async (upload: PrescriptionBlob) => {
    const url = await getObjectUrl(upload.id);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Could not load file');
    }
  };

  const handleDownload = async (upload: PrescriptionBlob) => {
    const url = await getObjectUrl(upload.id);
    if (!url) {
      toast.error('Could not load file');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = upload.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemove = async (upload: PrescriptionBlob) => {
    // Revoke the object URL if it exists
    const url = objectUrls.get(upload.id);
    if (url) {
      URL.revokeObjectURL(url);
      setObjectUrls((prev) => {
        const next = new Map(prev);
        next.delete(upload.id);
        return next;
      });
    }

    await prescriptionBlobService.removeBlob(upload.id);
    toast.success('Prescription removed');
    await loadUploads();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Upload Prescription</h1>
        <p className="text-muted-foreground mt-1">Submit your prescription documents</p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload a Prescription
          </CardTitle>
          <CardDescription>
            Upload a prescription PDF or image from your doctor. Accepted formats: PDF, JPG, PNG (max 10 MB).
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
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Select File'}
          </Button>
        </CardContent>
      </Card>

      {/* Uploads List */}
      {uploads.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Your Prescriptions
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
                  <p className="font-medium text-sm truncate">{upload.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(upload.sizeBytes)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(upload.uploadedAt), 'dd MMM yyyy, h:mm a')}
                    </span>
                    <Badge variant="outline" className="text-xs">Pending Review</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(upload)} title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(upload)} title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemove(upload)} title="Remove">
                    <Trash2 className="h-4 w-4" />
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
                Upload an existing prescription above, or book a consultation to have one issued by a doctor.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/patient/book">
                <Calendar className="h-4 w-4 mr-2" />
                Book a Consultation
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
