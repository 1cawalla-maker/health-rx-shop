import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DoctorWithProfile, DoctorAvailability } from '@/types/database';

export function useDoctors(options?: { activeOnly?: boolean }) {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('doctors').select('*');

      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch profiles for doctors
      if (data && data.length > 0) {
        const userIds = data.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const doctorsWithProfile = data.map(doctor => ({
          ...doctor,
          profile: profileMap.get(doctor.user_id) || null
        }));

        setDoctors(doctorsWithProfile as DoctorWithProfile[]);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options?.activeOnly]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
}

export function useDoctorAvailability(doctorId: string | null) {
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) {
      setAvailability([]);
      setLoading(false);
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_available', true)
        .order('day_of_week');

      setAvailability((data || []) as DoctorAvailability[]);
      setLoading(false);
    };

    fetchAvailability();
  }, [doctorId]);

  return { availability, loading };
}
