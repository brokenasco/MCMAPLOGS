-- Create the user first in Supabase Authentication.
-- Then run this SQL to mark that login as the free Owner/Developer MAI account.

insert into public.profiles (
  id,
  full_name,
  email,
  account_type,
  belt_level,
  unit,
  mai_number,
  subscription_status
)
select
  id,
  'Keaton Permenter',
  email,
  'Owner/Developer',
  'Black 1st Degree',
  'Owner / Developer',
  'MAI-0000',
  'owner_free'
from auth.users
where lower(email) = lower('keatonray99@gmail.com')
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  account_type = excluded.account_type,
  belt_level = excluded.belt_level,
  unit = excluded.unit,
  mai_number = excluded.mai_number,
  subscription_status = excluded.subscription_status;
