-- One-time admin script: assign fixed MAI codes and keep lookup/routing clean.
-- Paste this into Supabase SQL Editor for the active MCMAP Logs project.

begin;

alter table public.profiles
  add column if not exists mai_number text,
  add column if not exists subscription_status text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  add column if not exists lifetime_mai_access boolean not null default false,
  add column if not exists dev_test_access boolean not null default false,
  add column if not exists trial_start_date timestamptz,
  add column if not exists trial_end_date timestamptz;

-- Clear these reserved MAI codes from every account except the intended owner.
update public.profiles
set mai_number = null,
    updated_at = now()
where upper(trim(mai_number)) = 'MAI-0000'
  and id <> 'cbfab507-3f3a-402e-868d-399f387d83d1';

update public.profiles
set mai_number = null,
    updated_at = now()
where upper(trim(mai_number)) = 'MAI-0001'
  and id <> '3095224e-73bc-47d1-8ccc-a5e17bd718d8';

-- Assign MAI-0000 to the Owner / Developer account.
update public.profiles
set account_type = 'MAI',
    mai_number = 'MAI-0000',
    lifetime_mai_access = true,
    dev_test_access = false,
    subscription_status = 'owner_free',
    subscription_current_period_end = null,
    subscription_cancel_at_period_end = false,
    updated_at = now()
where id = 'cbfab507-3f3a-402e-868d-399f387d83d1';

-- Assign MAI-0001 to the Dev/Test MAI account.
update public.profiles
set account_type = 'MAI',
    mai_number = 'MAI-0001',
    lifetime_mai_access = true,
    dev_test_access = true,
    subscription_status = 'lifetime_free',
    subscription_current_period_end = null,
    subscription_cancel_at_period_end = false,
    updated_at = now()
where id = '3095224e-73bc-47d1-8ccc-a5e17bd718d8';

-- Enforce one active owner per MAI code after duplicates are cleaned up.
create unique index if not exists idx_profiles_mai_number_unique
  on public.profiles (upper(trim(mai_number)))
  where mai_number is not null and trim(mai_number) <> '';

create index if not exists idx_profiles_mai_number_lookup
  on public.profiles (upper(trim(mai_number)));

create index if not exists idx_profiles_user_id_mai_lookup
  on public.profiles (id)
  where mai_number is not null and trim(mai_number) <> '';

-- Re-route pending logs that reference either fixed MAI code.
update public.training_logs tl
set assigned_mai_user_id = p.id,
    assigned_mai_name = p.full_name,
    mai_number = p.mai_number,
    updated_at = now()
from public.profiles p
where upper(trim(tl.mai_number)) = upper(trim(p.mai_number))
  and p.id in (
    'cbfab507-3f3a-402e-868d-399f387d83d1',
    '3095224e-73bc-47d1-8ccc-a5e17bd718d8'
  )
  and coalesce(tl.status, '') = 'Pending';

-- Re-point existing message threads that use either fixed MAI code.
update public.message_threads mt
set mai_name = p.full_name,
    updated_at = now()
from public.profiles p
where upper(trim(mt.mai_number)) = upper(trim(p.mai_number))
  and p.id in (
    'cbfab507-3f3a-402e-868d-399f387d83d1',
    '3095224e-73bc-47d1-8ccc-a5e17bd718d8'
  );

update public.message_threads mt
set recipient_mai_user_id = p.id,
    recipient_mai_name = p.full_name,
    recipient_mai_number = p.mai_number,
    updated_at = now()
from public.profiles p
where upper(trim(mt.recipient_mai_number)) = upper(trim(p.mai_number))
  and p.id in (
    'cbfab507-3f3a-402e-868d-399f387d83d1',
    '3095224e-73bc-47d1-8ccc-a5e17bd718d8'
  );

-- Keep the MAI lookup view tied to profiles so new trial/subscription MAIs are searchable immediately.
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

-- Validation: both fixed accounts should appear here.
select
  id,
  full_name,
  account_type,
  mai_number,
  subscription_status,
  lifetime_mai_access,
  dev_test_access
from public.profiles
where id in (
  'cbfab507-3f3a-402e-868d-399f387d83d1',
  '3095224e-73bc-47d1-8ccc-a5e17bd718d8'
)
order by mai_number;

-- Validation: each fixed MAI code should have exactly one profile.
select
  upper(trim(mai_number)) as mai_code,
  count(*) as assigned_accounts
from public.profiles
where upper(trim(mai_number)) in ('MAI-0000', 'MAI-0001')
group by upper(trim(mai_number))
order by mai_code;

-- Validation: lookup should show MAI-0000 / MAI-0001 as active.
select
  mai_code,
  full_name,
  mai_user_id,
  access_status,
  is_lookup_active
from public.mai_code_lookup
where upper(trim(mai_code)) in ('MAI-0000', 'MAI-0001')
order by mai_code;

commit;
