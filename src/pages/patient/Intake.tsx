import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockBookingService } from '@/services/consultationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientIntake() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const booking = useMemo(() => {
    if (!bookingId) return null;
    return mockBookingService.getBooking(bookingId);
  }, [bookingId]);

  const scheduledText = useMemo(() => {
    if (!booking) return null;
    const dt = new Date(`${booking.scheduledDate}T${booking.timeWindowStart}:00`);
    return format(dt, 'MMMM d, yyyy at h:mm a');
  }, [booking]);

  const hasAccess = !!(user?.id && booking?.patientId === user.id);

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Intake Not Available</h2>
          <p className="text-muted-foreground mb-4">We couldn't find this booking or you don't have access to it.</p>
          <Button onClick={() => navigate('/patient/consultations')}>Go to Consultations</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Complete Intake Form</h1>
        <p className="text-muted-foreground mt-1">Prepare for your consultation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Intake Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {scheduledText && (
            <p>
              Your consultation is scheduled for <strong>{scheduledText}</strong>.
            </p>
          )}
          <p>
            Your intake form will be available closer to your consultation date.
          </p>
          <div>
            <Button onClick={() => navigate('/patient/consultations')}>Back to Consultations</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
