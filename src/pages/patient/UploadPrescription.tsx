import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar } from 'lucide-react';

export default function UploadPrescription() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Upload Prescription</h1>
        <p className="text-muted-foreground mt-1">Submit your prescription documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Upload a Prescription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Prescription uploads aren't available in the app yet. To get started, book a consultation and your doctor can issue your prescription during the call.
          </p>
          <Button asChild>
            <Link to="/patient/book">
              <Calendar className="h-4 w-4 mr-2" />
              Book a Consultation
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
