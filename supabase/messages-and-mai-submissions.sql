alter table public.training_logs
  add column if not exists submitter_role text default 'Belt User',
  add column if not exists assigned_mai_user_id uuid references auth.users(id),
  add column if not exists assigned_mai_name text;

update public.training_logs l
set
  assigned_mai_user_id = p.id,
  assigned_mai_name = p.full_name
from public.profiles p
where l.mai_number = p.mai_number
  and l.assigned_mai_user_id is null;

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  belt_user_id uuid references auth.users(id) on delete cascade,
  belt_user_name text not null,
  belt_user_email text not null,
  mai_number text not null,
  mai_name text not null,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.message_threads(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade,
  sender_key text not null,
  sender_name text not null,
  body text not null,
  read_by text[] default '{}',
  created_at timestamptz default now()
);

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

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
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.mai_number = message_threads.mai_number
    )
  );

create policy "Belt Users can create connected message threads"
  on public.message_threads
  for insert
  with check (
    auth.uid() = belt_user_id
    and exists (
      select 1
      from public.training_logs l
      where l.belt_user_id = auth.uid()
        and l.mai_number = message_threads.mai_number
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
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.mai_number = t.mai_number
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
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.mai_number = t.mai_number
          )
        )
    )
  );

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
