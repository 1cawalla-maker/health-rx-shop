import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorPortalService } from '@/services/doctorPortalService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Phone, Settings } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { CountdownChip } from '@/components/bookings/CountdownChip';
import type { MockBooking, BookingStatus } from '@/types/telehealth';

interface RowBooking {
  id: string;
  scheduledAt: Date;
  status: BookingStatus;
  patientId: string;
  doctorName: string | null;
  displayTimezone?: string;
  raw: MockBooking;
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Payment</Badge>;
    case 'booked':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Booked</Badge>;
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

export default function DoctorBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MockBooking[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setBookings(doctorPortalService.getDoctorBookings(user.id));
  }, [user?.id]);

  const rows: RowBooking[] = useMemo(() => {
    return bookings.map((b) => ({
      id: b.id,
      scheduledAt: new Date(`${b.scheduledDate}T${b.timeWindowStart}:00`),
      status: b.status,
      patientId: b.patientId,
      doctorName: b.doctorName,
      displayTimezone: b.displayTimezone,
      raw: b,
    }));
  }, [bookings]);

  const upcoming = rows
    .filter((r) => !isPast(r.scheduledAt) && ['booked', 'pending_payment', 'in_progress'].includes(r.status))
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const past = rows
    .filter((r) => isPast(r.scheduledAt) || ['completed', 'cancelled', 'no_answer'].includes(r.status))
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  const getTimezoneAbbr = (date: Date, timezone: string): string => {
    return (
      new Intl.DateTimeFormat('en-AU', { timeZone: timezone, timeZoneName: 'short' })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName')?.value || ''
    );
  };

  const BookingCard = ({ b }: { b: RowBooking }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Phone Consultation</h3>
                {statusBadge(b.status)}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(b.scheduledAt, 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(b.scheduledAt, 'h:mm a')} {getTimezoneAbbr(b.scheduledAt, b.displayTimezone || 'Australia/Brisbane')}
                </span>
                <CountdownChip targetMs={b.scheduledAt.getTime()} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Patient ID: {b.patientId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/doctor/booking/${b.id}`}>
                <Settings className="h-4 w-4 mr-2" />
                Open
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground mt-1">Phase 1: mock/localStorage doctor queue</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length ? (
            <div className="space-y-4">
              {upcoming.map((b) => (
                <BookingCard key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">No upcoming bookings</CardTitle>
                <CardDescription>Mock bookings will appear here once patients book.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {past.length ? (
            <div className="space-y-4">
              {past.map((b) => (
                <BookingCard key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">No past bookings</CardTitle>
                <CardDescription>Completed/no-answer bookings will appear here.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
