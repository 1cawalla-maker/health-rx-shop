import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface ConsultationDetails {
  id: string;
  patient_id: string;
  scheduled_at: string;
  status: string;
  consultation_type: string;
  reason_for_visit: string | null;
}

interface PatientProfile {
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
}

interface IntakeForm {
  symptoms: string | null;
  medical_history: string | null;
  allergies: string | null;
  current_medications: string | null;
  answers: Record<string, any>;
}

// Product options for prescription
const productOptions = [
  { value: 'zyn', label: 'ZYN' },
  { value: 'velo', label: 'VELO' },
  { value: 'nordic_spirit', label: 'Nordic Spirit' },
  { value: 'rogue', label: 'Rogue' },
  { value: 'on', label: 'On!' }
];

const strengthOptions = [
  { value: '3mg', label: '3mg (Low)' },
  { value: '6mg', label: '6mg (Medium)' },
  { value: '9mg', label: '9mg (High)' },
  { value: '12mg', label: '12mg (Extra High)' }
];

const quantityOptions = [
  { value: '5', label: '5 cans per month' },
  { value: '10', label: '10 cans per month' },
  { value: '15', label: '15 cans per month' },
  { value: '20', label: '20 cans per month (maximum)' }
];

export default function DoctorConsultationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<ConsultationDetails | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [intakeForm, setIntakeForm] = useState<IntakeForm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  
  // Prescription form state
  const [prescriptionData, setPrescriptionData] = useState({
    product: '',
    strength: '',
    quantity: '',
    instructions: ''
  });
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchConsultation();
    }
  }, [id]);

  const fetchConsultation = async () => {
    if (!id) return;

    // Fetch consultation
    const { data: consultData, error: consultError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (consultError || !consultData) {
      toast.error('Failed to load consultation');
      navigate('/doctor/bookings');
      return;
    }

    setConsultation(consultData);

    // Fetch patient profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, phone, date_of_birth')
      .eq('user_id', consultData.patient_id)
      .maybeSingle();

    if (profileData) {
      setPatientProfile(profileData);
    }

    // Fetch intake form
    const { data: intakeData } = await supabase
      .from('intake_forms')
      .select('symptoms, medical_history, allergies, current_medications, answers')
      .eq('booking_id', id)
      .maybeSingle();

    if (intakeData) {
      setIntakeForm({
        symptoms: intakeData.symptoms,
        medical_history: intakeData.medical_history,
        allergies: intakeData.allergies,
        current_medications: intakeData.current_medications,
        answers: (intakeData.answers as Record<string, any>) || {}
      });
    }

    setLoading(false);
  };

  const handleApprovePrescription = async () => {
    if (!prescriptionData.product || !prescriptionData.strength || !prescriptionData.quantity) {
      toast.error('Please complete all prescription fields');
      return;
    }

    if (!user || !consultation) return;

    setIsSubmitting(true);

    // Create prescription
    const { error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: consultation.patient_id,
        doctor_id: user.id,
        prescription_type: 'issued',
        status: 'active',
        product_category: prescriptionData.product,
        allowed_strength_min: parseInt(prescriptionData.strength),
        allowed_strength_max: parseInt(prescriptionData.strength),
        max_units_per_month: parseInt(prescriptionData.quantity),
        max_units_per_order: Math.ceil(parseInt(prescriptionData.quantity) / 2),
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      });

    if (prescriptionError) {
      toast.error('Failed to create prescription');
      setIsSubmitting(false);
      return;
    }

    // Update consultation status
    await supabase
      .from('consultations')
      .update({ status: 'script_uploaded' })
      .eq('id', id);

    toast.success('Prescription approved and issued');
    navigate('/doctor/bookings');
    setIsSubmitting(false);
  };

  const handleDeclinePrescription = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    if (!user || !consultation) return;

    setIsSubmitting(true);

    // Create rejected prescription record
    const { error } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: consultation.patient_id,
        doctor_id: user.id,
        prescription_type: 'issued',
        status: 'rejected',
        review_reason: declineReason
      });

    if (error) {
      toast.error('Failed to record decision');
      setIsSubmitting(false);
      return;
    }

    // Update consultation status
    await supabase
      .from('consultations')
      .update({ status: 'completed' })
      .eq('id', id);

    toast.success('Prescription declined');
    setShowDeclineDialog(false);
    navigate('/doctor/bookings');
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!consultation) {
    return null;
  }

  const calculateAge = (dob: string | null) => {
    if (!dob) return 'Unknown';
    const birthDate = new Date(dob);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age} years old`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/doctor/bookings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Consultation View
          </h1>
          <p className="text-muted-foreground">
            Review patient details and complete the consultation
          </p>
        </div>
      </div>

      {/* Call Instructions */}
      <Alert className="border-primary/50 bg-primary/5">
        <Phone className="h-4 w-4" />
        <AlertTitle>Phone Consultation</AlertTitle>
        <AlertDescription>
          Call the patient at the scheduled time. You may attempt up to 3 calls if they don't answer. 
          If the patient cannot be reached after 3 attempts, the consultation should be cancelled.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{patientProfile?.full_name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DOB:</span>
                <span className="font-medium">
                  {patientProfile?.date_of_birth 
                    ? `${format(new Date(patientProfile.date_of_birth), 'dd MMM yyyy')} (${calculateAge(patientProfile.date_of_birth)})`
                    : 'Not provided'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium font-mono">{patientProfile?.phone || 'Not provided'}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled:</span>
                <span className="font-medium">
                  {format(new Date(consultation.scheduled_at), 'PPP p')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="capitalize">{consultation.consultation_type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="capitalize">{consultation.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intake Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {intakeForm ? (
              <>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Symptoms / Reason for Visit:</span>
                    <p className="mt-1">{intakeForm.symptoms || 'Not provided'}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Medical History:</span>
                    <p className="mt-1">{intakeForm.medical_history || 'None reported'}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Current Medications:</span>
                    <p className="mt-1">{intakeForm.current_medications || 'None reported'}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Allergies:</span>
                    <p className="mt-1">{intakeForm.allergies || 'None reported'}</p>
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Patient has not completed the intake form yet.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prescription Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prescription Decision
          </CardTitle>
          <CardDescription>
            If clinically appropriate, complete the prescription details below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={prescriptionData.product}
                onValueChange={(value) => setPrescriptionData(prev => ({ ...prev, product: value }))}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strength">Nicotine Strength</Label>
              <Select
                value={prescriptionData.strength}
                onValueChange={(value) => setPrescriptionData(prev => ({ ...prev, strength: value }))}
              >
                <SelectTrigger id="strength">
                  <SelectValue placeholder="Select strength" />
                </SelectTrigger>
                <SelectContent>
                  {strengthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Monthly Quantity</Label>
              <Select
                value={prescriptionData.quantity}
                onValueChange={(value) => setPrescriptionData(prev => ({ ...prev, quantity: value }))}
              >
                <SelectTrigger id="quantity">
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {quantityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Usage instructions for patient..."
                value={prescriptionData.instructions}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button
              onClick={handleApprovePrescription}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Prescription
                </>
              )}
            </Button>

            <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={isSubmitting}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Decline Prescription</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for declining this prescription request. 
                    This will be shared with the patient.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder="Reason for declining..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeclinePrescription}
                    disabled={isSubmitting || !declineReason.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirm Decline'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
