-- Transactional email outbox (reliable + idempotent)

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),

  event_type text not null,
  to_email text not null,

  -- Template payload for rendering. Keep flexible; worker resolves into subject/text/html.
  payload jsonb not null default '{}'::jsonb,

  scheduled_for timestamptz not null default now(),

  status text not null default 'pending' check (status in ('pending','sending','sent','failed','cancelled')),
  attempts integer not null default 0,
  locked_at timestamptz null,
  sent_at timestamptz null,

  provider text null,
  provider_message_id text null,
  last_error text null,

  idempotency_key text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists email_outbox_idempotency_key_key
  on public.email_outbox(idempotency_key);

create index if not exists email_outbox_pending_due_idx
  on public.email_outbox(scheduled_for)
  where status = 'pending';

-- updated_at trigger (reuse existing set_updated_at if present)
do $do$
begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create function public.set_updated_at() returns trigger as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$ language plpgsql;
  end if;
end $do$;

drop trigger if exists trg_email_outbox_updated_at on public.email_outbox;
create trigger trg_email_outbox_updated_at
before update on public.email_outbox
for each row execute function public.set_updated_at();

-- Service role only. Do not allow clients to read/send from outbox.
alter table public.email_outbox enable row level security;

-- (Optional) A restrictive default: no policies = no access for anon/auth.
