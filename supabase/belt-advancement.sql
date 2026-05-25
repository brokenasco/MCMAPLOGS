alter table public.profiles
  add column if not exists belt_advanced_at timestamptz;
