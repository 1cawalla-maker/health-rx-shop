import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Upload, Loader2, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { PdfViewerDialog } from '@/components/prescription/PdfViewerDialog';

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

interface IssuedPrescription {
  id: string;
  reference_id: string;
  pdf_storage_path: string | null;
  nicotine_strength: string;
  usage_tier: string;
  daily_max_pouches: number;
  total_pouches: number;
  containers_allowed: number;
  supply_days: number;
  issued_at: string;
  expires_at: string;
  status: string;
}

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [issuedPrescriptions, setIssuedPrescriptions] = useState<IssuedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPdf, setViewingPdf] = useState<{ path: string; refId: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    if (!user) return;

    // Fetch uploaded prescriptions
    const { data: uploadedData, error: uploadedError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (uploadedError) {
      console.error('Error fetching prescriptions:', uploadedError);
    } else {
      setPrescriptions(uploadedData || []);
    }

    // Fetch doctor-issued prescriptions
    const { data: issuedData, error: issuedError } = await supabase
      .from('doctor_issued_prescriptions')
      .select('id, reference_id, pdf_storage_path, nicotine_strength, usage_tier, daily_max_pouches, total_pouches, containers_allowed, supply_days, issued_at, expires_at, status')
      .eq('patient_id', user.id)
      .order('issued_at', { ascending: false });

    if (issuedError) {
      console.error('Error fetching issued prescriptions:', issuedError);
    } else {
      setIssuedPrescriptions(issuedData || []);
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

  const hasNoPrescriptions = prescriptions.length === 0 && issuedPrescriptions.length === 0;

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

      {/* Doctor-Issued Prescriptions */}
      {issuedPrescriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Doctor-Issued Prescriptions</h2>
          {issuedPrescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          Prescription {prescription.reference_id}
                        </h3>
                        {getStatusBadge(prescription.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Issued: {format(new Date(prescription.issued_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          Expires: {format(new Date(prescription.expires_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="mt-2 text-sm space-y-1">
                        <p><strong>Nicotine Strength:</strong> {prescription.nicotine_strength}</p>
                        <p><strong>Usage Tier:</strong> {prescription.usage_tier}</p>
                        <p><strong>Daily Max:</strong> {prescription.daily_max_pouches} pouches/day</p>
                        <p><strong>Supply Period:</strong> {prescription.supply_days} days</p>
                        <p><strong>Total Pouches:</strong> {prescription.total_pouches}</p>
                        <p><strong>Containers Allowed:</strong> {prescription.containers_allowed}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* View PDF Button */}
                  {prescription.pdf_storage_path && prescription.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingPdf({
                        path: prescription.pdf_storage_path!,
                        refId: prescription.reference_id
                      })}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Prescriptions */}
      {prescriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Uploaded Prescriptions</h2>
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
      )}

      {/* Empty State */}
      {hasNoPrescriptions && (
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

      {/* PDF Viewer Dialog */}
      {viewingPdf && (
        <PdfViewerDialog
          open={!!viewingPdf}
          onOpenChange={() => setViewingPdf(null)}
          storagePath={viewingPdf.path}
          title={`Prescription ${viewingPdf.refId}`}
        />
      )}
    </div>
  );
}
