import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import type { BookingStatus, BookingWithPatient } from '@/types/database';

export default function DoctorBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('consultations')
      .select('*')
      .or(`doctor_id.eq.${user.id},doctor_id.is.null`)
      .order('scheduled_at', { ascending: false });

    if (data && data.length > 0) {
      const patientIds = [...new Set(data.map(b => b.patient_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', patientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const bookingsWithProfiles = data.map(booking => ({
        ...booking,
        patient_profile: profileMap.get(booking.patient_id) || null
      }));

      setBookings(bookingsWithProfiles as BookingWithPatient[]);
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchQuery === '' || 
      booking.patient_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">All Bookings</h1>
        <p className="text-muted-foreground mt-1">Search and manage patient bookings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="intake_pending">Intake Pending</SelectItem>
                <SelectItem value="ready_for_call">Ready for Call</SelectItem>
                <SelectItem value="called">Called</SelectItem>
                <SelectItem value="script_uploaded">Script Uploaded</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">
                        {booking.patient_profile?.full_name || 'Unknown Patient'}
                      </span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(booking.scheduled_at), 'MMM d, yyyy at h:mm a')} • {booking.consultation_type}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/doctor/booking/${booking.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No bookings match your search criteria'
                  : 'No bookings found'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
