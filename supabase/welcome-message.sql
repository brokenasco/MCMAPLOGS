-- Tracks whether the founder welcome message has been shown.
-- Run this once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists welcome_seen boolean;

-- Existing accounts should not suddenly see the post-account-creation message.
update public.profiles
set welcome_seen = true
where welcome_seen is null;

alter table public.profiles
  alter column welcome_seen set default false,
  alter column welcome_seen set not null;
