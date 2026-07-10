"use client";

import type { ConceptualContent } from "../registry/types";
import {
  ModuleHeading,
  NarrationStep,
  RenderBlock,
  TakeawayCard,
  ContinueButton,
} from "@/components/learn/shared/RichLessonPrimitives";

// ── Module-level accent config ────────────────────────────────────────────────
// To adapt this renderer for a different module, change these two constants and
// the moduleLabel string. Everything else is handled by the shared primitives.
const ACCENT = "var(--cm-cyan)";
const ACCENT_RGB = "0,240,255";
const MODULE_LABEL = "🌳 Segment Trees · Intermediate";

interface LessonRendererProps {
  lessonId: string;
  title: string;
  content: ConceptualContent;
  onComplete: () => void;
  nextLabel?: string;
}

export default function LessonRenderer({
  lessonId,
  title,
  content,
  onComplete,
  nextLabel = "Continue →",
}: LessonRendererProps) {
  const hasBlocks = content.blocks && content.blocks.length > 0;

  // Sequential index only for text blocks (so step numbers skip non-text blocks)
  let textCounter = 0;
  const blockIndices = (content.blocks ?? []).map((b) =>
    b.kind === "text" ? textCounter++ : -1
  );

  return (
    <div>
      <ModuleHeading
        title={title}
        moduleLabel={MODULE_LABEL}
        accentColor={ACCENT}
        accentRGB={ACCENT_RGB}
      />

      {/* Content blocks */}
      <div style={{ marginBottom: "1.75rem", display: "flex", flexDirection: "column", gap: "12px" }}>
        {hasBlocks
          ? content.blocks!.map((block, idx) => (
              <RenderBlock
                key={idx}
                block={block}
                textIdx={blockIndices[idx]}
                accentColor={ACCENT}
                accentRGB={ACCENT_RGB}
              />
            ))
          : content.narrations.map((narration, idx) => (
              <NarrationStep
                key={idx}
                idx={idx}
                accentColor={ACCENT}
                accentRGB={ACCENT_RGB}
              >
                {narration}
              </NarrationStep>
            ))}
      </div>

      <TakeawayCard
        takeaway={content.takeaway}
        accentColor={ACCENT}
        accentRGB={ACCENT_RGB}
      />

      <ContinueButton label={nextLabel} onClick={onComplete} />
    </div>
  );
}
