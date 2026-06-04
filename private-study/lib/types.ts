export type TaskSlug = "pitch" | "harmonic" | "jnd" | "gap" | "range" | "interval";

export type SessionType = "training" | "baseline" | "drug_day" | "post_drug";

export type TaskDefinition = {
  id: TaskSlug;
  name: string;
  requiresTraining: boolean;
  route: string;
  description: string;
};

export type Completion = {
  id: string;
  user_id: string;
  task_id: TaskSlug;
  session_type: SessionType;
  requirement_date: string;
  completed_at: string;
};

export type DashboardRequirement = {
  task: TaskDefinition;
  sessionType: SessionType;
  requirementDate: string;
  label: string;
  timing: "training_week" | "baseline" | "drug_day" | "post_drug";
  completed: boolean;
  completion?: Completion;
};

export type PitchColorAssignment = {
  low: string;
  "mid-low": string;
  "mid-high": string;
  high: string;
};
