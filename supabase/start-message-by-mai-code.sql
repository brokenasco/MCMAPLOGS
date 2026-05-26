-- Allows Belt Users and MAIs to start a message thread by valid active MAI code.
-- Paste this SQL into Supabase SQL Editor and run it once.

alter table public.profiles
  add column if not exists subscription_status text,
  add column if not exists lifetime_mai_access boolean not null default false,
  add column if not exists dev_test_access boolean not null default false;

drop policy if exists "Users can create allowed message threads" on public.message_threads;
drop policy if exists "Belt Users can create connected message threads" on public.message_threads;

create policy "Users can create allowed message threads"
  on public.message_threads
  for insert
  with check (
    (
      coalesce(thread_type, 'belt_mai') = 'belt_mai'
      and auth.uid() = belt_user_id
      and exists (
        select 1
        from public.profiles p
        where lower(p.mai_number) = lower(message_threads.mai_number)
          and p.account_type in ('MAI', 'Owner/Developer')
          and (
            p.lifetime_mai_access = true
            or p.dev_test_access = true
            or p.account_type = 'Owner/Developer'
            or coalesce(p.subscription_status, '') in ('active', 'trialing', 'owner_free', 'lifetime_free')
          )
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
          and lower(recipient_profile.mai_number) = lower(message_threads.recipient_mai_number)
          and recipient_profile.account_type in ('MAI', 'Owner/Developer')
          and (
            recipient_profile.lifetime_mai_access = true
            or recipient_profile.dev_test_access = true
            or recipient_profile.account_type = 'Owner/Developer'
            or coalesce(recipient_profile.subscription_status, '') in ('active', 'trialing', 'owner_free', 'lifetime_free')
          )
      )
    )
  );
