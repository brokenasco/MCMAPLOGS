-- One-time achievement backfill scan.
-- Run this once after supabase/achievements.sql has been applied.
-- It awards achievements to existing accounts based on their already-created logs.

with verified_logs as (
  select
    tl.*,
    coalesce(tl.minutes, round(tl.hours * 60)::integer, 0) as log_minutes,
    lower(
      coalesce(tl.technique_name, '') || ' ' ||
      coalesce(tl.description, '') || ' ' ||
      coalesce(tl.class_code, '')
    ) as search_text
  from public.training_logs tl
  where tl.belt_user_id is not null
    and tl.status = 'Verified'
    and coalesce(tl.archived, false) = false
),
pending_logs as (
  select
    tl.belt_user_id,
    count(*) as old_pending_count
  from public.training_logs tl
  where tl.belt_user_id is not null
    and tl.status = 'Pending'
    and coalesce(tl.archived, false) = false
    and coalesce(tl.created_at::date, tl.date) < current_date - interval '7 days'
  group by tl.belt_user_id
),
base_stats as (
  select
    vl.belt_user_id as user_id,
    sum(vl.log_minutes) as total_verified_minutes,
    sum(vl.log_minutes) filter (where vl.search_text like '%combat conditioning%') as combat_conditioning_minutes,
    sum(vl.log_minutes) filter (where vl.search_text like '%free sparring%') as free_sparring_minutes,
    count(*) filter (
      where vl.search_text like '%martial culture%'
         or vl.search_text like '%warrior study%'
         or vl.search_text like '%warrior studies%'
         or vl.search_text like '%study%'
    ) as martial_study_count,
    count(distinct regexp_replace(coalesce(vl.technique_name, vl.description, vl.class_code, ''), '[^a-zA-Z0-9]+', ' ', 'g')) filter (
      where vl.search_text like '%martial culture%'
         or vl.search_text like '%warrior study%'
         or vl.search_text like '%warrior studies%'
         or vl.search_text like '%study%'
    ) as different_warrior_studies,
    count(distinct coalesce(vl.verified_by::text, vl.mai_number, vl.assigned_mai_user_id::text, vl.assigned_mai_name)) filter (
      where lower(coalesce(vl.assigned_mai_name, '')) <> 'upon account creation'
        and lower(coalesce(vl.mai_number, '')) <> 'upon account creation'
    ) as unique_mais,
    sum(vl.log_minutes) filter (where to_char(vl.date, 'MM-DD') = '11-10') as nov_10_minutes,
    sum(vl.log_minutes) filter (where extract(month from vl.date) in (12, 1)) as winter_minutes,
    count(distinct vl.date) filter (where extract(isodow from vl.date) in (6, 7)) as weekend_training_days,
    count(*) filter (
      where coalesce(vl.target_belt, vl.belt_level) in ('No MCMAP Belt', 'Tan Belt', 'Gray Belt', 'Green Belt')
        and (
          vl.search_text like '%martial culture%'
          or vl.search_text like '%warrior study%'
          or vl.search_text like '%warrior studies%'
          or vl.search_text like '%study%'
        )
    ) as pre_brown_study_count
  from verified_logs vl
  group by vl.belt_user_id
),
training_days as (
  select distinct belt_user_id as user_id, date
  from verified_logs
),
mat_rat_stats as (
  select
    start_days.user_id,
    max(count_days.days_in_window) as max_days_in_60
  from training_days start_days
  join lateral (
    select count(*) as days_in_window
    from training_days window_days
    where window_days.user_id = start_days.user_id
      and window_days.date between start_days.date and start_days.date + interval '60 days'
  ) count_days on true
  group by start_days.user_id
),
weekly_training as (
  select distinct
    belt_user_id as user_id,
    date_trunc('week', date)::date as week_start
  from verified_logs
),
weekly_islands as (
  select
    user_id,
    week_start,
    week_start - ((row_number() over (partition by user_id order by week_start))::integer * interval '7 days') as streak_group
  from weekly_training
),
weekly_streaks as (
  select
    user_id,
    max(weeks_in_streak) as max_week_streak
  from (
    select user_id, streak_group, count(*) as weeks_in_streak
    from weekly_islands
    group by user_id, streak_group
  ) streaks
  group by user_id
),
daily_minutes as (
  select
    belt_user_id as user_id,
    date,
    sum(log_minutes) as minutes_on_day
  from verified_logs
  group by belt_user_id, date
),
daily_islands as (
  select
    user_id,
    date,
    minutes_on_day,
    date - (row_number() over (partition by user_id order by date))::integer as day_group
  from daily_minutes
),
consecutive_day_stats as (
  select
    user_id,
    max(minutes_in_streak) as max_consecutive_day_minutes
  from (
    select user_id, day_group, sum(minutes_on_day) as minutes_in_streak
    from daily_islands
    group by user_id, day_group
  ) streaks
  group by user_id
),
belt_hunter_stats as (
  select
    p.id as user_id,
    coalesce(sum(vl.log_minutes), 0) as belt_hunter_minutes
  from public.profiles p
  left join verified_logs vl
    on vl.belt_user_id = p.id
   and p.belt_advanced_at is not null
   and vl.date between p.belt_advanced_at::date and p.belt_advanced_at::date + interval '30 days'
  group by p.id
),
achievement_candidates as (
  select user_id, 'first-blood' as achievement_id from base_stats where total_verified_minutes >= 600
  union all select user_id, 'iron' from weekly_streaks where max_week_streak >= 12
  union all select user_id, 'relentless' from base_stats where total_verified_minutes >= 6000
  union all select user_id, 'warrior-scholar' from base_stats where martial_study_count >= 5
  union all select user_id, 'combat-athlete' from base_stats where coalesce(combat_conditioning_minutes, 0) >= 3000 and coalesce(free_sparring_minutes, 0) >= 3000
  union all select user_id, 'warrior-of-many' from base_stats where unique_mais >= 5
  union all select user_id, 'mat-rat' from mat_rat_stats where max_days_in_60 >= 30
  union all select user_id, 'battle-rhythm' from weekly_streaks where max_week_streak >= 8
  union all select user_id, 'sparring-partner' from base_stats where coalesce(free_sparring_minutes, 0) >= 4500
  union all select user_id, 'eternal-student' from base_stats where different_warrior_studies >= 10
  union all select user_id, 'never-rest' from consecutive_day_stats where max_consecutive_day_minutes >= 6000
  union all select user_id, 'chesty-proud' from base_stats where coalesce(nov_10_minutes, 0) >= 60
  union all select user_id, 'frozen-chosin' from base_stats where coalesce(winter_minutes, 0) >= 6000
  union all select user_id, 'master-of-arms' from base_stats where total_verified_minutes >= 15000 and martial_study_count >= 25
  union all select user_id, 'forged-by-many' from base_stats where unique_mais >= 15
  union all select user_id, 'belt-hunter' from belt_hunter_stats where belt_hunter_minutes >= 900
  union all select user_id, 'weekend-warrior' from base_stats where weekend_training_days >= 8
  union all select belt_user_id as user_id, 'hurry-up-wait' from pending_logs where old_pending_count >= 1
  union all select user_id, 'strategic-leader' from base_stats where pre_brown_study_count >= 10
),
inserted_achievements as (
  insert into public.user_achievements (user_id, achievement_id, unlocked_at, unlock_source)
  select distinct
    achievement_candidates.user_id,
    achievement_candidates.achievement_id,
    now(),
    'one_time_backfill_scan'
  from achievement_candidates
  join auth.users au on au.id = achievement_candidates.user_id
  on conflict (user_id, achievement_id) do nothing
  returning user_id, achievement_id
),
inserted_notifications as (
  insert into public.achievement_notifications (user_id, achievement_id, message)
  select
    inserted_achievements.user_id,
    inserted_achievements.achievement_id,
    'Congratulations! You unlocked "' || achievement_definitions.name || '". Go check it out in your Profile under Achievements.'
  from inserted_achievements
  join public.achievement_definitions
    on achievement_definitions.achievement_id = inserted_achievements.achievement_id
  returning id
)
select
  (select count(*) from inserted_achievements) as achievements_awarded,
  (select count(*) from inserted_notifications) as notifications_created;
