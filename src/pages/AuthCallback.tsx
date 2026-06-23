import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo from '@/components/seo/Seo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Finishing secure login…');
  const nextPath = useMemo(() => safeNextPath(searchParams.get('next')), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        const urlError = searchParams.get('error_description') || searchParams.get('error');
        if (urlError) throw new Error(urlError);

        const code = searchParams.get('code');
        if (code) {
          setStatus('Confirming Google session…');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        setStatus('Checking account access…');
        const { data, error: finalizeError } = await supabase.functions.invoke('finalize-patient-google-login', {
          body: {},
        });
        if (finalizeError) throw finalizeError;
        if ((data as any)?.error) throw new Error((data as any).error);

        const path = nextPath || (data as any)?.path || '/patient/dashboard';
        if (!cancelled) navigate(path, { replace: true });
      } catch (err) {
        await supabase.auth.signOut();
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not complete Google login.');
        }
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate, nextPath, searchParams]);

  return (
    <PublicLayout>
      <Seo title="Finishing login" description="Finishing secure PouchCare login." canonicalPath="/auth/callback" noIndex />
      <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
        <div className="container max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Google login
              </CardTitle>
              <CardDescription>
                We only allow Google login for existing approved patient accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error ? (
                <>
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button asChild className="w-full">
                    <Link to="/phone-login">Back to login</Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
