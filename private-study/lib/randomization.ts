import type { PitchColorAssignment } from "@/lib/types";

const PITCH_CATEGORIES: Array<keyof PitchColorAssignment> = ["low", "mid-low", "mid-high", "high"];
const COLORS = ["blue", "gold", "green", "coral"];

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(48271, state) % 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function createPitchColorAssignment(userId: string): PitchColorAssignment {
  const random = seededRandom(hashString(userId));
  const colors = [...COLORS];

  for (let index = colors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [colors[index], colors[swapIndex]] = [colors[swapIndex], colors[index]];
  }

  return PITCH_CATEGORIES.reduce((assignment, category, index) => {
    assignment[category] = colors[index];
    return assignment;
  }, {} as PitchColorAssignment);
}
