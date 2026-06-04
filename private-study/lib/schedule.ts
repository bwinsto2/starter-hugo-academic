import { diffDays } from "@/lib/dates";
import { TASKS, TEST_TASKS, TRAINING_TASKS } from "@/lib/tasks";
import type { Completion, DashboardRequirement, SessionType, TaskSlug } from "@/lib/types";

function completionKey(taskId: TaskSlug, sessionType: SessionType, requirementDate: string) {
  return `${taskId}:${sessionType}:${requirementDate}`;
}

export function getCompletionKey(taskId: TaskSlug, sessionType: SessionType, requirementDate: string) {
  return completionKey(taskId, sessionType, requirementDate);
}

export function getTodaysRequirements(params: {
  drugDay: string;
  today: string;
  completions: Completion[];
}): DashboardRequirement[] {
  const { drugDay, today, completions } = params;
  const daysFromDrugDay = diffDays(today, drugDay);
  const completedByKey = new Map(
    completions.map((completion) => [
      completionKey(completion.task_id, completion.session_type, completion.requirement_date),
      completion
    ])
  );

  const requirements: Omit<DashboardRequirement, "completed" | "completion">[] = [];

  if (daysFromDrugDay >= -7 && daysFromDrugDay <= -1) {
    for (const task of TRAINING_TASKS) {
      requirements.push({
        task,
        sessionType: "training",
        requirementDate: today,
        label: `${task.name} training`,
        timing: "training_week"
      });
    }
  }

  if (daysFromDrugDay < 0) {
    for (const task of TEST_TASKS) {
      requirements.push({
        task,
        sessionType: "baseline",
        requirementDate: drugDay,
        label: `${task.name} baseline`,
        timing: "baseline"
      });
    }
  }

  if (daysFromDrugDay === 0) {
    for (const task of TEST_TASKS) {
      requirements.push({
        task,
        sessionType: "drug_day",
        requirementDate: drugDay,
        label: `${task.name} drug-day session`,
        timing: "drug_day"
      });
    }
  }

  if (daysFromDrugDay > 0) {
    for (const task of TEST_TASKS) {
      requirements.push({
        task,
        sessionType: "post_drug",
        requirementDate: drugDay,
        label: `${task.name} post-drug session`,
        timing: "post_drug"
      });
    }
  }

  return requirements.map((requirement) => {
    const completion = completedByKey.get(
      completionKey(requirement.task.id, requirement.sessionType, requirement.requirementDate)
    );

    return {
      ...requirement,
      completed: Boolean(completion),
      completion
    };
  });
}

export function getAllTaskSlugs() {
  return TASKS.map((task) => task.id);
}
