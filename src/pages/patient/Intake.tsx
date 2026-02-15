import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockBookingService } from '@/services/consultationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientIntake() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const booking = useMemo(() => {
    if (!bookingId) return null;
    // Phase 1: localStorage-only booking lookup.
    return mockBookingService.getBooking(bookingId);
  }, [bookingId]);

  const scheduledText = useMemo(() => {
    if (!booking) return null;
    const dt = new Date(`${booking.scheduledDate}T${booking.timeWindowStart}:00`);
    return format(dt, 'MMMM d, yyyy at h:mm a');
  }, [booking]);

  // Basic access guard: must be logged in and must own the booking.
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
        <p className="text-muted-foreground mt-1">Phase 1: intake form submission is disabled</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Phase 1 Stub</CardTitle>
          <CardDescription>
            Intake forms will be stored in Phase 2 (Supabase table + validation). For Phase 1 we avoid Supabase writes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {scheduledText && (
            <p>
              Your consultation is scheduled for <strong>{scheduledText}</strong>.
            </p>
          )}
          <p>
            For testing, continue using the booking + rescheduling flows. We’ll wire intake persistence in Phase 2.
          </p>
          <div>
            <Button onClick={() => navigate('/patient/consultations')}>Back to Consultations</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
