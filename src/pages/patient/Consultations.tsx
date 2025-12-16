import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Video, Phone, Loader2 } from 'lucide-react';
import { format, isPast } from 'date-fns';

interface Consultation {
  id: string;
  scheduled_at: string;
  consultation_type: 'video' | 'phone';
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export default function PatientConsultations() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConsultations();
    }
  }, [user]);

  const fetchConsultations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', user.id)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching consultations:', error);
    } else {
      setConsultations(data || []);
    }
    setLoading(false);
  };

  const upcomingConsultations = consultations.filter(
    c => !isPast(new Date(c.scheduled_at)) && ['requested', 'confirmed'].includes(c.status)
  );
  
  const pastConsultations = consultations.filter(
    c => isPast(new Date(c.scheduled_at)) || ['completed', 'cancelled'].includes(c.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Requested</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const ConsultationCard = ({ consultation }: { consultation: Consultation }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {consultation.consultation_type === 'video' ? (
                <Video className="h-5 w-5 text-primary" />
              ) : (
                <Phone className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-medium capitalize">
                {consultation.consultation_type} Consultation
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(consultation.scheduled_at), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(consultation.scheduled_at), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
          {getStatusBadge(consultation.status)}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Consultations</h1>
          <p className="text-muted-foreground mt-1">View and manage your consultations</p>
        </div>
        <Button asChild>
          <Link to="/patient/book">Book New</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingConsultations.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastConsultations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingConsultations.length > 0 ? (
            <div className="space-y-4">
              {upcomingConsultations.map((consultation) => (
                <ConsultationCard key={consultation.id} consultation={consultation} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">No upcoming consultations</CardTitle>
                <CardDescription>
                  Book a consultation to speak with a doctor
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link to="/patient/book">Book Consultation</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastConsultations.length > 0 ? (
            <div className="space-y-4">
              {pastConsultations.map((consultation) => (
                <ConsultationCard key={consultation.id} consultation={consultation} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">No past consultations</CardTitle>
                <CardDescription>
                  Your completed consultations will appear here
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
