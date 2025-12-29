-- =============================================
-- TELEHEALTH SYSTEM - COMPLETE SCHEMA
-- All tables, enums, policies, functions in one migration
-- =============================================

-- =============================================
-- ENUMS (check if exist first)
-- =============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nicotine_strength') THEN
    CREATE TYPE public.nicotine_strength AS ENUM ('3mg', '6mg', '9mg', '12mg');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usage_tier') THEN
    CREATE TYPE public.usage_tier AS ENUM ('light', 'moderate', 'heavy');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM (
      'pending_payment', 'booked', 'in_progress', 'completed', 'cancelled', 'no_answer'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_type') THEN
    CREATE TYPE public.availability_type AS ENUM ('recurring', 'one_off', 'blocked');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issued_prescription_status') THEN
    CREATE TYPE public.issued_prescription_status AS ENUM ('active', 'expired', 'revoked');
  END IF;
END $$;

-- =============================================
-- TABLES
-- =============================================

-- consultation_bookings
CREATE TABLE IF NOT EXISTS public.consultation_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  slot_id UUID,
  scheduled_date DATE NOT NULL,
  time_window_start TIME NOT NULL,
  time_window_end TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney',
  status public.booking_status NOT NULL DEFAULT 'pending_payment',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  amount_paid INTEGER,
  paid_at TIMESTAMP WITH TIME ZONE,
  reason_for_visit TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

-- call_attempts
CREATE TABLE IF NOT EXISTS public.call_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL,
  attempt_number INTEGER NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT valid_attempt_number CHECK (attempt_number >= 1 AND attempt_number <= 3)
);

ALTER TABLE public.call_attempts ENABLE ROW LEVEL SECURITY;

-- doctor_availability_slots
CREATE TABLE IF NOT EXISTS public.doctor_availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  availability_type public.availability_type NOT NULL DEFAULT 'recurring',
  day_of_week INTEGER,
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney',
  max_bookings INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_recurring CHECK (
    (availability_type = 'recurring' AND day_of_week IS NOT NULL) OR
    (availability_type != 'recurring' AND specific_date IS NOT NULL)
  ),
  CONSTRAINT valid_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6))
);

ALTER TABLE public.doctor_availability_slots ENABLE ROW LEVEL SECURITY;

-- doctor_issued_prescriptions
CREATE TABLE IF NOT EXISTS public.doctor_issued_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  nicotine_strength public.nicotine_strength NOT NULL,
  usage_tier public.usage_tier NOT NULL,
  daily_max_pouches INTEGER NOT NULL,
  total_pouches INTEGER NOT NULL,
  containers_allowed INTEGER NOT NULL,
  supply_days INTEGER NOT NULL DEFAULT 90,
  status public.issued_prescription_status NOT NULL DEFAULT 'active',
  pdf_storage_path TEXT,
  reference_id TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_issued_prescriptions ENABLE ROW LEVEL SECURITY;

-- Update doctors table with AHPRA fields
ALTER TABLE public.doctors 
  ADD COLUMN IF NOT EXISTS ahpra_number TEXT,
  ADD COLUMN IF NOT EXISTS registration_complete BOOLEAN DEFAULT false;

-- =============================================
-- RLS POLICIES (drop if exist, then create)
-- =============================================

-- consultation_bookings policies
DROP POLICY IF EXISTS "Patients can view own bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Patients can insert own bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Patients can update own pending bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Doctors can view assigned bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Doctors can update assigned bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings cb" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Admins can update all bookings cb" ON public.consultation_bookings;

