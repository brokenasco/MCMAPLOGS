-- Permanently fixes Belt User message badges by requiring saved recipient_id and seen_at state.
-- Paste this SQL into Supabase SQL Editor and run it once.

alter table public.messages
  add column if not exists recipient_id uuid references auth.users(id) on delete set null,
  add column if not exists recipient_key text,
  add column if not exists seen_at timestamptz;

update public.messages m
set
  recipient_id = t.belt_user_id,
  recipient_key = t.belt_user_email
from public.message_threads t
where t.id = m.thread_id
  and coalesce(t.thread_type, 'belt_mai') = 'belt_mai'
  and m.recipient_id is null
  and m.sender_id is distinct from t.belt_user_id;

update public.messages m
set
  recipient_id = p.id,
  recipient_key = t.mai_number
from public.message_threads t
join public.profiles p
  on lower(p.mai_number) = lower(t.mai_number)
where t.id = m.thread_id
  and coalesce(t.thread_type, 'belt_mai') = 'belt_mai'
  and m.recipient_id is null
  and m.sender_id = t.belt_user_id;

update public.messages m
set
  recipient_id = case
    when m.sender_id = t.initiating_mai_user_id then t.recipient_mai_user_id
    when m.sender_id = t.recipient_mai_user_id then t.initiating_mai_user_id
    else m.recipient_id
  end,
  recipient_key = case
    when m.sender_id = t.initiating_mai_user_id then t.recipient_mai_number
    when m.sender_id = t.recipient_mai_user_id then t.initiating_mai_number
    else m.recipient_key
  end
from public.message_threads t
where t.id = m.thread_id
  and t.thread_type = 'mai_mai'
  and m.recipient_id is null;

update public.messages
set seen_at = created_at
where seen_at is null
  and recipient_id is not null
  and recipient_id::text = any(coalesce(read_by, '{}'));

drop policy if exists "Users can mark messages read in their threads" on public.messages;
drop policy if exists "Users can update read status for messages in their threads" on public.messages;
drop policy if exists "Users can mark messages seen in their threads" on public.messages;

create policy "Users can mark messages seen in their threads"
  on public.messages
  for update
  using (
    recipient_id = auth.uid()
  )
  with check (
    recipient_id = auth.uid()
  );
