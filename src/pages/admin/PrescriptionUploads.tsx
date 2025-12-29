import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Download, CheckCircle, XCircle, Search, Filter, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

type PrescriptionStatus = Database['public']['Enums']['prescription_status'];

interface PrescriptionRecord {
  id: string;
  patient_id: string;
  prescription_type: string;
  status: PrescriptionStatus;
  file_url: string | null;
  allowed_strength_min: number | null;
  allowed_strength_max: number | null;
  max_units_per_order: number | null;
  max_units_per_month: number | null;
  review_reason: string | null;
  issued_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  patient_name?: string | null;
  patient_email?: string | null;
}

const statusLabels: Record<PrescriptionStatus, string> = {
  pending_review: 'Pending Review',
  active: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

const statusColors: Record<PrescriptionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_review: 'secondary',
  active: 'default',
  rejected: 'destructive',
  expired: 'outline',
};

export default function AdminPrescriptionUploads() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | 'all'>('all');
  
  // Approval modal state
  const [approvalPrescription, setApprovalPrescription] = useState<PrescriptionRecord | null>(null);
  const [approvalData, setApprovalData] = useState({
    allowedStrengthMin: 3,
    allowedStrengthMax: 12,
    maxUnitsPerOrder: 10,
    maxUnitsPerMonth: 20,
  });
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Rejection modal state
  const [rejectionPrescription, setRejectionPrescription] = useState<PrescriptionRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // View file modal
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    
    let query = supabase
      .from('prescriptions')
      .select('*')
      .eq('prescription_type', 'uploaded')
      .order('created_at', { ascending: false });
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    const { data: prescriptionsData, error } = await query;
    
    if (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
      setLoading(false);
      return;
    }

    // Fetch patient profiles for names
    const patientIds = [...new Set((prescriptionsData || []).map(p => p.patient_id))];
    
    let profilesMap: Record<string, { full_name: string | null }> = {};
    if (patientIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', patientIds);
      
      profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = { full_name: p.full_name };
        return acc;
      }, {} as Record<string, { full_name: string | null }>);
    }

    // Combine data
    const combinedData: PrescriptionRecord[] = (prescriptionsData || []).map(p => ({
      ...p,
      patient_name: profilesMap[p.patient_id]?.full_name || null,
      patient_email: null, // Email not stored in profiles
    }));

    setPrescriptions(combinedData);
    setLoading(false);
  };

  const handleViewFile = async (prescription: PrescriptionRecord) => {
    if (!prescription.file_url) {
      toast.error('No file available');
      return;
    }

    const { data, error } = await supabase.storage
      .from('prescriptions')
      .createSignedUrl(prescription.file_url, 300); // 5 min expiry

    if (error || !data?.signedUrl) {
      toast.error('Could not load file');
      return;
    }

    setViewingFile({ 
      url: data.signedUrl, 
      name: prescription.file_url.split('/').pop() || 'Prescription' 
    });
  };

  const handleApprove = async () => {
    if (!approvalPrescription) return;
    
    setApprovalLoading(true);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days validity

    const { error } = await supabase
      .from('prescriptions')
      .update({
        status: 'active',
        allowed_strength_min: approvalData.allowedStrengthMin,
        allowed_strength_max: approvalData.allowedStrengthMax,
        max_units_per_order: approvalData.maxUnitsPerOrder,
        max_units_per_month: approvalData.maxUnitsPerMonth,
        issued_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', approvalPrescription.id);
    
    if (error) {
      toast.error('Failed to approve prescription');
      console.error('Approval error:', error);
    } else {
      toast.success('Prescription approved successfully! Customer can now access the shop.');
      fetchPrescriptions();
      setApprovalPrescription(null);
    }
    
    setApprovalLoading(false);
  };

  const handleReject = async () => {
    if (!rejectionPrescription || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setRejectionLoading(true);
    
    const { error } = await supabase
      .from('prescriptions')
      .update({
        status: 'rejected',
        review_reason: rejectionReason,
      })
      .eq('id', rejectionPrescription.id);
    
    if (error) {
      toast.error('Failed to reject prescription');
      console.error('Rejection error:', error);
    } else {
      toast.success('Prescription rejected');
      fetchPrescriptions();
      setRejectionPrescription(null);
      setRejectionReason('');
    }
    
    setRejectionLoading(false);
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.patient_name?.toLowerCase().includes(query) ||
      p.patient_id.toLowerCase().includes(query) ||
      p.file_url?.toLowerCase().includes(query)
    );
  });

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
        <h1 className="font-display text-3xl font-bold">Prescription Uploads</h1>
        <p className="text-muted-foreground mt-1">Review and approve patient prescription uploads to grant shop access</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PrescriptionStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="active">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prescription List */}
      {filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No prescription uploads found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {prescription.patient_name || `Patient ${prescription.patient_id.slice(0, 8)}...`}
                    </CardTitle>
                    <CardDescription>ID: {prescription.patient_id.slice(0, 12)}...</CardDescription>
                  </div>
                  <Badge variant={statusColors[prescription.status]}>
                    {statusLabels[prescription.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">File</p>
                    <p className="font-medium truncate">{prescription.file_url?.split('/').pop() || 'No file'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Uploaded</p>
                    <p className="font-medium">{format(new Date(prescription.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  {prescription.status === 'active' && prescription.expires_at && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Expires</p>
                      <p className="font-medium">{format(new Date(prescription.expires_at), 'dd MMM yyyy')}</p>
                    </div>
                  )}
                </div>

                {/* Approval limits for approved prescriptions */}
                {prescription.status === 'active' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Strength Range</p>
                      <p className="font-medium">{prescription.allowed_strength_min}-{prescription.allowed_strength_max}mg</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Per Order</p>
                      <p className="font-medium">{prescription.max_units_per_order} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Per Month</p>
                      <p className="font-medium">{prescription.max_units_per_month} units</p>
                    </div>
                  </div>
                )}

                {/* Rejection reason */}
                {prescription.status === 'rejected' && prescription.review_reason && (
                  <div className="mb-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Rejection Reason</p>
                    <p className="text-sm">{prescription.review_reason}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewFile(prescription)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View File
                  </Button>
                  
                  {prescription.status === 'pending_review' && (
                    <>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setApprovalPrescription(prescription);
                          setApprovalData({
                            allowedStrengthMin: 3,
                            allowedStrengthMax: 12,
                            maxUnitsPerOrder: 10,
                            maxUnitsPerMonth: 20,
                          });
                        }}
                        className="gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectionPrescription(prescription)}
                        className="gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={!!approvalPrescription} onOpenChange={() => setApprovalPrescription(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Prescription</DialogTitle>
            <DialogDescription>
              Set the allowed limits for this prescription. Once approved, the customer will have access to the shop.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStrength">Min Strength (mg)</Label>
                <Input
                  id="minStrength"
                  type="number"
                  min={1}
                  max={20}
                  value={approvalData.allowedStrengthMin}
                  onChange={(e) => setApprovalData(d => ({ ...d, allowedStrengthMin: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStrength">Max Strength (mg)</Label>
                <Input
                  id="maxStrength"
                  type="number"
                  min={1}
                  max={20}
                  value={approvalData.allowedStrengthMax}
                  onChange={(e) => setApprovalData(d => ({ ...d, allowedStrengthMax: parseInt(e.target.value) || 12 }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perOrder">Max Units Per Order</Label>
                <Input
                  id="perOrder"
                  type="number"
                  min={1}
                  max={50}
                  value={approvalData.maxUnitsPerOrder}
                  onChange={(e) => setApprovalData(d => ({ ...d, maxUnitsPerOrder: parseInt(e.target.value) || 10 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perMonth">Max Units Per Month</Label>
                <Input
                  id="perMonth"
                  type="number"
                  min={1}
                  max={100}
                  value={approvalData.maxUnitsPerMonth}
                  onChange={(e) => setApprovalData(d => ({ ...d, maxUnitsPerMonth: parseInt(e.target.value) || 20 }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalPrescription(null)} disabled={approvalLoading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approvalLoading}>
              {approvalLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Approve Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectionPrescription} onOpenChange={() => setRejectionPrescription(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Prescription</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this prescription. This will be visible to the patient.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="mt-2"
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionPrescription(null)} disabled={rejectionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectionLoading || !rejectionReason.trim()}>
              {rejectionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingFile?.url && (
              viewingFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={viewingFile.url} alt="Prescription" className="max-w-full h-auto" />
              ) : viewingFile.name.match(/\.pdf$/i) ? (
                <iframe 
                  src={viewingFile.url} 
                  className="w-full h-[60vh]" 
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <Button asChild>
                    <a href={viewingFile.url} download={viewingFile.name} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}