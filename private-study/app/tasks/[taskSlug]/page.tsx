import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { completeMockTask } from "@/app/actions/study";
import { todayIso } from "@/lib/dates";
import { TASK_BY_SLUG } from "@/lib/tasks";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SessionType, TaskSlug } from "@/lib/types";

export default async function TaskPlaceholderPage({
  params,
  searchParams
}: {
  params: Promise<{ taskSlug: string }>;
  searchParams: Promise<{ session?: SessionType; date?: string }>;
}) {
  const [{ taskSlug }, query] = await Promise.all([params, searchParams]);
  const task = TASK_BY_SLUG[taskSlug as TaskSlug];

  if (!task) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const sessionType = query.session ?? (task.requiresTraining ? "training" : "baseline");
  const requirementDate = query.date ?? todayIso();

  return (
    <main className="page-shell narrow">
      <section className="panel hero-panel">
        <p className="eyebrow">Task placeholder</p>
        <h1>{task.name}</h1>
        <p>{task.description}</p>
        <p>
          This route is reserved for the future jsPsych implementation. For now, completing this
          placeholder writes a mock completion record for dashboard testing.
        </p>

        {task.id === "pitch" ? (
          <div className="todo-box">
            <h2>Pitch task implementation notes</h2>
            <p>
              Add training and test flows here. Training should use nested blocks: each inner block
              trains one pitch/color category, replays the target tone at the start and halfway
              point, and records higher/lower key responses for tones sampled around the target.
            </p>
          </div>
        ) : null}

        <form action={completeMockTask} className="button-row">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="sessionType" value={sessionType} />
          <input type="hidden" name="requirementDate" value={requirementDate} />
          <input type="hidden" name="returnTo" value="/dashboard" />
          <button type="submit">Record mock completion</button>
          <Link className="ghost-link" href="/dashboard">
            Back to dashboard
          </Link>
        </form>
      </section>
    </main>
  );
}
