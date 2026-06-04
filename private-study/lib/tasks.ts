import type { TaskDefinition, TaskSlug } from "@/lib/types";

export const TASKS: TaskDefinition[] = [
  {
    id: "pitch",
    name: "Pitch task",
    requiresTraining: true,
    route: "/tasks/pitch",
    description: "Pitch/color learning and future pitch discrimination sessions."
  },
  {
    id: "harmonic",
    name: "Harmonic task",
    requiresTraining: true,
    route: "/tasks/harmonic",
    description: "Harmonic perception training and future test sessions."
  },
  {
    id: "jnd",
    name: "JND task",
    requiresTraining: false,
    route: "/tasks/jnd",
    description: "Just-noticeable-difference auditory threshold session."
  },
  {
    id: "gap",
    name: "Gap task",
    requiresTraining: false,
    route: "/tasks/gap",
    description: "Temporal gap detection session."
  },
  {
    id: "range",
    name: "Range task",
    requiresTraining: false,
    route: "/tasks/range",
    description: "Auditory range judgment session."
  },
  {
    id: "interval",
    name: "Interval task",
    requiresTraining: false,
    route: "/tasks/interval",
    description: "Pitch interval perception session."
  }
];

export const TASK_BY_SLUG = TASKS.reduce<Record<TaskSlug, TaskDefinition>>((acc, task) => {
  acc[task.id] = task;
  return acc;
}, {} as Record<TaskSlug, TaskDefinition>);

export const TEST_TASKS = TASKS.filter((task) => !task.requiresTraining);
export const TRAINING_TASKS = TASKS.filter((task) => task.requiresTraining);
