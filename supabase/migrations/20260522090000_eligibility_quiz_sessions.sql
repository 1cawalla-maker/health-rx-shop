-- Store pre-signup eligibility/pre-consultation questionnaire responses server-side.
-- Browser storage keeps only the generated session id until account creation.

create extension if not exists pgcrypto;

create table if not exists public.eligibility_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid null references auth.users(id) on delete set null,
  answers jsonb not null,
  result text not null default 'completed' check (result = 'completed'),
  risk_flags text[] not null default '{}',
  notice_version text not null,
  privacy_policy_version text not null,
  completed_at timestamptz not null default now(),
  linked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eligibility_quiz_sessions_patient_completed_idx
  on public.eligibility_quiz_sessions(patient_id, completed_at desc);

alter table public.eligibility_quiz_sessions enable row level security;

grant insert on table public.eligibility_quiz_sessions to anon, authenticated;
grant select on table public.eligibility_quiz_sessions to authenticated;

-- Public quiz submission. No public SELECT policy is provided, so anonymous users
-- can submit but cannot read questionnaire rows back out of Supabase.
drop policy if exists eligibility_quiz_sessions_anon_insert on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_anon_insert
on public.eligibility_quiz_sessions
for insert
to anon, authenticated
with check (patient_id is null and result = 'completed');

-- Patients can view their own linked quiz record.
drop policy if exists eligibility_quiz_sessions_patient_select_own on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_patient_select_own
on public.eligibility_quiz_sessions
for select
to authenticated
using (patient_id = auth.uid());

-- Doctors can view questionnaire rows for patients they have consultations/bookings with.
drop policy if exists eligibility_quiz_sessions_doctor_select_patient_history on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_doctor_select_patient_history
on public.eligibility_quiz_sessions
for select
to authenticated
using (
  public.has_role(auth.uid(), 'doctor')
  and (
    exists (
      select 1
      from public.consultations c
      left join public.doctors d on d.user_id = auth.uid()
      where c.patient_id = eligibility_quiz_sessions.patient_id
        and (c.doctor_id = auth.uid() or c.doctor_id = d.id or c.doctor_id is null)
    )
  )
);

-- Admins can view all questionnaire rows.
drop policy if exists eligibility_quiz_sessions_admin_select_all on public.eligibility_quiz_sessions;
create policy eligibility_quiz_sessions_admin_select_all
on public.eligibility_quiz_sessions
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create or replace function public.link_eligibility_quiz_session(_quiz_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row_count integer;
begin
  if v_user_id is null then
    return false;
  end if;

  update public.eligibility_quiz_sessions
  set patient_id = v_user_id,
      linked_at = now(),
      updated_at = now()
  where id = _quiz_session_id
    and patient_id is null;

  get diagnostics v_row_count = row_count;
  return v_row_count = 1;
end;
$$;

revoke all on function public.link_eligibility_quiz_session(uuid) from public;
grant execute on function public.link_eligibility_quiz_session(uuid) to authenticated;
