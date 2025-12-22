import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BookingWithPatient, BookingStatus } from '@/types/database';

export function useBookings(options?: {
  status?: BookingStatus[];
  doctorId?: string;
  patientId?: string;
  includePatient?: boolean;
}) {
  const { user, userRole } = useAuth();
  const [bookings, setBookings] = useState<BookingWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('consultations')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (options?.status && options.status.length > 0) {
        query = query.in('status', options.status);
      }

      if (options?.doctorId) {
        query = query.eq('doctor_id', options.doctorId);
      } else if (options?.patientId) {
        query = query.eq('patient_id', options.patientId);
      } else if (userRole?.role === 'patient') {
        query = query.eq('patient_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch patient profiles if needed
      if (options?.includePatient && data && data.length > 0) {
        const patientIds = [...new Set(data.map(b => b.patient_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', patientIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const bookingsWithPatient = data.map(booking => ({
          ...booking,
          patient_profile: profileMap.get(booking.patient_id) || null
        }));

        setBookings(bookingsWithPatient as BookingWithPatient[]);
      } else {
        setBookings((data || []) as BookingWithPatient[]);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, userRole, options?.status, options?.doctorId, options?.patientId, options?.includePatient]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    const { error } = await supabase
      .from('consultations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (!error) {
      await fetchBookings();
    }
    return { error };
  };

  const assignDoctor = async (bookingId: string, doctorId: string) => {
    const { error } = await supabase
      .from('consultations')
      .update({ doctor_id: doctorId, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (!error) {
      await fetchBookings();
    }
    return { error };
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    updateBookingStatus,
    assignDoctor
  };
}
