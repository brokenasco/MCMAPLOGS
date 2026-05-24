-- Replace the email below with the owner MAI email before running.
-- This marks that account as a free owner MAI account without Stripe billing.

update public.profiles
set
  account_type = 'MAI',
  subscription_status = 'owner_free',
  mai_number = coalesce(mai_number, 'MAI-0001')
where lower(email) = lower('keatonray99@gmail.com');
