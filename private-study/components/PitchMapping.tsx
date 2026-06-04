import type { PitchColorAssignment } from "@/lib/types";

export function PitchMapping({ assignment }: { assignment?: PitchColorAssignment }) {
  if (!assignment) {
    return null;
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Stable randomization</p>
        <h2>Pitch task color mapping</h2>
      </div>
      <div className="color-grid">
        {Object.entries(assignment).map(([pitch, color]) => (
          <div className="color-chip" key={pitch}>
            <span className={`color-dot ${color}`} />
            <span>{pitch}</span>
            <strong>{color}</strong>
          </div>
        ))}
      </div>
      <p className="muted">
        This randomized assignment is created once per participant and reused throughout the pitch
        task.
      </p>
    </section>
  );
}
