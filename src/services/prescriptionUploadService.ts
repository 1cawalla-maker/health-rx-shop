// Prescription upload service - mock implementation
// Will be replaced with Supabase queries

import type { PrescriptionUploadRecord, PrescriptionApprovalData, PrescriptionRejectionData } from '@/types/services';
import type { PrescriptionUploadStatus } from '@/types/enums';
import { fileStorageService } from './fileStorageService';

const MOCK_PRESCRIPTIONS_KEY = 'healthrx_mock_prescription_uploads';

// Initialize with some mock data
const getDefaultPrescriptions = (): PrescriptionUploadRecord[] => [
  {
    id: 'presc-1',
    patientId: 'user-patient-1',
    patientName: 'John Smith',
    patientEmail: 'john.smith@example.com',
    prescriptionType: 'uploaded',
    status: 'pending_review',
    fileUrl: 'prescriptions/user-patient-1/prescription-1.pdf',
    fileName: 'my_prescription.pdf',
    allowedStrengthMin: null,
    allowedStrengthMax: null,
    maxUnitsPerOrder: null,
    maxUnitsPerMonth: null,
    reviewReason: null,
    issuedAt: null,
    expiresAt: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'presc-2',
    patientId: 'user-patient-2',
    patientName: 'Jane Doe',
    patientEmail: 'jane.doe@example.com',
    prescriptionType: 'uploaded',
    status: 'pending_review',
    fileUrl: 'prescriptions/user-patient-2/prescription-2.jpg',
    fileName: 'doctor_note.jpg',
    allowedStrengthMin: null,
    allowedStrengthMax: null,
    maxUnitsPerOrder: null,
    maxUnitsPerMonth: null,
    reviewReason: null,
    issuedAt: null,
    expiresAt: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'presc-3',
    patientId: 'user-patient-3',
    patientName: 'Bob Wilson',
    patientEmail: 'bob.wilson@example.com',
    prescriptionType: 'uploaded',
    status: 'approved',
    fileUrl: 'prescriptions/user-patient-3/prescription-3.pdf',
    fileName: 'nicotine_prescription.pdf',
    allowedStrengthMin: 3,
    allowedStrengthMax: 12,
    maxUnitsPerOrder: 10,
    maxUnitsPerMonth: 20,
    reviewReason: null,
    issuedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const getPrescriptions = (): PrescriptionUploadRecord[] => {
  const stored = localStorage.getItem(MOCK_PRESCRIPTIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultPrescriptions();
    }
  }
  const defaults = getDefaultPrescriptions();
  localStorage.setItem(MOCK_PRESCRIPTIONS_KEY, JSON.stringify(defaults));
  return defaults;
};

const savePrescriptions = (prescriptions: PrescriptionUploadRecord[]): void => {
  localStorage.setItem(MOCK_PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));
};

