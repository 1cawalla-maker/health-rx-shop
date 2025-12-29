-- Remove doctor ability to update uploaded prescriptions
-- Doctors should only be able to INSERT prescriptions (issued type), not update uploaded ones

-- Drop existing doctor update policy
DROP POLICY IF EXISTS "Doctors can update prescriptions" ON public.prescriptions;

-- Create new policy: doctors can only update prescriptions they personally issued
CREATE POLICY "Doctors can update own issued prescriptions" 
ON public.prescriptions 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND prescription_type = 'issued'
  AND doctor_id = auth.uid()
);

-- Uploaded prescription updates should only be done by admins (already covered by existing admin policy)