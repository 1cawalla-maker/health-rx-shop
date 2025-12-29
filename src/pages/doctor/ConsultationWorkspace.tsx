import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Loader2, User, Phone, Calendar, Clock, FileText, 
  CheckCircle, AlertCircle, ChevronLeft, Pill, Send, PhoneCall
} from 'lucide-react';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';

const NICOTINE_STRENGTHS = ['3mg', '6mg', '9mg', '12mg'] as const;
const USAGE_TIERS = ['light', 'moderate', 'heavy'] as const;

export default function DoctorConsultationWorkspace() {
  const { id: bookingId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [intakeForm, setIntakeForm] = useState<any>(null);
  const [callAttempts, setCallAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Call logging
  const [callNotes, setCallNotes] = useState('');
  const [loggingCall, setLoggingCall] = useState(false);

  // Prescription form
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [nicotineStrength, setNicotineStrength] = useState<string>('6mg');
  const [usageTier, setUsageTier] = useState<string>('moderate');
  const [issuingPrescription, setIssuingPrescription] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (user && bookingId) {
      fetchData();
    }
  }, [user, bookingId]);

  const fetchData = async () => {
    if (!user || !bookingId) return;

    // Get doctor ID
    const { data: doctorData } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (doctorData) {
      setDoctorId(doctorData.id);
    }

    // Fetch booking from consultation_bookings
    const { data: bookingData, error: bookingError } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !bookingData) {
      toast.error('Booking not found');
      navigate('/doctor/bookings');
      return;
    }

    setBooking(bookingData);

    // Fetch patient profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', bookingData.patient_id)
      .single();

    setPatientProfile(profileData);

    // Fetch intake form
    const { data: intakeData } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    setIntakeForm(intakeData);

    // Fetch call attempts
    const { data: callData } = await supabase
      .from('call_attempts')
      .select('*')
      .eq('booking_id', bookingId)
      .order('attempted_at', { ascending: false });

    setCallAttempts(callData || []);
    setLoading(false);
  };

  const logCallAttempt = async (answered: boolean) => {
    if (!user || !bookingId || !doctorId) return;

    setLoggingCall(true);

    try {
      const attemptNumber = callAttempts.length + 1;

      const { error } = await supabase
        .from('call_attempts')
        .insert({
          booking_id: bookingId,
          doctor_id: doctorId,
          attempt_number: attemptNumber,
          notes: callNotes || (answered ? 'Patient answered' : 'No answer')
        });

      if (error) throw error;

      // Update booking status
      const newStatus = answered ? 'in_progress' : (attemptNumber >= 3 ? 'no_answer' : 'booked');
      
      await supabase
        .from('consultation_bookings')
        .update({ 
          status: newStatus,
          doctor_id: doctorId
        })
        .eq('id', bookingId);

      toast.success(answered ? 'Call logged - Patient answered' : 'Call attempt logged');
      setCallNotes('');
      fetchData();

      if (answered) {
        setShowPrescriptionForm(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to log call');
    } finally {
      setLoggingCall(false);
    }
  };

  const issuePrescription = async () => {
    if (!user || !bookingId || !doctorId || !booking) return;

    setIssuingPrescription(true);

    try {
      // Calculate quantities based on usage tier
      const { data: quantities, error: calcError } = await supabase
        .rpc('calculate_prescription_quantities', { _usage_tier: usageTier as 'light' | 'moderate' | 'heavy' });

      if (calcError || !quantities?.[0]) throw calcError || new Error('Failed to calculate quantities');

      const { daily_max_pouches, total_pouches, containers_allowed } = quantities[0];

      // Generate reference ID
      const referenceId = `RX-${Date.now().toString(36).toUpperCase()}`;

      // Calculate expiry (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      // Create prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from('doctor_issued_prescriptions')
        .insert({
          booking_id: bookingId,
          patient_id: booking.patient_id,
          doctor_id: doctorId,
          reference_id: referenceId,
          nicotine_strength: nicotineStrength as '3mg' | '6mg' | '9mg' | '12mg',
          usage_tier: usageTier as 'light' | 'moderate' | 'heavy',
          daily_max_pouches,
          total_pouches,
          containers_allowed,
          supply_days: 90,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Generate PDF
      await supabase.functions.invoke('generate-prescription-pdf', {
        body: { prescriptionId: prescription.id }
      });

      // Update booking status to completed
      await supabase
        .from('consultation_bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      toast.success('Prescription issued successfully!');
      navigate('/doctor/bookings');
    } catch (err: any) {
      console.error('Prescription error:', err);
      toast.error(err.message || 'Failed to issue prescription');
    } finally {
      setIssuingPrescription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Booking Not Found</h2>
          <Button onClick={() => navigate('/doctor/bookings')}>Go to Bookings</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Consultation Workspace</h1>
          <p className="text-muted-foreground text-sm">
            {patientProfile?.full_name || 'Patient'} • {format(new Date(booking.scheduled_date), 'MMM d, yyyy')}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{patientProfile?.full_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium text-lg">{intakeForm?.phone_number || patientProfile?.phone || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p className="font-medium">
                  {patientProfile?.date_of_birth 
                    ? format(new Date(patientProfile.date_of_birth), 'MMM d, yyyy')
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Time Window</Label>
                <p className="font-medium">
                  {booking.time_window_start?.slice(0, 5)} - {booking.time_window_end?.slice(0, 5)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intake Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Intake Form
              </CardTitle>
              <CardDescription>
                {intakeForm ? 'Completed by patient' : 'Not yet completed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intakeForm ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Symptoms / Reason for Visit</Label>
                    <p className="mt-1">{intakeForm.symptoms || 'Nicotine replacement therapy consultation'}</p>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Medical History</Label>
                      <p className="mt-1">{intakeForm.medical_history || 'None disclosed'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Allergies</Label>
                      <p className="mt-1">{intakeForm.allergies || 'None disclosed'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current Medications</Label>
                      <p className="mt-1">{intakeForm.current_medications || 'None disclosed'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Consent Given</Label>
                      <p className="mt-1">
                        {intakeForm.consent_given ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" /> Yes
                          </Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Patient has not completed the intake form yet</p>
                  <p className="text-sm mt-1">They should complete this before the consultation</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription Form */}
          {showPrescriptionForm && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Issue Prescription
                </CardTitle>
                <CardDescription>Complete the consultation by issuing a prescription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nicotine Strength</Label>
                    <Select value={nicotineStrength} onValueChange={setNicotineStrength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NICOTINE_STRENGTHS.map((strength) => (
                          <SelectItem key={strength} value={strength}>{strength}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Usage Tier</Label>
                    <Select value={usageTier} onValueChange={setUsageTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USAGE_TIERS.map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Prescription Details (90-day supply)</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on {usageTier} usage tier: 
                    {usageTier === 'light' && ' up to 5 pouches/day, 450 total pouches'}
                    {usageTier === 'moderate' && ' up to 10 pouches/day, 900 total pouches'}
                    {usageTier === 'heavy' && ' up to 15 pouches/day, 1350 total pouches'}
                  </p>
                </div>

                <Button 
                  onClick={issuePrescription} 
                  disabled={issuingPrescription}
                  className="w-full"
                >
                  {issuingPrescription ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Issue Prescription & Complete
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Call Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Call Patient
              </CardTitle>
              <CardDescription>
                {intakeForm?.phone_number || patientProfile?.phone || 'No phone number'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {intakeForm?.phone_number && (
                <a 
                  href={`tel:${intakeForm.phone_number}`}
                  className="flex items-center justify-center gap-2 w-full p-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call {intakeForm.phone_number}
                </a>
              )}

              <div className="space-y-2">
                <Label>Call Notes (optional)</Label>
                <Textarea
                  placeholder="Add notes about this call..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={() => logCallAttempt(false)}
                  disabled={loggingCall}
                >
                  No Answer
                </Button>
                <Button 
                  onClick={() => logCallAttempt(true)}
                  disabled={loggingCall}
                >
                  {loggingCall ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Answered'}
                </Button>
              </div>

              {!showPrescriptionForm && booking.status === 'in_progress' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowPrescriptionForm(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Issue Prescription
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Call History */}
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
            </CardHeader>
            <CardContent>
              {callAttempts.length > 0 ? (
                <div className="space-y-3">
                  {callAttempts.map((attempt, idx) => (
                    <div key={attempt.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">Attempt #{attempt.attempt_number}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(attempt.attempted_at), 'h:mm a')}
                        </span>
                      </div>
                      {attempt.notes && (
                        <p className="text-sm text-muted-foreground">{attempt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No calls logged yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
