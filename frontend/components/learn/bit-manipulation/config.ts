// Converts bit-manipulation-specific data into the shared CourseConfig + ChallengeConfig shapes.
import type { CourseConfig, ChallengeConfig, MCQQuestion } from "@/components/course/types";
import { BIT_CHALLENGES, SAMPLE_TEST_CASES, MCQ_PART_1, MCQ_PART_2 } from "./constants";

// Re-export MCQs typed as course/types.MCQQuestion (same shape, different import path)
export const BM_MCQ_1: MCQQuestion[] = MCQ_PART_1 as unknown as MCQQuestion[];
export const BM_MCQ_2: MCQQuestion[] = MCQ_PART_2 as unknown as MCQQuestion[];

const NEXT_LESSON: Record<string, string> = {
  challenge1: "lesson3",
  challenge2: "mcq1",
  challenge3: "lesson5",
  challenge4: "lesson7",
  challenge5: "challenge6",
  challenge6: "badge",
};

const NEXT_LABEL: Record<string, string> = {
  challenge1: "Next: Shifts & Pitfalls →",
  challenge2: "Checkpoint 1 →",
  challenge3: "Next: Isolating Bits →",
  challenge4: "Next: Subset Enumeration →",
  challenge5: "Next: Signal Calibration →",
  challenge6: "🏆 Claim Your Badge",
};

/** Map challenge id → ChallengeConfig (consumed by the generic ChallengeIde) */
export const BM_CHALLENGES: Record<string, ChallengeConfig> = Object.fromEntries(
  BIT_CHALLENGES.map(c => [
    c.id,
    {
      id: c.id,
      backendId: c.backendId,
      title: c.title,
      difficulty: c.difficulty,
      diffColor: c.diffColor,
      statement: c.statement,
      constraints: c.constraints,
      inputFormat: c.inputFormat,
      outputFormat: c.outputFormat,
      hints: c.hints,
      editorial: c.editorial,
      sampleCases: SAMPLE_TEST_CASES[c.id] ?? [],
      nextLesson: NEXT_LESSON[c.id] ?? "badge",
      nextLabel: NEXT_LABEL[c.id] ?? "Continue →",
    } satisfies ChallengeConfig,
  ])
);

/** Full CourseConfig for the Bit Manipulation Easy course */
export const BIT_MANIP_COURSE: CourseConfig = {
  moduleId: "bit-manipulation-easy",
  title: "Bit Manipulation",
  icon: "🔢",
  subtitle: "Easy · 20 steps",
  parts: [
    { number: 1, title: "Part 1: Binary Foundations" },
    { number: 2, title: "Part 2: Core Bit Techniques" },
    { number: 3, title: "Part 3: Practical CP Usage" },
  ],
  lessons: [
    // Part 1
    { id: "lesson1",    title: "Binary Basics",               part: 1, type: "lesson" },
    { id: "lesson2",    title: "The Six Bitwise Operators",   part: 1, type: "lesson" },
    { id: "challenge1", title: "Code: Odd or Even",           part: 1, type: "challenge" },
    { id: "lesson3",    title: "Shifts & CP Pitfalls",        part: 1, type: "lesson" },
    { id: "challenge2", title: "Code: Power of Two",          part: 1, type: "challenge" },
    { id: "mcq1",       title: "Checkpoint 1",                part: 1, type: "mcq" },
    // Part 2
    { id: "lesson4",    title: "Bit Masking",                 part: 2, type: "lesson" },
    { id: "challenge3", title: "Code: Flip Bits in a Range",  part: 2, type: "challenge" },
    { id: "lesson5",    title: "Isolating & Counting Bits",   part: 2, type: "lesson" },
    { id: "lesson6",    title: "XOR Properties",              part: 2, type: "lesson" },
    { id: "challenge4", title: "Code: Single Number",         part: 2, type: "challenge" },
    { id: "lesson7",    title: "Subset Enumeration",          part: 2, type: "lesson" },
    { id: "mcq2",       title: "Checkpoint 2",                part: 2, type: "mcq" },
    // Part 3
    { id: "lesson8",    title: "Pattern Recognition",         part: 3, type: "lesson" },
    { id: "lesson9",    title: "Masks as Sets",               part: 3, type: "lesson" },
    { id: "lesson10",   title: "Common Beginner Bugs",        part: 3, type: "lesson" },
    { id: "lesson11",   title: "Builtins & std::bitset",      part: 3, type: "lesson" },
    { id: "challenge5", title: "Code: Missing Number",        part: 3, type: "challenge" },
    { id: "challenge6", title: "Code: Signal Calibration",    part: 3, type: "challenge" },
    { id: "badge",      title: "Completion Badge",            part: 3, type: "badge" },
  ],
  allLessonIds: [
    "lesson1", "lesson2", "challenge1",
    "lesson3", "challenge2", "mcq1",
    "lesson4", "challenge3",
    "lesson5", "lesson6", "challenge4",
    "lesson7", "mcq2",
    "lesson8", "lesson9", "lesson10", "lesson11",
    "challenge5", "challenge6",
    "badge",
  ],
  challenges: BM_CHALLENGES,
};
