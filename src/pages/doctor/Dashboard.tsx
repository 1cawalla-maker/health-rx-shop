import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Loader2, User, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface BookingWithPatient {
  id: string;
  patient_id: string;
  status: string;
  scheduled_date: string;
  time_window_start: string;
  time_window_end: string;
  patient_name: string;
  patient_phone: string | null;
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState({ consultations: 0, pendingPrescriptions: 0 });
  const [recentBookings, setRecentBookings] = useState<BookingWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch upcoming consultations
    const { data: bookings } = await supabase
      .from('consultations')
      .select('*')
      .in('status', ['requested', 'confirmed', 'intake_pending', 'ready_for_call'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);
    
    // Fetch patient names
    const patientIds = bookings?.map(b => b.patient_id).filter(Boolean) || [];
    const { data: profiles } = patientIds.length > 0 
      ? await supabase.from('profiles').select('user_id, full_name, phone').in('user_id', patientIds)
      : { data: [] };
    
    const profileMap = new Map<string, { name: string; phone: string | null }>();
    profiles?.forEach(p => {
      if (p.user_id) {
        profileMap.set(p.user_id, { name: p.full_name || 'Patient', phone: p.phone });
      }
    });
    
    const bookingsWithNames: BookingWithPatient[] = (bookings || []).map(b => ({
      id: b.id,
      patient_id: b.patient_id,
      status: b.status,
      scheduled_date: b.scheduled_at.split('T')[0],
      time_window_start: new Date(b.scheduled_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      time_window_end: b.end_time ? new Date(b.end_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : '',
      patient_name: profileMap.get(b.patient_id)?.name || 'Patient',
      patient_phone: profileMap.get(b.patient_id)?.phone || null,
    }));

    // Fetch pending prescriptions count
    const { count: pendingCount } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review');

    setRecentBookings(bookingsWithNames);
    setStats({
      consultations: bookings?.length || 0,
      pendingPrescriptions: pendingCount || 0
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Doctor Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Consultations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.consultations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions to Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingPrescriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild size="sm" className="w-full"><Link to="/doctor/consultations">View Consultations</Link></Button>
            <Button asChild size="sm" variant="outline" className="w-full"><Link to="/doctor/prescriptions">Review Prescriptions</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Upcoming Consultations</CardTitle></CardHeader>
        <CardContent>
          {recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <Link 
                  key={booking.id} 
                  to={`/doctor/booking/${booking.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{booking.patient_name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.scheduled_date), 'MMM d, yyyy')} • {booking.time_window_start} - {booking.time_window_end}
                    </p>
                    {booking.patient_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{booking.patient_phone}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">{booking.status.replace('_', ' ')}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming consultations</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
