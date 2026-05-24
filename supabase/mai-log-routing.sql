alter table public.training_logs
  add column if not exists assigned_mai_user_id uuid references auth.users(id),
  add column if not exists assigned_mai_name text;

update public.training_logs l
set
  assigned_mai_user_id = p.id,
  assigned_mai_name = p.full_name
from public.profiles p
where l.mai_number = p.mai_number
  and l.assigned_mai_user_id is null;
