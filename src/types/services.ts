// Service layer types
import { DoctorApprovalStatus, PrescriptionUploadStatus, PrescriptionType } from './enums';

export interface DoctorRecord {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  providerNumber: string | null;
  ahpraNumber: string | null;
  specialties: string[];
  status: DoctorApprovalStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionUploadRecord {
  id: string;
  patientId: string;
  patientName: string | null;
  patientEmail: string | null;
  prescriptionType: PrescriptionType;
  status: PrescriptionUploadStatus;
  fileUrl: string | null;
  fileName: string | null;
  // Prescription limits (set by admin on approval)
  allowedStrengthMin: number | null;
  allowedStrengthMax: number | null;
  maxUnitsPerOrder: number | null;
  maxUnitsPerMonth: number | null;
  reviewReason: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionApprovalData {
  allowedStrengthMin: number;
  allowedStrengthMax: number;
  maxUnitsPerOrder: number;
  maxUnitsPerMonth: number;
  expiresAt?: string;
}

export interface PrescriptionRejectionData {
  reviewReason: string;
}

export interface FileUploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  role: 'patient' | 'doctor' | 'admin' | null;
}
