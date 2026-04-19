import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockBookingService } from '@/services/consultationService';
import { mockAvailabilityService } from '@/services/availabilityService';
import { supabase } from '@/integrations/supabase/client';
import { userPreferencesService } from '@/services/userPreferencesService';
import { getTimezoneAbbr } from '@/lib/datetime';
import { CONSULTATION_FEE_CENTS } from '@/config/consultations';
import { formatAudFromCents } from '@/lib/money';
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
  const [searchParams] = useSearchParams();
  const stripeSuccess = searchParams.get('stripeSuccess') === '1';
  const stripeCancelled = searchParams.get('stripeCancelled') === '1';

  const patientTz = useMemo(() => user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane', [user?.id]);

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
          const reservation = mockAvailabilityService.getReservations().find((r: any) => r.id === foundBooking.reservationId);
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

  // Stripe return handling: when coming back from Checkout, wait for webhook to confirm.
  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!stripeSuccess || !bookingId || !user?.id) return;

    // If we just returned from Stripe, this page is only for confirmation polling.
    // Never allow the user to start a new checkout from here (avoids "Edge Function returned non-2xx" loops
    // when the reservation has already been consumed/confirmed).
    setPolicyAgreed(true);

    let cancelled = false;
    setProcessing(true);

    const poll = async () => {
      const startedAt = Date.now();
      while (!cancelled && Date.now() - startedAt < 30_000) {
        // 1) check payment row
        const { data: payment } = await supabase
          .from('consultation_payments')
          .select('status, stripe_checkout_session_id')
          .eq('consultation_id', bookingId)
          .maybeSingle();

        if (payment?.status === 'paid') {
          toast.success('Payment successful!');
          navigate(`/patient/booking/confirmation/${bookingId}`);
          return;
        }

        // Fallback: if session_id differs, don't block the user forever.
        if (sessionId && payment?.stripe_checkout_session_id && payment.stripe_checkout_session_id !== sessionId) {
          break;
        }

        await new Promise((r) => setTimeout(r, 1500));
      }

      if (!cancelled) {
        toast.message('Payment received. We are still confirming your booking…');
        // Allow user to retry by refreshing; keep them on page.
        setProcessing(false);
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [bookingId, navigate, searchParams, user?.id]);

  // Countdown timer (reservation expiry)
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

    try {
      // Phase 2: real Stripe checkout. Server validates reservation + ownership.
      const { stripeSupabaseService } = await import('@/services/stripeSupabaseService');
      const { url } = await stripeSupabaseService.createConsultationCheckout({
        consultationId: bookingId,
        amountCents: CONSULTATION_FEE_CENTS,
      });

      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url;
    } catch (e) {
      console.error('Failed to start checkout:', e);
      const msg = (e as any)?.message || (e as any)?.error_description || 'Could not start secure checkout.';
      toast.error(msg);
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
                <span>{booking.timeWindowStart} {getTimezoneAbbr(new Date(`${booking.scheduledDate}T${booking.timeWindowStart}:00`), patientTz)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Phone Consultation</span>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatAudFromCents(CONSULTATION_FEE_CENTS)} AUD</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mt-4">
              <p className="text-sm text-muted-foreground">Doctor Assignment</p>
              <p className="font-medium text-muted-foreground">Assigned after payment confirmation</p>
            </div>
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
            {/* Payment form */}
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

      {stripeSuccess ? (
        <Alert className="border-primary/50 bg-primary/10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <AlertDescription>
            <strong>Payment received.</strong> We’re confirming your booking now…
          </AlertDescription>
        </Alert>
      ) : stripeCancelled ? (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            Payment was cancelled. You can try again, as long as your reservation hasn’t expired.
          </AlertDescription>
        </Alert>
      ) : (
        <>
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
            <Button variant="outline" onClick={handleCancel} className="flex-1" disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={!policyAgreed || processing} className="flex-1" size="lg">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ${formatAudFromCents(CONSULTATION_FEE_CENTS)} AUD`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}