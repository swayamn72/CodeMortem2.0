/**
 * Shared ContentBlock types used by any module that renders rich lesson content.
 * Import from here rather than duplicating these types per module.
 *
 * Usage:
 *   import type { ContentBlock } from "@/components/learn/shared/RichLessonTypes";
 */

export type ContentBlock =
  | {
      kind: "text";
      /**
       * Supports inline formatting:
       *   **bold**   → <strong>
       *   `code`     → <code> styled with module accent colour
       *   _italic_   → <em>
       *   base^exp   → base<sup>exp</sup>  (e.g. "10^5" → 10⁵)
       */
      text: string;
    }
  | {
      kind: "code";
      /** Language label shown in the header bar (e.g. "C++", "Python", "Pseudocode") */
      language: string;
      code: string;
    }
  | {
      kind: "diagram";
      /**
       * Pre-formatted ASCII / Unicode art.
       * Rendered inside a monospace box in the module accent colour.
       */
      diagram: string;
      /** Optional italic caption shown below the box */
      caption?: string;
    }
  | {
      kind: "callout";
      /**
       * Visual variant — controls the icon and colour:
       *   insight → 💡 cyan/accent
       *   warning → ⚠️ yellow
       *   rule    → ✅ green
       *   gotcha  → 🚨 red
       */
      variant: "insight" | "warning" | "rule" | "gotcha";
      title: string;
      body: string;
    };

export type SharedMCQQuestion = {
  id: string | number;
  question: string;
  options: string[] | { text: string }[];
  answerIndex: number;
  explanation: string;
};

export type SharedMCQData = {
  title?: string;
  questions: SharedMCQQuestion[];
};
