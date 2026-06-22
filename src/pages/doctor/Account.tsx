import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Save, User } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorAccount() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const email = user?.email || '';
  const authPhone = user?.phone || '';

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [{ data: profile }, { data: doctor }] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('doctors')
            .select('phone')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        setFullName(
          (profile as any)?.full_name ||
          (user.user_metadata?.full_name as string | undefined) ||
          ''
        );
        setPhone((profile as any)?.phone || (doctor as any)?.phone || authPhone || '');
      } catch (error) {
        console.error('Failed to load doctor account details:', error);
        toast.error('Could not load account details.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user?.id, authPhone, user?.user_metadata?.full_name]);

  const saveAccount = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const cleanName = fullName.trim() || null;
      const cleanPhone = phone.trim() || null;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: cleanName,
          phone: cleanPhone,
        } as any, { onConflict: 'user_id' });
      if (profileError) throw profileError;

      const { error: doctorError } = await supabase
        .from('doctors')
        .update({ phone: cleanPhone } as any)
        .eq('user_id', user.id);
      if (doctorError) throw doctorError;

      toast.success('Account details saved.');
    } catch (error) {
      console.error('Failed to save doctor account details:', error);
      toast.error(error instanceof Error ? error.message : 'Could not save account details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-1">
          Basic contact details for your PouchCare doctor account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Doctor details
          </CardTitle>
          <CardDescription>
            PouchCare only needs these details for account access and patient-consultation matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="doctor-name">Name</Label>
            <Input
              id="doctor-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Doctor name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor-email">Email</Label>
            <Input
              id="doctor-email"
              value={email || 'No email on this account'}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed by admin/account setup.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor-phone">Phone number</Label>
            <Input
              id="doctor-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="04xx xxx xxx"
              inputMode="tel"
            />
            {authPhone && authPhone !== phone && (
              <p className="text-xs text-muted-foreground">
                Login phone on this account: {authPhone}
              </p>
            )}
          </div>

          <Button onClick={saveAccount} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
