import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    const { data } = await supabase.from('prescriptions').select('*, profiles!prescriptions_patient_id_fkey(full_name)').order('created_at', { ascending: false });
    setPrescriptions(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('prescriptions').update({ status, issued_at: status === 'active' ? new Date().toISOString() : null }).eq('id', id);
    toast.success('Prescription updated');
    fetchPrescriptions();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Prescriptions</h1>
      <div className="space-y-4">
        {prescriptions.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{p.profiles?.full_name || 'Patient'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{p.prescription_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{p.status.replace('_', ' ')}</Badge>
                  {p.status !== 'active' && <Button size="sm" onClick={() => updateStatus(p.id, 'active')}>Set Active</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
