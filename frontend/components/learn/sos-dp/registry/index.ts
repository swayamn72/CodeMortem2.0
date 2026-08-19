import type { ProblemGroup } from "./types";
import { PART0_PHILOSOPHY } from "./part0-philosophy";

/**
 * Ordered list of all problem groups in the SOS DP module.
 * To add a new part, create a registry file and append here.
 */
export const PROBLEMS: ProblemGroup[] = [
  PART0_PHILOSOPHY,
];

/**
 * Flat ordered list of all lesson IDs for progress tracking.
 * The "badge" entry is appended by the path component, not stored here.
 */
export const ALL_LESSON_IDS: string[] = [
  ...PROBLEMS.flatMap((p) => p.lessons.map((l) => l.id)),
  "badge",
];

/** Module ID used as the key in the progress store. */
export const MODULE_ID = "sos-dp";
