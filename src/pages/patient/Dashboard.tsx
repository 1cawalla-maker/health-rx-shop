import { useEffect, useState, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { mockBookingService } from '@/services/consultationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { ManageBookingDialog } from '@/components/patient/ManageBookingDialog';
import { Calendar, FileText, ShoppingBag, Upload, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { formatDoctorName } from '@/lib/utils';
import type { MockBooking, BookingStatus } from '@/types/telehealth';

interface OutletContext {
  hasActivePrescription: boolean;
  checkActivePrescription: () => void;
}

interface CombinedBooking {
  id: string;
  scheduledAt: Date;
  status: BookingStatus;
  doctorName: string | null;
  displayTimezone?: string;
  amountPaid?: number;
}

// Helper to get timezone abbreviation (AEST/AEDT)
const getTimezoneLabel = (date: Date, timezone: string = 'Australia/Sydney'): string => {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone,
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  return tzPart?.value || 'AEST';
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const { hasActivePrescription } = useOutletContext<OutletContext>();
  const [mockBookings, setMockBookings] = useState<MockBooking[]>([]);
  const [prescriptionStatus, setPrescriptionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedBookingForManage, setSelectedBookingForManage] = useState<CombinedBooking | null>(null);

  const refreshBookings = () => {
    if (user) {
      const bookings = mockBookingService.getPatientBookings(user.id);
      setMockBookings(bookings);
    }
  };

  useEffect(() => {
    if (user) {
      // Load mock bookings from localStorage
      refreshBookings();
      fetchPrescriptionData();
    }
  }, [user]);

  // Combine mock bookings into unified format
  const allBookings: CombinedBooking[] = useMemo(() => {
    return mockBookings.map(b => ({
      id: b.id,
      scheduledAt: new Date(`${b.scheduledDate}T${b.timeWindowStart}:00`),
      status: b.status,
      doctorName: b.doctorName,
      displayTimezone: b.displayTimezone,
      amountPaid: ['booked', 'confirmed', 'completed', 'in_progress', 'no_answer'].includes(b.status) ? 49 : undefined,
    }));
  }, [mockBookings]);

  // Derive next upcoming booking
  const nextBooking: CombinedBooking | null = useMemo(() => {
    // 'booked' represents confirmed bookings in our mock data
    const upcomingStatuses: BookingStatus[] = ['booked'];
    const now = new Date();
    
    return allBookings
      .filter(b => upcomingStatuses.includes(b.status) && new Date(b.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] || null;
  }, [allBookings]);

  const fetchPrescriptionData = async () => {
    if (!user) return;

    // Fetch latest prescription
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (prescriptions && prescriptions.length > 0) {
      setPrescriptionStatus(prescriptions[0]);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to your patient portal</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/patient/book">
            <Calendar className="h-6 w-6 text-primary" />
            <span>Book Consultation</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/patient/upload-prescription">
            <Upload className="h-6 w-6 text-primary" />
            <span>Upload Prescription</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/patient/prescriptions">
            <FileText className="h-6 w-6 text-primary" />
            <span>View Prescriptions</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/patient/shop">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span>Shop Products</span>
          </Link>
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Next Consultation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Consultation</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-16 bg-muted animate-pulse rounded" />
            ) : nextBooking ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {new Date(nextBooking.scheduledAt).toLocaleDateString('en-AU', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  <BookingStatusBadge status={nextBooking.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(nextBooking.scheduledAt).toLocaleTimeString('en-AU', {
                    hour: '2-digit', minute: '2-digit'
                  })} ({getTimezoneLabel(new Date(nextBooking.scheduledAt), nextBooking.displayTimezone)})
                </p>
                {nextBooking.doctorName && (
                  <p className="text-sm flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDoctorName(nextBooking.doctorName)}</span>
                  </p>
                )}
                <div className="pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setSelectedBookingForManage(nextBooking);
                      setManageDialogOpen(true);
                    }}
                  >
                    Manage
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No upcoming consultations</p>
                <Button asChild>
                  <Link to="/patient/book">Book a Consultation</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prescription Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescription Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-16 bg-muted animate-pulse rounded" />
            ) : prescriptionStatus ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {prescriptionStatus.status === 'active' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : prescriptionStatus.status === 'pending_review' ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {getStatusBadge(prescriptionStatus.status)}
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {prescriptionStatus.prescription_type} prescription
                </p>
                {prescriptionStatus.expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(prescriptionStatus.expires_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">No prescriptions yet</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/patient/upload-prescription">Upload</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shop Access */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop Access</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasActivePrescription ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Unlocked</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can now order products
                </p>
                <Button asChild size="sm">
                  <Link to="/patient/shop">Browse Shop</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Locked</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get a prescription to unlock
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">How to get started</CardTitle>
          <CardDescription>
            Follow these steps to access nicotine pouch products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
              <span>Book a consultation with one of our doctors or upload an existing prescription</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
              <span>Complete your medical assessment during the consultation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
              <span>If clinically appropriate, receive a prescription that unlocks the shop</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</span>
              <span>Order products within your prescription limits</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Manage Booking Dialog */}
      <ManageBookingDialog
        booking={selectedBookingForManage}
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        onBookingCancelled={refreshBookings}
      />
    </div>
  );
}
