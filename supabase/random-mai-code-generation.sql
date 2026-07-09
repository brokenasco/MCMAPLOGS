-- Random MAI code generation support.
-- Paste this into Supabase SQL Editor if you want database-side protection for admin-created MAIs.
-- Reserved/manual codes such as MAI-0000 and MAI-0001 are not changed.

begin;

alter table public.profiles
  add column if not exists mai_number text,
  add column if not exists subscription_status text,
  add column if not exists lifetime_mai_access boolean not null default false,
  add column if not exists dev_test_access boolean not null default false;

create unique index if not exists idx_profiles_mai_number_unique
  on public.profiles (upper(trim(mai_number)))
  where mai_number is not null and trim(mai_number) <> '';

create index if not exists idx_profiles_mai_number_lookup
  on public.profiles (upper(trim(mai_number)));

create or replace function public.generate_random_mai_code()
returns text
language plpgsql
as $$
declare
  generated_code text;
  digit_count integer;
  attempt_count integer := 0;
begin
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
      )
    then
      return generated_code;
    end if;

    if attempt_count >= 60 then
      raise exception 'Unable to generate a unique MAI code.';
    end if;
  end loop;
end;
$$;

create or replace function public.assign_random_mai_code_if_missing()
returns trigger
language plpgsql
as $$
begin
  if new.account_type in ('MAI', 'Owner/Developer')
    and (new.mai_number is null or trim(new.mai_number) = '')
    and (
      new.lifetime_mai_access = true
      or new.dev_test_access = true
      or coalesce(new.subscription_status, '') in ('active', 'trialing', 'owner_free', 'lifetime_free')
    )
  then
    new.mai_number := public.generate_random_mai_code();
  end if;

  if new.mai_number is not null and trim(new.mai_number) <> '' then
    new.mai_number := upper(trim(new.mai_number));
  end if;

  return new;
end;
$$;

drop trigger if exists assign_random_mai_code_before_write on public.profiles;
create trigger assign_random_mai_code_before_write
  before insert or update of account_type, subscription_status, lifetime_mai_access, dev_test_access, mai_number
  on public.profiles
  for each row
  execute function public.assign_random_mai_code_if_missing();

drop view if exists public.mai_code_lookup;

create view public.mai_code_lookup
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

commit;
