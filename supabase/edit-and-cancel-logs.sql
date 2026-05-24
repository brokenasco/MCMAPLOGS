-- Allows Belt Users to edit/cancel pending logs and edit/resubmit returned logs.
-- Run this in Supabase SQL Editor before using the correction workflow in production.

alter table public.training_logs
  add column if not exists edit_history jsonb default '[]'::jsonb,
  add column if not exists resubmitted_at timestamptz;

drop policy if exists "Belt Users can edit their own pending or returned logs" on public.training_logs;
drop policy if exists "Belt Users can cancel their own pending logs" on public.training_logs;

create policy "Belt Users can edit their own pending or returned logs"
  on public.training_logs
  for update
  using (
    belt_user_id = auth.uid()
    and status in ('Pending', 'Returned')
  )
  with check (
    belt_user_id = auth.uid()
    and status = 'Pending'
  );

create policy "Belt Users can cancel their own pending logs"
  on public.training_logs
  for delete
  using (
    belt_user_id = auth.uid()
    and status = 'Pending'
  );
