-- Allows MAIs to message other MAIs by MAI code.
-- Run this once in Supabase SQL Editor.

alter table public.message_threads
  add column if not exists thread_type text not null default 'belt_mai',
  add column if not exists initiating_mai_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists initiating_mai_name text,
  add column if not exists initiating_mai_number text,
  add column if not exists recipient_mai_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists recipient_mai_name text,
  add column if not exists recipient_mai_number text;

update public.message_threads
set thread_type = 'belt_mai'
where thread_type is null;

drop policy if exists "Users can read their message threads" on public.message_threads;
drop policy if exists "Belt Users can create connected message threads" on public.message_threads;
drop policy if exists "Users can read messages in their threads" on public.messages;
drop policy if exists "Users can send messages in their threads" on public.messages;
drop policy if exists "Users can mark messages read in their threads" on public.messages;

create policy "Users can read their message threads"
  on public.message_threads
  for select
  using (
    auth.uid() = belt_user_id
    or auth.uid() = initiating_mai_user_id
    or auth.uid() = recipient_mai_user_id
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          p.mai_number = message_threads.mai_number
          or p.mai_number = message_threads.initiating_mai_number
          or p.mai_number = message_threads.recipient_mai_number
        )
    )
  );

create policy "Users can create allowed message threads"
  on public.message_threads
  for insert
  with check (
    (
      thread_type = 'belt_mai'
      and auth.uid() = belt_user_id
      and exists (
        select 1
        from public.training_logs l
        where l.belt_user_id = auth.uid()
          and l.mai_number = message_threads.mai_number
      )
    )
    or (
      thread_type = 'mai_mai'
      and auth.uid() = initiating_mai_user_id
      and initiating_mai_number <> recipient_mai_number
      and exists (
        select 1
        from public.profiles sender_profile
        where sender_profile.id = auth.uid()
          and sender_profile.mai_number = message_threads.initiating_mai_number
          and sender_profile.account_type in ('MAI', 'Owner/Developer')
      )
      and exists (
        select 1
        from public.profiles recipient_profile
        where recipient_profile.id = message_threads.recipient_mai_user_id
          and recipient_profile.mai_number = message_threads.recipient_mai_number
          and recipient_profile.account_type in ('MAI', 'Owner/Developer')
      )
    )
  );

create policy "Users can read messages in their threads"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.belt_user_id = auth.uid()
          or t.initiating_mai_user_id = auth.uid()
          or t.recipient_mai_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and (
                p.mai_number = t.mai_number
                or p.mai_number = t.initiating_mai_number
                or p.mai_number = t.recipient_mai_number
              )
          )
        )
    )
  );

create policy "Users can send messages in their threads"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.belt_user_id = auth.uid()
          or t.initiating_mai_user_id = auth.uid()
          or t.recipient_mai_user_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and (
                p.mai_number = t.mai_number
                or p.mai_number = t.initiating_mai_number
                or p.mai_number = t.recipient_mai_number
              )
          )
        )
    )
  );

create policy "Users can mark messages read in their threads"
  on public.messages
  for update
  using (
    recipient_id = auth.uid()
    or exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.belt_user_id = auth.uid()
          or t.initiating_mai_user_id = auth.uid()
          or t.recipient_mai_user_id = auth.uid()
        )
    )
  )
  with check (
    recipient_id = auth.uid()
    or exists (
      select 1
      from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.belt_user_id = auth.uid()
          or t.initiating_mai_user_id = auth.uid()
          or t.recipient_mai_user_id = auth.uid()
        )
    )
  );
