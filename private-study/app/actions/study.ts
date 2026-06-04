"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, todayIso } from "@/lib/dates";
import { createPitchColorAssignment } from "@/lib/randomization";
import { getCompletionKey } from "@/lib/schedule";
import { TASK_BY_SLUG } from "@/lib/tasks";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SessionType, TaskSlug } from "@/lib/types";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return { supabase, user };
}

export async function saveDrugDay(formData: FormData) {
  const drugDay = String(formData.get("drugDay") ?? "");
  const { supabase, user } = await requireUser();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(drugDay)) {
    redirect("/setup?error=Please%20select%20a%20valid%20drug%20day.");
  }

  const { error: profileError } = await supabase.from("participant_profiles").upsert({
    user_id: user.id,
    email: user.email,
    first_name: user.user_metadata?.first_name,
    last_name: user.user_metadata?.last_name,
    display_name: user.user_metadata?.display_name ?? user.email,
    sex: user.user_metadata?.sex,
    age: user.user_metadata?.age
  });

  if (profileError) {
    redirect(`/setup?error=${encodeURIComponent(profileError.message)}`);
  }

  const { error } = await supabase.from("participant_study_settings").upsert({
    user_id: user.id,
    drug_day: drugDay,
    drug_day_locked_at: new Date().toISOString()
  });

  if (error) {
    redirect(`/setup?error=${encodeURIComponent(error.message)}`);
  }

  await ensurePitchRandomization();
  redirect("/dashboard");
}

export async function ensurePitchRandomization() {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("participant_randomizations")
    .select("id")
    .eq("user_id", user.id)
    .eq("randomization_type", "pitch_color_assignment")
    .maybeSingle();

  if (existing) {
    return;
  }

  await supabase.from("participant_randomizations").insert({
    user_id: user.id,
    randomization_type: "pitch_color_assignment",
    assignment: createPitchColorAssignment(user.id)
  });
}

export async function completeMockTask(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "") as TaskSlug;
  const sessionType = String(formData.get("sessionType") ?? "") as SessionType;
  const requirementDate = String(formData.get("requirementDate") ?? todayIso());
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");

  if (!TASK_BY_SLUG[taskId]) {
    redirect("/dashboard?error=Unknown%20task.");
  }

  const { supabase, user } = await requireUser();
  const completionKey = getCompletionKey(taskId, sessionType, requirementDate);

  const { error } = await supabase.from("task_session_completions").upsert(
    {
      user_id: user.id,
      task_id: taskId,
      session_type: sessionType,
      requirement_date: requirementDate,
      completion_key: completionKey,
      metadata: {
        mock: true,
        source: "placeholder_start_button",
        future_route: TASK_BY_SLUG[taskId].route,
        suggested_post_session_date: sessionType === "drug_day" ? addDays(requirementDate, 1) : null
      }
    },
    { onConflict: "user_id,completion_key" }
  );

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect(returnTo);
}
