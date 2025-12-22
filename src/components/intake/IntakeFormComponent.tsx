import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const intakeSchema = z.object({
  symptoms: z.string().min(10, 'Please describe your symptoms in at least 10 characters'),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  current_medications: z.string().optional(),
  phone_number: z.string().min(8, 'Please enter a valid phone number'),
  preferred_pharmacy: z.string().optional(),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the consent to proceed' })
  })
});

interface IntakeFormComponentProps {
  bookingId: string;
  onComplete?: () => void;
}

export function IntakeFormComponent({ bookingId, onComplete }: IntakeFormComponentProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    phone_number: '',
    preferred_pharmacy: '',
    consent_given: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      intakeSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (!user) {
      toast.error('You must be logged in to submit the intake form');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: intakeError } = await supabase
        .from('intake_forms')
        .insert({
          booking_id: bookingId,
          patient_id: user.id,
          symptoms: formData.symptoms,
          medical_history: formData.medical_history || null,
          allergies: formData.allergies || null,
          current_medications: formData.current_medications || null,
          phone_number: formData.phone_number,
          preferred_pharmacy: formData.preferred_pharmacy || null,
          consent_given: formData.consent_given,
          completed_at: new Date().toISOString()
        });

      if (intakeError) throw intakeError;

      // Update booking status to ready_for_call
      await supabase
        .from('consultations')
        .update({ status: 'ready_for_call' })
        .eq('id', bookingId);

      toast.success('Intake form submitted successfully!');
      
      if (onComplete) {
        onComplete();
      } else {
        navigate('/patient/consultations');
      }
    } catch (err) {
      console.error('Error submitting intake form:', err);
      toast.error('Failed to submit intake form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
          <CardDescription>
            Please provide accurate information to help your doctor prepare for the consultation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">
              Current Symptoms <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="symptoms"
              placeholder="Please describe your current symptoms and reason for this consultation..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              placeholder="Any relevant medical history, previous conditions, surgeries..."
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Input
                id="allergies"
                placeholder="e.g., Penicillin, Aspirin..."
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_medications">Current Medications</Label>
              <Input
                id="current_medications"
                placeholder="List any medications you're currently taking..."
                value={formData.current_medications}
                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            We'll use this to contact you for your phone consultation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone_number">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="+61 4XX XXX XXX"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              The doctor will call you at this number at the scheduled time
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_pharmacy">Preferred Pharmacy (Optional)</Label>
            <Input
              id="preferred_pharmacy"
              placeholder="Name and location of your preferred pharmacy..."
              value={formData.preferred_pharmacy}
              onChange={(e) => setFormData({ ...formData, preferred_pharmacy: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={formData.consent_given}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, consent_given: checked as boolean })
              }
            />
            <div className="space-y-1">
              <Label htmlFor="consent" className="cursor-pointer">
                I consent to telehealth consultation <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                I understand that this is a telehealth consultation conducted by phone. 
                I consent to the collection and use of my health information for the purpose 
                of this consultation and any resulting prescriptions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Intake Form'
          )}
        </Button>
      </div>

      <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Your information is securely stored and only accessible to your assigned doctor 
          and authorized medical staff.
        </p>
      </div>
    </form>
  );
}
