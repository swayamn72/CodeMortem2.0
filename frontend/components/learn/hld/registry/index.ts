import type { ProblemGroup } from "./types";
import { PART0_PHILOSOPHY } from "./part0-philosophy";
import { PART1_SETUP } from "./part1-setup";
import { PART2_STATIC_QUERIES } from "./part2-static-queries";
import { PART3_DYNAMIC } from "./part3-dynamic";
import { PART4_ADVANCED } from "./part4-advanced";
import { PART5_TEMPLATE } from "./part5-template";

/**
 * Ordered list of all problem groups in the HLD module.
 * To add a new part, create a registry file and append here.
 */
export const PROBLEMS: ProblemGroup[] = [
  PART0_PHILOSOPHY,
  PART1_SETUP,
  PART2_STATIC_QUERIES,
  PART3_DYNAMIC,
  PART4_ADVANCED,
  PART5_TEMPLATE,
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
export const MODULE_ID = "hld-hard";
