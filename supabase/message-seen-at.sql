-- Permanently tracks when a message was viewed by its recipient.
-- Run this once in Supabase SQL Editor.

alter table public.messages
  add column if not exists recipient_id uuid references auth.users(id),
  add column if not exists recipient_key text,
  add column if not exists read_by text[] default '{}',
  add column if not exists seen_at timestamptz;

-- Make sure older messages have recipient_id populated wherever possible.
update public.messages m
set
  recipient_id = case
    when t.thread_type = 'mai_mai' and m.sender_key = t.initiating_mai_number then t.recipient_mai_user_id
    when t.thread_type = 'mai_mai' and m.sender_key = t.recipient_mai_number then t.initiating_mai_user_id
    when coalesce(t.thread_type, 'belt_mai') = 'belt_mai' and m.sender_id = t.belt_user_id then p.id
    when coalesce(t.thread_type, 'belt_mai') = 'belt_mai' then t.belt_user_id
    else m.recipient_id
  end,
  recipient_key = case
    when t.thread_type = 'mai_mai' and m.sender_key = t.initiating_mai_number then t.recipient_mai_number
    when t.thread_type = 'mai_mai' and m.sender_key = t.recipient_mai_number then t.initiating_mai_number
    when coalesce(t.thread_type, 'belt_mai') = 'belt_mai' and m.sender_id = t.belt_user_id then t.mai_number
    when coalesce(t.thread_type, 'belt_mai') = 'belt_mai' then t.belt_user_email
    else m.recipient_key
  end
from public.message_threads t
left join public.profiles p
  on p.mai_number = t.mai_number
where t.id = m.thread_id
  and m.recipient_id is null;

-- Messages already marked read by the recipient should not reappear as unread.
update public.messages
set seen_at = created_at
where seen_at is null
  and recipient_id is not null
  and recipient_id::text = any(coalesce(read_by, '{}'));

drop policy if exists "Users can mark messages read in their threads" on public.messages;
drop policy if exists "Users can update read status for messages in their threads" on public.messages;

create policy "Users can mark messages seen in their threads"
  on public.messages
  for update
  using (
    recipient_id = auth.uid()
  )
  with check (
    recipient_id = auth.uid()
  );
