import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { useDoctorReadiness } from '@/hooks/useDoctorReadiness';
import { useAuth } from '@/hooks/useAuth';
import { PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES } from '@/constants/routing';
import {
  Stethoscope,
  Phone,
  Clock,
  FileText,
  DollarSign,
  Info,
  Menu,
  X,
  LogOut,
  User,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/doctor/consultations', label: 'Consultations', icon: Phone },
  { href: '/doctor/availability', label: 'Availability', icon: Clock },
  { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/doctor/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/doctor/info', label: 'Info', icon: Info },
  { href: '/doctor/account', label: 'Account', icon: User },
];

function isRouteAllowedPreOnboarding(pathname: string): boolean {
  return PRE_ONBOARDING_ALLOWED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

export function DoctorLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { ready, loading: readinessLoading } = useDoctorReadiness();

  // Onboarding gate: deny-by-default for non-allowlisted routes
  if (!readinessLoading && !ready) {
    if (!isRouteAllowedPreOnboarding(location.pathname)) {
      return <Navigate to="/doctor/onboarding" replace />;
    }
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const showOnboardingBanner =
    !readinessLoading &&
    !ready &&
    !location.pathname.startsWith('/doctor/onboarding');

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16 flex items-center justify-between px-4">
        <Link to="/doctor/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Stethoscope className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>NicoPatch</span>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-foreground"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-background border-r border-border transition-transform lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="hidden lg:flex items-center gap-2 p-6 border-b border-border">
            <Link to="/doctor/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>NicoPatch</span>
            </Link>
          </div>

          <div className="hidden lg:block px-6 py-3 bg-primary/10 border-b border-primary/20">
            <span className="text-xs font-medium text-primary">Doctor Portal</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 mt-16 lg:mt-0">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/doctor/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {showOnboardingBanner && (
            <Alert className="mb-6 border-primary/50 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>Complete your onboarding to start receiving consultations.</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => navigate('/doctor/onboarding')}
                >
                  Complete Setup →
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
