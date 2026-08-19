# CodeMortem2.0 Course & Lesson Generation Rules

When creating or adding new courses, modules, or lessons for CodeMortem2.0, you **MUST** use the "Rich Lesson Primitives" styling system instead of flat arrays of strings or basic layouts. This ensures a consistent, high-fidelity UI across all learning modules (inspired by the HLD and Segment Tree modules).

## 1. Use the Shared Primitives
All lesson rendering must use the shared primitives located at:
- `@/components/learn/shared/RichLessonPrimitives`
- `@/components/learn/shared/RichLessonTypes`

**Never write custom rendering logic** for new lessons. Instead, create a thin wrapper component that passes your module's specific `ACCENT_COLOR`, `ACCENT_RGB`, and `MODULE_LABEL` to these shared primitives.

## 2. Content Authoring (The Registry)
When authoring lesson content in registry files (e.g., `registry/my-new-topic.ts`), you must adhere to the `ConceptualContent` and `ContentBlock` types:
- **Use `blocks` instead of `narrations`**: You should provide an array of rich content blocks rather than just flat text.
- **Rich Formatting (`fmt`)**: Text blocks support markdown-like syntax:
  - `**bold**` (bolded text)
  - `` `code` `` (inline code styled with the module accent)
  - `_italic_` (dimmed italic text)
  - `base^exp` (renders as superscripts, e.g., `10^5` for 10⁵) -> **ALWAYS USE THIS INSTEAD OF UNICODE SUPERSCRIPTS IN CALLOUTS OR TEXT BLOCKS**.

## 3. Visual Variety
Avoid "dull" text walls. A good lesson should have:
- **Diagrams**: Use `kind: "diagram"` for visualising arrays, trees, algorithms.
- **Code Snippets**: Use `kind: "code"` for showing implementation details.
- **Callouts**: Use `kind: "callout"` with variants like `insight`, `gotcha`, `rule`, `warning` to emphasize points.

## 4. Checkpoint (MCQ)
For multiple-choice questions or checkpoints, use the `MCQCheckpoint` component (`@/components/learn/shared/MCQCheckpoint`). It automatically supports the `fmt()` parser for questions, options, and explanations.

## 5. Superscripts

When writing text in plain React UI components (like `page.tsx`, `PrerequisitesScreen.tsx`) where the `RichLessonPrimitives` `fmt` parser is NOT used, **NEVER** use literal strings like `2^N` or `O(N 2^N)`. Always use HTML/React superscript tags (e.g. `2<sup>N</sup>`) to ensure superscripts are rendered correctly and maintain a polished UI.

When authoring lesson content via `RichLessonPrimitives` `fmt`, you can use the syntax `base^exp` (e.g., `3^N`). The `fmt` parser will automatically replace the `^` character and wrap the exponent in an HTML `<sup>` tag. We have made `fmt` recursive, so this works perfectly even inside bold text (e.g., `**O(3^N)**` correctly parses as bold with an HTML `<sup>` exponent).

By following these rules, all future courses will automatically look premium without needing to be redesigned.
