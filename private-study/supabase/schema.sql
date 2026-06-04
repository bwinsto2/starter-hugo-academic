-- Auditory psychophysics private study schema.
-- Run this in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.participant_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  sex text check (sex in ('female', 'male', 'intersex', 'prefer_not_to_say')),
  age integer check (age between 18 and 120),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.participant_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists sex text check (sex in ('female', 'male', 'intersex', 'prefer_not_to_say')),
  add column if not exists age integer check (age between 18 and 120);

create table if not exists public.participant_study_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  drug_day date not null,
  drug_day_locked_at timestamptz not null default now(),
  drug_day_override_reason text,
  drug_day_overridden_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_tasks (
  id text primary key,
  name text not null,
  requires_training boolean not null default false,
  route text not null,
  sort_order integer not null,
  active boolean not null default true,
  schedule_rule jsonb not null default '{}'::jsonb
);

create table if not exists public.task_session_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.study_tasks(id),
  session_type text not null check (session_type in ('training', 'baseline', 'drug_day', 'post_drug')),
  requirement_date date not null,
  completion_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique (user_id, completion_key)
);

create table if not exists public.participant_randomizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  randomization_type text not null,
  assignment jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, randomization_type)
);

create table if not exists public.scheduled_requirement_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.study_tasks(id),
  session_type text not null check (session_type in ('training', 'baseline', 'drug_day', 'post_drug')),
  requirement_date date not null,
  status text not null default 'required' check (status in ('required', 'waived', 'rescheduled')),
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

insert into public.study_tasks (id, name, requires_training, route, sort_order, schedule_rule)
values
  ('pitch', 'Pitch task', true, '/tasks/pitch', 10, '{"training_days_before_drug_day": 7, "future_sessions": ["training", "test"]}'),
  ('harmonic', 'Harmonic task', true, '/tasks/harmonic', 20, '{"training_days_before_drug_day": 7}'),
  ('jnd', 'JND task', false, '/tasks/jnd', 30, '{"sessions": ["baseline", "drug_day", "post_drug"]}'),
  ('gap', 'Gap task', false, '/tasks/gap', 40, '{"sessions": ["baseline", "drug_day", "post_drug"]}'),
  ('range', 'Range task', false, '/tasks/range', 50, '{"sessions": ["baseline", "drug_day", "post_drug"]}'),
  ('interval', 'Interval task', false, '/tasks/interval', 60, '{"sessions": ["baseline", "drug_day", "post_drug"]}')
on conflict (id) do update
set
  name = excluded.name,
  requires_training = excluded.requires_training,
  route = excluded.route,
  sort_order = excluded.sort_order,
  schedule_rule = excluded.schedule_rule;

alter table public.participant_profiles enable row level security;
alter table public.participant_study_settings enable row level security;
alter table public.study_tasks enable row level security;
alter table public.task_session_completions enable row level security;
alter table public.participant_randomizations enable row level security;
alter table public.scheduled_requirement_overrides enable row level security;

drop policy if exists "participants can read own profile" on public.participant_profiles;
create policy "participants can read own profile"
on public.participant_profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "participants can upsert own profile" on public.participant_profiles;
create policy "participants can upsert own profile"
on public.participant_profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "participants can update own profile" on public.participant_profiles;
create policy "participants can update own profile"
on public.participant_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "participants can read own settings" on public.participant_study_settings;
create policy "participants can read own settings"
on public.participant_study_settings for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "participants can insert own settings once" on public.participant_study_settings;
create policy "participants can insert own settings once"
on public.participant_study_settings for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "participants can read active tasks" on public.study_tasks;
create policy "participants can read active tasks"
on public.study_tasks for select
to authenticated
using (active = true);

drop policy if exists "participants can read own completions" on public.task_session_completions;
create policy "participants can read own completions"
on public.task_session_completions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "participants can insert own completions" on public.task_session_completions;
create policy "participants can insert own completions"
on public.task_session_completions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "participants can update own completions" on public.task_session_completions;
create policy "participants can update own completions"
on public.task_session_completions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "participants can read own randomizations" on public.participant_randomizations;
create policy "participants can read own randomizations"
on public.participant_randomizations for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "participants can insert own randomizations" on public.participant_randomizations;
create policy "participants can insert own randomizations"
on public.participant_randomizations for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "participants can read own schedule overrides" on public.scheduled_requirement_overrides;
create policy "participants can read own schedule overrides"
on public.scheduled_requirement_overrides for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists participant_profiles_touch_updated_at on public.participant_profiles;
create trigger participant_profiles_touch_updated_at
before update on public.participant_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists participant_settings_touch_updated_at on public.participant_study_settings;
create trigger participant_settings_touch_updated_at
before update on public.participant_study_settings
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_participant_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.participant_profiles (
    user_id,
    email,
    first_name,
    last_name,
    display_name,
    sex,
    age
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    new.raw_user_meta_data ->> 'sex',
    nullif(new.raw_user_meta_data ->> 'age', '')::integer
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    sex = excluded.sex,
    age = excluded.age;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_participant_profile on auth.users;
create trigger on_auth_user_created_create_participant_profile
after insert on auth.users
for each row execute function public.handle_new_participant_user();
