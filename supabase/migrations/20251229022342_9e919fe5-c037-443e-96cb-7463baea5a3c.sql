-- Fix security definer views by recreating them with SECURITY INVOKER (default, but explicit)
-- Drop and recreate admin_user_overview with proper security
DROP VIEW IF EXISTS public.admin_user_overview;
CREATE VIEW public.admin_user_overview 
WITH (security_invoker = true)
AS
SELECT 
  ur.id as role_id,
  ur.user_id,
  ur.role,
  ur.status,
  ur.created_at as role_created_at,
  p.full_name,
  p.phone,
  p.date_of_birth,
  p.created_at as profile_created_at,
  d.id as doctor_id,
  d.provider_number,
  d.specialties,
  d.is_active as doctor_is_active,
  dp.registration_number,
  dp.specialty,
  dp.qualifications
FROM public.user_roles ur
LEFT JOIN public.profiles p ON ur.user_id = p.user_id
LEFT JOIN public.doctors d ON ur.user_id = d.user_id
LEFT JOIN public.doctor_profiles dp ON ur.user_id = dp.user_id
ORDER BY ur.created_at DESC;

-- Drop and recreate admin_prescription_overview with proper security
DROP VIEW IF EXISTS public.admin_prescription_overview;
CREATE VIEW public.admin_prescription_overview
WITH (security_invoker = true)
AS
SELECT 
  pr.id as prescription_id,
  pr.patient_id,
  pr.doctor_id,
  pr.prescription_type,
  pr.status,
  pr.file_url,
  pr.allowed_strength_min,
  pr.allowed_strength_max,
  pr.max_units_per_order,
  pr.max_units_per_month,
  pr.review_reason,
  pr.issued_at,
  pr.expires_at,
  pr.created_at,
  pr.updated_at,
  p.full_name as patient_name,
  p.phone as patient_phone,
  p.date_of_birth as patient_dob
FROM public.prescriptions pr
LEFT JOIN public.profiles p ON pr.patient_id = p.user_id
ORDER BY pr.created_at DESC;

-- Grant access
GRANT SELECT ON public.admin_user_overview TO authenticated;
GRANT SELECT ON public.admin_prescription_overview TO authenticated;