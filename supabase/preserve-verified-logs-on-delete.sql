-- Preserve verified logbook records when a submitting user deletes their account.
-- Run this once in Supabase SQL Editor.
--
-- This lets the delete-account endpoint clear belt_user_id on verified logs so
-- those records remain visible in the verifying MAI's Logbook.

alter table public.training_logs
  alter column belt_user_id drop not null;

do $$
declare
  constraint_name text;
begin
  select tc.constraint_name
  into constraint_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  join information_schema.constraint_column_usage ccu
    on tc.constraint_name = ccu.constraint_name
   and tc.table_schema = ccu.table_schema
  where tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public'
    and tc.table_name = 'training_logs'
    and kcu.column_name = 'belt_user_id'
    and ccu.table_schema = 'auth'
    and ccu.table_name = 'users'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.training_logs drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.training_logs
  add constraint training_logs_belt_user_id_fkey
  foreign key (belt_user_id)
  references auth.users(id)
  on delete set null;
