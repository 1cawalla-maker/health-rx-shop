// Auth service - placeholder for Supabase integration
// Currently uses localStorage mock, will be replaced with Supabase auth

import type { CurrentUser } from '@/types/services';
import type { UserRole } from '@/types/enums';

const MOCK_STORAGE_KEY = 'healthrx_mock_user';

// Mock user for development - in production, this comes from Supabase auth
const getMockUser = (): CurrentUser | null => {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const authService = {
  // Get current authenticated user
  getCurrentUser: async (): Promise<CurrentUser | null> => {
    // TODO: Replace with Supabase auth
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return null;
    // const { data: role } = await supabase.rpc('get_user_role', { _user_id: user.id });
    // return { id: user.id, email: user.email, role };
    
    return getMockUser();
  },

  // Check if user has a specific role
  hasRole: async (role: UserRole): Promise<boolean> => {
    const user = await authService.getCurrentUser();
    return user?.role === role;
  },

  // Check if user is admin
  isAdmin: async (): Promise<boolean> => {
    return authService.hasRole('admin');
  },

  // Check if user is doctor
  isDoctor: async (): Promise<boolean> => {
    return authService.hasRole('doctor');
  },

  // Check if user is patient
  isPatient: async (): Promise<boolean> => {
    return authService.hasRole('patient');
  },

  // For development: set mock user
  setMockUser: (user: CurrentUser | null): void => {
    if (user) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    }
  },
};
