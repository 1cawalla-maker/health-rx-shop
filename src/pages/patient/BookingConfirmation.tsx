import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockBookingService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { CheckCircle, Calendar, Clock, Phone, User, AlertTriangle, Loader2 } from 'lucide-react';
import type { MockBooking } from '@/types/telehealth';

export default function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<MockBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      const foundBooking = mockBookingService.getBooking(bookingId);
      setBooking(foundBooking);
      setLoading(false);
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4">Booking not found</h2>
        <Button asChild>
          <Link to="/patient/consultations">View My Consultations</Link>
        </Button>
      </div>
    );
  }

  const getTimezoneAbbr = () => {
    if (booking.displayTimezone === 'Australia/Brisbane') {
      return 'AEST';
    }
    return booking.displayTimezone;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-2">
          Your consultation has been scheduled successfully.
        </p>
      </div>

      {/* Booking Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Consultation Details</CardTitle>
            <Badge className="bg-success/10 text-success border-success/20">
              Confirmed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{booking.timeWindowStart} {getTimezoneAbbr()}</p>
              </div>
            </div>
          </div>

          {/* Consultation Type */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consultation Type</p>
              <p className="font-medium">Phone Call</p>
            </div>
          </div>

          {/* Assigned Doctor */}
          {booking.doctorName && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Assigned Doctor</p>
                <p className="font-medium text-lg">{booking.doctorName}</p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold">${(booking.amountPaid || 4900) / 100} AUD</span>
            </div>
            {booking.paidAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Paid on {format(new Date(booking.paidAt), 'MMMM d, yyyy h:mm a')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What to Expect */}
      <Card>
        <CardHeader>
          <CardTitle>What Happens Next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
              1
            </div>
            <p className="text-sm">
              <strong>Keep your phone nearby</strong> – The doctor will call you at your scheduled time.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
              2
            </div>
            <p className="text-sm">
              <strong>Answer the call</strong> – Make sure you're in a quiet place where you can speak freely.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
              3
            </div>
            <p className="text-sm">
              <strong>If eligible</strong> – The doctor may issue a prescription, which you can use in our shop.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* No-show Policy Reminder */}
      <Alert className="border-orange-500/50 bg-orange-500/10">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-orange-700 dark:text-orange-400">
          <strong>Reminder:</strong> If the doctor calls 3 times and you do not answer, your 
          consultation will be marked as a no-show and you will still be charged.
        </AlertDescription>
      </Alert>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link to="/patient/consultations">View My Consultations</Link>
        </Button>
      </div>
    </div>
  );
}