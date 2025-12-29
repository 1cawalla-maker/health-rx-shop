import { Badge } from '@/components/ui/badge';
import type { BookingStatus, ConsultationStatus } from '@/types/database';

// Unified status type that handles both consultation_bookings and consultations tables
type AnyBookingStatus = BookingStatus | ConsultationStatus | string;

interface BookingStatusBadgeProps {
  status: AnyBookingStatus;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // consultation_bookings statuses
  pending_payment: {
    label: 'Pending Payment',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  },
  booked: {
    label: 'Booked',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  },
  no_answer: {
    label: 'No Answer',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
  },
  // consultations table statuses (legacy)
  requested: {
    label: 'Requested',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-primary/10 text-primary border-primary/20'
  },
  intake_pending: {
    label: 'Intake Pending',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  },
  ready_for_call: {
    label: 'Ready for Call',
    className: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  called: {
    label: 'Called',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  },
  script_uploaded: {
    label: 'Script Uploaded',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
  },
  // Shared statuses
  completed: {
    label: 'Completed',
    className: 'bg-success/10 text-success border-success/20'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  }
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: '' };
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
