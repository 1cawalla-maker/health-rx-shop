import type { AppRole } from '@/hooks/useAuth';

export function getDashboardPathForRole(role: AppRole | null | undefined) {
  switch (role) {
    case 'patient':
      return '/patient/dashboard';
    case 'doctor':
      return '/doctor/halaxy-consults';
    case 'admin':
      return '/admin/dashboard';
    default:
      return null;
  }
}
