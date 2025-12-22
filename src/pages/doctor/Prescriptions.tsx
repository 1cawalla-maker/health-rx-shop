import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type PrescriptionStatus = Database['public']['Enums']['prescription_status'];

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    const { data } = await supabase.from('prescriptions').select('*').order('created_at', { ascending: false });
    setPrescriptions(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: PrescriptionStatus, reason?: string) => {
    await supabase.from('prescriptions').update({ 
      status, 
      review_reason: reason, 
      issued_at: status === 'active' ? new Date().toISOString() : null 
    }).eq('id', id);
    toast.success('Prescription updated');
    fetchPrescriptions();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Prescriptions</h1>
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No prescriptions found.
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Patient ID: {p.patient_id.slice(0, 8)}...</p>
                    <p className="text-sm text-muted-foreground capitalize">{p.prescription_type} prescription</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{p.status.replace('_', ' ')}</Badge>
                    {p.status === 'pending_review' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(p.id, 'active')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(p.id, 'rejected', 'Does not meet requirements')}>Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
