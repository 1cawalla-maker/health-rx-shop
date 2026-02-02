import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockBookingService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, CreditCard, Clock, AlertTriangle, ChevronLeft, Phone, Calendar } from 'lucide-react';

export default function BookingPayment() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<ReturnType<typeof mockBookingService.getBooking>>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (bookingId) {
      const foundBooking = mockBookingService.getBooking(bookingId);
      if (foundBooking) {
        setBooking(foundBooking);
        
        // Calculate time remaining from reservation
        if (foundBooking.reservationId) {
          const reservations = JSON.parse(localStorage.getItem('nicopatch_reservations') || '[]');
          const reservation = reservations.find((r: any) => r.id === foundBooking.reservationId);
          if (reservation) {
            const expiresAt = new Date(reservation.expiresAt).getTime();
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setTimeRemaining(remaining);
          }
        }
      } else {
        toast.error('Booking not found');
        navigate('/patient/book');
      }
      setLoading(false);
    }
  }, [bookingId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          // Reservation expired - cancel and redirect
          if (bookingId) {
            mockBookingService.cancelBooking(bookingId);
            toast.error('Your reservation has expired. Please try booking again.');
            navigate('/patient/book');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, bookingId, navigate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePayment = async () => {
    if (!policyAgreed) {
      toast.error('Please agree to the no-show policy');
      return;
    }

    if (!bookingId) return;

    setProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const confirmed = mockBookingService.confirmPayment(bookingId);
    
    if (confirmed) {
      toast.success('Payment successful!');
      navigate(`/patient/booking/confirmation/${bookingId}`);
    } else {
      toast.error('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (bookingId) {
      mockBookingService.cancelBooking(bookingId);
      toast.info('Booking cancelled');
    }
    navigate('/patient/book');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Complete Payment</h1>
          <p className="text-muted-foreground text-sm">Secure your consultation slot</p>
        </div>
      </div>

      {/* Time Warning */}
      {timeRemaining !== null && timeRemaining > 0 && (
        <Alert className={timeRemaining < 180 ? 'border-destructive/50 bg-destructive/10' : 'border-primary/50 bg-primary/10'}>
          <Clock className={`h-4 w-4 ${timeRemaining < 180 ? 'text-destructive' : 'text-primary'}`} />
          <AlertDescription className={timeRemaining < 180 ? 'text-destructive' : ''}>
            <strong>Time remaining:</strong> {formatTime(timeRemaining)} to complete your payment.
            {timeRemaining < 180 && ' Your reservation will expire soon!'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{booking.timeWindowStart} {booking.displayTimezone === 'Australia/Brisbane' ? 'AEST' : booking.displayTimezone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Phone Consultation</span>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>$49.00 AUD</span>
              </div>
            </div>

            {booking.doctorName && (
              <div className="bg-muted/50 rounded-lg p-3 mt-4">
                <p className="text-sm text-muted-foreground">Assigned Doctor</p>
                <p className="font-medium">{booking.doctorName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>Your payment is secure and encrypted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mock payment form - disabled inputs */}
            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input 
                value="4242 4242 4242 4242" 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry</Label>
                <Input 
                  value="12/25" 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input 
                  value="123" 
                  disabled 
                  className="bg-muted"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              Mock payment form - no real payment will be processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* No-show Policy */}
      <Alert className="border-orange-500/50 bg-orange-500/10">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-orange-700 dark:text-orange-400">
          <strong>Important No-Show Policy:</strong> If the doctor calls 3 times and you do not answer, 
          your consultation will be marked as a no-show and you will still be charged.
        </AlertDescription>
      </Alert>

      {/* Policy Agreement */}
      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="policy"
          checked={policyAgreed}
          onCheckedChange={(checked) => setPolicyAgreed(checked === true)}
        />
        <label htmlFor="policy" className="text-sm leading-relaxed cursor-pointer">
          I understand that if I do not answer 3 call attempts, my consultation will be marked as 
          no-show and I will still be charged the full consultation fee.
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="flex-1"
          disabled={processing}
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={!policyAgreed || processing}
          className="flex-1"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Pay $49.00 AUD'
          )}
        </Button>
      </div>
    </div>
  );
}