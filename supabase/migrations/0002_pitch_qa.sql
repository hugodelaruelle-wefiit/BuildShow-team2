-- Phase 3 — Pitch + Q&R Vocal
--
-- Adds the pitch transcript to sessions and creates the questions_generated
-- table with row-level security. Idempotent so it can run before or after the
-- Phase 5.1 base migration (0001_init.sql). Apply via the Supabase SQL editor
-- or the CLI.

-- 1) Pitch transcript on the session.
alter table public.sessions
  add column if not exists pitch_transcript text;

-- 2) Generated questions (+ captured answers).
create table if not exists public.questions_generated (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references public.sessions (id) on delete cascade,
  question_order    integer not null default 0,
  question_text     text not null,
  question_category text not null
    check (question_category in ('criteria_check', 'transference_test', 'objection')),
  answer_transcript text,
  created_at        timestamptz not null default now()
);

create index if not exists questions_generated_session_id_idx
  on public.questions_generated (session_id, question_order);

-- 3) Row-level security: a user only sees questions for their own sessions.
alter table public.questions_generated enable row level security;

drop policy if exists "questions_owner_select" on public.questions_generated;
create policy "questions_owner_select" on public.questions_generated
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = questions_generated.session_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "questions_owner_insert" on public.questions_generated;
create policy "questions_owner_insert" on public.questions_generated
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = questions_generated.session_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "questions_owner_update" on public.questions_generated;
create policy "questions_owner_update" on public.questions_generated
  for update using (
    exists (
      select 1 from public.sessions s
      where s.id = questions_generated.session_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "questions_owner_delete" on public.questions_generated;
create policy "questions_owner_delete" on public.questions_generated
  for delete using (
    exists (
      select 1 from public.sessions s
      where s.id = questions_generated.session_id
        and s.user_id = auth.uid()
    )
  );
