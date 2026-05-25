-- Stores requirement-applied time and overflow verified time for each log.
-- Run this once in Supabase SQL Editor before relying on Extra Verified Hours.

alter table public.training_logs
  add column if not exists applied_minutes integer,
  add column if not exists extra_minutes integer not null default 0;

update public.training_logs
set
  applied_minutes = coalesce(applied_minutes, minutes, round(hours * 60)::integer),
  extra_minutes = coalesce(extra_minutes, 0)
where status = 'Verified';
