import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  requireApproval?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireApproval = true }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(userRole.role)) {
    // Redirect to appropriate dashboard based on role
    switch (userRole.role) {
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  if (requireApproval && userRole.role === 'doctor' && userRole.status === 'pending_approval') {
    return <Navigate to="/doctor/pending" replace />;
  }

  if (userRole.status === 'deactivated') {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
