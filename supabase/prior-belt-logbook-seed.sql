-- Adds fields needed for account-creation verified prior-belt logbook entries.
-- The app uses its built-in MCMAP reference data to create the records once per account.

alter table public.profiles
  add column if not exists prior_belt_logs_seeded boolean not null default false;

alter table public.training_logs
  add column if not exists source text,
  add column if not exists verification_source text;
