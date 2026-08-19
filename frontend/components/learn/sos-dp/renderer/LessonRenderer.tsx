"use client";

import React from "react";
import type { ConceptualContent } from "../registry/types";
import {
  ModuleHeading,
  RenderBlock,
  TakeawayCard,
  ContinueButton,
} from "@/components/learn/shared/RichLessonPrimitives";

interface LessonRendererProps {
  lessonId: string;
  title: string;
  content: ConceptualContent;
  onComplete: () => void;
  nextLabel?: string;
}

export default function SOSDPLessonRenderer({
  lessonId,
  title,
  content,
  onComplete,
  nextLabel = "Continue →",
}: LessonRendererProps) {
  // Theme for SOS DP: Electric Indigo
  const accentColor = "#6366f1";
  const accentRGB = "99, 102, 241";
  const moduleLabel = "Sum Over Subsets DP";

  return (
    <div>
      <ModuleHeading
        title={title}
        moduleLabel={moduleLabel}
        accentColor={accentColor}
        accentRGB={accentRGB}
      />

      <div style={{ marginBottom: "1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {content.blocks.map((block, idx) => (
          <RenderBlock
            key={idx}
            block={block}
            textIdx={idx}
            accentColor={accentColor}
            accentRGB={accentRGB}
          />
        ))}
      </div>

      <TakeawayCard
        takeaway={content.takeaway}
        accentColor={accentColor}
        accentRGB={accentRGB}
      />

      <div style={{ paddingBottom: "1.25rem" }}>
        <ContinueButton label={nextLabel} onClick={onComplete} />
      </div>
    </div>
  );
}
