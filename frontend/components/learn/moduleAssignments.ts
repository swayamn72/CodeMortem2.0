export type AssignmentDifficulty = "Easy" | "Medium" | "Hard";

export interface AssignmentQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ModuleAssignment {
  moduleId: string;
  title: string;
  subtitle: string;
  icon: string;
  difficulty: AssignmentDifficulty;
  questionCount: number;
  timeLimitMinutes: number;
  requiredLessonIds: string[];
  questions: AssignmentQuestion[];
}

const ONE_HOUR = 60;

export const MODULE_ASSIGNMENTS: Record<string, ModuleAssignment> = {
  "segment-tree-easy": {
    moduleId: "segment-tree-easy",
    title: "Segment Tree",
    subtitle: "1-hour premium assignment",
    icon: "🌳",
    difficulty: "Easy",
    questionCount: 5,
    timeLimitMinutes: ONE_HOUR,
    requiredLessonIds: [
      "lesson1", "lesson2", "mcq1",
      "lesson3", "lesson4", "lesson5", "lesson5b", "lesson7", "mcq2",
      "lesson6", "challenge1", "challenge2", "challenge3", "challenge4", "badge",
    ],
    questions: [
      {
        id: "st-q1",
        prompt: "What is the time complexity of a point update and a range query on a standard segment tree?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        answerIndex: 1,
        explanation: "Both point updates and range queries descend a single path through the tree, which takes O(log N).",
      },
      {
        id: "st-q2",
        prompt: "Why is a segment tree preferred over prefix sums when updates are frequent?",
        options: ["Prefix sums cannot answer sums", "Prefix sums need O(N) rebuilds after updates", "Segment trees use less memory than arrays", "Segment trees only work on sorted arrays"],
        answerIndex: 1,
        explanation: "Prefix sums are fast for queries but expensive for updates, while segment trees handle both in O(log N).",
      },
      {
        id: "st-q3",
        prompt: "In a 0-indexed heap-like segment tree array, what are the children of node i?",
        options: ["2i and 2i+1", "2i+1 and 2i+2", "i-1 and i+1", "i/2 and i/2+1"],
        answerIndex: 1,
        explanation: "For 0-indexed array storage, the left child is 2i+1 and the right child is 2i+2.",
      },
      {
        id: "st-q4",
        prompt: "What does lazy propagation primarily optimize?",
        options: ["Building the tree", "Range updates", "Binary search", "Sorting the input"],
        answerIndex: 1,
        explanation: "Lazy propagation defers updates so multiple range changes can be handled efficiently.",
      },
      {
        id: "st-q5",
        prompt: "What does an internal node of a range-sum segment tree usually store?",
        options: ["Only the leftmost value", "The sum of its covered segment", "The maximum element in the whole array", "The number of leaves in the tree"],
        answerIndex: 1,
        explanation: "Each internal node stores the aggregate for its interval, such as the sum for range-sum trees.",
      },
    ],
  },
  "bit-manipulation-easy": {
    moduleId: "bit-manipulation-easy",
    title: "Bit Manipulation",
    subtitle: "1-hour premium assignment",
    icon: "🔢",
    difficulty: "Easy",
    questionCount: 5,
    timeLimitMinutes: ONE_HOUR,
    requiredLessonIds: [
      "lesson1", "lesson2", "challenge1",
      "lesson3", "challenge2", "mcq1",
      "lesson4", "challenge3", "lesson4b",
      "lesson5", "lesson5b",
      "lesson6", "challenge4",
      "lesson7", "mcq2",
      "lesson8", "lesson8b", "lesson9", "challenge5",
      "badge",
    ],
    questions: [
      {
        id: "bm-q1",
        prompt: "What does the expression x & (x - 1) do?",
        options: ["Sets the lowest set bit", "Clears the lowest set bit", "Flips all bits", "Isolates the highest set bit"],
        answerIndex: 1,
        explanation: "Subtracting 1 flips the trailing bits, and ANDing removes the lowest set bit.",
      },
      {
        id: "bm-q2",
        prompt: "What does x & -x isolate?",
        options: ["The lowest set bit", "The highest set bit", "The parity bit", "All unset bits"],
        answerIndex: 0,
        explanation: "x & -x keeps only the lowest set bit, which is useful in many bit tricks.",
      },
      {
        id: "bm-q3",
        prompt: "How many subsets does an n-element set have?",
        options: ["n", "2n", "2ⁿ", "n!"],
        answerIndex: 2,
        explanation: "Each element can be either included or excluded, so the total is 2ⁿ.",
      },
      {
        id: "bm-q4",
        prompt: "Which condition correctly checks whether x is a power of two?",
        options: ["x > 0 and (x & (x - 1)) == 0", "x % 2 == 0", "x & 1 == 1", "x == 2ᵏ for some k"],
        answerIndex: 0,
        explanation: "A positive power of two has exactly one set bit, so x & (x - 1) becomes 0.",
      },
      {
        id: "bm-q5",
        prompt: "Why is XOR useful in competitive programming?",
        options: ["It always sorts numbers", "Equal values cancel out and 0 acts as identity", "It only works on odd numbers", "It replaces division"],
        answerIndex: 1,
        explanation: "XOR has the useful properties a ^ a = 0 and a ^ 0 = a, which make it ideal for parity and cancellation tricks.",
      },
    ],
  },
};

export function getModuleAssignment(moduleId: string): ModuleAssignment | undefined {
  return MODULE_ASSIGNMENTS[moduleId];
}
