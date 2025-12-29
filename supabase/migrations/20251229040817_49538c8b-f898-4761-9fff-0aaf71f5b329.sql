-- Allow users to insert their own doctor record during signup
CREATE POLICY "Users can insert own doctor record" 
ON public.doctors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Drop the duplicate view policy if exists and recreate
DROP POLICY IF EXISTS "Doctors can view all doctors for lookup" ON public.doctors;