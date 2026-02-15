import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, User, AlertCircle } from 'lucide-react';

export default function PatientAccount() {
  const { user } = useAuth();

  const email = useMemo(() => user?.email || '', [user?.email]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Phase 1: profile editing is stubbed (no backend writes)</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Phase 1 Stub
          </CardTitle>
          <CardDescription>
            Profile persistence will be wired in Phase 2 (Supabase table + RLS). In Phase 1 we avoid Supabase writes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            You can still use the app normally. This page is kept for UX completeness, but does not save changes yet.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Info
          </CardTitle>
          <CardDescription>Read-only in Phase 1</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{email || 'Not signed in'}</span>
            </div>
            <Badge variant="outline">Read-only</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
