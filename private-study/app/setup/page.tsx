import { redirect } from "next/navigation";
import { saveDrugDay } from "@/app/actions/study";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function SetupPage({
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

  if (settings?.drug_day) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell narrow">
      <section className="panel hero-panel">
        <p className="eyebrow">First login setup</p>
        <h1>Select your planned drug day</h1>
        <p>
          This date anchors your training week, baseline sessions, drug-day sessions, and post-drug
          sessions. After you save it, changes should be made only by the study team.
        </p>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <form action={saveDrugDay} className="stacked-form">
          <label>
            Planned drug day
            <input name="drugDay" type="date" required />
          </label>
          <button type="submit">Save study schedule</button>
        </form>
      </section>
    </main>
  );
}
