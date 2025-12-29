-- Fix function search_path for calculate_prescription_quantities
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
SECURITY INVOKER
SET search_path = public
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