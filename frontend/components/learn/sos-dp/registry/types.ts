// ── Shared Types for the SOS DP Learning Path ──
import type { ContentBlock } from "@/components/learn/shared/RichLessonTypes";

export interface HintItem {
  title: string;
  body: string;
}

export interface SampleCase {
  label: string;
  input: string;
  expected: string;
}

// ── Lesson content variants ──────────────────────────────────────────────────

/** A conceptual lesson that walks the user through an idea step by step. */
export interface ConceptualContent {
  /** Array of rich content blocks shown one at a time (step-through). */
  blocks: ContentBlock[];
  /** Shown in a highlighted card at the bottom of the lesson. */
  takeaway: string;
}

/** A from-scratch coding challenge rendered inside the split-pane IDE. */
export interface ChallengeContent {
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  constraints: string[];
  hints: HintItem[];
  backendChallengeId: string;
  sampleTestCases: SampleCase[];
  starterCode: { cpp: string; python: string };
  referenceBoilerplate: { cpp: string; python: string };
  editorial?: string | ContentBlock[];
  premium?: boolean;
}

export type LessonContent =
  | { type: "conceptual"; data: ConceptualContent }
  | { type: "challenge"; data: ChallengeContent };

export interface LessonConfig {
  id: string;
  title: string;
  content: LessonContent;
}

export interface ProblemGroup {
  partLabel: string;
  lessons: LessonConfig[];
}
