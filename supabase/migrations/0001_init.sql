-- Base schema — sessions table + RLS.
--
-- This is the foundation the other migrations build on. Idempotent; apply via
-- the Supabase SQL editor or CLI before 0002 and 0003.

create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  consultant_brief  text not null,
  client_spec       text not null,
  created_at        timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);

-- Row-level security: a user only ever sees and writes their own sessions.
alter table public.sessions enable row level security;

drop policy if exists "sessions_owner_all" on public.sessions;
create policy "sessions_owner_all" on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
