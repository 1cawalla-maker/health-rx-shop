-- Add decline_reason column to doctor_issued_prescriptions
ALTER TABLE public.doctor_issued_prescriptions
ADD COLUMN decline_reason text DEFAULT NULL;

-- Add declined status to the enum if not exists (checking via exception handling)
DO $$
BEGIN
  ALTER TYPE public.issued_prescription_status ADD VALUE IF NOT EXISTS 'declined';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add RLS policy for doctors to update prescriptions they issued
DROP POLICY IF EXISTS "Doctors can update own prescriptions" ON public.doctor_issued_prescriptions;
CREATE POLICY "Doctors can update own prescriptions" 
ON public.doctor_issued_prescriptions 
FOR UPDATE 
USING (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id);

-- Ensure profiles policy allows doctors to view patient profiles for consultation_bookings
-- (Policy already updated in previous migration)