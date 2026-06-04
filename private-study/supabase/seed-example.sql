-- Optional smoke-test data after you create a Supabase Auth user.
-- Replace the UUID and email with values from Authentication > Users.

insert into public.participant_profiles (
  user_id,
  email,
  first_name,
  last_name,
  display_name,
  sex,
  age
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'participant@example.com',
    'Example',
    'Participant',
    'participant@example.com',
    'prefer_not_to_say',
    30
  )
on conflict (user_id) do update
set
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  display_name = excluded.display_name,
  sex = excluded.sex,
  age = excluded.age;

insert into public.participant_study_settings (user_id, drug_day)
values
  ('00000000-0000-0000-0000-000000000000', current_date + interval '3 days')
on conflict (user_id) do update
set drug_day = excluded.drug_day;

insert into public.participant_randomizations (user_id, randomization_type, assignment)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'pitch_color_assignment',
    '{"low":"blue","mid-low":"gold","mid-high":"green","high":"coral"}'
  )
on conflict (user_id, randomization_type) do nothing;
