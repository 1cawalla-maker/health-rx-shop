import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { IntakeFormComponent } from '@/components/intake/IntakeFormComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientIntake() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [existingIntake, setExistingIntake] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && bookingId) {
      fetchBookingAndIntake();
    }
  }, [user, bookingId]);

  const fetchBookingAndIntake = async () => {
    if (!user || !bookingId) return;

    // Fetch booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', bookingId)
      .eq('patient_id', user.id)
      .single();

    if (bookingError || !bookingData) {
      navigate('/patient/consultations');
      return;
    }

    setBooking(bookingData);

    // Check for existing intake
    const { data: intakeData } = await supabase
      .from('intake_forms')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    setExistingIntake(!!intakeData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find this booking or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/patient/consultations')}>
            Go to Consultations
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (existingIntake) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Intake Already Completed</h2>
            <p className="text-muted-foreground mb-4">
              You have already submitted the intake form for this consultation.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Your consultation is scheduled for{' '}
              <strong>{format(new Date(booking.scheduled_at), 'MMMM d, yyyy at h:mm a')}</strong>
            </p>
            <Button onClick={() => navigate('/patient/consultations')}>
              View Consultations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Complete Intake Form</h1>
        <p className="text-muted-foreground mt-1">
          For your consultation on {format(new Date(booking.scheduled_at), 'MMMM d, yyyy at h:mm a')}
        </p>
      </div>

      <IntakeFormComponent 
        bookingId={bookingId!} 
        onComplete={() => navigate('/patient/consultations')}
      />
    </div>
  );
}
