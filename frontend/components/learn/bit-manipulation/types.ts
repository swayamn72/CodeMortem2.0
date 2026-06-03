// ── Shared Types for the Bit Manipulation Learning Path ──

export interface Lesson {
  id: string;
  title: string;
  part: number;
  unlocked: boolean;
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface WalkthroughLine {
  lineNum: number;
  code: string;
  explanation: string;
  type: "keyword" | "comment" | "normal" | "highlight";
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

export interface BitPattern {
  id: string;
  title: string;
  expression: string;
  example: string;
  explanation: string;
}

export interface SampleCase {
  input: string;
  expected: string;
  label?: string;
}
