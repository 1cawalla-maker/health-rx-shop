import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths,
  isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Phone, Video } from 'lucide-react';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import type { BookingStatus } from '@/types/database';

type ViewMode = 'day' | 'week' | 'month';

interface Booking {
  id: string;
  scheduled_at: string;
  consultation_type: 'video' | 'phone';
  status: BookingStatus;
  patient_profile?: {
    full_name: string | null;
  };
}

export default function DoctorCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, currentDate, viewMode]);

  const fetchBookings = async () => {
    if (!user) return;

    let start: Date, end: Date;
    
    if (viewMode === 'day') {
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }

    const { data } = await supabase
      .from('consultations')
      .select('*')
      .or(`doctor_id.eq.${user.id},doctor_id.is.null`)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at');

    if (data && data.length > 0) {
      const patientIds = [...new Set(data.map(b => b.patient_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', patientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const bookingsWithProfiles = data.map(booking => ({
        ...booking,
        patient_profile: profileMap.get(booking.patient_id) || null
      }));

      setBookings(bookingsWithProfiles as Booking[]);
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(prev => direction === 'next' 
        ? new Date(prev.getTime() + 86400000) 
        : new Date(prev.getTime() - 86400000));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(b => isSameDay(new Date(b.scheduled_at), day));
  };

  const weekDays = viewMode === 'week' 
    ? eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) })
    : viewMode === 'month'
    ? eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })
    : [currentDate];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">View your scheduled consultations</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
              {viewMode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'day' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button 
              variant={viewMode === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {weekDays.map((day, idx) => {
                const dayBookings = getBookingsForDay(day);
                return (
                  <div 
                    key={idx} 
                    className={`min-h-24 p-2 border rounded-lg ${
                      isToday(day) ? 'bg-primary/5 border-primary' : 'border-border'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map(booking => (
                        <div key={booking.id} className="text-xs p-1 bg-primary/10 rounded truncate">
                          {format(new Date(booking.scheduled_at), 'h:mm a')}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`grid gap-4 ${viewMode === 'week' ? 'grid-cols-7' : ''}`}>
              {weekDays.map((day, idx) => {
                const dayBookings = getBookingsForDay(day);
                return (
                  <div 
                    key={idx} 
                    className={`space-y-2 ${viewMode === 'week' ? 'min-h-48' : ''}`}
                  >
                    <div className={`text-sm font-medium p-2 rounded-lg ${
                      isToday(day) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {format(day, viewMode === 'day' ? 'EEEE' : 'EEE d')}
                    </div>
                    <div className="space-y-2">
                      {dayBookings.length > 0 ? (
                        dayBookings.map(booking => (
                          <div 
                            key={booking.id} 
                            className="p-2 border rounded-lg text-sm space-y-1"
                          >
                            <div className="flex items-center gap-1">
                              {booking.consultation_type === 'phone' ? (
                                <Phone className="h-3 w-3" />
                              ) : (
                                <Video className="h-3 w-3" />
                              )}
                              <span className="font-medium">
                                {format(new Date(booking.scheduled_at), 'h:mm a')}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {booking.patient_profile?.full_name || 'Patient'}
                            </div>
                            <BookingStatusBadge status={booking.status} />
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground p-2">
                          No bookings
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
