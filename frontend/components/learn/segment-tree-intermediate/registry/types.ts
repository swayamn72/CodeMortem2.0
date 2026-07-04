// ── Shared Types for the Segment Tree Intermediate Learning Path ──
// All lesson content is expressed as pure data conforming to these types.
// The renderer components are fully generic — adding a new problem
// requires only a new registry file, never touching the renderer.

export interface HintItem {
  title: string;
  body: string; // plain text; renderer may apply basic formatting
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
  /** Displayed in the Statement tab. Markdown-like plain text supported. */
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
  /**
   * Blank starter code (just I/O boilerplate) shown when the editor opens.
   * Should NOT contain any segment tree logic.
   */
  starterCode: { cpp: string; python: string };
  /**
   * Reference boilerplate shown when the user clicks "Refer Boilerplate".
   * Contains the full segment tree scaffold with TODOs removed — i.e. a
   * working generic template the student adapts.
   */
  referenceBoilerplate: { cpp: string; python: string };
  /** Markdown text for the editorial, optionally containing code blocks. */
  editorial?: string;
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
  /** Used for sidebar part header (e.g., "Problem 1: Min + Count"). */
  partLabel: string;
  lessons: LessonConfig[];
}

// ── Re-export judge result type (shared with beginner IDE) ───────────────────
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
