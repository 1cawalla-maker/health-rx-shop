import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DoctorConsultations() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConsultations(); }, []);

  const fetchConsultations = async () => {
    const { data } = await supabase.from('consultations').select('*, profiles!consultations_patient_id_fkey(full_name)').order('scheduled_at', { ascending: false });
    setConsultations(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('consultations').update({ status }).eq('id', id);
    toast.success('Consultation updated');
    fetchConsultations();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Consultations</h1>
      <div className="space-y-4">
        {consultations.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{c.profiles?.full_name || 'Patient'}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(c.scheduled_at), 'MMM d, yyyy h:mm a')} • {c.consultation_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{c.status}</Badge>
                  {c.status === 'requested' && <Button size="sm" onClick={() => updateStatus(c.id, 'confirmed')}>Confirm</Button>}
                  {c.status === 'confirmed' && <Button size="sm" onClick={() => updateStatus(c.id, 'completed')}>Complete</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
