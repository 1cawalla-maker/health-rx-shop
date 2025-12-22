import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Doctor {
  id: string;
  user_id: string;
  provider_number: string | null;
  specialties: string[] | null;
  is_active: boolean;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  availability?: DoctorAvailability[];
}

interface DoctorAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    // Fetch doctors
    const { data: doctorsData } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (doctorsData) {
      // Fetch profiles separately
      const userIds = doctorsData.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);
      
      const doctorsWithProfiles = doctorsData.map(d => ({
        ...d,
        profile: profiles?.find(p => p.user_id === d.user_id)
      }));
      
      setDoctors(doctorsWithProfiles);
    }
    setLoading(false);
  };

  const toggleDoctorStatus = async (doctorId: string, isActive: boolean) => {
    await supabase
      .from('doctors')
      .update({ is_active: !isActive })
      .eq('id', doctorId);
    
    toast.success(`Doctor ${isActive ? 'deactivated' : 'activated'}`);
    fetchDoctors();
  };

  const openAvailability = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    
    const { data } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctor.id)
      .order('day_of_week');
    
    // Initialize all days if not present
    const existingDays = data?.map(a => a.day_of_week) || [];
    const fullAvailability = DAYS.map((_, idx) => {
      const existing = data?.find(a => a.day_of_week === idx);
      return existing || {
        id: `new-${idx}`,
        day_of_week: idx,
        start_time: '09:00',
        end_time: '17:00',
        is_available: false,
      };
    });
    
    setAvailability(fullAvailability);
    setAvailabilityOpen(true);
  };

  const saveAvailability = async () => {
    if (!selectedDoctor) return;
    
    for (const slot of availability) {
      if (slot.id.startsWith('new-')) {
        if (slot.is_available) {
          await supabase.from('doctor_availability').insert({
            doctor_id: selectedDoctor.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
            timezone: 'Australia/Sydney',
          });
        }
      } else {
        await supabase.from('doctor_availability').update({
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        }).eq('id', slot.id);
      }
    }
    
    toast.success('Availability updated');
    setAvailabilityOpen(false);
  };

  const updateSlot = (dayIndex: number, field: string, value: any) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.day_of_week === dayIndex 
          ? { ...slot, [field]: value }
          : slot
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold">Doctor Management</h1>
      </div>

      <div className="grid gap-4">
        {doctors.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No doctors registered yet.
            </CardContent>
          </Card>
        ) : (
          doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {doctor.profile?.full_name || 'Unknown Doctor'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Provider: {doctor.provider_number || 'Not set'}
                      </p>
                      {doctor.specialties && doctor.specialties.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {doctor.specialties.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={doctor.is_active ? 'default' : 'secondary'}>
                      {doctor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAvailability(doctor)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Availability
                    </Button>
                    <Button
                      size="sm"
                      variant={doctor.is_active ? 'destructive' : 'default'}
                      onClick={() => toggleDoctorStatus(doctor.id, doctor.is_active)}
                    >
                      {doctor.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Availability Dialog */}
      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Availability - {selectedDoctor?.profile?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {availability.map((slot) => (
              <div
                key={slot.day_of_week}
                className="flex items-center gap-4 p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2 w-32">
                  <Checkbox
                    checked={slot.is_available}
                    onCheckedChange={(checked) => 
                      updateSlot(slot.day_of_week, 'is_available', checked)
                    }
                  />
                  <span className="font-medium">{DAYS[slot.day_of_week]}</span>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">From</Label>
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => 
                        updateSlot(slot.day_of_week, 'start_time', e.target.value)
                      }
                      disabled={!slot.is_available}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">To</Label>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => 
                        updateSlot(slot.day_of_week, 'end_time', e.target.value)
                      }
                      disabled={!slot.is_available}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAvailabilityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAvailability}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
