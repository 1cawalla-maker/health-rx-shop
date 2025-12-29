import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Plus, Trash2, Clock, CalendarDays } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  availability_type: 'recurring' | 'one_off' | 'blocked';
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
  timezone: string;
}

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // New slot form state
  const [newSlotType, setNewSlotType] = useState<'recurring' | 'one_off' | 'blocked'>('recurring');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxBookings, setMaxBookings] = useState(5);

  useEffect(() => {
    if (user) {
      fetchDoctorAndSlots();
    }
  }, [user]);

  const fetchDoctorAndSlots = async () => {
    if (!user) return;

    // Get doctor ID
    const { data: doctorData } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctorData) {
      setLoading(false);
      return;
    }

    setDoctorId(doctorData.id);

    // Get availability slots
    const { data: slotsData } = await supabase
      .from('doctor_availability_slots')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    setSlots((slotsData || []) as AvailabilitySlot[]);
    setLoading(false);
  };

  const addSlot = async () => {
    if (!doctorId) {
      toast.error('Doctor profile not found');
      return;
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    setSaving(true);

    try {
      const newSlot: any = {
        doctor_id: doctorId,
        availability_type: newSlotType,
        start_time: startTime,
        end_time: endTime,
        max_bookings: newSlotType === 'blocked' ? 0 : maxBookings,
        is_active: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      if (newSlotType === 'recurring') {
        newSlot.day_of_week = selectedDay;
      } else if (selectedDate) {
        newSlot.specific_date = format(selectedDate, 'yyyy-MM-dd');
      } else {
        toast.error('Please select a date');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('doctor_availability_slots')
        .insert(newSlot);

      if (error) throw error;

      toast.success('Availability slot added');
      fetchDoctorAndSlots();
    } catch (err: any) {
      console.error('Error adding slot:', err);
      toast.error(err.message || 'Failed to add slot');
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from('doctor_availability_slots')
      .delete()
      .eq('id', slotId);

    if (error) {
      toast.error('Failed to delete slot');
    } else {
      toast.success('Slot deleted');
      setSlots(slots.filter(s => s.id !== slotId));
    }
  };

  const toggleSlotActive = async (slotId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('doctor_availability_slots')
      .update({ is_active: isActive })
      .eq('id', slotId);

    if (error) {
      toast.error('Failed to update slot');
    } else {
      setSlots(slots.map(s => s.id === slotId ? { ...s, is_active: isActive } : s));
    }
  };

  const recurringSlots = slots.filter(s => s.availability_type === 'recurring');
  const oneOffSlots = slots.filter(s => s.availability_type === 'one_off');
  const blockedSlots = slots.filter(s => s.availability_type === 'blocked');

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
        <h1 className="font-display text-3xl font-bold text-foreground">Availability</h1>
        <p className="text-muted-foreground mt-1">Manage your consultation time slots</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add New Slot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Availability
            </CardTitle>
            <CardDescription>Create new time slots for consultations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={newSlotType} onValueChange={(v) => setNewSlotType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recurring">Weekly</TabsTrigger>
                <TabsTrigger value="one_off">One-off</TabsTrigger>
                <TabsTrigger value="blocked">Block Time</TabsTrigger>
              </TabsList>

              <TabsContent value="recurring" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="one_off" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              </TabsContent>

              <TabsContent value="blocked" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Block Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newSlotType !== 'blocked' && (
              <div className="space-y-2">
                <Label>Max Bookings per Slot</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxBookings}
                  onChange={(e) => setMaxBookings(Number(e.target.value))}
                />
              </div>
            )}

            <Button onClick={addSlot} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Slot'}
            </Button>
          </CardContent>
        </Card>

        {/* Current Slots */}
        <div className="space-y-4">
          {/* Recurring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recurringSlots.length > 0 ? (
                <div className="space-y-2">
                  {recurringSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={slot.is_active}
                          onCheckedChange={(checked) => toggleSlotActive(slot.id, checked)}
                        />
                        <div>
                          <p className="font-medium">
                            {DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {slot.start_time} - {slot.end_time} ({slot.max_bookings} slots)
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recurring slots set up</p>
              )}
            </CardContent>
          </Card>

          {/* One-off */}
          {oneOffSlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Special Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {oneOffSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={slot.is_active}
                          onCheckedChange={(checked) => toggleSlotActive(slot.id, checked)}
                        />
                        <div>
                          <p className="font-medium">
                            {slot.specific_date && format(new Date(slot.specific_date), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {slot.start_time} - {slot.end_time}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blocked */}
          {blockedSlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Blocked Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blockedSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {slot.specific_date && format(new Date(slot.specific_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slot.start_time} - {slot.end_time}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
