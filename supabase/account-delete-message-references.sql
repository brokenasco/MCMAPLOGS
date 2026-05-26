-- Keeps account deletion from being blocked by internal message references.
-- Run this once in Supabase SQL Editor.

alter table public.messages
  drop constraint if exists messages_sender_id_fkey;

alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id)
  references auth.users(id)
  on delete set null;

alter table public.messages
  drop constraint if exists messages_recipient_id_fkey;

alter table public.messages
  add constraint messages_recipient_id_fkey
  foreign key (recipient_id)
  references auth.users(id)
  on delete set null;

alter table public.message_threads
  drop constraint if exists message_threads_belt_user_id_fkey;

alter table public.message_threads
  add constraint message_threads_belt_user_id_fkey
  foreign key (belt_user_id)
  references auth.users(id)
  on delete set null;

alter table public.message_threads
  drop constraint if exists message_threads_initiating_mai_user_id_fkey;

alter table public.message_threads
  add constraint message_threads_initiating_mai_user_id_fkey
  foreign key (initiating_mai_user_id)
  references auth.users(id)
  on delete set null;

alter table public.message_threads
  drop constraint if exists message_threads_recipient_mai_user_id_fkey;

alter table public.message_threads
  add constraint message_threads_recipient_mai_user_id_fkey
  foreign key (recipient_mai_user_id)
  references auth.users(id)
  on delete set null;
