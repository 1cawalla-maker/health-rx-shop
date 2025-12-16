
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('approved', 'pending_approval', 'deactivated');

-- Create enum for consultation status
CREATE TYPE public.consultation_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');

-- Create enum for consultation type
CREATE TYPE public.consultation_type AS ENUM ('video', 'phone');

-- Create enum for prescription type
CREATE TYPE public.prescription_type AS ENUM ('uploaded', 'issued');

-- Create enum for prescription status
CREATE TYPE public.prescription_status AS ENUM ('pending_review', 'active', 'rejected', 'expired');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  status user_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create patient_profiles table for medical info
CREATE TABLE public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  smoking_history TEXT,
  vaping_history TEXT,
  current_conditions TEXT,
  medications TEXT,
  allergies TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor_profiles table
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  qualifications TEXT,
  registration_number TEXT,
  specialty TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consultation_type consultation_type NOT NULL DEFAULT 'video',
  status consultation_status NOT NULL DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prescription_type prescription_type NOT NULL,
  status prescription_status NOT NULL DEFAULT 'pending_review',
  file_url TEXT,
  product_category TEXT DEFAULT 'nicotine_pouches',
  allowed_strength_min INTEGER,
  allowed_strength_max INTEGER,
  max_units_per_order INTEGER,
  max_units_per_month INTEGER,
  issued_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  review_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND status = 'approved'
  )
$$;

-- Create function to check if user has any role (for basic auth)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to check if user has approved doctor role
CREATE OR REPLACE FUNCTION public.is_approved_doctor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'doctor'
      AND status = 'approved'
  )
$$;

-- Create function to check if patient has active prescription
CREATE OR REPLACE FUNCTION public.has_active_prescription(_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.prescriptions
    WHERE patient_id = _patient_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own role during signup"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Patient profiles policies
CREATE POLICY "Patients can view own medical profile"
ON public.patient_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own medical profile"
ON public.patient_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own medical profile"
ON public.patient_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient profiles for their consultations"
ON public.patient_profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor') AND
  EXISTS (
    SELECT 1 FROM public.consultations
    WHERE consultations.patient_id = patient_profiles.user_id
    AND consultations.doctor_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all patient profiles"
ON public.patient_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Doctor profiles policies
CREATE POLICY "Doctors can view own profile"
ON public.doctor_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile"
ON public.doctor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own profile"
ON public.doctor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view doctor profiles"
ON public.doctor_profiles FOR SELECT
TO authenticated
USING (true);

-- Consultations policies
CREATE POLICY "Patients can view own consultations"
ON public.consultations FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own consultations"
ON public.consultations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update own consultations"
ON public.consultations FOR UPDATE
TO authenticated
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view assigned consultations"
ON public.consultations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update assigned consultations"
ON public.consultations FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor') AND
  (doctor_id = auth.uid() OR doctor_id IS NULL)
);

CREATE POLICY "Admins can view all consultations"
ON public.consultations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all consultations"
ON public.consultations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Prescriptions policies
CREATE POLICY "Patients can view own prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own prescriptions (uploads)"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id AND prescription_type = 'uploaded');

CREATE POLICY "Doctors can view all prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can insert prescriptions"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update prescriptions"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins can view all prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all prescriptions"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for prescription uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false);

-- Storage policies for prescription uploads
CREATE POLICY "Patients can upload prescriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Patients can view own prescription files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can view prescription files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Admins can view all prescription files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  public.has_role(auth.uid(), 'admin')
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at
BEFORE UPDATE ON public.patient_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_profiles_updated_at
BEFORE UPDATE ON public.doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
