import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Users, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({ consultations: 0, pendingPrescriptions: 0 });
  const [recentConsultations, setRecentConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: consultations } = await supabase
      .from('consultations')
      .select('*')
      .in('status', ['requested', 'confirmed'])
      .order('scheduled_at', { ascending: true })
      .limit(5);
    
    // Fetch patient names separately
    const patientIds = consultations?.map(c => c.patient_id).filter(Boolean) || [];
    const { data: profiles } = patientIds.length > 0 
      ? await supabase.from('profiles').select('user_id, full_name').in('user_id', patientIds)
      : { data: [] };
    
    const profileMap = new Map<string, string>();
    profiles?.forEach(p => {
      if (p.user_id && p.full_name) {
        profileMap.set(p.user_id, p.full_name);
      }
    });
    
    const consultationsWithNames = consultations?.map(c => ({
      ...c,
      patient_name: profileMap.get(c.patient_id) || 'Patient'
    })) || [];

    const { count: pendingCount } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review');

    setRecentConsultations(consultationsWithNames);
    setStats({
      consultations: consultations?.length || 0,
      pendingPrescriptions: pendingCount || 0
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Doctor Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Consultations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.consultations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions to Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingPrescriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild size="sm" className="w-full"><Link to="/doctor/consultations">View Consultations</Link></Button>
            <Button asChild size="sm" variant="outline" className="w-full"><Link to="/doctor/prescriptions">Review Prescriptions</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Upcoming Consultations</CardTitle></CardHeader>
        <CardContent>
          {recentConsultations.length > 0 ? (
            <div className="space-y-3">
              {recentConsultations.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{c.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(c.scheduled_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{c.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming consultations</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
