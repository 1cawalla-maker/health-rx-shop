import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X, Clock, XCircle } from 'lucide-react';
import { prescriptionUploadService } from '@/services/prescriptionUploadService';
import type { PrescriptionUploadRecord } from '@/types/services';
import { prescriptionStatusLabels, prescriptionStatusColors } from '@/types/enums';
import { format } from 'date-fns';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadPrescription() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [myUploads, setMyUploads] = useState<PrescriptionUploadRecord[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyUploads();
    }
  }, [user]);

  const fetchMyUploads = async () => {
    if (!user) return;
    setLoadingUploads(true);
    const uploads = await prescriptionUploadService.getPatientUploads(user.id);
    setMyUploads(uploads);
    setLoadingUploads(false);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a PDF or image file (JPEG, PNG, WebP)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;

    setIsUploading(true);

    try {
      const result = await prescriptionUploadService.createUpload(
        user.id,
        null,
        user.email || null,
        selectedFile
      );

      if (result.success) {
        toast.success('Prescription uploaded successfully!');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchMyUploads();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload prescription. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Upload Prescription</h1>
        <p className="text-muted-foreground mt-1">Submit an existing prescription for review</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Upload a clear image or PDF of your valid prescription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : selectedFile 
                  ? 'border-green-500 bg-green-500/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {selectedFile ? (
              <div className="space-y-3">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-foreground">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF, JPEG, PNG or WebP (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Prescription
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* My Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>My Uploads</CardTitle>
          <CardDescription>Track the status of your prescription uploads</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUploads ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : myUploads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              You haven't uploaded any prescriptions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {myUploads.map((upload) => (
                <div 
                  key={upload.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{upload.fileName || 'Prescription'}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {format(new Date(upload.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={prescriptionStatusColors[upload.status]}
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(upload.status)}
                    {prescriptionStatusLabels[upload.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>After uploading your prescription:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>An admin will review your prescription within 24-48 hours</li>
            <li>You'll see the status update on this page</li>
            <li>If approved, the shop will be unlocked for you to order products</li>
            <li>If rejected, you'll see the reason and can upload a new document</li>
          </ol>
          <p className="mt-4 text-xs">
            Note: Prescriptions must be from a registered Australian medical practitioner 
            and be valid (not expired).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
