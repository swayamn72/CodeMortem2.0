// ── Shared Types for the Segment Tree Learning Path ──

export interface Lesson {
  id: string;
  title: string;
  part: number;
  unlocked: boolean;
}

export interface NodeData {
  id: number;
  label: string;
  range: [number, number];
  val: number;
  x: number;
  y: number;
  level: number;
  children?: [number, number];
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
  type: string;
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
