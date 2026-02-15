import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, FileText, Upload } from 'lucide-react';

export default function UploadPrescription() {
  const { user } = useAuth();

  const helperText = useMemo(() => {
    // Keep this page safe even if user is not logged in.
    // In Phase 1 we do NOT perform any uploads or storage writes from this route.
    if (!user) {
      return 'Prescription upload will be enabled in Phase 2. Log in to use the Dev Mock Prescription toggle for testing.';
    }

    return 'Prescription upload will be enabled in Phase 2. For now, use the Dev Mock Prescription toggle to unlock the shop for testing.';
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Upload Prescription</h1>
        <p className="text-muted-foreground mt-1">Phase 1: upload is stubbed (no PDFs stored)</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Phase 1 Stub
          </CardTitle>
          <CardDescription>
            Prescription file upload and PDF viewing are disabled in Phase 1.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{helperText}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>No file selection</li>
            <li>No form submission</li>
            <li>No localStorage writes from this page</li>
            <li>No network calls</li>
          </ul>
        </CardContent>
      </Card>

      {/* Disabled upload UI mockup (visual-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document (Phase 2)
          </CardTitle>
          <CardDescription>
            This UI is intentionally disabled in Phase 1.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center opacity-60 select-none">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="mt-3 space-y-1">
              <p className="font-medium text-foreground">Upload will be enabled in Phase 2</p>
              <p className="text-sm text-muted-foreground">Use the Dev Mock Prescription toggle to unlock the shop for testing.</p>
            </div>
            <div className="mt-4 inline-flex items-center rounded-md border px-3 py-2 text-sm text-muted-foreground">
              File selection disabled
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
