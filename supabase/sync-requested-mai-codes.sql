-- One-time admin script: sync requested MAI codes and generate one random Dev Tester MAI code.
-- Paste this into Supabase SQL Editor for the active MCMAP Logs project.
-- This preserves logs, messages, achievements, profile data, and lifetime access flags.

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

do $$
declare
  owner_uid uuid := 'cbfab507-3f3a-402e-868d-399f387d83d1';
  dev_one_uid uuid := '3095224e-73bc-47d1-8ccc-a5e17bd718d8';
  dev_random_uid uuid := '16e59741-7d69-424d-a922-023f3ec0a0ec';
  old_random_code text;
  generated_code text;
  digit_count integer;
  attempt_count integer := 0;
begin
  if not exists (select 1 from public.profiles where id = owner_uid) then
    raise exception 'Profile not found for UID %', owner_uid;
  end if;

  if not exists (select 1 from public.profiles where id = dev_one_uid) then
    raise exception 'Profile not found for UID %', dev_one_uid;
  end if;

  if not exists (select 1 from public.profiles where id = dev_random_uid) then
    raise exception 'Profile not found for UID %', dev_random_uid;
  end if;

  select mai_number
    into old_random_code
  from public.profiles
  where id = dev_random_uid;

  -- Reserve MAI-0000 and MAI-0001 for the requested accounts only.
  update public.profiles
  set mai_number = null,
      updated_at = now()
  where upper(trim(mai_number)) = 'MAI-0000'
    and id <> owner_uid;

  update public.profiles
  set mai_number = null,
      updated_at = now()
  where upper(trim(mai_number)) = 'MAI-0001'
    and id <> dev_one_uid;

  update public.profiles
  set account_type = 'MAI',
      mai_number = 'MAI-0000',
      lifetime_mai_access = true,
      subscription_status = 'owner_free',
      subscription_current_period_end = null,
      subscription_cancel_at_period_end = false,
      updated_at = now()
  where id = owner_uid;

  update public.profiles
  set account_type = 'MAI',
      mai_number = 'MAI-0001',
      lifetime_mai_access = true,
      dev_test_access = true,
      subscription_status = 'lifetime_free',
      subscription_current_period_end = null,
      subscription_cancel_at_period_end = false,
      updated_at = now()
  where id = dev_one_uid;

  -- Generate a randomized unique MAI code for the requested Dev Tester account.
  loop
    attempt_count := attempt_count + 1;
    digit_count := case
      when attempt_count <= 35 then 4
      when attempt_count <= 45 then 5
      else 6
    end;

    generated_code := 'MAI-' || (
      (power(10, digit_count - 1)::bigint) +
      floor(random() * (9 * power(10, digit_count - 1)))::bigint
    )::text;

    if generated_code not in ('MAI-0000', 'MAI-0001')
      and not exists (
        select 1
        from public.profiles
        where upper(trim(mai_number)) = upper(generated_code)
          and id <> dev_random_uid
      )
    then
      exit;
    end if;

    if attempt_count >= 60 then
      raise exception 'Unable to generate a unique MAI code for UID %', dev_random_uid;
    end if;
  end loop;

  update public.profiles
  set account_type = 'MAI',
      mai_number = generated_code,
      lifetime_mai_access = true,
      dev_test_access = true,
      subscription_status = 'lifetime_free',
      subscription_current_period_end = null,
      subscription_cancel_at_period_end = false,
      updated_at = now()
  where id = dev_random_uid;

  -- Re-route pending logs by fixed code.
  update public.training_logs tl
  set assigned_mai_user_id = p.id,
      assigned_mai_name = p.full_name,
      mai_number = p.mai_number,
      updated_at = now()
  from public.profiles p
  where upper(trim(tl.mai_number)) = upper(trim(p.mai_number))
    and p.id in (owner_uid, dev_one_uid, dev_random_uid)
    and coalesce(tl.status, '') = 'Pending';

  -- If the randomized account had an old MAI code, move pending routing from old code to new code.
  update public.training_logs tl
  set assigned_mai_user_id = dev_random_uid,
      assigned_mai_name = p.full_name,
      mai_number = generated_code,
      updated_at = now()
  from public.profiles p
  where p.id = dev_random_uid
    and old_random_code is not null
    and trim(old_random_code) <> ''
    and upper(trim(tl.mai_number)) = upper(trim(old_random_code))
    and coalesce(tl.status, '') = 'Pending';

  -- Re-point existing Belt User to MAI threads by current code.
  update public.message_threads mt
  set mai_name = p.full_name,
      updated_at = now()
  from public.profiles p
  where upper(trim(mt.mai_number)) = upper(trim(p.mai_number))
    and p.id in (owner_uid, dev_one_uid, dev_random_uid);

  -- Re-point existing MAI-to-MAI recipient threads by current code.
  update public.message_threads mt
  set recipient_mai_user_id = p.id,
      recipient_mai_name = p.full_name,
      recipient_mai_number = p.mai_number,
      updated_at = now()
  from public.profiles p
  where upper(trim(mt.recipient_mai_number)) = upper(trim(p.mai_number))
    and p.id in (owner_uid, dev_one_uid, dev_random_uid);

  -- If the randomized account had an old MAI code, move existing threads to the new code.
  update public.message_threads mt
  set mai_number = generated_code,
      mai_name = p.full_name,
      updated_at = now()
  from public.profiles p
  where p.id = dev_random_uid
    and old_random_code is not null
    and trim(old_random_code) <> ''
    and upper(trim(mt.mai_number)) = upper(trim(old_random_code));

  update public.message_threads mt
  set recipient_mai_user_id = dev_random_uid,
      recipient_mai_name = p.full_name,
      recipient_mai_number = generated_code,
      updated_at = now()
  from public.profiles p
  where p.id = dev_random_uid
    and old_random_code is not null
    and trim(old_random_code) <> ''
    and upper(trim(mt.recipient_mai_number)) = upper(trim(old_random_code));

  raise notice 'Generated MAI code for UID %: %', dev_random_uid, generated_code;
end $$;

create unique index if not exists idx_profiles_mai_number_unique
  on public.profiles (upper(trim(mai_number)))
  where mai_number is not null and trim(mai_number) <> '';

create index if not exists idx_profiles_mai_number_lookup
  on public.profiles (upper(trim(mai_number)));

create index if not exists idx_profiles_user_id_mai_lookup
  on public.profiles (id)
  where mai_number is not null and trim(mai_number) <> '';

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

-- Validation: requested profiles and assigned codes.
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
  '3095224e-73bc-47d1-8ccc-a5e17bd718d8',
  '16e59741-7d69-424d-a922-023f3ec0a0ec'
)
order by mai_number;

-- Validation: requested fixed codes should each belong to exactly one account.
select
  upper(trim(mai_number)) as mai_code,
  count(*) as assigned_accounts
from public.profiles
where upper(trim(mai_number)) in ('MAI-0000', 'MAI-0001')
group by upper(trim(mai_number))
order by mai_code;

-- Validation: all three requested accounts should appear as active in MAI lookup.
select
  mai_code,
  full_name,
  mai_user_id,
  access_status,
  is_lookup_active
from public.mai_code_lookup
where mai_user_id in (
  'cbfab507-3f3a-402e-868d-399f387d83d1',
  '3095224e-73bc-47d1-8ccc-a5e17bd718d8',
  '16e59741-7d69-424d-a922-023f3ec0a0ec'
)
order by mai_code;

commit;
