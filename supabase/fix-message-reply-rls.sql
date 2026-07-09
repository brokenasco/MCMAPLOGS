-- Fix message reply RLS.
-- Paste this into Supabase SQL Editor and run once.
-- This allows Belt Users and MAIs to reply inside message threads they are part of.

begin;

alter table public.messages enable row level security;

grant select, insert, update on public.messages to authenticated;

drop policy if exists "Users can reply to related message threads" on public.messages;
create policy "Users can reply to related message threads"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.message_threads mt
      where mt.id = messages.thread_id
        and (
          mt.belt_user_id = (select auth.uid())
          or mt.initiating_mai_user_id = (select auth.uid())
          or mt.recipient_mai_user_id = (select auth.uid())
          or exists (
            select 1
            from public.profiles p
            where p.id = (select auth.uid())
              and p.mai_number is not null
              and (
                upper(trim(p.mai_number)) = upper(trim(mt.mai_number))
                or upper(trim(p.mai_number)) = upper(trim(mt.initiating_mai_number))
                or upper(trim(p.mai_number)) = upper(trim(mt.recipient_mai_number))
              )
          )
        )
    )
  );

drop policy if exists "Users can read related thread messages" on public.messages;
create policy "Users can read related thread messages"
  on public.messages
  for select
  to authenticated
  using (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or exists (
      select 1
      from public.message_threads mt
      where mt.id = messages.thread_id
        and (
          mt.belt_user_id = (select auth.uid())
          or mt.initiating_mai_user_id = (select auth.uid())
          or mt.recipient_mai_user_id = (select auth.uid())
          or exists (
            select 1
            from public.profiles p
            where p.id = (select auth.uid())
              and p.mai_number is not null
              and (
                upper(trim(p.mai_number)) = upper(trim(mt.mai_number))
                or upper(trim(p.mai_number)) = upper(trim(mt.initiating_mai_number))
                or upper(trim(p.mai_number)) = upper(trim(mt.recipient_mai_number))
              )
          )
        )
    )
  );

drop policy if exists "Users can mark received messages seen" on public.messages;
create policy "Users can mark received messages seen"
  on public.messages
  for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

commit;
