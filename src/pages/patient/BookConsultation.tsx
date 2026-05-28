import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockAvailabilityService, supabaseAvailabilityService, getTimezoneAbbr } from '@/services/availabilityService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { mockBookingService } from '@/services/consultationService';
import { consultationsSupabaseService } from '@/services/consultationsSupabaseService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { Phone, Loader2, CalendarDays, Clock, AlertTriangle, Info } from 'lucide-react';
import type { FiveMinuteSlot } from '@/types/telehealth';
import { CONSULTATION_FEE_CENTS } from '@/config/consultations';
import { STRIPE_REVIEWER_EMAIL, isStripeReviewerEmail } from '@/config/stripeReview';
import { formatAudFromCents } from '@/lib/money';

export default function BookConsultation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<FiveMinuteSlot | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<FiveMinuteSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datesWithAvailability, setDatesWithAvailability] = useState<Set<string>>(new Set());

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 30);

  const patientTz = useMemo(
    () => (user?.id ? userPreferencesService.getTimezone(user.id) : 'Australia/Brisbane'),
    [user?.id]
  );
  const stripeReviewMode = isStripeReviewerEmail(user?.email);

  const formatHHmmInTz = (utcIso: string, tz: string): string => {
    const dtf = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    // en-GB gives HH:mm
    return dtf.format(new Date(utcIso));
  };

  // Reschedule mode detection and validation
  const isReschedule = searchParams.get('reschedule') === 'true';
  const rescheduleBookingId = searchParams.get('bookingId') || '';
  const amountPaidParam = searchParams.get('amountPaid');

  // Validate amountPaid: must be numeric, positive, and reasonable (max $1000 = 100000 cents)
  const rescheduleAmountPaid = useMemo(() => {
    if (!isReschedule) return 0;
    const parsed = parseInt(amountPaidParam || '', 10);
    // Validate: must be a positive number between 1 cent and $1000 (100000 cents)
    if (isNaN(parsed) || parsed <= 0 || parsed > 100000) {
      return null; // Invalid
    }
    return parsed;
  }, [isReschedule, amountPaidParam]);

  // If reschedule mode but invalid params, show error
  const rescheduleParamsValid = !isReschedule || (rescheduleBookingId && rescheduleAmountPaid !== null);

  // Load dates with availability on mount
  useEffect(() => {
    const run = async () => {
      try {
        if (stripeReviewMode) {
          const reviewDates = Array.from({ length: 14 }, (_, i) => format(addDays(minDate, i), 'yyyy-MM-dd'));
          setDatesWithAvailability(new Set(reviewDates));
          return;
        }

        const dates = await supabaseAvailabilityService.getDatesWithAvailability(minDate, maxDate);
        setDatesWithAvailability(new Set(dates));
      } catch (e) {
        console.error('Failed to load availability dates:', e);
        // Do NOT silently fall back in prod, otherwise the UI misrepresents real availability.
        if (import.meta.env.DEV) {
          const dates = mockAvailabilityService.getDatesWithAvailability(minDate, maxDate);
          setDatesWithAvailability(new Set(dates));
        } else {
          toast.error('Could not load live doctor availability');
          setDatesWithAvailability(new Set());
        }
      }
    };
    void run();
  }, [stripeReviewMode]);

  // Load slots when date changes
  useEffect(() => {
    const run = async () => {
      if (selectedDate) {
        setLoadingSlots(true);
        setSelectedSlot(undefined);

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        try {
          if (stripeReviewMode) {
            setAvailableSlots([
              {
                time: '10:00',
                date: dateStr,
                utcTimestamp: new Date(`${dateStr}T10:00:00+10:00`).toISOString(),
                displayTimezone: patientTz,
                timezoneAbbr: 'AEST',
                isAvailable: true,
                doctorIds: ['stripe-review-doctor'],
              },
            ]);
            return;
          }

          const slots = await supabaseAvailabilityService.getAggregatedSlotsForDate(dateStr);
          // Display times in the patient's timezone (MVP expectation)
          const display = (slots || [])
            .map((s) => {
              const utcIso = s.utcTimestamp;
              const displayTime = utcIso ? formatHHmmInTz(utcIso, patientTz) : s.time;
              const tzAbbr = utcIso ? getTimezoneAbbr(new Date(utcIso), patientTz) : s.timezoneAbbr;
              return {
                ...s,
                time: displayTime,
                displayTimezone: patientTz,
                timezoneAbbr: tzAbbr,
              };
            })
            // Keep stable ordering
            .sort((a, b) => (a.utcTimestamp || '').localeCompare(b.utcTimestamp || '') || a.time.localeCompare(b.time));
          setAvailableSlots(display);
        } catch (e) {
          console.error('Failed to load slots:', e);
          if (import.meta.env.DEV) {
            const slots = mockAvailabilityService.getAggregatedSlotsForDate(dateStr);
            setAvailableSlots(slots);
          } else {
            toast.error('Could not load live time slots');
            setAvailableSlots([]);
          }
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };

    void run();
  }, [selectedDate, patientTz, stripeReviewMode]);

  // Group slots by hour for better display
  const slotsByHour = useMemo(() => {
    const groups: Record<string, FiveMinuteSlot[]> = {};
    for (const slot of availableSlots) {
      const hour = slot.time.split(':')[0];
      if (!groups[hour]) {
        groups[hour] = [];
      }
      groups[hour].push(slot);
    }
    return groups;
  }, [availableSlots]);

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedSlot) {
      toast.error('Please select a date and time');
      return;
    }

    // Guard: slot must still be available (defensive against stale UI)
    if (!selectedSlot.isAvailable || (selectedSlot.doctorIds || []).length === 0) {
      toast.error('That time slot is no longer available. Please select another time.');
      setSelectedSlot(undefined);
      return;
    }

    // Validate reschedule params
    if (isReschedule && !rescheduleParamsValid) {
      toast.error('Invalid reschedule request. Please try again from your dashboard.');
      return;
    }

    setIsSubmitting(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      if (isReschedule && rescheduleAmountPaid) {
        // Atomic reschedule: validates slot + doctor availability + 24h rule,
        // creates new paid booking, cancels old
        const newBooking = mockBookingService.rescheduleBooking(
          rescheduleBookingId,
          user.id,
          dateStr,
          selectedSlot.time,
          selectedSlot.utcTimestamp,
          selectedSlot.displayTimezone,
          selectedSlot.doctorIds,
          rescheduleAmountPaid
        );
        
        toast.success('Consultation rescheduled successfully!');
        navigate(`/patient/booking/confirmation/${newBooking.id}`);
      } else {
        // Normal flow: create requested consultation, then let Supabase fairly choose
        // one eligible doctor for this exact slot. Do not pick doctorIds[0] in the frontend.
        const consultationId = crypto.randomUUID();

        await consultationsSupabaseService.createRequested({
          id: consultationId,
          patientId: user.id,
          scheduledAtIso: selectedSlot.utcTimestamp,
          timezone: selectedSlot.displayTimezone,
        });

        let reservation: any = null;
        if (!stripeReviewMode) {
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          const { data, error: reservationError } = await supabase.rpc(
            'create_fair_consultation_reservation' as any,
            {
              _consultation_id: consultationId,
              _expires_at: expiresAt,
            } as any
          ).single();

          if (reservationError) throw reservationError;
          reservation = data;
        }

        const booking = mockBookingService.createPendingBookingFromServerReservation({
          id: consultationId,
          patientId: user.id,
          doctorId: (reservation as any)?.doctor_id ?? null,
          date: dateStr,
          time: selectedSlot.time,
          utcTimestamp: selectedSlot.utcTimestamp,
          displayTimezone: selectedSlot.displayTimezone,
          reservationId: (reservation as any)?.reservation_id ?? (stripeReviewMode ? `stripe-review-${consultationId}` : undefined),
        });

        // Keep payment in-app and start embedded Stripe Checkout from the Proceed to Payment action.
        navigate(`/patient/booking/payment/${booking.id}?startCheckout=1`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const message = error instanceof Error ? error.message : 'Failed to create booking. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatYyyyMmDdInTz = (date: Date, tz: string): string => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  };

  // Check if a date has availability
  const dateHasAvailability = (date: Date): boolean => {
    const dateStr = formatYyyyMmDdInTz(date, patientTz);
    return datesWithAvailability.has(dateStr);
  };

  // Disable dates without availability
  const isDateDisabled = (date: Date): boolean => {
    if (isBefore(date, startOfDay(minDate)) || date > maxDate) {
      return true;
    }
    return !dateHasAvailability(date);
  };

  const getTimezoneLabel = (): string => {
    if (selectedSlot) {
      return selectedSlot.timezoneAbbr;
    }
    if (availableSlots.length > 0) {
      return availableSlots[0].timezoneAbbr;
    }
    return 'AEST';
  };

  if (!stripeReviewMode) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Consultation bookings temporarily paused</CardTitle>
            <CardDescription>
              We are temporarily pausing public consultation bookings while our payment review is underway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>If you need help, please contact PouchCare support.</p>
            <p>Reviewer access is available using the dedicated Stripe review account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Book Consultation</h1>
        <p className="text-muted-foreground mt-1">Schedule a phone consultation with a doctor</p>
      </div>

      <Alert className="border-blue-500/50 bg-blue-500/10">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          <strong>Stripe review mode:</strong> public bookings are paused. This reviewer account can access a controlled booking flow to review the PouchCare consultation payment page.
        </AlertDescription>
      </Alert>

      {/* Reschedule Mode Banner */}
      {isReschedule && rescheduleParamsValid && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            <strong>Rescheduling:</strong> Select a new time for your consultation. 
            No additional payment required.
          </AlertDescription>
        </Alert>
      )}

      {/* Invalid reschedule params error */}
      {isReschedule && !rescheduleParamsValid && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            <strong>Error:</strong> Invalid reschedule request. Please return to your 
            dashboard and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* No-show Policy Warning */}
      <Alert className="border-orange-500/50 bg-orange-500/10">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-orange-700 dark:text-orange-400">
          <strong>Important:</strong> If the doctor calls 3 times and you do not answer, your 
          consultation will be marked as a no-show and you will still be charged.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Select Date
            </CardTitle>
            <CardDescription>
              Choose a date for your consultation. Only dates with available slots are selectable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className="rounded-md border mx-auto pointer-events-auto"
              modifiers={{
                available: (date) => dateHasAvailability(date) && !isBefore(date, startOfDay(minDate)) && date <= maxDate,
              }}
              modifiersStyles={{
                // Soft highlight for dates with availability (on-brand, easier on the eyes)
                available: {
                  fontWeight: 600,
                  backgroundColor: 'hsl(var(--primary) / 0.12)',
                  color: 'hsl(var(--primary))',
                  borderRadius: '10px',
                },
              }}
            />
            {datesWithAvailability.size === 0 && (
              <p className="text-center text-muted-foreground mt-4 text-sm">
                No appointments available in the next 30 days.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Time
            </CardTitle>
            <CardDescription>
              {selectedDate 
                ? `Available 5-minute slots for ${format(selectedDate, 'EEEE, MMMM d')} (${getTimezoneLabel()})`
                : 'Select a date to see available times'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a date to view available times</p>
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No available slots for this date.</p>
                <p className="text-sm mt-1">Try selecting a different date.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(slotsByHour)
                  .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
                  .map(([hour, slots]) => (
                  <div key={hour}>
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                      {hour}:00 - {hour}:59
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {slots.map((slot) => {
                        const isDisabled = !slot.isAvailable || (slot.doctorIds || []).length === 0;
                        return (
                          <Button
                            key={slot.time}
                            variant={selectedSlot?.time === slot.time ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedSlot(slot)}
                            className="text-xs h-8"
                            disabled={isDisabled}
                            title={isDisabled ? 'No doctors available at this time' : undefined}
                          >
                            {slot.time}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary & Submit */}
      {selectedDate && selectedSlot && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">Phone Consultation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedSlot.time} {selectedSlot.timezoneAbbr}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-primary font-bold">$</div>
                <div>
                  <p className="text-sm text-muted-foreground">Fee</p>
                  <p className="font-medium">
                    {isReschedule && rescheduleParamsValid ? 'Already paid' : `${formatAudFromCents(CONSULTATION_FEE_CENTS)} AUD`}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>A doctor will be assigned after booking confirmation. You will be called at the scheduled time.</p>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={isSubmitting || (isReschedule && !rescheduleParamsValid)}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing payment...
                </span>
              ) : isReschedule && rescheduleParamsValid ? (
                'Confirm New Time'
              ) : (
                `Proceed to Payment (${formatAudFromCents(CONSULTATION_FEE_CENTS)})`
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By booking, you agree to our terms of service and no-show policy.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
