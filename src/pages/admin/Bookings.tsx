import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, Calendar, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import type { BookingStatus } from '@/types/database';

interface Booking {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  scheduled_at: string;
  status: BookingStatus;
  consultation_type: 'video' | 'phone';
  reason_for_visit: string | null;
  patient_profile?: {
    full_name: string | null;
    phone: string | null;
  };
}

interface Doctor {
  id: string;
  user_id: string;
  profile?: {
    full_name: string | null;
  };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from('consultations')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (bookingsData) {
      // Fetch patient profiles
      const patientIds = [...new Set(bookingsData.map(b => b.patient_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', patientIds);

      const bookingsWithProfiles = bookingsData.map(b => ({
        ...b,
        status: b.status as BookingStatus,
        patient_profile: profiles?.find(p => p.user_id === b.patient_id),
      }));

      setBookings(bookingsWithProfiles);
    }

    // Fetch doctors
    const { data: doctorsData } = await supabase
      .from('doctors')
      .select('id, user_id')
      .eq('is_active', true);

    if (doctorsData) {
      const doctorUserIds = doctorsData.map(d => d.user_id);
      const { data: doctorProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', doctorUserIds);

      const doctorsWithProfiles = doctorsData.map(d => ({
        ...d,
        profile: doctorProfiles?.find(p => p.user_id === d.user_id),
      }));

      setDoctors(doctorsWithProfiles);
    }

    setLoading(false);
  };

  const assignDoctor = async (doctorUserId: string) => {
    if (!selectedBooking) return;

    await supabase
      .from('consultations')
      .update({ doctor_id: doctorUserId })
      .eq('id', selectedBooking.id);

    toast.success('Doctor assigned successfully');
    setAssignDialogOpen(false);
    fetchData();
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    await supabase
      .from('consultations')
      .update({ status })
      .eq('id', bookingId);

    toast.success('Booking status updated');
    fetchData();
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.patient_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.reason_for_visit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getDoctorName = (doctorId: string | null) => {
    if (!doctorId) return 'Unassigned';
    const doctor = doctors.find(d => d.user_id === doctorId);
    return doctor?.profile?.full_name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">All Bookings</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No bookings found.
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {booking.patient_profile?.full_name || 'Unknown Patient'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(booking.scheduled_at), 'PPp')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {booking.consultation_type}
                        </span>
                      </div>
                      {booking.reason_for_visit && (
                        <p className="text-sm mt-1">
                          <span className="text-muted-foreground">Reason: </span>
                          {booking.reason_for_visit}
                        </p>
                      )}
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Doctor: </span>
                        {getDoctorName(booking.doctor_id)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <BookingStatusBadge status={booking.status} />
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setAssignDialogOpen(true);
                      }}
                    >
                      Assign Doctor
                    </Button>
                    
                    {booking.status === 'requested' && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                    
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assign Doctor Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {doctors.length === 0 ? (
              <p className="text-muted-foreground text-center">No active doctors available.</p>
            ) : (
              doctors.map((doctor) => (
                <Button
                  key={doctor.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => assignDoctor(doctor.user_id)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {doctor.profile?.full_name || 'Unknown Doctor'}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
