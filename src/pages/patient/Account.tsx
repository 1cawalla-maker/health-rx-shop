import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userPreferencesService } from '@/services/userPreferencesService';
import { AU_TIMEZONE_OPTIONS, timezoneLabel } from '@/lib/timezones';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, User, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientAccount() {
  const { user } = useAuth();
  const email = useMemo(() => user?.email || '', [user?.email]);

  const [timezone, setTimezone] = useState('Australia/Brisbane');

  useEffect(() => {
    if (!user?.id) return;
    setTimezone(userPreferencesService.getTimezone(user.id));
  }, [user?.id]);

  const saveTz = () => {
    if (!user?.id) return;
    userPreferencesService.setTimezone(user.id, timezone);
    toast.success('Timezone saved');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

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

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Timezone
          </CardTitle>
          <CardDescription>All consultation and booking times are displayed in this timezone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AU_TIMEZONE_OPTIONS.map((opt, i) => (
                  <SelectItem key={`${opt.value}-${i}`} value={opt.value}>{opt.label} ({opt.value})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={saveTz}>Save</Button>
          </div>
          <p className="text-xs text-muted-foreground">Default: Australia/Brisbane. Only Australian timezones are supported.</p>
        </CardContent>
      </Card>
    </div>
  );
}
