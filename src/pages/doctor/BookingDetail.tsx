import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Loader2, User, Phone, Calendar, Clock, FileText, 
  Upload, CheckCircle, AlertCircle, ChevronLeft, Pill
} from 'lucide-react';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { PatientEligibilitySummary } from '@/components/doctor/PatientEligibilitySummary';
import { PrescriptionForm } from '@/components/doctor/PrescriptionForm';
import type { ConsultationStatus, IntakeForm, ConsultationNote, BookingFile } from '@/types/database';

interface DoctorInfo {
  id: string;
  fullName: string;
  ahpraNumber: string | null;
  providerNumber: string | null;
}

export default function DoctorBookingDetail() {
  const { id: bookingId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [booking, setBooking] = useState<any>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [patientMedicalProfile, setPatientMedicalProfile] = useState<any>(null);
  const [intakeForm, setIntakeForm] = useState<IntakeForm | null>(null);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [files, setFiles] = useState<BookingFile[]>([]);
  const [existingPrescription, setExistingPrescription] = useState<any>(null);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  useEffect(() => {
    if (user && bookingId) {
      fetchBookingDetails();
    }
  }, [user, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId || !user) return;

    try {
      // Fetch booking from consultations table
      const { data: bookingData, error: bookingError } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError) {
        console.error('Booking fetch error:', bookingError);
        toast.error('Failed to load booking');
        return;
      }

      if (!bookingData) {
        toast.error('Booking not found');
        navigate('/doctor/bookings');
        return;
      }

      setBooking(bookingData);

      // Fetch doctor info
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id, ahpra_number, provider_number, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorData) {
        // Get doctor's full name from profiles
        const { data: doctorProfileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        setDoctorInfo({
          id: doctorData.id,
          fullName: doctorProfileData?.full_name || '',
          ahpraNumber: doctorData.ahpra_number,
          providerNumber: doctorData.provider_number,
        });
      }

      // Fetch patient profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', bookingData.patient_id)
        .maybeSingle();

      setPatientProfile(profileData);

      // Fetch patient medical profile
      const { data: medicalProfileData } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', bookingData.patient_id)
        .maybeSingle();

      setPatientMedicalProfile(medicalProfileData);

      // Fetch intake form
      const { data: intakeData } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      setIntakeForm(intakeData as IntakeForm | null);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('consultation_notes')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      setNotes((notesData || []) as ConsultationNote[]);

      // Fetch files
      const { data: filesData } = await supabase
        .from('booking_files')
        .select('*')
        .eq('booking_id', bookingId)
        .order('uploaded_at', { ascending: false });

      setFiles((filesData || []) as BookingFile[]);

      // Check for existing prescription
      const { data: prescriptionData } = await supabase
        .from('doctor_issued_prescriptions')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      setExistingPrescription(prescriptionData);

    } catch (err) {
      console.error('Error fetching booking details:', err);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: ConsultationStatus) => {
    if (!user || !bookingId || !doctorInfo) return;

    const updates: any = { 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    };

    // Assign doctor if not already assigned
    if (!booking.doctor_id) {
      updates.doctor_id = user.id;
    }

    const { error } = await supabase
      .from('consultations')
      .update(updates)
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchBookingDetails();
    }
  };

  const saveNote = async () => {
    if (!user || !bookingId || !newNote.trim()) return;

    setSavingNote(true);
    const { error } = await supabase
      .from('consultation_notes')
      .insert({
        booking_id: bookingId,
        doctor_id: user.id,
        notes: newNote.trim(),
        internal_only: true
      });

    setSavingNote(false);

    if (error) {
      toast.error('Failed to save note');
    } else {
      toast.success('Note saved');
      setNewNote('');
      fetchBookingDetails();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !bookingId || !booking || !doctorInfo) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setUploadingFile(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${booking.patient_id}/${bookingId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('booking-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save file metadata
      const { error: dbError } = await supabase
        .from('booking_files')
        .insert({
          booking_id: bookingId,
          patient_id: booking.patient_id,
          doctor_id: doctorInfo.id,
          storage_path: fileName,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size
        });

      if (dbError) throw dbError;

      toast.success('File uploaded successfully');
      fetchBookingDetails();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrescriptionComplete = () => {
    navigate('/doctor/bookings');
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

  const canShowPrescriptionForm = 
    booking.status !== 'completed' && 
    booking.status !== 'cancelled' && 
    booking.status !== 'pending_payment' &&
    !existingPrescription &&
    doctorInfo;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Booking Details</h1>
          <p className="text-muted-foreground text-sm">ID: {bookingId}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
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
                <p className="font-medium">{patientProfile?.phone || intakeForm?.phone_number || 'Not provided'}</p>
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
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/doctor/patient/${booking.patient_id}`}>View Full History</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Medical Profile */}
          {patientMedicalProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Medical Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Smoking History</Label>
                  <p className="mt-1">{patientMedicalProfile.smoking_history || 'Not disclosed'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vaping History</Label>
                  <p className="mt-1">{patientMedicalProfile.vaping_history || 'Not disclosed'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current Conditions</Label>
                  <p className="mt-1">{patientMedicalProfile.current_conditions || 'None disclosed'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Allergies</Label>
                  <p className="mt-1">{patientMedicalProfile.allergies || 'None disclosed'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Medications</Label>
                  <p className="mt-1">{patientMedicalProfile.medications || 'None disclosed'}</p>
                </div>
                {patientMedicalProfile.additional_notes && (
                  <div className="sm:col-span-2">
                    <Label className="text-muted-foreground">Additional Notes</Label>
                    <p className="mt-1">{patientMedicalProfile.additional_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pre-Consultation Questionnaire */}
          <PatientEligibilitySummary patientId={booking.patient_id} />

          {/* Intake Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Intake Form
              </CardTitle>
              <CardDescription>
                {intakeForm?.completed_at ? 'Completed on ' + format(new Date(intakeForm.completed_at), 'MMM d, yyyy') : 'Not yet completed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intakeForm ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Symptoms</Label>
                    <p className="mt-1">{intakeForm.symptoms || 'None provided'}</p>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Medical History</Label>
                      <p className="mt-1">{intakeForm.medical_history || 'None'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Allergies</Label>
                      <p className="mt-1">{intakeForm.allergies || 'None'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current Medications</Label>
                      <p className="mt-1">{intakeForm.current_medications || 'None'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Preferred Pharmacy</Label>
                      <p className="mt-1">{intakeForm.preferred_pharmacy || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Patient has not completed the intake form yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription Form (if eligible) */}
          {canShowPrescriptionForm && (showPrescriptionForm || booking.status === 'in_progress') && doctorInfo && (
            <PrescriptionForm
              bookingId={bookingId!}
              patientId={booking.patient_id}
              doctorId={doctorInfo.id}
              doctorInfo={{
                fullName: doctorInfo.fullName,
                ahpraNumber: doctorInfo.ahpraNumber,
                providerNumber: doctorInfo.providerNumber,
              }}
              patientInfo={{
                fullName: patientProfile?.full_name || '',
                dateOfBirth: patientProfile?.date_of_birth,
              }}
              onComplete={handlePrescriptionComplete}
            />
          )}

          {/* Existing Prescription */}
          {existingPrescription && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  Prescription Issued
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono">{existingPrescription.reference_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strength</span>
                  <span>{existingPrescription.nicotine_strength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage Tier</span>
                  <span className="capitalize">{existingPrescription.usage_tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Containers</span>
                  <span>{existingPrescription.containers_allowed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issued</span>
                  <span>{format(new Date(existingPrescription.issued_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{format(new Date(existingPrescription.expires_at), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultation Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Consultation Notes</CardTitle>
              <CardDescription>Internal notes (not visible to patient)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a consultation note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={saveNote} disabled={savingNote || !newNote.trim()}>
                  {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Note'}
                </Button>
              </div>
              {notes.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{note.notes}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(note.created_at), 'MMM d, yyyy at h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{booking.scheduled_at ? format(new Date(booking.scheduled_at), 'MMMM d, yyyy') : 'Not scheduled'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {booking.scheduled_at ? format(new Date(booking.scheduled_at), 'h:mm a') : 'N/A'}
                  {booking.end_time ? ` - ${format(new Date(booking.end_time), 'h:mm a')}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{booking.consultation_type || 'Phone'} Consultation</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(booking.status === 'requested' || booking.status === 'confirmed' || booking.status === 'ready_for_call') && (
                <Button className="w-full" onClick={() => updateStatus('called')}>
                  Start Consultation
                </Button>
              )}
              {booking.status === 'called' && !showPrescriptionForm && !existingPrescription && (
                <Button className="w-full" onClick={() => setShowPrescriptionForm(true)}>
                  <Pill className="h-4 w-4 mr-2" />
                  Issue Prescription
                </Button>
              )}
              {(booking.status === 'called' || booking.status === 'ready_for_call') && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload File
                  </Button>
                </>
              )}
              {(booking.status === 'called' || booking.status === 'script_uploaded') && existingPrescription && (
                <Button className="w-full" variant="default" onClick={() => updateStatus('completed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Consultation
                </Button>
              )}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={() => updateStatus('cancelled')}
                >
                  Cancel Booking
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm truncate flex-1">{file.file_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No files uploaded</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
