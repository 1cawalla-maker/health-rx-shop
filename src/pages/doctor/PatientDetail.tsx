import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { 
  Loader2, User, ChevronLeft, Calendar, FileText, 
  ClipboardList, MessageSquare, Phone, Video 
} from 'lucide-react';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { PatientEligibilitySummary } from '@/components/doctor/PatientEligibilitySummary';

export default function DoctorPatientDetail() {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, loading, error, fetchPatientHistory } = usePatientHistory();

  useEffect(() => {
    if (patientId) {
      fetchPatientHistory(patientId);
    }
  }, [patientId, fetchPatientHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <h2 className="font-display text-xl font-bold mb-2">Patient Not Found</h2>
          <p className="text-muted-foreground mb-4">
            You may not have access to this patient's records.
          </p>
          <Button onClick={() => navigate('/doctor/patients')}>Go Back</Button>
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
          <h1 className="font-display text-2xl font-bold text-foreground">
            {patient.full_name || 'Patient'}
          </h1>
          <p className="text-muted-foreground text-sm">Patient Profile & History</p>
        </div>
      </div>

      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{patient.full_name || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{patient.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date of Birth</p>
            <p className="font-medium">
              {patient.date_of_birth 
                ? format(new Date(patient.date_of_birth), 'MMMM d, yyyy')
                : 'Not provided'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Consultation Questionnaire */}
      {patientId && <PatientEligibilitySummary patientId={patientId} />}

      {/* Tabs for history */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">
            Timeline ({patient.bookings.length + patient.intake_forms.length + patient.booking_files.length})
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({patient.bookings.length})
          </TabsTrigger>
          <TabsTrigger value="intakes">
            Intakes ({patient.intake_forms.length})
          </TabsTrigger>
          <TabsTrigger value="files">
            Files ({patient.booking_files.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Chronological history of all patient activity</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Combine all events into timeline
                const events = [
                  ...patient.bookings.map(b => ({
                    type: 'booking' as const,
                    date: b.scheduled_at,
                    data: b
                  })),
                  ...patient.intake_forms.map(i => ({
                    type: 'intake' as const,
                    date: i.completed_at || i.created_at,
                    data: i
                  })),
                  ...patient.booking_files.map(f => ({
                    type: 'file' as const,
                    date: f.uploaded_at,
                    data: f
                  }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (events.length === 0) {
                  return <p className="text-muted-foreground">No activity yet</p>;
                }

                return (
                  <div className="space-y-4">
                    {events.map((event, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            event.type === 'booking' ? 'bg-primary/10 text-primary' :
                            event.type === 'intake' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-green-500/10 text-green-500'
                          }`}>
                            {event.type === 'booking' && <Calendar className="h-4 w-4" />}
                            {event.type === 'intake' && <ClipboardList className="h-4 w-4" />}
                            {event.type === 'file' && <FileText className="h-4 w-4" />}
                          </div>
                          {idx < events.length - 1 && (
                            <div className="w-px h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.date), 'MMM d, yyyy at h:mm a')}
                          </p>
                          {event.type === 'booking' && (
                            <div className="mt-1">
                              <p className="font-medium">
                                {event.data.consultation_type === 'phone' ? 'Phone' : 'Video'} Consultation
                              </p>
                              <BookingStatusBadge status={event.data.status} />
                            </div>
                          )}
                          {event.type === 'intake' && (
                            <div className="mt-1">
                              <p className="font-medium">Intake Form Completed</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {event.data.symptoms}
                              </p>
                            </div>
                          )}
                          {event.type === 'file' && (
                            <div className="mt-1">
                              <p className="font-medium">File Uploaded</p>
                              <p className="text-sm text-muted-foreground">{event.data.file_name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <div className="space-y-4">
            {patient.bookings.length > 0 ? (
              patient.bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {booking.consultation_type === 'phone' ? (
                            <Phone className="h-5 w-5 text-primary" />
                          ) : (
                            <Video className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {booking.consultation_type} Consultation
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.scheduled_at), 'MMMM d, yyyy at h:mm a')}
                          </p>
                          {booking.reason_for_visit && (
                            <p className="text-sm mt-2">{booking.reason_for_visit}</p>
                          )}
                        </div>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No bookings yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="intakes" className="mt-6">
          <div className="space-y-4">
            {patient.intake_forms.length > 0 ? (
              patient.intake_forms.map((intake) => (
                <Card key={intake.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Intake Form
                    </CardTitle>
                    <CardDescription>
                      {intake.completed_at 
                        ? `Completed on ${format(new Date(intake.completed_at), 'MMMM d, yyyy')}`
                        : 'Not completed'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Symptoms</p>
                      <p>{intake.symptoms || 'None provided'}</p>
                    </div>
                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Medical History</p>
                        <p className="text-sm">{intake.medical_history || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Allergies</p>
                        <p className="text-sm">{intake.allergies || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Medications</p>
                        <p className="text-sm">{intake.current_medications || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="text-sm">{intake.phone_number}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No intake forms yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>Prescriptions and documents</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.booking_files.length > 0 ? (
                <div className="space-y-3">
                  {patient.booking_files.map((file) => (
                    <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(file.uploaded_at), 'MMM d, yyyy')} • {file.file_type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No files uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
