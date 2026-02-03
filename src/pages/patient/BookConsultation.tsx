import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockAvailabilityService } from '@/services/availabilityService';
import { mockBookingService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { Phone, Loader2, CalendarDays, Clock, AlertTriangle, Info } from 'lucide-react';
import type { FiveMinuteSlot } from '@/types/telehealth';

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
    const dates = mockAvailabilityService.getDatesWithAvailability(minDate, maxDate);
    setDatesWithAvailability(new Set(dates));
  }, []);

  // Load slots when date changes
  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true);
      setSelectedSlot(undefined);
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const slots = mockAvailabilityService.getAggregatedSlotsForDate(dateStr);
      setAvailableSlots(slots);
      setLoadingSlots(false);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate]);

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
        // Normal flow: create pending booking and go to payment
        const booking = mockBookingService.createBooking(
          user.id,
          dateStr,
          selectedSlot.time,
          selectedSlot.utcTimestamp,
          selectedSlot.displayTimezone,
          selectedSlot.doctorIds
        );

        toast.success('Proceeding to payment...');
        navigate(`/patient/booking/payment/${booking.id}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const message = error instanceof Error ? error.message : 'Failed to create booking. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if a date has availability
  const dateHasAvailability = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Book Consultation</h1>
        <p className="text-muted-foreground mt-1">Schedule a phone consultation with a doctor</p>
      </div>

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
                available: { fontWeight: 'bold' },
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
                {Object.entries(slotsByHour).map(([hour, slots]) => (
                  <div key={hour}>
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                      {hour}:00 - {hour}:59
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {slots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedSlot?.time === slot.time ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                          className="text-xs h-8"
                        >
                          {slot.time}
                        </Button>
                      ))}
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
                    {isReschedule && rescheduleParamsValid ? 'Already paid' : '$49 AUD'}
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isReschedule && rescheduleParamsValid ? (
                'Confirm New Time'
              ) : (
                'Proceed to Payment ($49)'
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