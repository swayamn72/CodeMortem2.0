import type { CourseConfig, ChallengeConfig, MCQQuestion } from "@/components/course/types";
import { COMB_CHALLENGES, SAMPLE_TEST_CASES, MCQ_PART_1, MCQ_PART_2 } from "./constants";

export const COMB_MCQ_1: MCQQuestion[] = MCQ_PART_1 as unknown as MCQQuestion[];
export const COMB_MCQ_2: MCQQuestion[] = MCQ_PART_2 as unknown as MCQQuestion[];

const NEXT_LESSON: Record<string, string> = {
  challenge1:  "lesson2",
  challenge2:  "lesson3",
  challenge3:  "lesson4",
  challenge4:  "lesson5",
  challenge5:  "mcq1",
  challenge6:  "lesson7",
  challenge7:  "lesson8",
  challenge8:  "lesson9",
  challenge9:  "challenge10",
  challenge10: "lesson10",
  challenge11: "lesson11",
  challenge12: "mcq2",
  challenge14: "badge",
  challenge15: "badge",
};

const NEXT_LABEL: Record<string, string> = {
  challenge1:  "Next: Binary Exponentiation →",
  challenge2:  "Next: Fermat's Theorem →",
  challenge3:  "Next: Counting Principles →",
  challenge4:  "Next: Combinations →",
  challenge5:  "Checkpoint 1 →",
  challenge6:  "Next: Inverse Arrays →",
  challenge7:  "Next: O(1) nCr →",
  challenge8:  "Next: Grid Paths →",
  challenge9:  "Next: The Relay Station →",
  challenge10: "Next: Stars & Bars →",
  challenge11: "Next: DNA Sequences →",
  challenge12: "Checkpoint 2 →",
  challenge14: "🏆 Claim Your Badge",
  challenge15: "Complete →",
};

export const COMB_CHALLENGE_CONFIGS: Record<string, ChallengeConfig> = Object.fromEntries(
  COMB_CHALLENGES.map(c => [
    c.id,
    {
      id: c.id,
      backendId: c.backendId,
      title: c.title,
      premium: c.premium,
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

export const COMB_COURSE: CourseConfig = {
  moduleId: "combinatorics-beginner",
  title: "Combinatorics",
  icon: "∑",
  subtitle: "Beginner · 20 steps",
  parts: [
    { number: 1, title: "Part 1: Modular Arithmetic" },
    { number: 2, title: "Part 2: Counting Principles" },
    { number: 3, title: "Part 3: Precomputation Template" },
    { number: 4, title: "Part 4: Classical Models" },
    { number: 5, title: "Part 5: Advanced Counting" },
    { number: 6, title: "Part 6: Practice (Premium)" },
  ],
  lessons: [
    // Part 1
    { id: "lesson1",    title: "1. Modulo Properties",         part: 1, type: "lesson" },
    { id: "challenge1", title: "Code: Safe Product",           part: 1, type: "challenge" },
    { id: "lesson2",    title: "2. Binary Exponentiation",     part: 1, type: "lesson" },
    { id: "challenge2", title: "Code: Fast Power",             part: 1, type: "challenge" },
    { id: "lesson3",    title: "3. Fermat's Theorem",          part: 1, type: "lesson" },
    { id: "challenge3", title: "Code: Modulo Division",        part: 1, type: "challenge" },
    // Part 2
    { id: "lesson4",    title: "4. Permutations",              part: 2, type: "lesson" },
    { id: "challenge4", title: "Code: Task Lineup",            part: 2, type: "challenge" },
    { id: "lesson5",    title: "5. Combinations nCr",          part: 2, type: "lesson" },
    { id: "challenge5", title: "Code: Team Formations",        part: 2, type: "challenge" },
    { id: "mcq1",       title: "Checkpoint 1",                 part: 2, type: "mcq" },
    // Part 3
    { id: "lesson6",    title: "6. The Query Bottleneck",      part: 3, type: "lesson" },
    { id: "challenge6", title: "Code: Prefix Factorials",      part: 3, type: "challenge" },
    { id: "lesson7",    title: "7. Precomputing Inverses",     part: 3, type: "lesson" },
    { id: "challenge7", title: "Code: Inverse Array",          part: 3, type: "challenge" },
    { id: "lesson8",    title: "8. O(1) nCr Function",         part: 3, type: "lesson" },
    { id: "challenge8", title: "Code: Massive Queries",        part: 3, type: "challenge" },
    // Part 4
    { id: "lesson9",    title: "9. Grid Paths",                part: 4, type: "lesson" },
    { id: "challenge9", title: "Code: Robot Grid",             part: 4, type: "challenge" },
    { id: "challenge10",title: "Code: Relay Station",          part: 4, type: "challenge" },
    { id: "lesson10",   title: "10. Stars and Bars",           part: 4, type: "lesson" },
    { id: "challenge11",title: "Code: Candy Distribution",     part: 4, type: "challenge" },
    { id: "lesson11",   title: "11. Permutations w/ Reps",     part: 4, type: "lesson" },
    { id: "challenge12",title: "Code: DNA Sequences",          part: 4, type: "challenge" },
    { id: "mcq2",       title: "Checkpoint 2",                 part: 4, type: "mcq" },
    // Part 5
    { id: "lesson13",   title: "12. Inclusion-Exclusion",      part: 5, type: "lesson" },
    { id: "challenge14",title: "Code: Co-prime Count",         part: 5, type: "challenge" },
    { id: "badge",      title: "Completion Badge",             part: 5, type: "badge" },
    // Part 6
    { id: "challenge15",title: "Code: Quantum Routing",        part: 6, type: "challenge", premium: true },
  ],
  allLessonIds: [
    "lesson1", "challenge1",
    "lesson2", "challenge2",
    "lesson3", "challenge3",
    "lesson4", "challenge4",
    "lesson5", "challenge5", "mcq1",
    "lesson6", "challenge6",
    "lesson7", "challenge7",
    "lesson8", "challenge8",
    "lesson9", "challenge9", "challenge10",
    "lesson10", "challenge11",
    "lesson11", "challenge12", "mcq2",
    "lesson13", "challenge14",
    "badge",
  ],
  challenges: COMB_CHALLENGE_CONFIGS,
};
