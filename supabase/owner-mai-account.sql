-- Run this after creating the owner user in Supabase Authentication.
-- This marks the account as the free owner MAI account.

alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (account_type in ('Belt User', 'MAI', 'Owner/Developer'));

insert into public.profiles (
  id,
  full_name,
  email,
  account_type,
  belt_level,
  unit,
  mai_number,
  subscription_status
)
select
  id,
  'Keaton Permenter (OWNER)',
  email,
  'MAI',
  'Black 1st Degree',
  'Owner / Developer',
  'MAI-0000',
  'owner_free'
from auth.users
where id = '8c5a14d7-5f97-4020-ade5-de534b315287'
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  account_type = 'MAI',
  belt_level = excluded.belt_level,
  unit = excluded.unit,
  mai_number = excluded.mai_number,
  subscription_status = excluded.subscription_status;
