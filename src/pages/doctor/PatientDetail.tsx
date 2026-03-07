import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';

export default function DoctorPatientDetail() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Button variant="outline" className="gap-2" onClick={() => navigate('/doctor/patients')}>
        <ArrowLeft className="h-4 w-4" />Back to Patients
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Patient Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detailed patient history, notes, and files will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
