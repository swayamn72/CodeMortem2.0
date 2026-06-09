// ── Shared types for the modular course system ──────────────────────────────
// Any new course creates a CourseConfig and passes it to <CourseLayout>.

export type LessonType = "lesson" | "challenge" | "mcq" | "badge";

export interface LessonDef {
  id: string;
  title: string;
  part: number;
  type: LessonType;
}

export interface SampleCase {
  input: string;
  expected: string;
  label?: string;
  explanation?: string;
}

export interface ChallengeConfig {
  /** lesson id, e.g. "challenge1" */
  id: string;
  /** backend challengeId sent to /learning-path/submit */
  backendId: string;
  title: string;
  difficulty: string;
  diffColor: string;
  statement: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  /** ordered from nudge → near-answer */
  hints: string[];
  /** shown only after first submit */
  editorial: string;
  sampleCases: SampleCase[];
  /** lesson id to navigate to on completion */
  nextLesson: string;
  nextLabel: string;
}

export interface PartDef {
  number: number;
  title: string;
}

export interface CourseConfig {
  /** stable id used in progressStore, e.g. "bit-manipulation-easy" */
  moduleId: string;
  title: string;
  icon: string;
  subtitle: string;
  parts: PartDef[];
  lessons: LessonDef[];
  /** ordered list of all completable step IDs (for progress tracking) */
  allLessonIds: string[];
  /** keyed by lesson id */
  challenges: Record<string, ChallengeConfig>;
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

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
