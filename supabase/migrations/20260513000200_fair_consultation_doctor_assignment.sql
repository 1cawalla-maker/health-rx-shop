-- Fair doctor assignment for overlapping consultation availability.
-- Keep availability generation unchanged; only centralize the doctor selection/reservation step.

-- Mark stale holds as expired before choosing doctors, so old abandoned holds do not
-- permanently block a doctor/slot. Existing availability code only treats active
-- unexpired + confirmed reservations as blocking.
create or replace function public.expire_stale_consultation_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.consultation_reservations
  set status = 'expired'
  where status = 'active'
    and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Helpful lookup index for checking held doctors at a slot. We intentionally do
-- not make active reservations unique because active holds expire by timestamp,
-- and PostgreSQL partial indexes cannot safely express "expires_at > now()".
-- Race-safety is handled by an advisory transaction lock in the reservation RPC.
create index if not exists idx_consultation_reservations_doctor_slot_status
  on public.consultation_reservations (doctor_id, scheduled_at, status)
  where doctor_id is not null;

-- The legacy unique index uses doctor_user_id. The current canonical assignment
-- field is consultations.doctor_id -> public.doctors(id), so protect that too.
create unique index if not exists uniq_consultations_doctor_id_scheduled_at_confirmed
  on public.consultations (doctor_id, scheduled_at)
  where doctor_id is not null
    and status = 'confirmed';

-- Pick the fairest eligible doctor for a single slot.
-- Eligibility is strictly limited to doctors with an availability block covering
-- the consultation scheduled_at in that block's timezone.
create or replace function public.select_fair_consultation_doctor(_scheduled_at timestamptz)
returns uuid
language sql
security definer
set search_path = public
as $$
  with eligible as (
    select distinct d.id
    from public.doctor_availability_blocks b
    join public.doctors d on d.id = b.doctor_id
    where coalesce(d.is_active, true) = true
      and b.date = (_scheduled_at at time zone b.timezone)::date
      and (_scheduled_at at time zone b.timezone)::time >= b.start_time
      and (_scheduled_at at time zone b.timezone)::time < b.end_time
      and not exists (
        select 1
        from public.consultations c2
        where c2.doctor_id = d.id
          and c2.scheduled_at = _scheduled_at
          and c2.status = 'confirmed'
      )
      and not exists (
        select 1
        from public.consultation_reservations r
        where r.doctor_id = d.id
          and r.scheduled_at = _scheduled_at
          and (
            r.status = 'confirmed'
            or (r.status = 'active' and r.expires_at > now())
          )
      )
  ), workload as (
    select
      e.id,
      count(c.id) filter (
        where c.status = 'confirmed'
          and c.created_at >= now() - interval '30 days'
      ) as confirmed_30d,
      max(c.created_at) filter (where c.status = 'confirmed') as last_confirmed_at
    from eligible e
    left join public.consultations c on c.doctor_id = e.id
    group by e.id
  )
  select id
  from workload
  order by confirmed_30d asc, last_confirmed_at asc nulls first, random()
  limit 1;
$$;

-- Patient-facing RPC: create the requested consultation's 10-minute hold using
-- fair doctor assignment among doctors available for that exact slot.
create or replace function public.create_fair_consultation_reservation(
  _consultation_id uuid,
  _expires_at timestamptz default (now() + interval '10 minutes')
)
returns table (
  reservation_id uuid,
  doctor_id uuid,
  scheduled_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consult public.consultations%rowtype;
  v_existing public.consultation_reservations%rowtype;
  v_doctor_id uuid;
begin
  perform public.expire_stale_consultation_reservations();

  select *
    into v_consult
  from public.consultations
  where id = _consultation_id
    and patient_id = auth.uid()
    and status = 'requested'
  for update;

  if not found then
    raise exception 'Consultation not found, not owned by user, or not requestable';
  end if;

  -- Serialize assignment for this exact UTC slot to prevent two concurrent
  -- callers choosing the same least-loaded doctor before either insert commits.
  perform pg_advisory_xact_lock(hashtextextended(v_consult.scheduled_at::text, 0));

  -- Idempotent retry: reuse a still-live hold for this consultation.
  select *
    into v_existing
  from public.consultation_reservations r
  where r.consultation_id = _consultation_id
    and r.patient_id = v_consult.patient_id
    and r.status = 'active'
    and r.expires_at > now()
  order by r.created_at desc
  limit 1;

  if found and v_existing.doctor_id is not null then
    reservation_id := v_existing.id;
    doctor_id := v_existing.doctor_id;
    scheduled_at := v_existing.scheduled_at;
    expires_at := v_existing.expires_at;
    return next;
    return;
  end if;

  v_doctor_id := public.select_fair_consultation_doctor(v_consult.scheduled_at);

  if v_doctor_id is null then
    raise exception 'No doctor available for this time';
  end if;

  insert into public.consultation_reservations (
    consultation_id,
    patient_id,
    scheduled_at,
    expires_at,
    status,
    doctor_id
  ) values (
    _consultation_id,
    v_consult.patient_id,
    v_consult.scheduled_at,
    _expires_at,
    'active',
    v_doctor_id
  )
  returning id, consultation_reservations.doctor_id, consultation_reservations.scheduled_at, consultation_reservations.expires_at
  into reservation_id, doctor_id, scheduled_at, expires_at;

  return next;
end;
$$;

-- Payment-confirmation function remains defensive: normally it uses the held
-- doctor from the reservation. If a legacy reservation has no doctor_id, use the
-- same fair-selection logic rather than deterministic order by UUID.
create or replace function public.confirm_paid_consultation(_consultation_id uuid)
returns consultations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consult public.consultations%rowtype;
  v_doctor_id uuid;
  v_held_doctor_id uuid;
  v_patient_id uuid;
begin
  perform public.expire_stale_consultation_reservations();

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

  -- idempotency: if already confirmed, do nothing
  if v_consult.status = 'confirmed' then
    return v_consult;
  end if;

  if v_consult.status <> 'requested' then
    raise exception 'Consultation not in requested status';
  end if;

  -- Serialize fallback assignment for this exact UTC slot.
  perform pg_advisory_xact_lock(hashtextextended(v_consult.scheduled_at::text, 0));

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
    v_doctor_id := public.select_fair_consultation_doctor(v_consult.scheduled_at);
  else
    v_doctor_id := v_held_doctor_id;
  end if;

  if v_doctor_id is null then
    raise exception 'No doctor available for this time';
  end if;

  update public.consultations
  set doctor_id = v_doctor_id,
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
$$;
