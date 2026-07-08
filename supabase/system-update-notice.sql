-- One-time account system update notice flag.
-- Run this in Supabase SQL Editor so each user sees the notice once.

alter table public.profiles
  add column if not exists system_notice_seen boolean not null default false;

update public.profiles
set system_notice_seen = false
where system_notice_seen is distinct from false;
