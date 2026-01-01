
-- Drop the existing foreign key constraint that references consultation_bookings
ALTER TABLE public.doctor_issued_prescriptions
DROP CONSTRAINT IF EXISTS doctor_issued_prescriptions_booking_id_fkey;

-- Add new foreign key constraint that references consultations instead
ALTER TABLE public.doctor_issued_prescriptions
ADD CONSTRAINT doctor_issued_prescriptions_booking_id_fkey
FOREIGN KEY (booking_id) REFERENCES public.consultations(id);

-- Update the profiles RLS policy to also check consultations table (not just consultation_bookings)
DROP POLICY IF EXISTS "Doctors can view patient profiles for bookings" ON public.profiles;

CREATE POLICY "Doctors can view patient profiles for bookings" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND (
    EXISTS (
      SELECT 1 FROM consultation_bookings
      WHERE consultation_bookings.patient_id = profiles.user_id
    )
    OR
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.patient_id = profiles.user_id
    )
  )
);
