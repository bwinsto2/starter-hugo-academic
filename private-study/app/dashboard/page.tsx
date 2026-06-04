import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { ensurePitchRandomization } from "@/app/actions/study";
import { DashboardChecklist } from "@/components/DashboardChecklist";
import { PitchMapping } from "@/components/PitchMapping";
import { todayIso } from "@/lib/dates";
import { getTodaysRequirements } from "@/lib/schedule";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Completion, PitchColorAssignment } from "@/lib/types";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: settings } = await supabase
    .from("participant_study_settings")
    .select("drug_day")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.drug_day) {
    redirect("/setup");
  }

  await ensurePitchRandomization();

  const today = todayIso();
  const [{ data: completions }, { data: randomization }] = await Promise.all([
    supabase
      .from("task_session_completions")
      .select("id,user_id,task_id,session_type,requirement_date,completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false }),
    supabase
      .from("participant_randomizations")
      .select("assignment")
      .eq("user_id", user.id)
      .eq("randomization_type", "pitch_color_assignment")
      .maybeSingle()
  ]);

  const requirements = getTodaysRequirements({
    drugDay: settings.drug_day,
    today,
    completions: (completions ?? []) as Completion[]
  });

  const completeCount = requirements.filter((requirement) => requirement.completed).length;

  return (
    <main className="page-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Participant dashboard</p>
          <h1>Today&apos;s study checklist</h1>
          <p className="lede">
            Signed in as {user.email}. Your drug day is anchored to{" "}
            <strong>{settings.drug_day}</strong>.
          </p>
        </div>
        <form action={signOut}>
          <button className="ghost-button" type="submit">
            Sign out
          </button>
        </form>
      </header>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <section className="stats-grid">
        <div className="stat-card">
          <span>{today}</span>
          <strong>Today</strong>
        </div>
        <div className="stat-card">
          <span>
            {completeCount}/{requirements.length}
          </span>
          <strong>Required sessions complete</strong>
        </div>
        <div className="stat-card">
          <span>{settings.drug_day}</span>
          <strong>Drug day</strong>
        </div>
      </section>

      <DashboardChecklist requirements={requirements} />
      <PitchMapping assignment={randomization?.assignment as PitchColorAssignment | undefined} />

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Future task routes</p>
          <h2>jsPsych placeholders</h2>
        </div>
        <p>
          Real auditory implementations can be added under <code>/tasks/pitch</code>,{" "}
          <code>/tasks/harmonic</code>, <code>/tasks/jnd</code>, <code>/tasks/gap</code>,{" "}
          <code>/tasks/range</code>, and <code>/tasks/interval</code>.
        </p>
        <Link className="text-link" href="/tasks/pitch">
          View pitch task placeholder
        </Link>
      </section>
    </main>
  );
}
