-- Grants permanent free MAI developer/test access to approved Dev/Test accounts.
-- Run this once in Supabase SQL Editor.

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
where id = '18a9842e-84f8-46a8-806c-c2276a46c6f0';

update public.profiles
set
  account_type = 'MAI',
  lifetime_mai_access = true,
  dev_test_access = true,
  subscription_status = 'lifetime_free',
  subscription_current_period_end = null,
  subscription_cancel_at_period_end = false
where id in (
  '9fb3dac1-bfd7-440d-bbd4-9b625ec26dd6',
  '33ef0ef8-cfec-4524-a137-56e585897472',
  '3095224e-73bc-47d1-8ccc-a5e17bd718d8'
);
