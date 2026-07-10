import type { ProblemGroup } from "./types";
import { MIN_COUNT_PROBLEM } from "./min-count";
import { MAX_SUBARRAY_PROBLEM } from "./max-subarray";
import { LAZY_PROPAGATION_PROBLEM } from "./lazy-propagation";

/**
 * Ordered list of all problem groups in the Segment Tree Intermediate module.
 * To add a new problem, create a registry file and append its ProblemGroup here.
 * No other changes are needed.
 */
export const PROBLEMS: ProblemGroup[] = [
  MIN_COUNT_PROBLEM,
  MAX_SUBARRAY_PROBLEM,
  LAZY_PROPAGATION_PROBLEM,
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
export const MODULE_ID = "segment-tree-medium";
