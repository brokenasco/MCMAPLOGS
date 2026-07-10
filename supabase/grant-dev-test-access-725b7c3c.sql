-- One-time admin script: grant lifetime MAI Dev/Test access.
-- Paste this into Supabase SQL Editor and run once after the auth user/profile exists.
-- This reuses the existing lifetime_mai_access + dev_test_access permission model.

begin;

alter table public.profiles
  add column if not exists lifetime_mai_access boolean not null default false,
  add column if not exists dev_test_access boolean not null default false,
  add column if not exists subscription_status text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean not null default false;

update public.profiles
set
  account_type = 'MAI',
  lifetime_mai_access = true,
  dev_test_access = true,
  subscription_status = 'lifetime_free',
  subscription_current_period_end = null,
  subscription_cancel_at_period_end = false,
  updated_at = now()
where id = '725b7c3c-8aed-4491-9eed-2461d1228d16';

select
  id,
  full_name,
  account_type,
  mai_number,
  subscription_status,
  lifetime_mai_access,
  dev_test_access
from public.profiles
where id = '725b7c3c-8aed-4491-9eed-2461d1228d16';

commit;
