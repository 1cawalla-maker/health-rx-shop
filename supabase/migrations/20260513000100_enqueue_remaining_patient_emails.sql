-- Enqueue remaining patient transactional emails into email_outbox.
-- Covers:
-- - patient.prescription_active when a prescription is issued
-- - patient.consultation_missed_reschedule when a consultation is marked no_answer

create or replace function public.enqueue_patient_prescription_active_email()
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
         coalesce((u.raw_user_meta_data->>'full_name')::text, (u.raw_user_meta_data->>'name')::text, '')
    into v_email, v_name
  from auth.users u
  where u.id = new.patient_id;

  if v_email is null or v_email = '' then
    return new;
  end if;

  v_app_origin := current_setting('app.settings.app_origin', true);

  insert into public.email_outbox(event_type, to_email, payload, scheduled_for, idempotency_key)
  values(
    'patient.prescription_active',
    v_email,
    jsonb_build_object(
      'consultation_id', new.consultation_id,
      'prescription_id', new.id,
      'patient_id', new.patient_id,
      'doctor_id', new.doctor_id,
      'max_strength_mg', new.max_strength_mg,
      'issued_at', new.issued_at,
      'name', v_name,
      'app_origin', v_app_origin
    ),
    now(),
    'patient.prescription_active:' || new.consultation_id::text
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$fn$;

create or replace function public.enqueue_patient_consultation_missed_reschedule_email()
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
  if new.status::text <> 'no_answer' or old.status::text = 'no_answer' then
    return new;
  end if;

  select u.email,
         coalesce((u.raw_user_meta_data->>'full_name')::text, (u.raw_user_meta_data->>'name')::text, '')
    into v_email, v_name
  from auth.users u
  where u.id = new.patient_id;

  if v_email is null or v_email = '' then
    return new;
  end if;

  v_app_origin := current_setting('app.settings.app_origin', true);

  insert into public.email_outbox(event_type, to_email, payload, scheduled_for, idempotency_key)
  values(
    'patient.consultation_missed_reschedule',
    v_email,
    jsonb_build_object(
      'consultation_id', new.id,
      'patient_id', new.patient_id,
      'doctor_id', new.doctor_id,
      'scheduled_at', new.scheduled_at,
      'timezone', coalesce(new.timezone, 'Australia/Brisbane'),
      'name', v_name,
      'app_origin', v_app_origin,
      'reschedule_url', case when v_app_origin is null or v_app_origin = '' then null else v_app_origin || '/patient/book' end,
      'book_url', case when v_app_origin is null or v_app_origin = '' then null else v_app_origin || '/patient/book' end,
      'manage_url', case when v_app_origin is null or v_app_origin = '' then null else v_app_origin || '/patient/consultations' end
    ),
    now(),
    'patient.consultation_missed_reschedule:' || new.id::text
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$fn$;

drop trigger if exists trg_issued_prescriptions_patient_prescription_active_email on public.issued_prescriptions;
create trigger trg_issued_prescriptions_patient_prescription_active_email
after insert on public.issued_prescriptions
for each row execute function public.enqueue_patient_prescription_active_email();

drop trigger if exists trg_consultations_patient_missed_reschedule_email on public.consultations;
create trigger trg_consultations_patient_missed_reschedule_email
after update of status on public.consultations
for each row execute function public.enqueue_patient_consultation_missed_reschedule_email();
