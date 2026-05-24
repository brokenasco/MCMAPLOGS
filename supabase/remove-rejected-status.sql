-- Removes Rejected as an active review status by converting old rejected logs to Returned.
-- Run this in Supabase SQL Editor.

update public.training_logs
set
  status = 'Returned',
  return_reason = coalesce(nullif(return_reason, 'Rejected'), 'Returned for correction'),
  return_message = coalesce(return_message, 'This log was returned for correction.')
where status = 'Rejected';
