import { completeMockTask } from "@/app/actions/study";
import type { DashboardRequirement } from "@/lib/types";

export function CompletionButton({ requirement }: { requirement: DashboardRequirement }) {
  if (requirement.completed) {
    return <span className="status-pill complete">Completed</span>;
  }

  return (
    <form action={completeMockTask}>
      <input type="hidden" name="taskId" value={requirement.task.id} />
      <input type="hidden" name="sessionType" value={requirement.sessionType} />
      <input type="hidden" name="requirementDate" value={requirement.requirementDate} />
      <input type="hidden" name="returnTo" value="/dashboard" />
      <button type="submit" className="secondary-button">
        Start task
      </button>
    </form>
  );
}
