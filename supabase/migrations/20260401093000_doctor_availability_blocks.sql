-- Explicit per-date doctor availability blocks (advanced: multiple blocks per day)

CREATE TABLE IF NOT EXISTS public.doctor_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Australia/Brisbane',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT doctor_availability_blocks_valid_time CHECK (end_time > start_time)
);

-- Prevent exact duplicates
CREATE UNIQUE INDEX IF NOT EXISTS doctor_availability_blocks_unique
  ON public.doctor_availability_blocks (doctor_id, date, start_time, end_time);

-- Speed up week/date queries
CREATE INDEX IF NOT EXISTS doctor_availability_blocks_doctor_date
  ON public.doctor_availability_blocks (doctor_id, date);

CREATE INDEX IF NOT EXISTS doctor_availability_blocks_date
  ON public.doctor_availability_blocks (date);

ALTER TABLE public.doctor_availability_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can manage own availability blocks" ON public.doctor_availability_blocks;

CREATE POLICY "Doctors can manage own availability blocks"
ON public.doctor_availability_blocks
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor')
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = doctor_availability_blocks.doctor_id
      AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'doctor')
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = doctor_availability_blocks.doctor_id
      AND d.user_id = auth.uid()
  )
);
