-- Fixes MAI pending queue visibility for logs sent to MAI-0000 or any assigned MAI.
-- Run this in Supabase SQL Editor.

alter table public.training_logs
  add column if not exists assigned_mai_user_id uuid references auth.users(id),
  add column if not exists assigned_mai_name text;

update public.training_logs l
set
  assigned_mai_user_id = p.id,
  assigned_mai_name = p.full_name
from public.profiles p
where lower(l.mai_number) = lower(p.mai_number)
  and (
    l.assigned_mai_user_id is null
    or l.assigned_mai_user_id <> p.id
    or l.assigned_mai_name is distinct from p.full_name
  );

drop policy if exists "MAIs can read logs assigned to their MAI code" on public.training_logs;
drop policy if exists "MAIs can verify logs assigned to their MAI code" on public.training_logs;

create policy "MAIs can read logs assigned to their MAI code"
  on public.training_logs
  for select
  using (
    belt_user_id = auth.uid()
    or assigned_mai_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type in ('MAI', 'Owner/Developer')
        and p.mai_number is not null
        and lower(p.mai_number) = lower(training_logs.mai_number)
    )
  );

create policy "MAIs can verify logs assigned to their MAI code"
  on public.training_logs
  for update
  using (
    assigned_mai_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type in ('MAI', 'Owner/Developer')
        and p.mai_number is not null
        and lower(p.mai_number) = lower(training_logs.mai_number)
    )
  )
  with check (
    assigned_mai_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type in ('MAI', 'Owner/Developer')
        and p.mai_number is not null
        and lower(p.mai_number) = lower(training_logs.mai_number)
    )
  );

select
  id,
  marine_name,
  status,
  mai_number,
  assigned_mai_user_id,
  assigned_mai_name,
  created_at
from public.training_logs
where mai_number = 'MAI-0000'
order by created_at desc;
