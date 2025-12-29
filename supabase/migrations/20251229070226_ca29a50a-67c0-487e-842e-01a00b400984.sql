-- Allow doctors to view profiles for patients with bookings
DROP POLICY IF EXISTS "Doctors can view patient profiles for bookings" ON public.profiles;

CREATE POLICY "Doctors can view patient profiles for bookings"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND (
    EXISTS (
      SELECT 1 FROM consultation_bookings
      WHERE consultation_bookings.patient_id = profiles.user_id
    )
  )
);