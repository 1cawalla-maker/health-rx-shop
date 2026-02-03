import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInHours } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, AlertTriangle, Info } from 'lucide-react';
import { formatDoctorName } from '@/lib/utils';
import { mockBookingService } from '@/services/consultationService';
import { toast } from '@/hooks/use-toast';
import type { BookingStatus } from '@/types/telehealth';

interface ManagedBooking {
  id: string;
  scheduledAt: Date;
  status: BookingStatus;
  doctorName: string | null;
  displayTimezone?: string;
}

interface ManageBookingDialogProps {
  booking: ManagedBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCancelled?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_payment: {
    label: 'Pending Payment',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  booked: {
    label: 'Confirmed',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  no_answer: {
    label: 'No Answer',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
};

const RESCHEDULING_POLICY = `You can change your consultation time up to 24 hours before your scheduled appointment, subject to availability. Changes within 24 hours are not permitted. Rescheduling does not include refunds. If you reschedule, your original time slot is released and may be booked by another patient. No-shows remain non-refundable.`;

export function ManageBookingDialog({
  booking,
  open,
  onOpenChange,
  onBookingCancelled,
}: ManageBookingDialogProps) {
  const navigate = useNavigate();
  const [isRescheduling, setIsRescheduling] = useState(false);

  if (!booking) return null;

  const timezone = booking.displayTimezone || 'Australia/Brisbane';
  const now = new Date();
  const hoursUntilAppointment = differenceInHours(booking.scheduledAt, now);
  const canReschedule = hoursUntilAppointment > 24;
  const isUpcoming = ['booked', 'confirmed'].includes(booking.status);

  const getTimezoneAbbr = (date: Date, tz: string): string => {
    return (
      new Intl.DateTimeFormat('en-AU', {
        timeZone: tz,
        timeZoneName: 'short',
      })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName')?.value || ''
    );
  };

  const timezoneAbbr = getTimezoneAbbr(booking.scheduledAt, timezone);
  const statusInfo = statusConfig[booking.status] || {
    label: booking.status,
    className: '',
  };

  const handleReschedule = () => {
    setIsRescheduling(true);

    // Cancel the current booking and release the slot
    mockBookingService.cancelBooking(booking.id);

    toast({
      title: 'Booking cancelled',
      description: 'Please select a new time for your consultation.',
    });

    onBookingCancelled?.();
    onOpenChange(false);
    setIsRescheduling(false);

    // Navigate to booking page
    navigate('/patient/book');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Consultation</DialogTitle>
          <DialogDescription>
            View and manage your upcoming consultation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(booking.scheduledAt, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(booking.scheduledAt, 'h:mm a')} {timezoneAbbr}
              </span>
            </div>
            {booking.doctorName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{formatDoctorName(booking.doctorName)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusInfo.className}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Reschedule Section - only for upcoming bookings */}
          {isUpcoming && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Change Appointment Time</h4>

              {canReschedule ? (
                <Button
                  onClick={handleReschedule}
                  variant="outline"
                  className="w-full"
                  disabled={isRescheduling}
                >
                  {isRescheduling ? 'Processing...' : 'Change time'}
                </Button>
              ) : (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700">
                      Changes cannot be made within 24 hours of your scheduled
                      appointment.
                    </p>
                  </div>
                </div>
              )}

              {/* Policy Info */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Rescheduling Policy
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {RESCHEDULING_POLICY}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button className="flex-1" onClick={() => navigate('/patient/book')}>
              Book another
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
