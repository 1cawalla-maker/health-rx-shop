import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { cartService } from '@/services/cartService';

export type AppRole = Database['public']['Enums']['app_role'];
export type UserStatus = Database['public']['Enums']['user_status'];

interface UserRole {
  role: AppRole;
  status: UserStatus;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: AppRole
  ) => Promise<{ error: Error | null; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const errorMsg = 'Supabase is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.';
      console.error(errorMsg);
      setConfigError(errorMsg);
      setLoading(false);
      return;
    }
  }, []);

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching user role:', error);
        }
        return null;
      }

      if (data) {
        return {
          role: data.role,
          status: data.status
        };
      }
      return null;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error in fetchUserRole:', err);
      }
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userId = session.user.id;

          // Best-effort welcome email on first SIGNED_IN event.
          // This covers:
          // - users who end up with a session right after signup
          // - users who only get a session after email confirmation redirect
          // - normal logins
          if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
            try {
              const sentKey = `welcome_email_sent:${userId}`;
              const alreadySent = window.localStorage.getItem(sentKey);

              if (!alreadySent) {
                const { error: welcomeErr } = await supabase.functions.invoke(
                  'send-welcome-email',
                  { body: {} }
                );

                if (!welcomeErr) {
                  window.localStorage.setItem(sentKey, new Date().toISOString());
                } else if (import.meta.env.DEV) {
                  console.error('Welcome email failed (non-fatal):', welcomeErr);
                }
              }
            } catch (e) {
              if (import.meta.env.DEV) {
                console.error('Welcome email exception (non-fatal):', e);
              }
            }
          }

          setTimeout(() => {
            fetchUserRole(userId).then(setUserRole);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Protect against rare hangs during auth bootstrap (network blockers, stale cookies, etc.)
    // If getSession never resolves, the /auth page can get stuck on an infinite spinner.
    const sessionTimeoutMs = 10000;

    Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AUTH_BOOTSTRAP_TIMEOUT')), sessionTimeoutMs)
      ),
    ])
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchUserRole(session.user.id).then((role) => {
            setUserRole(role);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Auth bootstrap failed:', err);
        setSession(null);
        setUser(null);
        setUserRole(null);
        setLoading(false);
        setConfigError(
          'We had trouble loading your session. Please refresh the page. If it persists, clear site data for pouchcare.com.au or try an Incognito window.'
        );
      });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (_email: string, _password: string, _fullName: string, _role: AppRole) => {
    return { error: new Error('Public email/password signup is disabled. Patients should use Start consult; doctors must be created by an admin.') };
  };

  const signIn = async (_email: string, _password: string) => {
    return { error: new Error('Email/password login is disabled. Please use phone login.') };
  };

  const signOut = async () => {
    // Clear cart before signing out to prevent data leakage
    await cartService.clearCart();
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  const resetPassword = async (_email: string) => {
    return { error: new Error('Password reset is disabled because PouchCare uses phone OTP login.') };
  };

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Configuration Error</h1>
          <p className="text-muted-foreground">{configError}</p>
          <p className="text-sm text-muted-foreground">
            Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
