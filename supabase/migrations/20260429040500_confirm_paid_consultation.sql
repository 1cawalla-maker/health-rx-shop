-- Bring existing production function into version control
-- Source: extracted from linked Supabase project on 2026-04-29

CREATE OR REPLACE FUNCTION public.confirm_paid_consultation(_consultation_id uuid)
 RETURNS consultations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_consult public.consultations%rowtype;
  v_doctor_user_id uuid;
  v_held_doctor_id uuid;
  v_patient_id uuid;
begin
  select *
    into v_consult
  from public.consultations
  where id = _consultation_id
    and (
      patient_id = auth.uid()
      or coalesce(auth.role(), '') = 'service_role'
    )
  for update;

  if not found then
    raise exception 'Consultation not found or not owned by user';
  end if;

  v_patient_id := v_consult.patient_id;

  if v_consult.status <> 'requested' then
    raise exception 'Consultation not in requested status';
  end if;

  -- must have an active reservation
  select r.doctor_id
    into v_held_doctor_id
  from public.consultation_reservations r
  where r.consultation_id = _consultation_id
    and r.patient_id = v_patient_id
    and r.status = 'active'
    and r.expires_at > now()
  order by r.expires_at desc
  limit 1;

  if v_held_doctor_id is null then
    -- No held doctor: choose one from explicit per-date availability blocks
    select d.user_id
      into v_doctor_user_id
    from public.doctor_availability_blocks b
    join public.doctors d on d.id = b.doctor_id
    where b.date = (v_consult.scheduled_at at time zone b.timezone)::date
      and (v_consult.scheduled_at at time zone b.timezone)::time >= b.start_time
      and (v_consult.scheduled_at at time zone b.timezone)::time < b.end_time
      and not exists (
        select 1
        from public.consultations c2
        where c2.doctor_id = d.user_id
          and c2.scheduled_at = v_consult.scheduled_at
          and c2.status = 'confirmed'
      )
    order by d.user_id
    limit 1;
  else
    -- Use the held doctor
    select d.user_id
      into v_doctor_user_id
    from public.doctors d
    where d.id = v_held_doctor_id;
  end if;

  if v_doctor_user_id is null then
    raise exception 'No doctor available for this time';
  end if;

  update public.consultations
  set doctor_id = v_doctor_user_id,
      status = 'confirmed',
      updated_at = now()
  where id = _consultation_id
  returning * into v_consult;

  update public.consultation_reservations
  set status = 'confirmed'
  where consultation_id = _consultation_id
    and patient_id = v_patient_id
    and status = 'active';

  return v_consult;
end;
$function$;
