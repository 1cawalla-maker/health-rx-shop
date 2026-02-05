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
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
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
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then(setUserRole);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
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
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured. Please check environment variables.') };
    }

    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://health-rx-shop.vercel.app';
      const redirectUrl = `${siteUrl}/`;
      
      if (import.meta.env.DEV) {
        console.log('Signup attempt:', { email, role, redirectUrl });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Supabase signup error:', error);
        }
        return { error };
      }

      if (data.user) {
        const status: UserStatus = role === 'doctor' ? 'pending_approval' : 'approved';
        
        // Create user_roles record
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: role,
            status: status
          });

        if (roleError) {
          if (import.meta.env.DEV) {
            console.error('Error creating user role:', roleError);
          }
          return { error: new Error('Failed to assign role. Please try again.') };
        }

        // Create profile record (handled by trigger, but ensure it exists)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            full_name: fullName
          }, { onConflict: 'user_id' });

        if (profileError && import.meta.env.DEV) {
          console.error('Error creating profile:', profileError);
        }

        // Create role-specific profile
        if (role === 'patient') {
          const { error: patientError } = await supabase
            .from('patient_profiles')
            .insert({ user_id: data.user.id });
          
          if (patientError && import.meta.env.DEV) {
            console.error('Error creating patient profile:', patientError);
          }
        } else if (role === 'doctor') {
          // Create doctors table record
          const { error: doctorsError } = await supabase
            .from('doctors')
            .insert({ 
              user_id: data.user.id,
              is_active: false,
              registration_complete: false
            });
          
          if (doctorsError && import.meta.env.DEV) {
            console.error('Error creating doctors record:', doctorsError);
          }

          // Create doctor_profiles record
          const { error: doctorProfileError } = await supabase
            .from('doctor_profiles')
            .insert({ user_id: data.user.id });
          
          if (doctorProfileError && import.meta.env.DEV) {
            console.error('Error creating doctor profile:', doctorProfileError);
          }
        }

        setUserRole({ role, status });
      }

      return { error: null };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Signup exception:', err);
      }
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured. Please check environment variables.') };
    }

    try {
      if (import.meta.env.DEV) {
        console.log('Login attempt:', { email });
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error && import.meta.env.DEV) {
        console.error('Supabase login error:', error);
      }

      return { error };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Login exception:', err);
      }
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    // Clear cart before signing out to prevent data leakage
    await cartService.clearCart();
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured. Please check environment variables.') };
    }

    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://health-rx-shop.vercel.app';
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth?mode=reset`
      });

      return { error };
    } catch (err) {
      return { error: err as Error };
    }
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