CREATE POLICY "Patients can view own bookings" ON public.consultation_bookings FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own bookings" ON public.consultation_bookings FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own pending bookings" ON public.consultation_bookings FOR UPDATE USING (auth.uid() = patient_id AND status = 'pending_payment');
CREATE POLICY "Doctors can view assigned bookings" ON public.consultation_bookings FOR SELECT USING (has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can update assigned bookings" ON public.consultation_bookings FOR UPDATE USING (has_role(auth.uid(), 'doctor') AND (doctor_id = auth.uid() OR doctor_id IS NULL));
CREATE POLICY "Admins can view all bookings cb" ON public.consultation_bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all bookings cb" ON public.consultation_bookings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- call_attempts policies
DROP POLICY IF EXISTS "Doctors can manage call attempts" ON public.call_attempts;
DROP POLICY IF EXISTS "Admins can view all call attempts" ON public.call_attempts;
DROP POLICY IF EXISTS "Patients can view own booking attempts" ON public.call_attempts;

CREATE POLICY "Doctors can manage call attempts" ON public.call_attempts FOR ALL 
  USING (has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id)
  WITH CHECK (has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);
CREATE POLICY "Admins can view all call attempts" ON public.call_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can view own booking attempts" ON public.call_attempts FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.consultation_bookings WHERE id = call_attempts.booking_id AND patient_id = auth.uid()));

-- doctor_availability_slots policies
DROP POLICY IF EXISTS "Anyone can view active availability slots" ON public.doctor_availability_slots;
DROP POLICY IF EXISTS "Doctors can manage own availability slots" ON public.doctor_availability_slots;
DROP POLICY IF EXISTS "Admins can manage all availability slots" ON public.doctor_availability_slots;

CREATE POLICY "Anyone can view active availability slots" ON public.doctor_availability_slots FOR SELECT USING (is_active = true);
CREATE POLICY "Doctors can manage own availability slots" ON public.doctor_availability_slots FOR ALL 
  USING (doctor_id = get_doctor_id(auth.uid())) WITH CHECK (doctor_id = get_doctor_id(auth.uid()));
CREATE POLICY "Admins can manage all availability slots" ON public.doctor_availability_slots FOR ALL 
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- doctor_issued_prescriptions policies
DROP POLICY IF EXISTS "Patients can view own issued prescriptions" ON public.doctor_issued_prescriptions;
DROP POLICY IF EXISTS "Doctors can insert prescriptions issued" ON public.doctor_issued_prescriptions;
DROP POLICY IF EXISTS "Doctors can view prescriptions they issued" ON public.doctor_issued_prescriptions;
DROP POLICY IF EXISTS "Admins can view all issued prescriptions" ON public.doctor_issued_prescriptions;

CREATE POLICY "Patients can view own issued prescriptions" ON public.doctor_issued_prescriptions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can insert prescriptions issued" ON public.doctor_issued_prescriptions FOR INSERT WITH CHECK (has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);
CREATE POLICY "Doctors can view prescriptions they issued" ON public.doctor_issued_prescriptions FOR SELECT USING (has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all issued prescriptions" ON public.doctor_issued_prescriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS update_consultation_bookings_updated_at ON public.consultation_bookings;
CREATE TRIGGER update_consultation_bookings_updated_at
  BEFORE UPDATE ON public.consultation_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON public.doctor_availability_slots;
CREATE TRIGGER update_availability_slots_updated_at
  BEFORE UPDATE ON public.doctor_availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_issued_prescriptions_updated_at ON public.doctor_issued_prescriptions;
CREATE TRIGGER update_issued_prescriptions_updated_at
  BEFORE UPDATE ON public.doctor_issued_prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Get available slots function
CREATE OR REPLACE FUNCTION public.get_available_slots(
  _date DATE,
  _timezone TEXT DEFAULT 'Australia/Sydney'
)
RETURNS TABLE (
  slot_id UUID,
  doctor_id UUID,
  start_time TIME,
  end_time TIME,
  available_capacity INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    das.id as slot_id,
    das.doctor_id,
    das.start_time,
    das.end_time,
    (das.max_bookings - COALESCE(
      (SELECT COUNT(*) 
       FROM consultation_bookings cb 
       WHERE cb.slot_id = das.id 
       AND cb.scheduled_date = _date
       AND cb.status NOT IN ('cancelled', 'no_answer')), 0
    ))::INTEGER as available_capacity
  FROM doctor_availability_slots das
  WHERE das.is_active = true
    AND das.timezone = _timezone
    AND (
      (das.availability_type = 'recurring' AND das.day_of_week = EXTRACT(DOW FROM _date)::INTEGER)
      OR (das.availability_type = 'one_off' AND das.specific_date = _date)
    )
    AND NOT EXISTS (
      SELECT 1 FROM doctor_availability_slots blocked
      WHERE blocked.doctor_id = das.doctor_id
        AND blocked.availability_type = 'blocked'
        AND blocked.specific_date = _date
        AND blocked.start_time <= das.start_time
        AND blocked.end_time >= das.end_time
    )
    AND (das.max_bookings - COALESCE(
      (SELECT COUNT(*) 
       FROM consultation_bookings cb 
       WHERE cb.slot_id = das.id 
       AND cb.scheduled_date = _date
       AND cb.status NOT IN ('cancelled', 'no_answer')), 0
    )) > 0;
$$;

-- Calculate prescription quantities
CREATE OR REPLACE FUNCTION public.calculate_prescription_quantities(
  _usage_tier public.usage_tier
)
RETURNS TABLE (
  daily_max_pouches INTEGER,
  total_pouches INTEGER,
  containers_allowed INTEGER
)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    CASE _usage_tier
      WHEN 'light' THEN 5
      WHEN 'moderate' THEN 10
      WHEN 'heavy' THEN 15
    END as daily_max_pouches,
    CASE _usage_tier
      WHEN 'light' THEN 5 * 90
      WHEN 'moderate' THEN 10 * 90
      WHEN 'heavy' THEN 15 * 90
    END as total_pouches,
    CASE _usage_tier
      WHEN 'light' THEN CEIL(5.0 * 90 / 20)::INTEGER
      WHEN 'moderate' THEN CEIL(10.0 * 90 / 20)::INTEGER
      WHEN 'heavy' THEN CEIL(15.0 * 90 / 20)::INTEGER
    END as containers_allowed;
$$;

-- Check if patient has active issued prescription
CREATE OR REPLACE FUNCTION public.has_active_issued_prescription(_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.doctor_issued_prescriptions
    WHERE patient_id = _patient_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;

-- Complete doctor registration (no approval needed)
CREATE OR REPLACE FUNCTION public.complete_doctor_registration(
  _user_id UUID,
  _ahpra_number TEXT,
  _provider_number TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update doctors table
  UPDATE public.doctors
  SET 
    ahpra_number = _ahpra_number,
    provider_number = _provider_number,
    registration_complete = true,
    is_active = true
  WHERE user_id = _user_id;
  
  -- Update user_roles to approved
  UPDATE public.user_roles
  SET status = 'approved'
  WHERE user_id = _user_id AND role = 'doctor';
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.complete_doctor_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_prescription_quantities TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_issued_prescription TO authenticated;

-- Storage bucket for prescription PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-pdfs', 'prescription-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Doctors can upload prescription PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own prescription PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view prescription PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all prescription PDFs" ON storage.objects;

CREATE POLICY "Doctors can upload prescription PDFs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prescription-pdfs' AND has_role(auth.uid(), 'doctor'));
CREATE POLICY "Patients can view own prescription PDFs" ON storage.objects FOR SELECT
  USING (bucket_id = 'prescription-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Doctors can view prescription PDFs" ON storage.objects FOR SELECT
  USING (bucket_id = 'prescription-pdfs' AND has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all prescription PDFs" ON storage.objects FOR SELECT
  USING (bucket_id = 'prescription-pdfs' AND has_role(auth.uid(), 'admin'));