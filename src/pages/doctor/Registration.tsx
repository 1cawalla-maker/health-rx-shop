import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Stethoscope, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const ahpraSchema = z.string().regex(/^MED\d{10}$/, 'AHPRA number must be in format MED followed by 10 digits');
const providerSchema = z.string().min(6, 'Provider number must be at least 6 characters');

export default function DoctorRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ahpraNumber, setAhpraNumber] = useState('');
  const [providerNumber, setProviderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      ahpraSchema.parse(ahpraNumber);
      providerSchema.parse(providerNumber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the database function to complete registration
      const { data, error } = await supabase.rpc('complete_doctor_registration', {
        _user_id: user.id,
        _ahpra_number: ahpraNumber,
        _provider_number: providerNumber
      });

      if (error) throw error;

      toast.success('Registration completed! Your account is now active.');
      navigate('/doctor/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 gradient-section min-h-[60vh] flex items-center">
        <div className="container">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Complete Your Registration</CardTitle>
              <CardDescription>
                Please provide your professional credentials to activate your doctor account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ahpra">AHPRA Registration Number</Label>
                  <Input
                    id="ahpra"
                    placeholder="MED0001234567"
                    value={ahpraNumber}
                    onChange={(e) => setAhpraNumber(e.target.value.toUpperCase())}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: MED followed by 10 digits (e.g., MED0001234567)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Medicare Provider Number</Label>
                  <Input
                    id="provider"
                    placeholder="123456AB"
                    value={providerNumber}
                    onChange={(e) => setProviderNumber(e.target.value.toUpperCase())}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Medicare provider number for billing purposes
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    What happens next?
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your credentials will be verified against AHPRA records</li>
                    <li>• Upon approval, you'll have full access to the platform</li>
                    <li>• You can start accepting consultations immediately</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