export const prescriptionUploadService = {
  // Create a new prescription upload record
  createUpload: async (
    patientId: string,
    patientName: string | null,
    patientEmail: string | null,
    file: File
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    // Upload file first
    const fileExt = file.name.split('.').pop();
    const filePath = `${patientId}/${Date.now()}.${fileExt}`;
    
    const uploadResult = await fileStorageService.uploadFile('prescriptions', filePath, file);
    
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    // Create prescription record
    const newPrescription: PrescriptionUploadRecord = {
      id: `presc-${Date.now()}`,
      patientId,
      patientName,
      patientEmail,
      prescriptionType: 'uploaded',
      status: 'pending_review',
      fileUrl: uploadResult.path || null,
      fileName: file.name,
      allowedStrengthMin: null,
      allowedStrengthMax: null,
      maxUnitsPerOrder: null,
      maxUnitsPerMonth: null,
      reviewReason: null,
      issuedAt: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const prescriptions = getPrescriptions();
    prescriptions.unshift(newPrescription);
    savePrescriptions(prescriptions);

    return { success: true, id: newPrescription.id };
  },

  // List all prescription uploads (for admin)
  listUploads: async (statusFilter?: PrescriptionUploadStatus): Promise<PrescriptionUploadRecord[]> => {
    // TODO: Replace with Supabase query
    // const query = supabase.from('prescriptions')
    //   .select('*, profiles(full_name)')
    //   .eq('prescription_type', 'uploaded')
    //   .order('created_at', { ascending: false });

    const prescriptions = getPrescriptions();
    const uploads = prescriptions.filter(p => p.prescriptionType === 'uploaded');
    
    if (statusFilter) {
      return uploads.filter(p => p.status === statusFilter);
    }
    return uploads;
  },

  // Get pending upload count
  getPendingCount: async (): Promise<number> => {
    const prescriptions = getPrescriptions();
    return prescriptions.filter(p => 
      p.prescriptionType === 'uploaded' && p.status === 'pending_review'
    ).length;
  },

  // Get uploads for a specific patient
  getPatientUploads: async (patientId: string): Promise<PrescriptionUploadRecord[]> => {
    const prescriptions = getPrescriptions();
    return prescriptions.filter(p => 
      p.patientId === patientId && p.prescriptionType === 'uploaded'
    );
  },

  // Get a single prescription by ID
  getById: async (id: string): Promise<PrescriptionUploadRecord | null> => {
    const prescriptions = getPrescriptions();
    return prescriptions.find(p => p.id === id) || null;
  },

  // Approve a prescription upload with limits
  approveUpload: async (
    id: string,
    approvalData: PrescriptionApprovalData
  ): Promise<{ success: boolean; error?: string }> => {
    const prescriptions = getPrescriptions();
    const index = prescriptions.findIndex(p => p.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Prescription not found' };
    }

    prescriptions[index] = {
      ...prescriptions[index],
      status: 'approved',
      allowedStrengthMin: approvalData.allowedStrengthMin,
      allowedStrengthMax: approvalData.allowedStrengthMax,
      maxUnitsPerOrder: approvalData.maxUnitsPerOrder,
      maxUnitsPerMonth: approvalData.maxUnitsPerMonth,
      expiresAt: approvalData.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      issuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    savePrescriptions(prescriptions);
    return { success: true };
  },

  // Reject a prescription upload
  rejectUpload: async (
    id: string,
    rejectionData: PrescriptionRejectionData
  ): Promise<{ success: boolean; error?: string }> => {
    const prescriptions = getPrescriptions();
    const index = prescriptions.findIndex(p => p.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Prescription not found' };
    }

    prescriptions[index] = {
      ...prescriptions[index],
      status: 'rejected',
      reviewReason: rejectionData.reviewReason,
      updatedAt: new Date().toISOString(),
    };
    
    savePrescriptions(prescriptions);
    return { success: true };
  },

  // Check if patient has an active prescription (issued OR approved upload)
  hasActivePrescription: async (patientId: string): Promise<{
    hasActive: boolean;
    prescription?: PrescriptionUploadRecord;
  }> => {
    const prescriptions = getPrescriptions();
    const now = new Date().toISOString();
    
    const activePrescription = prescriptions.find(p => 
      p.patientId === patientId &&
      p.status === 'approved' &&
      (!p.expiresAt || p.expiresAt > now)
    );

    return {
      hasActive: !!activePrescription,
      prescription: activePrescription,
    };
  },

  // Get download URL for prescription file
  getFileDownloadUrl: async (id: string): Promise<string | null> => {
    const prescription = await prescriptionUploadService.getById(id);
    if (!prescription?.fileUrl) return null;
    
    // The fileUrl is stored as "bucket/path", extract the path
    const [bucket, ...pathParts] = prescription.fileUrl.split('/');
    const path = pathParts.join('/');
    
    return fileStorageService.getDownloadUrl(bucket, path);
  },
};
