// ── Shared Types for the HLD (Heavy-Light Decomposition) Learning Path ──
// All lesson content is expressed as pure data conforming to these types.
// The renderer components are fully generic — adding a new problem
// requires only a new registry file, never touching the renderer.

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
  /** Array of narration strings shown one at a time (step-through). */
  narrations: string[];
  /** Shown in a highlighted card at the bottom of the lesson. */
  takeaway: string;
}

/** A from-scratch coding challenge rendered inside the split-pane IDE. */
export interface ChallengeContent {
  /** Displayed in the Statement tab. */
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  constraints: string[];
  hints: HintItem[];
  /** ID registered in the backend challenges registry. */
  backendChallengeId: string;
  sampleTestCases: SampleCase[];
  /** Blank starter code shown when the editor opens. */
  starterCode: { cpp: string; python: string };
  /** Reference boilerplate shown when the user clicks "Refer Boilerplate". */
  referenceBoilerplate: { cpp: string; python: string };
  /** Markdown text for the editorial, optionally containing code blocks. */
  editorial?: string | import("@/components/learn/shared/RichLessonTypes").ContentBlock[];
  /** Whether this challenge is premium-gated. */
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

/** Groups lessons under a named part in the sidebar. */
export interface ProblemGroup {
  partLabel: string;
  lessons: LessonConfig[];
}

// ── Re-export judge result type ───────────────────────────────────────────────
export interface LPTestResult {
  testIndex: number;
  verdict: string;
  executionTime?: string;
  memory?: number;
  input: string;
  output?: string;
  expected: string;
  stderr?: string;
  compileOutput?: string;
}
