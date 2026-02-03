import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Copy, AlertTriangle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDoctorName } from '@/lib/utils';

// Status can come from different tables with different allowed values
type ConsultationStatus = 'pending_payment' | 'booked' | 'confirmed' | 'requested' | 'in_progress' | 'completed' | 'cancelled' | 'no_answer';

interface ConsultationBooking {
  id: string;
  scheduledAt: Date;
  status: ConsultationStatus;
  doctorName: string | null;
  displayTimezone?: string;
  amountPaid?: number;
}

interface ConsultationDetailDialogProps {
  booking: ConsultationBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_payment: {
    label: 'Pending Payment',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  },
  booked: {
    label: 'Booked',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-primary/10 text-primary border-primary/20'
  },
  requested: {
    label: 'Requested',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-600 border-red-500/20'
  },
  no_answer: {
    label: 'No Answer',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
  }
};

export function ConsultationDetailDialog({ booking, open, onOpenChange }: ConsultationDetailDialogProps) {
  if (!booking) return null;

  const timezone = booking.displayTimezone || 'Australia/Brisbane';
  
  const getTimezoneAbbr = (date: Date, tz: string): string => {
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: tz,
      timeZoneName: 'short'
    }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
  };

  const timezoneAbbr = getTimezoneAbbr(booking.scheduledAt, timezone);
  const statusInfo = statusConfig[booking.status] || { label: booking.status, className: '' };
  const isUpcoming = booking.status === 'booked' || booking.status === 'confirmed';

  const copyBookingId = async () => {
    try {
      await navigator.clipboard.writeText(booking.id);
      toast({
        title: 'Copied',
        description: 'Booking ID copied to clipboard',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy booking ID',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consultation Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date, Time & Timezone */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(booking.scheduledAt, 'EEEE, MMMM d, yyyy')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(booking.scheduledAt, 'h:mm a')} {timezoneAbbr}</span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Doctor Name - only if available */}
          {booking.doctorName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{formatDoctorName(booking.doctorName)}</span>
            </div>
          )}

          {/* Amount Paid - only if exists */}
          {booking.amountPaid && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="font-medium">${booking.amountPaid}</span>
            </div>
          )}

          {/* Booking ID with Copy */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <span className="text-xs text-muted-foreground">Booking ID</span>
              <p className="font-mono text-sm">{booking.id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={copyBookingId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* No-Show Policy - only for upcoming bookings */}
          {isUpcoming && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  If you do not answer after 3 call attempts within the scheduled time, your consultation will be marked as a no-show. The $49 consultation fee is non-refundable for no-shows.
                </p>
              </div>
            </div>
          )}

          {/* Rescheduling Note - only for upcoming bookings */}
          {isUpcoming && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Need to change your appointment? Changes must be made at least 24 hours in advance. Use the "Manage" option from your consultations list.
                </p>
              </div>
            </div>
          )}

          {/* Book Another CTA */}
          <Button asChild className="w-full">
            <Link to="/patient/book">Book another consultation</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
