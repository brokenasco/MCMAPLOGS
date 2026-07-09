-- Creates one official MAI code lookup source for verifier selection.
-- Run this once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists subscription_status text,
  add column if not exists lifetime_mai_access boolean not null default false,
  add column if not exists dev_test_access boolean not null default false;

alter table public.profiles
  add column if not exists trial_start_date timestamptz,
  add column if not exists trial_end_date timestamptz;

create or replace view public.mai_code_lookup
with (security_invoker = true) as
select
  trim(p.mai_number) as mai_code,
  p.id as mai_user_id,
  p.full_name,
  split_part(trim(p.full_name), ' ', 1) as first_name,
  nullif(regexp_replace(trim(p.full_name), '^\S+\s*', ''), '') as last_name,
  null::text as email,
  p.unit,
  p.account_type as account_status,
  case
    when p.lifetime_mai_access = true or p.dev_test_access = true then 'lifetime_free'
    when p.subscription_status = 'owner_free' then 'owner_free'
    else coalesce(p.subscription_status, 'unpaid')
  end as access_status,
  (
    p.mai_number is not null
    and trim(p.mai_number) <> ''
    and p.account_type in ('MAI', 'Owner/Developer')
    and upper(trim(p.mai_number)) <> 'UPON ACCOUNT CREATION'
    and (
      p.lifetime_mai_access = true
      or p.dev_test_access = true
      or coalesce(p.subscription_status, '') in ('active', 'trialing', 'owner_free', 'lifetime_free')
    )
  ) as is_lookup_active,
  p.created_at,
  p.trial_start_date,
  p.trial_end_date,
  p.updated_at
from public.profiles p
where p.mai_number is not null
  and trim(p.mai_number) <> ''
  and upper(trim(p.mai_number)) <> 'UPON ACCOUNT CREATION';

grant select on public.mai_code_lookup to authenticated;
