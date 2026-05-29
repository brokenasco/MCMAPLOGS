-- One-time setup for the MCMAP Logs achievement system.
-- Paste this SQL into Supabase SQL Editor and run it once.

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  unlock_source text not null default 'system',
  created_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create table if not exists public.achievement_definitions (
  achievement_id text primary key,
  name text not null,
  requirement text not null,
  hidden boolean not null default false,
  icon text not null,
  progress_target integer,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievement_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  message text not null,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_achievements_user_id
  on public.user_achievements(user_id);

create index if not exists idx_user_achievements_achievement_id
  on public.user_achievements(achievement_id);

create index if not exists idx_achievement_notifications_user_id
  on public.achievement_notifications(user_id);

alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.achievement_notifications enable row level security;

drop policy if exists "Anyone signed in can read achievement definitions" on public.achievement_definitions;
create policy "Anyone signed in can read achievement definitions"
  on public.achievement_definitions
  for select
  to authenticated
  using (true);

insert into public.achievement_definitions
  (achievement_id, name, requirement, hidden, icon, progress_target, description)
values
  ('first-blood', 'First Blood', 'Verify first 10 hours.', false, 'droplet', 600, null),
  ('iron', 'Iron', 'Log training for 12 consecutive weeks.', false, 'chain', 12, null),
  ('relentless', 'Relentless', 'Complete 100 verified hours.', false, 'helmet', 6000, null),
  ('warrior-scholar', 'Warrior Scholar', 'Complete 5 Martial Culture Studies.', false, 'study', 5, null),
  ('combat-athlete', 'Combat Athlete', 'Log 50 Combat Conditioning hours and 50 Free Sparring hours.', false, 'shield-bolt', 6000, 'Develop both technical and athletic combat proficiency.'),
  ('warrior-of-many', 'A Warrior of Many', 'Train under 5 different MAIs.', false, 'compass', 5, null),
  ('mat-rat', 'Mat Rat', 'Log training on 30 separate days within a 60-day period.', false, 'badge', 30, null),
  ('battle-rhythm', 'Battle Rhythm', 'Log at least one training session every week for 8 consecutive weeks.', false, 'drum', 8, null),
  ('sparring-partner', 'Sparring Partner', 'Log 75 Free Sparring hours.', false, 'glove', 4500, null),
  ('eternal-student', 'The Eternal Student', 'Log 10 different Warrior Studies.', true, 'graduation', 10, null),
  ('never-rest', 'Never Rest', 'Log 100 hours through consecutive training days.', true, 'runner', 6000, null),
  ('chesty-proud', 'Chesty Would Be Proud', 'Log a cumulative 1 hour of training on November 10.', true, 'ega', 60, null),
  ('frozen-chosin', 'Frozen Chosin', 'Log 100 total hours during December and January.', true, 'snowflake', 6000, null),
  ('master-of-arms', 'Master of Arms', 'Complete 250 verified hours and 25 Martial Culture Studies.', true, 'rifles', 15000, null),
  ('forged-by-many', 'Forged by Many', 'Train under 15 different MAIs.', true, 'users', 15, null),
  ('belt-hunter', 'Belt Hunter', 'Log 15 hours toward the next belt within 30 days of completing the previous belt advancement.', true, 'crosshair', 900, null),
  ('weekend-warrior', 'Weekend Warrior', 'Log training on Saturday or Sunday 8 times.', true, 'calendar', 8, null),
  ('hurry-up-wait', 'Hurry Up and Wait', 'Have a log remain pending verification for more than 7 days.', true, 'clock', 1, null),
  ('strategic-leader', 'The Strategic Leader', 'Complete 10 Martial Culture Studies before reaching Brown Belt.', true, 'map', 10, null)
on conflict (achievement_id) do update set
  name = excluded.name,
  requirement = excluded.requirement,
  hidden = excluded.hidden,
  icon = excluded.icon,
  progress_target = excluded.progress_target,
  description = excluded.description,
  updated_at = now();

drop policy if exists "Users can read their own achievements" on public.user_achievements;
create policy "Users can read their own achievements"
  on public.user_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own achievements" on public.user_achievements;
create policy "Users can create their own achievements"
  on public.user_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own achievement notifications" on public.achievement_notifications;
create policy "Users can read their own achievement notifications"
  on public.achievement_notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own achievement notifications" on public.achievement_notifications;
create policy "Users can create their own achievement notifications"
  on public.achievement_notifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- This policy allows the logged-in MAI who verified a log to unlock achievements
-- for the Marine whose log was just verified.
drop policy if exists "MAIs can create achievements for verified students" on public.user_achievements;
create policy "MAIs can create achievements for verified students"
  on public.user_achievements
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.training_logs tl
      where tl.belt_user_id = user_achievements.user_id
        and tl.verified_by = auth.uid()
        and tl.status = 'Verified'
    )
  );

drop policy if exists "MAIs can update achievements for verified students" on public.user_achievements;
create policy "MAIs can update achievements for verified students"
  on public.user_achievements
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.training_logs tl
      where tl.belt_user_id = user_achievements.user_id
        and tl.verified_by = auth.uid()
        and tl.status = 'Verified'
    )
  )
  with check (
    exists (
      select 1
      from public.training_logs tl
      where tl.belt_user_id = user_achievements.user_id
        and tl.verified_by = auth.uid()
        and tl.status = 'Verified'
    )
  );

drop policy if exists "MAIs can create achievement notifications for verified students" on public.achievement_notifications;
create policy "MAIs can create achievement notifications for verified students"
  on public.achievement_notifications
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.training_logs tl
      where tl.belt_user_id = achievement_notifications.user_id
        and tl.verified_by = auth.uid()
        and tl.status = 'Verified'
    )
  );

drop policy if exists "MAIs can update achievement notifications for verified students" on public.achievement_notifications;
create policy "MAIs can update achievement notifications for verified students"
  on public.achievement_notifications
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.training_logs tl
      where tl.belt_user_id = achievement_notifications.user_id
        and tl.verified_by = auth.uid()
        and tl.status = 'Verified'
    )
  )
  with check (
    exists (
      select 1
      from public.training_logs tl
      where tl.belt_user_id = achievement_notifications.user_id
        and tl.verified_by = auth.uid()
        and tl.status = 'Verified'
    )
  );
