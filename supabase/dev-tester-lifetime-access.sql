-- Grants permanent Dev Tester MAI access to the specified developer test account.
-- Run once in Supabase SQL Editor after the auth user exists.

alter table public.profiles
  add column if not exists lifetime_mai_access boolean not null default false,
  add column if not exists dev_test_access boolean not null default false;

update public.profiles
set
  account_type = 'MAI',
  lifetime_mai_access = true,
  dev_test_access = true,
  subscription_status = 'lifetime_free',
  subscription_current_period_end = null,
  subscription_cancel_at_period_end = false
where id = '16e59741-7d69-424d-a922-023f3ec0a0ec';
