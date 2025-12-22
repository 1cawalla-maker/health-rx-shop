
-- ============================================
-- TELEHEALTH PLATFORM DATABASE SCHEMA
-- ============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.booking_files CASCADE;
DROP TABLE IF EXISTS public.consultation_notes CASCADE;
DROP TABLE IF EXISTS public.intake_forms CASCADE;
DROP TABLE IF EXISTS public.doctor_availability CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;

-- ============================================
-- CREATE NEW TABLES
-- ============================================

-- Doctors table (extends profiles for doctor-specific data)
CREATE TABLE public.doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    provider_number text,
    specialties text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Doctor availability table
CREATE TABLE public.doctor_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    timezone text DEFAULT 'Australia/Sydney' NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(doctor_id, day_of_week)
);

-- Intake forms table
CREATE TABLE public.intake_forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL,
    patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symptoms text,
    medical_history text,
    allergies text,
    current_medications text,
    phone_number text NOT NULL,
    preferred_pharmacy text,
    consent_given boolean DEFAULT false NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Consultation notes table (internal notes by doctors)
CREATE TABLE public.consultation_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL,
    doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notes text NOT NULL,
    internal_only boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Booking files table (prescriptions, documents)
CREATE TABLE public.booking_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL,
    patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    storage_path text NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_size integer,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    type text DEFAULT 'info',
    is_read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Audit log table
CREATE TABLE public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add reason_for_visit and end_time to consultations if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'reason_for_visit') THEN
        ALTER TABLE public.consultations ADD COLUMN reason_for_visit text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'end_time') THEN
        ALTER TABLE public.consultations ADD COLUMN end_time timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'timezone') THEN
        ALTER TABLE public.consultations ADD COLUMN timezone text DEFAULT 'Australia/Sydney';
    END IF;
END $$;

-- Add phone to profiles if not exists (check and add)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
END $$;

-- ============================================
-- CREATE EXTENDED BOOKING STATUS ENUM
-- ============================================

