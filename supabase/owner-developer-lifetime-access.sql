-- Grants permanent Owner / Developer MAI access to the specified owner account.
-- Run once in Supabase SQL Editor after the auth user exists.

alter table public.profiles
  add column if not exists lifetime_mai_access boolean not null default false,
  add column if not exists dev_test_access boolean not null default false;

update public.profiles
set
  account_type = 'Owner/Developer',
  lifetime_mai_access = true,
  dev_test_access = false,
  subscription_status = 'owner_free',
  subscription_current_period_end = null,
  subscription_cancel_at_period_end = false
where id = 'cbfab507-3f3a-402e-868d-399f387d83d1';
