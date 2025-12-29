import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, UserX, UserMinus, RefreshCw, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { doctorService } from '@/services/doctorService';
import type { DoctorRecord } from '@/types/services';
import type { DoctorApprovalStatus } from '@/types/enums';
import { doctorStatusLabels, doctorStatusColors } from '@/types/enums';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminDoctorsApproval() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DoctorApprovalStatus | 'all'>('all');
  const [actionDoctor, setActionDoctor] = useState<{ doctor: DoctorRecord; action: 'approve' | 'reject' | 'deactivate' | 'reactivate' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const fetchDoctors = async () => {
    setLoading(true);
    const filter = statusFilter === 'all' ? undefined : statusFilter;
    const data = await doctorService.listDoctors(filter);
    setDoctors(data);
    setLoading(false);
  };

  const handleAction = async () => {
    if (!actionDoctor) return;
    
    setActionLoading(true);
    let result;
    
    switch (actionDoctor.action) {
      case 'approve':
        result = await doctorService.approveDoctor(actionDoctor.doctor.id);
        break;
      case 'reject':
        result = await doctorService.rejectDoctor(actionDoctor.doctor.id);
        break;
      case 'deactivate':
        result = await doctorService.deactivateDoctor(actionDoctor.doctor.id);
        break;
      case 'reactivate':
        result = await doctorService.reactivateDoctor(actionDoctor.doctor.id);
        break;
    }

    if (result.success) {
      toast.success(`Doctor ${actionDoctor.action}d successfully`);
      fetchDoctors();
    } else {
      toast.error(result.error || 'Action failed');
    }

    setActionLoading(false);
    setActionDoctor(null);
  };

  const filteredDoctors = doctors.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.fullName?.toLowerCase().includes(query) ||
      d.email?.toLowerCase().includes(query) ||
      d.ahpraNumber?.toLowerCase().includes(query) ||
      d.providerNumber?.toLowerCase().includes(query)
    );
  });

  const getActionButtons = (doctor: DoctorRecord) => {
    switch (doctor.status) {
      case 'pending_approval':
        return (
          <>
            <Button 
              size="sm" 
              onClick={() => setActionDoctor({ doctor, action: 'approve' })}
              className="gap-1"
            >
              <UserCheck className="h-4 w-4" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => setActionDoctor({ doctor, action: 'reject' })}
              className="gap-1"
            >
              <UserX className="h-4 w-4" />
              Reject
            </Button>
          </>
        );
      case 'approved':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setActionDoctor({ doctor, action: 'deactivate' })}
            className="gap-1"
          >
            <UserMinus className="h-4 w-4" />
            Deactivate
          </Button>
        );
      case 'deactivated':
      case 'rejected':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setActionDoctor({ doctor, action: 'reactivate' })}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Reactivate
          </Button>
        );
      default:
        return null;
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
        <h1 className="font-display text-3xl font-bold">Doctor Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and manage doctor registrations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, AHPRA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DoctorApprovalStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Doctor List */}
      {filteredDoctors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No doctors found matching your criteria.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{doctor.fullName || 'Unknown Doctor'}</CardTitle>
                    <CardDescription>{doctor.email}</CardDescription>
                  </div>
                  <Badge variant={doctorStatusColors[doctor.status]}>
                    {doctorStatusLabels[doctor.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">AHPRA Number</p>
                    <p className="font-medium">{doctor.ahpraNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Provider Number</p>
                    <p className="font-medium">{doctor.providerNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                    <p className="font-medium">{doctor.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                {doctor.specialties && doctor.specialties.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Specialties</p>
                    <div className="flex flex-wrap gap-1">
                      {doctor.specialties.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {getActionButtons(doctor)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionDoctor} onOpenChange={() => setActionDoctor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDoctor?.action === 'approve' && 'Approve Doctor'}
              {actionDoctor?.action === 'reject' && 'Reject Doctor'}
              {actionDoctor?.action === 'deactivate' && 'Deactivate Doctor'}
              {actionDoctor?.action === 'reactivate' && 'Reactivate Doctor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDoctor?.action === 'approve' && 
                `Are you sure you want to approve ${actionDoctor.doctor.fullName}? They will be able to conduct consultations.`}
              {actionDoctor?.action === 'reject' && 
                `Are you sure you want to reject ${actionDoctor.doctor.fullName}? They will not be able to use the platform.`}
              {actionDoctor?.action === 'deactivate' && 
                `Are you sure you want to deactivate ${actionDoctor.doctor.fullName}? They will no longer be able to conduct consultations.`}
              {actionDoctor?.action === 'reactivate' && 
                `Are you sure you want to reactivate ${actionDoctor.doctor.fullName}? They will be able to conduct consultations again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