-- Add new status values to consultation_status enum if they don't exist
DO $$
BEGIN
    -- Add intake_pending
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'intake_pending' AND enumtypid = 'consultation_status'::regtype) THEN
        ALTER TYPE consultation_status ADD VALUE 'intake_pending';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ready_for_call' AND enumtypid = 'consultation_status'::regtype) THEN
        ALTER TYPE consultation_status ADD VALUE 'ready_for_call';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'called' AND enumtypid = 'consultation_status'::regtype) THEN
        ALTER TYPE consultation_status ADD VALUE 'called';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'script_uploaded' AND enumtypid = 'consultation_status'::regtype) THEN
        ALTER TYPE consultation_status ADD VALUE 'script_uploaded';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON public.doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_booking_id ON public.intake_forms(booking_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_patient_id ON public.intake_forms(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_booking_id ON public.consultation_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_files_booking_id ON public.booking_files(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_files_patient_id ON public.booking_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON public.audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON public.consultations(scheduled_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a doctor is assigned to a patient (via consultations)
CREATE OR REPLACE FUNCTION public.is_doctor_assigned_to_patient(_doctor_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.consultations
    WHERE doctor_id = _doctor_id
      AND patient_id = _patient_id
  )
$$;

-- Function to check if user is the doctor for a booking
CREATE OR REPLACE FUNCTION public.is_booking_doctor(_user_id uuid, _booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.consultations
    WHERE id = _booking_id
      AND doctor_id = _user_id
  )
$$;

-- Function to get doctor_id from user_id
CREATE OR REPLACE FUNCTION public.get_doctor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE user_id = _user_id LIMIT 1
$$;

-- ============================================
-- RLS POLICIES FOR DOCTORS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can manage all doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view own record" ON public.doctors;
DROP POLICY IF EXISTS "Anyone can view active doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update own record" ON public.doctors;

CREATE POLICY "Admins can manage all doctors"
ON public.doctors FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can view own record"
ON public.doctors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active doctors"
ON public.doctors FOR SELECT
USING (is_active = true);

CREATE POLICY "Doctors can update own record"
ON public.doctors FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR DOCTOR_AVAILABILITY TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can manage all availability" ON public.doctor_availability;
DROP POLICY IF EXISTS "Doctors can manage own availability" ON public.doctor_availability;
DROP POLICY IF EXISTS "Anyone can view availability" ON public.doctor_availability;

CREATE POLICY "Admins can manage all availability"
ON public.doctor_availability FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can manage own availability"
ON public.doctor_availability FOR ALL
USING (doctor_id = get_doctor_id(auth.uid()))
WITH CHECK (doctor_id = get_doctor_id(auth.uid()));

CREATE POLICY "Anyone can view availability"
ON public.doctor_availability FOR SELECT
USING (is_available = true);

-- ============================================
-- RLS POLICIES FOR INTAKE_FORMS TABLE
-- ============================================

DROP POLICY IF EXISTS "Patients can manage own intake forms" ON public.intake_forms;
DROP POLICY IF EXISTS "Doctors can view intake for assigned bookings" ON public.intake_forms;
DROP POLICY IF EXISTS "Admins can view all intake forms" ON public.intake_forms;

CREATE POLICY "Patients can manage own intake forms"
ON public.intake_forms FOR ALL
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can view intake for assigned bookings"
ON public.intake_forms FOR SELECT
USING (
  has_role(auth.uid(), 'doctor') AND 
  is_booking_doctor(auth.uid(), booking_id)
);

CREATE POLICY "Admins can view all intake forms"
ON public.intake_forms FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR CONSULTATION_NOTES TABLE
-- ============================================

DROP POLICY IF EXISTS "Doctors can manage own notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Admins can view all notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Patients can view non-internal notes" ON public.consultation_notes;

CREATE POLICY "Doctors can manage own notes"
ON public.consultation_notes FOR ALL
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Admins can view all notes"
ON public.consultation_notes FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Patients can view non-internal notes"
ON public.consultation_notes FOR SELECT
USING (
  internal_only = false AND
  EXISTS (
    SELECT 1 FROM public.consultations 
    WHERE id = booking_id AND patient_id = auth.uid()
  )
);

-- ============================================
-- RLS POLICIES FOR BOOKING_FILES TABLE
-- ============================================

DROP POLICY IF EXISTS "Patients can view own files" ON public.booking_files;
DROP POLICY IF EXISTS "Doctors can manage files for assigned bookings" ON public.booking_files;
DROP POLICY IF EXISTS "Admins can view all files" ON public.booking_files;

CREATE POLICY "Patients can view own files"
ON public.booking_files FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can manage files for assigned bookings"
ON public.booking_files FOR ALL
USING (
  has_role(auth.uid(), 'doctor') AND
  is_booking_doctor(auth.uid(), booking_id)
)
WITH CHECK (
  has_role(auth.uid(), 'doctor') AND
  is_booking_doctor(auth.uid(), booking_id)
);

CREATE POLICY "Admins can view all files"
ON public.booking_files FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR NOTIFICATIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- ============================================
-- RLS POLICIES FOR AUDIT_LOG TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

CREATE POLICY "Admins can view audit logs"
ON public.audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_log FOR INSERT
WITH CHECK (true);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_availability_updated_at
    BEFORE UPDATE ON public.doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intake_forms_updated_at
    BEFORE UPDATE ON public.intake_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_notes_updated_at
    BEFORE UPDATE ON public.consultation_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKET FOR BOOKING FILES
-- ============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('booking-files', 'booking-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for booking-files bucket
DROP POLICY IF EXISTS "Patients can view own booking files" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload booking files" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view assigned booking files" ON storage.objects;

CREATE POLICY "Patients can view own booking files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can upload booking files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking-files' AND
  has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Doctors can view assigned booking files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-files' AND
  has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Admins can manage all booking files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'booking-files' AND
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'booking-files' AND
  has_role(auth.uid(), 'admin')
);
