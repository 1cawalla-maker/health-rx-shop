// Shared enums for the application
// These mirror the database enums but can be used independently

export type DoctorApprovalStatus = 'pending_approval' | 'approved' | 'rejected' | 'deactivated';

export type PrescriptionUploadStatus = 'pending_review' | 'approved' | 'rejected' | 'expired';

export type PrescriptionType = 'uploaded' | 'issued';

export type UserRole = 'patient' | 'doctor' | 'admin';

export type ConsultationStatus = 
  | 'requested' 
  | 'confirmed' 
  | 'intake_pending' 
  | 'ready_for_call' 
  | 'called' 
  | 'script_uploaded' 
  | 'completed' 
  | 'cancelled';

// Status display helpers
export const doctorStatusLabels: Record<DoctorApprovalStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  deactivated: 'Deactivated',
};

export const prescriptionStatusLabels: Record<PrescriptionUploadStatus, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const doctorStatusColors: Record<DoctorApprovalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_approval: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  deactivated: 'outline',
};

export const prescriptionStatusColors: Record<PrescriptionUploadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  expired: 'outline',
};
