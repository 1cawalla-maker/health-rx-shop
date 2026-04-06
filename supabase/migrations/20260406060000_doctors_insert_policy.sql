-- Allow doctors to create their own doctors row during signup
-- This fixes doctor registration failing under RLS when the app upserts into public.doctors.

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can insert own record" ON public.doctors;

CREATE POLICY "Doctors can insert own record"
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);
