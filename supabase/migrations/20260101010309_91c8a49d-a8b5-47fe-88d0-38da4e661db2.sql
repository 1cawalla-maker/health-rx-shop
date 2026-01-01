-- Drop the incorrect insert policy
DROP POLICY IF EXISTS "Doctors can insert prescriptions issued" ON public.doctor_issued_prescriptions;

-- Create correct insert policy that uses get_doctor_id to compare
CREATE POLICY "Doctors can insert prescriptions issued" 
ON public.doctor_issued_prescriptions 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND get_doctor_id(auth.uid()) = doctor_id
);

-- Also fix the update policy
DROP POLICY IF EXISTS "Doctors can update own prescriptions" ON public.doctor_issued_prescriptions;

CREATE POLICY "Doctors can update own prescriptions" 
ON public.doctor_issued_prescriptions 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND get_doctor_id(auth.uid()) = doctor_id
);