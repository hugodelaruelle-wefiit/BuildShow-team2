-- Phase 4 — Débrief + Pitch Recommandé
--
-- Adds the generated feedback and recommended-pitch columns to sessions.
-- Idempotent; apply via the Supabase SQL editor or CLI after 0002.

alter table public.sessions
  add column if not exists feedback_summary jsonb;

alter table public.sessions
  add column if not exists debrief_full text;

alter table public.sessions
  add column if not exists pitch_recommended_json jsonb;

alter table public.sessions
  add column if not exists pitch_recommended_full_text text;
