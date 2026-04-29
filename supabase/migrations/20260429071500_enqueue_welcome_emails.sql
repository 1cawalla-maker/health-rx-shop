-- Enqueue welcome emails when patient/doctor records are created

create or replace function public.enqueue_patient_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text;
  v_name text;
  v_app_origin text;
begin
  -- Look up email from auth.users
  select u.email,
         coalesce((u.raw_user_meta_data->>'full_name')::text, '')
    into v_email, v_name
  from auth.users u
  where u.id = new.user_id;

  if v_email is null or v_email = '' then
    return new;
  end if;

  -- Store URLs in payload for later template rendering
  v_app_origin := current_setting('app.settings.app_origin', true);

  insert into public.email_outbox(event_type, to_email, payload, scheduled_for, idempotency_key)
  values(
    'patient.welcome',
    v_email,
    jsonb_build_object(
      'user_id', new.user_id,
      'name', v_name,
      'app_origin', v_app_origin
    ),
    now(),
    'patient.welcome:' || new.user_id::text
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$fn$;

create or replace function public.enqueue_doctor_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text;
  v_name text;
  v_app_origin text;
begin
  select u.email,
         coalesce((u.raw_user_meta_data->>'full_name')::text, '')
    into v_email, v_name
  from auth.users u
  where u.id = new.user_id;

  if v_email is null or v_email = '' then
    return new;
  end if;

  v_app_origin := current_setting('app.settings.app_origin', true);

  insert into public.email_outbox(event_type, to_email, payload, scheduled_for, idempotency_key)
  values(
    'doctor.welcome',
    v_email,
    jsonb_build_object(
      'user_id', new.user_id,
      'doctor_id', new.id,
      'name', v_name,
      'app_origin', v_app_origin
    ),
    now(),
    'doctor.welcome:' || new.user_id::text
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$fn$;

-- Triggers

drop trigger if exists trg_patient_profiles_welcome_email on public.patient_profiles;
create trigger trg_patient_profiles_welcome_email
after insert on public.patient_profiles
for each row execute function public.enqueue_patient_welcome_email();

drop trigger if exists trg_doctors_welcome_email on public.doctors;
create trigger trg_doctors_welcome_email
after insert on public.doctors
for each row execute function public.enqueue_doctor_welcome_email();
