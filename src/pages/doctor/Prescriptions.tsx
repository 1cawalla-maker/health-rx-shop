import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface IssuedPrescription {
  id: string;
  booking_id: string;
  patient_id: string;
  doctor_id: string;
  nicotine_strength: string;
  usage_tier: string;
  daily_max_pouches: number;
  total_pouches: number;
  containers_allowed: number;
  supply_days: number;
  status: string;
  reference_id: string;
  issued_at: string;
  expires_at: string;
  pdf_storage_path: string | null;
  patient_name?: string;
}

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<IssuedPrescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (user) {
      fetchPrescriptions(); 
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    if (!user) return;
    
    // Fetch only doctor-issued prescriptions by this doctor
    const { data, error } = await supabase
      .from('doctor_issued_prescriptions')
      .select('*')
      .eq('doctor_id', user.id)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
      setLoading(false);
      return;
    }

    // Fetch patient names
    const patientIds = data?.map(p => p.patient_id).filter(Boolean) || [];
    const { data: profiles } = patientIds.length > 0
      ? await supabase.from('profiles').select('user_id, full_name').in('user_id', patientIds)
      : { data: [] };
    
    const profileMap = new Map<string, string>();
    profiles?.forEach(p => {
      if (p.user_id && p.full_name) {
        profileMap.set(p.user_id, p.full_name);
      }
    });

    const prescriptionsWithNames = data?.map(p => ({
      ...p,
      patient_name: profileMap.get(p.patient_id) || 'Patient'
    })) || [];

    setPrescriptions(prescriptionsWithNames);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'outline';
    }
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
      <div>
        <h1 className="font-display text-3xl font-bold">My Issued Prescriptions</h1>
        <p className="text-muted-foreground mt-1">
          Prescriptions you have issued during consultations
        </p>
      </div>

      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>You haven't issued any prescriptions yet.</p>
              <p className="text-sm mt-2">
                Prescriptions are created during consultations with patients.
              </p>
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {prescription.patient_name}
                    </CardTitle>
                    <CardDescription>
                      Ref: {prescription.reference_id}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(prescription.status)} className="capitalize">
                    {prescription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Strength</p>
                    <p className="font-medium">{prescription.nicotine_strength}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Usage Tier</p>
                    <p className="font-medium capitalize">{prescription.usage_tier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Daily Max</p>
                    <p className="font-medium">{prescription.daily_max_pouches} pouches</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Supply Days</p>
                    <p className="font-medium">{prescription.supply_days} days</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Issued</p>
                    <p className="font-medium">{format(new Date(prescription.issued_at), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium">{format(new Date(prescription.expires_at), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pouches</p>
                    <p className="font-medium">{prescription.total_pouches}</p>
                  </div>
                </div>

                {prescription.pdf_storage_path && (
                  <Button size="sm" variant="outline" className="gap-1">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}