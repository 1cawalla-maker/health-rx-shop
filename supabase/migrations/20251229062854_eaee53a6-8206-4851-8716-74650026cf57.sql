-- Drop the existing doctor RLS policy for patient_profiles
DROP POLICY IF EXISTS "Doctors can view patient profiles for their consultations" ON public.patient_profiles;

-- Create a new policy that allows doctors to view patient profiles for ANY booking
-- (assigned or unassigned, since doctors can see all bookings in their queue)
CREATE POLICY "Doctors can view patient profiles for bookings" 
ON public.patient_profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND (
    -- Via consultations table (existing logic)
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.patient_id = patient_profiles.user_id
        AND (consultations.doctor_id = auth.uid() OR consultations.doctor_id IS NULL)
    )
    OR
    -- Via consultation_bookings table
    EXISTS (
      SELECT 1 FROM consultation_bookings
      WHERE consultation_bookings.patient_id = patient_profiles.user_id
        AND (consultation_bookings.doctor_id = auth.uid() OR consultation_bookings.doctor_id IS NULL)
    )
  )
);