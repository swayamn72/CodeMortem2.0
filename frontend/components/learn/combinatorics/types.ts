// ── Shared Types for the Combinatorics Learning Path ──

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface SampleCase {
  input: string;
  expected: string;
  label?: string;
}
