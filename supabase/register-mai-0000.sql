-- Repair/seed the owner MAI account so MAI-0000 works as a full MAI account.
-- Run this in the Supabase SQL editor after the auth user exists.

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
  coalesce(email, 'keatonray99@gmail.com'),
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
  subscription_status = 'owner_free';

alter table public.training_logs
  add column if not exists submitter_role text default 'Belt User',
  add column if not exists assigned_mai_user_id uuid references auth.users(id),
  add column if not exists assigned_mai_name text;

update public.training_logs l
set
  assigned_mai_user_id = p.id,
  assigned_mai_name = p.full_name
from public.profiles p
where lower(l.mai_number) = lower(p.mai_number)
  and lower(l.mai_number) = 'mai-0000';

drop policy if exists "Users can read their profile and MAI lookup profiles" on public.profiles;
drop policy if exists "Users can read own or assigned training logs" on public.training_logs;
drop policy if exists "Users can submit their own training logs" on public.training_logs;
drop policy if exists "Assigned MAIs can update verification status" on public.training_logs;

create policy "Users can read their profile and MAI lookup profiles"
  on public.profiles
  for select
  using (
    id = auth.uid()
    or (
      account_type = 'MAI'
      and mai_number is not null
    )
  );

create policy "Users can read own or assigned training logs"
  on public.training_logs
  for select
  using (
    belt_user_id = auth.uid()
    or assigned_mai_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'MAI'
        and lower(p.mai_number) = lower(training_logs.mai_number)
    )
  );

create policy "Users can submit their own training logs"
  on public.training_logs
  for insert
  with check (
    belt_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = assigned_mai_user_id
        and p.account_type = 'MAI'
        and lower(p.mai_number) = lower(training_logs.mai_number)
    )
  );

create policy "Assigned MAIs can update verification status"
  on public.training_logs
  for update
  using (
    assigned_mai_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'MAI'
        and lower(p.mai_number) = lower(training_logs.mai_number)
    )
  )
  with check (
    assigned_mai_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'MAI'
        and lower(p.mai_number) = lower(training_logs.mai_number)
    )
  );

select
  id,
  full_name,
  email,
  account_type,
  belt_level,
  unit,
  mai_number,
  subscription_status
from public.profiles
where mai_number = 'MAI-0000';
