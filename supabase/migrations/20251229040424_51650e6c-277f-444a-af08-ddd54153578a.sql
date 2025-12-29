-- Add practice_location to doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS practice_location text,
ADD COLUMN IF NOT EXISTS phone text;

-- Update doctor_profiles to ensure specialty field is used
-- (specialty already exists in doctor_profiles)

-- Create an index for admin lookups
CREATE INDEX IF NOT EXISTS idx_doctors_practice_location ON public.doctors(practice_location);

-- Add RLS policy for doctors to view all doctors (for admin overview)
CREATE POLICY "Doctors can view all doctors for lookup" 
ON public.doctors 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'));

-- Ensure profiles table phone can be updated
-- (phone already exists in profiles table)