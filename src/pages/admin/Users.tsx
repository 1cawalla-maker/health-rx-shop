import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('user_roles').select('*, profiles(full_name)').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('user_roles').update({ status }).eq('id', id);
    toast.success('User updated');
    fetchUsers();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">User Management</h1>
      <div className="space-y-4">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{u.profiles?.full_name || 'User'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{u.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{u.status.replace('_', ' ')}</Badge>
                  {u.status === 'pending_approval' && <Button size="sm" onClick={() => updateStatus(u.id, 'approved')}>Approve</Button>}
                  {u.status === 'approved' && <Button size="sm" variant="destructive" onClick={() => updateStatus(u.id, 'deactivated')}>Deactivate</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
