alter table public.training_logs
  add column if not exists target_belt text,
  add column if not exists class_code text,
  add column if not exists technique_name text,
  add column if not exists minutes integer;
