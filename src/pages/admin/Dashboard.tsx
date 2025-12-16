import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, FileText, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, pendingDoctors: 0, consultations: 0, prescriptions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: users }, { count: pendingDoctors }, { count: consultations }, { count: prescriptions }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'doctor').eq('status', 'pending_approval'),
        supabase.from('consultations').select('*', { count: 'exact', head: true }),
        supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      setStats({ users: users || 0, pendingDoctors: pendingDoctors || 0, consultations: consultations || 0, prescriptions: prescriptions || 0 });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Total Users</CardTitle><Users className="h-4 w-4" /></CardHeader><CardContent><p className="text-2xl font-bold">{stats.users}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Pending Doctors</CardTitle><Users className="h-4 w-4" /></CardHeader><CardContent><p className="text-2xl font-bold">{stats.pendingDoctors}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Consultations</CardTitle><Calendar className="h-4 w-4" /></CardHeader><CardContent><p className="text-2xl font-bold">{stats.consultations}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Active Prescriptions</CardTitle><FileText className="h-4 w-4" /></CardHeader><CardContent><p className="text-2xl font-bold">{stats.prescriptions}</p></CardContent></Card>
      </div>
    </div>
  );
}
