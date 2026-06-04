import { CompletionButton } from "@/components/CompletionButton";
import type { DashboardRequirement } from "@/lib/types";

export function DashboardChecklist({ requirements }: { requirements: DashboardRequirement[] }) {
  if (requirements.length === 0) {
    return (
      <section className="panel empty-state">
        <h2>No required sessions today</h2>
        <p>
          Your checklist is clear for today. Come back during your training week, drug day, or
          post-drug follow-up window.
        </p>
      </section>
    );
  }

  return (
    <section className="checklist">
      {requirements.map((requirement) => (
        <article
          className={`task-card ${requirement.completed ? "is-complete" : ""}`}
          key={`${requirement.task.id}-${requirement.sessionType}-${requirement.requirementDate}`}
        >
          <div className="checkmark" aria-hidden="true">
            {requirement.completed ? "✓" : ""}
          </div>
          <div className="task-copy">
            <p className="eyebrow">{requirement.timing.replaceAll("_", " ")}</p>
            <h3>{requirement.label}</h3>
            <p>{requirement.task.description}</p>
            {requirement.completed ? (
              <p className="completion-note">
                Completed {new Date(requirement.completion!.completed_at).toLocaleString()}
              </p>
            ) : null}
          </div>
          <CompletionButton requirement={requirement} />
        </article>
      ))}
    </section>
  );
}
