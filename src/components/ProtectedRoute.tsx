import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  requireApproval?: boolean;
}

function loginPathFor(role: AppRole | undefined, pathname: string, search: string) {
  const intendedRole = role || 'patient';
  const next = `${pathname}${search}`;
  const params = new URLSearchParams({ role: intendedRole, next });

  if (intendedRole === 'patient' && pathname === '/patient/upload-prescription') {
    params.set('mode', 'signup');
  }

  return `/phone-login?${params.toString()}`;
}

export function ProtectedRoute({ children, allowedRoles, requireApproval = true }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const loginPath = loginPathFor(allowedRoles[0], location.pathname, location.search);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  if (!userRole) {
    return <Navigate to={loginPath} replace />;
  }

  if (!allowedRoles.includes(userRole.role)) {
    // Redirect to appropriate dashboard based on role
    switch (userRole.role) {
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/halaxy-consults" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to={loginPath} replace />;
    }
  }

  // TODO(phase2): restore pending doctor redirect once doctor approval UX is finalized.
  if (userRole.status === 'suspended') {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
