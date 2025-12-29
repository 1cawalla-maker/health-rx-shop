// Doctor service - Supabase implementation for approval workflow
import { supabase } from '@/integrations/supabase/client';
import type { DoctorRecord } from '@/types/services';
import type { DoctorApprovalStatus } from '@/types/enums';
import type { Database } from '@/integrations/supabase/types';

// Database user_status type (without 'rejected')
type DbUserStatus = Database['public']['Enums']['user_status'];

// Map app status to database status
const mapToDbStatus = (status: DoctorApprovalStatus): DbUserStatus => {
  if (status === 'rejected') return 'deactivated';
  return status as DbUserStatus;
};

export const doctorService = {
  // List all doctors (for admin)
  listDoctors: async (statusFilter?: DoctorApprovalStatus): Promise<DoctorRecord[]> => {
    try {
      // Query the admin_user_overview view which joins all the relevant tables
      let query = supabase
        .from('admin_user_overview')
        .select('*')
        .eq('role', 'doctor');

      if (statusFilter) {
        const dbStatus = mapToDbStatus(statusFilter);
        query = query.eq('status', dbStatus);
      }

      const { data, error } = await query.order('role_created_at', { ascending: false });

      if (error) {
        console.error('Error fetching doctors:', error);
        return [];
      }

      // Get the user emails from auth (not available in view)
      // We'll need to fetch doctor records separately
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('*');

      const doctorsMap = new Map(doctorsData?.map(d => [d.user_id, d]) || []);

      return (data || []).map((row: any) => ({
        id: row.role_id || row.user_id,
        userId: row.user_id,
        fullName: row.full_name,
        email: null, // Email is in auth.users, not accessible from frontend
        phone: row.phone || doctorsMap.get(row.user_id)?.phone,
        providerNumber: row.provider_number || doctorsMap.get(row.user_id)?.provider_number,
        ahpraNumber: doctorsMap.get(row.user_id)?.ahpra_number || null,
        specialties: row.specialties || doctorsMap.get(row.user_id)?.specialties || [],
        practiceLocation: doctorsMap.get(row.user_id)?.practice_location || null,
        specialty: row.specialty,
        status: row.status as DoctorApprovalStatus,
        isActive: row.doctor_is_active ?? false,
        createdAt: row.role_created_at,
        updatedAt: row.profile_created_at,
      }));
    } catch (err) {
      console.error('Error in listDoctors:', err);
      return [];
    }
  },

  // Get pending doctor approvals count
  getPendingCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'doctor')
      .eq('status', 'pending_approval');

    if (error) {
      console.error('Error fetching pending count:', error);
      return 0;
    }

    return count || 0;
  },

  // Get a single doctor by ID
  getDoctorById: async (id: string): Promise<DoctorRecord | null> => {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (roleError || !roleData) return null;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', roleData.user_id)
      .single();

    const { data: doctorData } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', roleData.user_id)
      .single();

    const { data: doctorProfileData } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', roleData.user_id)
      .single();

    return {
      id: roleData.id,
      userId: roleData.user_id,
      fullName: profileData?.full_name || null,
      email: null,
      phone: profileData?.phone || doctorData?.phone || null,
      providerNumber: doctorData?.provider_number || null,
      ahpraNumber: doctorData?.ahpra_number || null,
      specialties: doctorData?.specialties || [],
      practiceLocation: doctorData?.practice_location || null,
      specialty: doctorProfileData?.specialty || null,
      status: roleData.status as DoctorApprovalStatus,
      isActive: doctorData?.is_active ?? false,
      createdAt: roleData.created_at,
      updatedAt: profileData?.updated_at || roleData.created_at,
    };
  },

  // Update doctor approval status
  updateDoctorStatus: async (
    id: string, 
    status: DoctorApprovalStatus
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbStatus = mapToDbStatus(status);
      
      // First get the user_id from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('id', id)
        .single();

      if (roleError || !roleData) {
        return { success: false, error: 'Doctor not found' };
      }

      // Update user_roles status
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ status: dbStatus })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating user_roles:', updateError);
        return { success: false, error: updateError.message };
      }

      // Also update doctors.is_active based on status
      const isActive = status === 'approved';
      const { error: doctorError } = await supabase
        .from('doctors')
        .update({ 
          is_active: isActive,
          registration_complete: isActive 
        })
        .eq('user_id', roleData.user_id);

      if (doctorError) {
        console.error('Error updating doctors:', doctorError);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error in updateDoctorStatus:', err);
      return { success: false, error: err.message };
    }
  },

  // Approve a doctor
  approveDoctor: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return doctorService.updateDoctorStatus(id, 'approved');
  },

  // Reject a doctor (deactivated status)
  rejectDoctor: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return doctorService.updateDoctorStatus(id, 'deactivated');
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
