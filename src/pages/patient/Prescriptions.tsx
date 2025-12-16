import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Upload, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Prescription {
  id: string;
  prescription_type: 'uploaded' | 'issued';
  status: 'pending_review' | 'active' | 'rejected' | 'expired';
  file_url: string | null;
  product_category: string | null;
  allowed_strength_min: number | null;
  allowed_strength_max: number | null;
  max_units_per_order: number | null;
  max_units_per_month: number | null;
  issued_at: string | null;
  expires_at: string | null;
  review_reason: string | null;
  created_at: string;
}

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prescriptions:', error);
    } else {
      setPrescriptions(data || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">View your prescription history and status</p>
        </div>
        <Button asChild>
          <Link to="/patient/upload-prescription">
            <Upload className="h-4 w-4 mr-2" />
            Upload New
          </Link>
        </Button>
      </div>

      {prescriptions.length > 0 ? (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium capitalize">
                          {prescription.prescription_type} Prescription
                        </h3>
                        {getStatusBadge(prescription.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(prescription.created_at), 'MMM d, yyyy')}
                        </span>
                        {prescription.expires_at && (
                          <span className="flex items-center gap-1">
                            Expires: {format(new Date(prescription.expires_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>

                      {prescription.status === 'active' && (
                        <div className="mt-2 text-sm space-y-1">
                          {prescription.allowed_strength_max && (
                            <p>
                              Strength: {prescription.allowed_strength_min || 0} - {prescription.allowed_strength_max}mg
                            </p>
                          )}
                          {prescription.max_units_per_order && (
                            <p>Max per order: {prescription.max_units_per_order} units</p>
                          )}
                          {prescription.max_units_per_month && (
                            <p>Max per month: {prescription.max_units_per_month} units</p>
                          )}
                        </div>
                      )}

                      {prescription.status === 'rejected' && prescription.review_reason && (
                        <div className="mt-2 p-3 bg-red-500/10 rounded-lg">
                          <p className="text-sm text-red-600 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{prescription.review_reason}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">No prescriptions yet</CardTitle>
            <CardDescription>
              Upload a prescription or book a consultation to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/patient/book">Book Consultation</Link>
            </Button>
            <Button asChild>
              <Link to="/patient/upload-prescription">Upload Prescription</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
