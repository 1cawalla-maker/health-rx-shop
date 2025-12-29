import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingWithPatient {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  status: BookingStatus;
  scheduled_date: string;
  time_window_start: string;
  time_window_end: string;
  reason_for_visit: string | null;
  patient_name: string;
  patient_phone: string | null;
  patient_dob: string | null;
}

export default function DoctorConsultations() {
  const [bookings, setBookings] = useState<BookingWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    // Fetch bookings
    const { data: bookingsData, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .order('scheduled_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
      return;
    }

    // Fetch patient profiles for all bookings
    const patientIds = bookingsData?.map(b => b.patient_id).filter(Boolean) || [];
    const { data: profiles } = patientIds.length > 0
      ? await supabase.from('profiles').select('user_id, full_name, phone, date_of_birth').in('user_id', patientIds)
      : { data: [] };

    const profileMap = new Map<string, { name: string; phone: string | null; dob: string | null }>();
    profiles?.forEach(p => {
      if (p.user_id) {
        profileMap.set(p.user_id, { 
          name: p.full_name || 'Unknown Patient', 
          phone: p.phone,
          dob: p.date_of_birth 
        });
      }
    });

    const bookingsWithPatients: BookingWithPatient[] = (bookingsData || []).map(b => ({
      ...b,
      patient_name: profileMap.get(b.patient_id)?.name || 'Unknown Patient',
      patient_phone: profileMap.get(b.patient_id)?.phone || null,
      patient_dob: profileMap.get(b.patient_id)?.dob || null,
    }));

    setBookings(bookingsWithPatients);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('consultation_bookings').update({ status }).eq('id', id);
    if (error) {
      toast.error('Failed to update booking');
      return;
    }
    toast.success('Booking updated');
    fetchBookings();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Consultations</h1>
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No consultations found.
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{booking.patient_name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(booking.scheduled_date), 'MMM d, yyyy')} • {booking.time_window_start} - {booking.time_window_end}
                      </span>
                    </div>
                    {booking.patient_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{booking.patient_phone}</span>
                      </div>
                    )}
                    {booking.reason_for_visit && (
                      <p className="text-sm text-muted-foreground">Reason: {booking.reason_for_visit}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{booking.status.replace('_', ' ')}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/doctor/booking/${booking.id}`}>View Details</Link>
                    </Button>
                    {booking.status === 'booked' && (
                      <Button size="sm" onClick={() => updateStatus(booking.id, 'in_progress')}>Start</Button>
                    )}
                    {booking.status === 'in_progress' && (
                      <Button size="sm" onClick={() => updateStatus(booking.id, 'completed')}>Complete</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
