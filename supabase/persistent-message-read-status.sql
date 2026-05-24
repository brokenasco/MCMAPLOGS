-- Allows unread message alerts to stay cleared after refresh, logout/login, and new sessions.
-- Run this in Supabase SQL Editor.

alter table public.messages
  add column if not exists read_by text[] default '{}';

update public.messages
set read_by = array_remove(array_append(coalesce(read_by, '{}'), sender_id::text), null)
where sender_id is not null
  and not (sender_id::text = any(coalesce(read_by, '{}')));

drop policy if exists "Users can mark messages read in their threads" on public.messages;

create policy "Users can mark messages read in their threads"
  on public.messages
  for update
  using (
    exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.belt_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.mai_number = t.mai_number
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.belt_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.mai_number = t.mai_number
          )
        )
    )
  );
