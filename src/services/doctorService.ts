// Doctor service - mock implementation for approval workflow
// Will be replaced with Supabase queries

import type { DoctorRecord } from '@/types/services';
import type { DoctorApprovalStatus } from '@/types/enums';

const MOCK_DOCTORS_KEY = 'healthrx_mock_doctors';

// Initialize with some mock data
const getDefaultDoctors = (): DoctorRecord[] => [
  {
    id: 'doc-1',
    userId: 'user-doc-1',
    fullName: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '0412 345 678',
    providerNumber: 'PRV123456',
    ahpraNumber: 'MED0001234567',
    specialties: ['General Practice'],
    status: 'pending_approval',
    isActive: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-2',
    userId: 'user-doc-2',
    fullName: 'Dr. Michael Chen',
    email: 'michael.chen@example.com',
    phone: '0423 456 789',
    providerNumber: 'PRV789012',
    ahpraNumber: 'MED0007890123',
    specialties: ['General Practice', 'Telehealth'],
    status: 'approved',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'doc-3',
    userId: 'user-doc-3',
    fullName: 'Dr. Emily Watson',
    email: 'emily.watson@example.com',
    phone: '0434 567 890',
    providerNumber: 'PRV345678',
    ahpraNumber: 'MED0003456789',
    specialties: ['General Practice'],
    status: 'pending_approval',
    isActive: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const getDoctors = (): DoctorRecord[] => {
  const stored = localStorage.getItem(MOCK_DOCTORS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultDoctors();
    }
  }
  const defaults = getDefaultDoctors();
  localStorage.setItem(MOCK_DOCTORS_KEY, JSON.stringify(defaults));
  return defaults;
};

const saveDoctors = (doctors: DoctorRecord[]): void => {
  localStorage.setItem(MOCK_DOCTORS_KEY, JSON.stringify(doctors));
};

export const doctorService = {
  // List all doctors (for admin)
  listDoctors: async (statusFilter?: DoctorApprovalStatus): Promise<DoctorRecord[]> => {
    // TODO: Replace with Supabase query
    // const query = supabase.from('doctors')
    //   .select('*, profiles(full_name, phone), user_roles(status)')
    //   .order('created_at', { ascending: false });
    // if (statusFilter) query.eq('user_roles.status', statusFilter);
    // const { data } = await query;

    const doctors = getDoctors();
    if (statusFilter) {
      return doctors.filter(d => d.status === statusFilter);
    }
    return doctors;
  },

  // Get pending doctor approvals count
  getPendingCount: async (): Promise<number> => {
    const doctors = getDoctors();
    return doctors.filter(d => d.status === 'pending_approval').length;
  },

  // Get a single doctor by ID
  getDoctorById: async (id: string): Promise<DoctorRecord | null> => {
    const doctors = getDoctors();
    return doctors.find(d => d.id === id) || null;
  },

  // Update doctor approval status
  updateDoctorStatus: async (
    id: string, 
    status: DoctorApprovalStatus
  ): Promise<{ success: boolean; error?: string }> => {
    // TODO: Replace with Supabase update
    // const { error } = await supabase.from('user_roles')
    //   .update({ status })
    //   .eq('user_id', doctorUserId)
    //   .eq('role', 'doctor');

    const doctors = getDoctors();
    const index = doctors.findIndex(d => d.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Doctor not found' };
    }

    doctors[index] = {
      ...doctors[index],
      status,
      isActive: status === 'approved',
      updatedAt: new Date().toISOString(),
    };
    
    saveDoctors(doctors);
    return { success: true };
  },

  // Approve a doctor
  approveDoctor: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return doctorService.updateDoctorStatus(id, 'approved');
  },

  // Reject a doctor
  rejectDoctor: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return doctorService.updateDoctorStatus(id, 'rejected');
  },

  // Deactivate a doctor
  deactivateDoctor: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return doctorService.updateDoctorStatus(id, 'deactivated');
  },

  // Reactivate a doctor
  reactivateDoctor: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return doctorService.updateDoctorStatus(id, 'approved');
  },
};
