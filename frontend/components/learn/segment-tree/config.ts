import { CourseConfig } from "@/components/course/types";
import { ST_CHALLENGES } from "./constants";

export const SEGMENT_TREE_COURSE: CourseConfig = {
  moduleId: "segment-tree-easy",
  title: "Segment Trees",
  icon: "🌳",
  subtitle: "Easy · 18 steps",
  parts: [
    { number: 1, title: "Part 1: The Problem" },
    { number: 2, title: "Part 2: Introducing Trees" },
    { number: 3, title: "Part 3: Code It" },
    { number: 4, title: "Part 4: Practice (Premium)" },
  ],
  lessons: [
    { id: "lesson1", title: "1. The Naive Approach", part: 1, type: "lesson" },
    { id: "lesson2", title: "2. Why This Hurts", part: 1, type: "lesson" },
    { id: "mcq1", title: "Checkpoint: Complexity Check", part: 1, type: "mcq" },
    { id: "lesson3", title: "3. The Core Idea", part: 2, type: "lesson" },
    { id: "lesson4", title: "4. Answering a Query", part: 2, type: "lesson" },
    { id: "lesson5", title: "5. Point Update", part: 2, type: "lesson" },
    { id: "lesson5b", title: "6. Array Representation", part: 2, type: "lesson" },
    { id: "lesson7", title: "7. When to Use a Seg Tree", part: 2, type: "lesson" },
    { id: "mcq2", title: "Checkpoint: Tree Structure", part: 2, type: "mcq" },
    { id: "lesson6", title: "8. Code Walkthrough", part: 3, type: "lesson" },
    { id: "challenge1", title: "9. Code: Sum Tree", part: 3, type: "challenge" },
    { id: "challenge2", title: "10. Code: Min Tree", part: 3, type: "challenge" },
    { id: "challenge3", title: "11. Code: Max Tree", part: 3, type: "challenge" },
    { id: "challenge4", title: "12. Code: Escape Route", part: 3, type: "challenge" },
    { id: "badge", title: "13. Completion Certificate", part: 3, type: "badge" },
    { id: "challenge5", title: "14. Queue Anomalies", part: 4, type: "challenge", premium: true },
    { id: "challenge6", title: "15. Queue Anomalies: Reconstruction", part: 4, type: "challenge", premium: true },
    { id: "challenge7", title: "16. Nested Stays", part: 4, type: "challenge", premium: true },
    { id: "challenge8", title: "17. Partial Overlaps", part: 4, type: "challenge", premium: true },
    { id: "challenge9", title: "18. Energy Grid Polarities", part: 4, type: "challenge", premium: true },
  ],
  allLessonIds: [
    "lesson1", "lesson2", "mcq1",
    "lesson3", "lesson4", "lesson5", "lesson5b", "lesson7", "mcq2",
    "lesson6", "challenge1", "challenge2", "challenge3", "challenge4",
    "badge",
  ],
  challenges: ST_CHALLENGES,
};
