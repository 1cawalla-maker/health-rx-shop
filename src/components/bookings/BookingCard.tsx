import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Phone, Calendar, Clock, User } from 'lucide-react';
import type { BookingWithPatient } from '@/types/database';

interface BookingCardProps {
  booking: BookingWithPatient;
  showPatient?: boolean;
  onViewDetails?: () => void;
  actions?: React.ReactNode;
}

export function BookingCard({ booking, showPatient, onViewDetails, actions }: BookingCardProps) {
  // Always use Phone icon (phone-only service model)
  const Icon = Phone;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Phone Consultation
              </CardTitle>
              {showPatient && booking.patient_profile && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{booking.patient_profile.full_name || 'Unknown Patient'}</span>
                </div>
              )}
            </div>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(booking.scheduled_at), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(booking.scheduled_at), 'h:mm a')}</span>
          </div>
        </div>

        {booking.reason_for_visit && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {booking.reason_for_visit}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
          )}
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
