import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Patient {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  booking_count: number;
  last_booking: string | null;
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;

    // Get all consultations for this doctor
    const { data: consultations } = await supabase
      .from('consultations')
      .select('patient_id, scheduled_at')
      .or(`doctor_id.eq.${user.id}`)
      .order('scheduled_at', { ascending: false });

    if (!consultations || consultations.length === 0) {
      setPatients([]);
      setLoading(false);
      return;
    }

    // Group by patient
    const patientMap = new Map<string, { count: number; lastBooking: string }>();
    consultations.forEach(c => {
      const existing = patientMap.get(c.patient_id);
      if (existing) {
        existing.count++;
      } else {
        patientMap.set(c.patient_id, { count: 1, lastBooking: c.scheduled_at });
      }
    });

    // Fetch profiles
    const patientIds = [...patientMap.keys()];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .in('user_id', patientIds);

    const patientsWithData = patientIds.map(id => {
      const profile = profiles?.find(p => p.user_id === id);
      const bookingData = patientMap.get(id)!;
      return {
        user_id: id,
        full_name: profile?.full_name || null,
        phone: profile?.phone || null,
        booking_count: bookingData.count,
        last_booking: bookingData.lastBooking
      };
    });

    setPatients(patientsWithData);
    setLoading(false);
  };

  const filteredPatients = patients.filter(patient => 
    searchQuery === '' || 
    patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">My Patients</h1>
        <p className="text-muted-foreground mt-1">Patients you have consulted with</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPatients.length > 0 ? (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div key={patient.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{patient.full_name || 'Unknown'}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{patient.booking_count} consultation{patient.booking_count !== 1 ? 's' : ''}</span>
                        {patient.last_booking && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last: {format(new Date(patient.last_booking), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/doctor/patient/${patient.user_id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View History
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No patients match your search' : 'No patients yet'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
