# Private Auditory Psychophysics Study App

First-version private web app for participant signup/login, drug-day setup, personalized study checklist generation, mock task completions, persistent progress tracking, and stable per-participant pitch/color randomization.

This app is intentionally isolated from the public Hugo site in the repository. Deploy it separately as a private subdomain such as `study.brianwinston.com`, or place it behind a reverse proxy/subdirectory such as `brianwinston.com/private-study`.

## Stack

- Next.js App Router with TypeScript
- Supabase Auth for participant signup and login
- Supabase Postgres with RLS for participant records, study settings, completions, and randomization
- Server-side route protection through `middleware.ts`
- Server actions for drug-day setup, sign-out, and mock completions

## Local Setup

1. Create a Supabase project.
2. In Supabase, enable Email/Password auth.
3. Decide whether email confirmation should be enabled.
   If confirmation is enabled, participants sign up, confirm by email, then log in.
   If confirmation is disabled, participants can sign up and immediately continue to drug-day setup.
4. Run [supabase/schema.sql](./supabase/schema.sql) in the Supabase SQL editor.
5. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

6. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root redirects to `/dashboard`, which redirects unauthenticated users to `/auth/login`. That page has both signup and login forms.

Participants sign up and log in with email and password. The email address is the participant identifier in this first version.

## Data Model

- `participant_profiles`: participant metadata tied to `auth.users`, including email, first name, last name, sex, and age.
- `participant_study_settings`: per-participant study settings, including locked `drug_day` and future admin override fields.
- `study_tasks`: task catalog and schedule-rule metadata for Pitch, Harmonic, JND, Gap, Range, and Interval.
- `task_session_completions`: persistent completion records keyed by participant, task, session type, and requirement date.
- `participant_randomizations`: stable per-participant assignments, currently the Task 1 pitch category to color mapping.
- `scheduled_requirement_overrides`: future admin/developer schedule overrides or waivers.

The current dashboard computes schedule requirements in [lib/schedule.ts](./lib/schedule.ts) rather than persisting every scheduled row. That keeps the first version simple while still preserving all completion history.

## Scheduling Rules

- Pitch and Harmonic training are required daily for the 7 calendar days before drug day.
- JND, Gap, Range, and Interval show one baseline session before drug day, one drug-day session on drug day, and one post-drug session after drug day.
- The checklist is personalized from the signed-in user, their `drug_day`, today's date, and their saved `task_session_completions`.

## Mock Completion Flow

Dashboard `Start task` buttons currently write mock rows to `task_session_completions`. This lets you test progress indicators before the auditory tasks are implemented.

Task routes already exist as placeholders:

- `/tasks/pitch`
- `/tasks/harmonic`
- `/tasks/jnd`
- `/tasks/gap`
- `/tasks/range`
- `/tasks/interval`

## Pitch Task Randomization

On first dashboard load, the app creates one `participant_randomizations` row with `randomization_type = 'pitch_color_assignment'`. The mapping assigns colors to:

- low
- mid-low
- mid-high
- high

The assignment is deterministic from the participant ID at creation time and then stored permanently, so it remains stable for that participant throughout the study.

## Testing With Example Participants

You can either sign up through the app or create a Supabase Auth user manually. For manual smoke-test data, copy that user's UUID into [supabase/seed-example.sql](./supabase/seed-example.sql) and run it. The example seed sets a drug day three days from the current date, which should show baseline tasks plus Pitch/Harmonic training.

## Deployment

Recommended deployment is a private subdomain such as `study.brianwinston.com`.

Vercel:

- Set the project root to `private-study`.
- Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`.
- Deploy with the standard Next.js preset.

Netlify:

- Set the site base directory to `private-study`.
- Use the included [netlify.toml](./netlify.toml).
- Add the same environment variables.

For a subdirectory deployment such as `brianwinston.com/private-study`, prefer a reverse proxy that forwards that path to this Next.js app. If you need a baked-in Next.js `basePath`, add it to `next.config.ts` before deployment.

## Privacy Notes

- Do not expose Supabase service-role keys to the browser.
- The app only uses the public Supabase URL and anon key; RLS policies protect participant data.
- Signup is self-serve in this first version, but the app should remain unlinked from the public site. If you need stricter recruitment control, add invite codes, disable public signup after account creation, or add an outer access layer such as HTTP basic auth.
- Keep the app unlinked from the public Hugo navigation and consider HTTP basic auth, IP allowlisting, or a private preview deployment in addition to Supabase login if recruitment requires stricter access control.

## TODOs For jsPsych Auditory Tasks

- Add jsPsych dependencies and task-specific route components under `/tasks/*`.
- Implement Pitch training nested blocks with four pitch/color categories.
- Replay the target tone at the beginning and halfway point of each Pitch inner block.
- Store trial-level data in a new table, likely `task_trial_events`, keyed to `task_session_completions.id`.
- Add CSV/JSON export scripts for completions and trial data.
- Add admin tooling for drug-day overrides and schedule waivers.
