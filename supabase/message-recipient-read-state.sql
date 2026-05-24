-- Makes unread message alerts persistent and recipient-based.
-- Run this in Supabase SQL Editor.

alter table public.messages
  add column if not exists recipient_id uuid references auth.users(id),
  add column if not exists recipient_key text,
  add column if not exists read_by text[] default '{}';

update public.messages m
set
  recipient_id = case
    when m.sender_id = t.belt_user_id then null
    else t.belt_user_id
  end,
  recipient_key = case
    when m.sender_key = t.mai_number then t.belt_user_email
    else t.mai_number
  end
from public.message_threads t
where t.id = m.thread_id
  and m.recipient_key is null;

update public.messages
set read_by = array_remove(array_append(coalesce(read_by, '{}'), sender_id::text), null)
where sender_id is not null
  and not (sender_id::text = any(coalesce(read_by, '{}')));

update public.messages
set read_by = array_remove(array_append(coalesce(read_by, '{}'), sender_key), null)
where sender_key is not null
  and not (sender_key = any(coalesce(read_by, '{}')));

drop policy if exists "Users can mark messages read in their threads" on public.messages;

create policy "Users can mark messages read in their threads"
  on public.messages
  for update
  using (
    recipient_id = auth.uid()
    or exists (
      select 1
      from public.message_threads t
      join public.profiles p on p.id = auth.uid()
      where t.id = messages.thread_id
        and p.mai_number = t.mai_number
    )
    or exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and t.belt_user_id = auth.uid()
    )
  )
  with check (
    recipient_id = auth.uid()
    or exists (
      select 1
      from public.message_threads t
      join public.profiles p on p.id = auth.uid()
      where t.id = messages.thread_id
        and p.mai_number = t.mai_number
    )
    or exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and t.belt_user_id = auth.uid()
    )
  );
