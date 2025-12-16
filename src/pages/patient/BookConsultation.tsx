import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format, addDays, setHours, setMinutes, isBefore } from 'date-fns';
import { Phone, Video, Loader2, CalendarDays, Clock } from 'lucide-react';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export default function BookConsultation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [consultationType, setConsultationType] = useState<'video' | 'phone'>('video');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

    if (isBefore(scheduledAt, new Date())) {
      toast.error('Please select a future date and time');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('consultations')
      .insert({
        patient_id: user.id,
        scheduled_at: scheduledAt.toISOString(),
        consultation_type: consultationType,
        status: 'requested'
      });

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to book consultation. Please try again.');
      console.error('Error booking consultation:', error);
    } else {
      toast.success('Consultation booked successfully!');
      navigate('/patient/consultations');
    }
  };

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 30);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Book Consultation</h1>
        <p className="text-muted-foreground mt-1">Schedule an online consultation with a doctor</p>
      </div>

      <div className="grid gap-6">
        {/* Consultation Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Consultation Type
            </CardTitle>
            <CardDescription>Choose how you'd like to meet with the doctor</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={consultationType}
              onValueChange={(value) => setConsultationType(value as 'video' | 'phone')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="video" id="video" className="peer sr-only" />
                <Label
                  htmlFor="video"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors"
                >
                  <Video className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Video Call</span>
                  <span className="text-xs text-muted-foreground">Face-to-face consultation</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="phone" id="phone" className="peer sr-only" />
                <Label
                  htmlFor="phone"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors"
                >
                  <Phone className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Phone Call</span>
                  <span className="text-xs text-muted-foreground">Audio consultation</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Select Date
            </CardTitle>
            <CardDescription>Choose a date for your consultation</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => 
                isBefore(date, minDate) || 
                date > maxDate ||
                date.getDay() === 0 || 
                date.getDay() === 6
              }
              className="rounded-md border mx-auto"
            />
          </CardContent>
        </Card>

        {/* Time Selection */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Select Time
              </CardTitle>
              <CardDescription>
                Available slots for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => setSelectedTime(time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary & Submit */}
        {selectedDate && selectedTime && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{consultationType} consultation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{selectedTime} AEST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee:</span>
                  <span className="font-medium">$49 AUD</span>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm Booking'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By booking, you agree to our terms of service and cancellation policy.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
