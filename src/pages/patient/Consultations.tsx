import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { mockBookingService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Phone, Loader2, User, Eye, Settings } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { formatDoctorName } from '@/lib/utils';
import { ConsultationDetailDialog } from '@/components/patient/ConsultationDetailDialog';
import { ManageBookingDialog } from '@/components/patient/ManageBookingDialog';
import type { MockBooking, BookingStatus } from '@/types/telehealth';

interface Consultation {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface CombinedBooking {
  id: string;
  scheduledAt: Date;
  status: BookingStatus;
  doctorName: string | null;
  displayTimezone?: string;
  isMock: boolean;
  amountPaid?: number;
}

export default function PatientConsultations() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [mockBookings, setMockBookings] = useState<MockBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<CombinedBooking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedBookingForManage, setSelectedBookingForManage] = useState<CombinedBooking | null>(null);

  const refreshBookings = () => {
    if (user) {
      const bookings = mockBookingService.getPatientBookings(user.id);
      setMockBookings(bookings);
      fetchConsultations();
    }
  };

  useEffect(() => {
    if (user) {
      fetchConsultations();
      // Also load mock bookings from localStorage
      const bookings = mockBookingService.getPatientBookings(user.id);
      setMockBookings(bookings);
    }
  }, [user]);

  const fetchConsultations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', user.id)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching consultations:', error);
    } else {
      setConsultations(data || []);
    }
    setLoading(false);
  };

  // Combine and filter consultations
  const allBookings: CombinedBooking[] = [
    ...mockBookings.map(b => ({
      id: b.id,
      scheduledAt: new Date(`${b.scheduledDate}T${b.timeWindowStart}:00`),
      status: b.status,
      doctorName: b.doctorName,
      displayTimezone: b.displayTimezone,
      isMock: true,
      amountPaid: ['booked', 'confirmed', 'completed', 'in_progress', 'no_answer'].includes(b.status) ? 49 : undefined,
    })),
    ...consultations.map(c => ({
      id: c.id,
      scheduledAt: new Date(c.scheduled_at),
      status: c.status as BookingStatus,
      doctorName: null,
      displayTimezone: undefined,
      isMock: false,
      amountPaid: ['booked', 'confirmed', 'completed', 'in_progress', 'no_answer'].includes(c.status) ? 49 : undefined,
    })),
  ];

  const openDetails = (booking: CombinedBooking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const getTimezoneAbbr = (date: Date, timezone: string): string => {
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: timezone,
      timeZoneName: 'short'
    }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
  };

  const upcomingBookings = allBookings.filter(
    b => !isPast(b.scheduledAt) && ['booked', 'pending_payment', 'in_progress', 'requested', 'confirmed'].includes(b.status)
  );
  
  const pastBookings = allBookings.filter(
    b => isPast(b.scheduledAt) || ['completed', 'cancelled', 'no_answer'].includes(b.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Payment</Badge>;
      case 'booked':
      case 'confirmed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Confirmed</Badge>;
      case 'requested':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Requested</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      case 'no_answer':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">No Answer</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const BookingCard = ({ booking }: { booking: CombinedBooking }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Phone Consultation</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(booking.scheduledAt, 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(booking.scheduledAt, 'h:mm a')} {getTimezoneAbbr(booking.scheduledAt, booking.displayTimezone || 'Australia/Brisbane')}
                </span>
              </div>
              {booking.doctorName && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDoctorName(booking.doctorName)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(booking.status)}
            {['booked', 'confirmed'].includes(booking.status) && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  setSelectedBookingForManage(booking);
                  setManageDialogOpen(true);
                }}
                title="Manage booking"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => openDetails(booking)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Consultations</h1>
          <p className="text-muted-foreground mt-1">View and manage your consultations</p>
        </div>
        <Button asChild>
          <Link to="/patient/book">Book New</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">No upcoming consultations</CardTitle>
                <CardDescription>
                  Book a consultation to speak with a doctor
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link to="/patient/book">Book Consultation</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastBookings.length > 0 ? (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">No past consultations</CardTitle>
                <CardDescription>
                  Your completed consultations will appear here
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConsultationDetailDialog
        booking={selectedBooking}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ManageBookingDialog
        booking={selectedBookingForManage}
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        onBookingCancelled={refreshBookings}
      />
    </div>
  );
}