// Availability Service - handles doctor availability management
import { supabase } from '@/integrations/supabase/client';
import type { AvailabilitySlot, AvailabilityType } from '@/types/telehealth';

// Map database row to AvailabilitySlot
function mapToAvailabilitySlot(row: any): AvailabilitySlot {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    availabilityType: row.availability_type,
    dayOfWeek: row.day_of_week,
    specificDate: row.specific_date,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    maxBookings: row.max_bookings,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const availabilityService = {
  // Get doctor's availability slots
  async getDoctorAvailability(doctorId: string): Promise<AvailabilitySlot[]> {
    const { data, error } = await supabase
      .from('doctor_availability_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }

    return (data || []).map(mapToAvailabilitySlot);
  },

  // Create recurring weekly availability
  async createRecurringSlot(
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    maxBookings: number = 1,
    timezone: string = 'Australia/Sydney'
  ): Promise<AvailabilitySlot> {
    const { data, error } = await supabase
      .from('doctor_availability_slots')
      .insert({
        doctor_id: doctorId,
        availability_type: 'recurring' as AvailabilityType,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        max_bookings: maxBookings,
        timezone,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring slot:', error);
      throw error;
    }

    return mapToAvailabilitySlot(data);
  },

  // Create one-off availability
  async createOneOffSlot(
    doctorId: string,
    specificDate: string,
    startTime: string,
    endTime: string,
    maxBookings: number = 1,
    timezone: string = 'Australia/Sydney'
  ): Promise<AvailabilitySlot> {
    const { data, error } = await supabase
      .from('doctor_availability_slots')
      .insert({
        doctor_id: doctorId,
        availability_type: 'one_off' as AvailabilityType,
        specific_date: specificDate,
        start_time: startTime,
        end_time: endTime,
        max_bookings: maxBookings,
        timezone,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating one-off slot:', error);
      throw error;
    }

    return mapToAvailabilitySlot(data);
  },

  // Block a specific date/time
  async createBlockedSlot(
    doctorId: string,
    specificDate: string,
    startTime: string,
    endTime: string,
    timezone: string = 'Australia/Sydney'
  ): Promise<AvailabilitySlot> {
    const { data, error } = await supabase
      .from('doctor_availability_slots')
      .insert({
        doctor_id: doctorId,
        availability_type: 'blocked' as AvailabilityType,
        specific_date: specificDate,
        start_time: startTime,
        end_time: endTime,
        max_bookings: 0,
        timezone,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blocked slot:', error);
      throw error;
    }

    return mapToAvailabilitySlot(data);
  },

  // Remove/deactivate a slot
  async removeSlot(slotId: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_availability_slots')
      .update({ is_active: false })
      .eq('id', slotId);

    if (error) {
      console.error('Error removing slot:', error);
      throw error;
    }
  },

  // Delete a slot permanently
  async deleteSlot(slotId: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_availability_slots')
      .delete()
      .eq('id', slotId);

    if (error) {
      console.error('Error deleting slot:', error);
      throw error;
    }
  },

  // Get available slots for a specific date (for patient booking)
  async getAvailableSlotsForDate(
    date: string,
    timezone: string = 'Australia/Sydney'
  ): Promise<{ slotId: string; doctorId: string; startTime: string; endTime: string; availableCapacity: number }[]> {
    const { data, error } = await supabase
      .rpc('get_available_slots', {
        _date: date,
        _timezone: timezone,
      });

    if (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      slotId: row.slot_id,
      doctorId: row.doctor_id,
      startTime: row.start_time,
      endTime: row.end_time,
      availableCapacity: row.available_capacity,
    }));
  },

  // Update slot capacity
  async updateSlotCapacity(slotId: string, maxBookings: number): Promise<void> {
    const { error } = await supabase
      .from('doctor_availability_slots')
      .update({ max_bookings: maxBookings })
      .eq('id', slotId);

    if (error) {
      console.error('Error updating slot capacity:', error);
      throw error;
    }
  },
};
