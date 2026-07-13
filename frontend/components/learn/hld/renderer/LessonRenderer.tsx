"use client";

import type { ConceptualContent } from "../registry/types";
import { useProgressStore } from "@/stores/progressStore";
import { Zap } from "lucide-react";
import { getHLDVisual } from "../HLDInteractiveTools";
import styles from "@/app/learn/segment-tree/page.module.css";

interface LessonRendererProps {
  lessonId: string;
  title: string;
  content: ConceptualContent;
  onComplete: () => void;
  nextLabel?: string;
}

// ── Design primitives matching CombinatoricsPath style ──────────────────────

function formatText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\b[A-Za-z0-9]+\^[0-9]+)/g);
  return parts.map((p, j) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={j} style={{ color: "var(--text-primary)" }}>{p.slice(2, -2)}</strong>;
    }
    const caretIdx = p.indexOf("^");
    if (caretIdx > 0 && caretIdx < p.length - 1) {
      const base = p.slice(0, caretIdx);
      const exp = p.slice(caretIdx + 1);
      return <span key={j}>{base}<sup>{exp}</sup></span>;
    }
    return p;
  });
}

function LessonHeading({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--cm-red)",
          marginBottom: "0.4rem",
          opacity: 0.85,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", marginRight: "6px" }}><Zap size={16} /></span>Heavy-Light Decomposition
      </div>
      <h1
        style={{
          fontSize: "1.85rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "-0.5px",
          lineHeight: 1.2,
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h1>
      <div
        style={{
          height: 3,
          width: 48,
          background: "linear-gradient(90deg, var(--cm-red), transparent)",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

function NarrationParagraph({ children, idx }: { children: string; idx: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem 1.25rem",
        background:
          idx % 2 === 0
            ? "rgba(255,255,255,0.02)"
            : "transparent",
        borderRadius: 8,
        borderLeft: "3px solid rgba(255,45,85,0.3)",
        marginBottom: "0.75rem",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "rgba(255,45,85,0.15)",
          border: "1px solid rgba(255,45,85,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--cm-red)",
          marginTop: 2,
        }}
      >
        {idx + 1}
      </span>
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          lineHeight: 1.8,
          fontSize: "0.95rem",
        }}
      >
        {formatText(children)}
      </p>
    </div>
  );
}

export default function HLDLessonRenderer({
  lessonId,
  title,
  content,
  onComplete,
  nextLabel = "Continue →",
}: LessonRendererProps) {
  const visual = getHLDVisual(lessonId);

  return (
    <div>
      <LessonHeading title={title} />

      {/* Narrations */}
      <div style={{ marginBottom: "1.75rem" }}>
        {content.narrations.map((narration, idx) => (
          <NarrationParagraph key={idx} idx={idx}>
            {narration}
          </NarrationParagraph>
        ))}
      </div>

      {/* Interactive Visual (if any) */}
      {visual && (
        <div style={{ marginBottom: "1.75rem" }}>
          {visual}
        </div>
      )}

      {/* Takeaway */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "rgba(255,45,85,0.06)",
          border: "1px solid rgba(255,45,85,0.25)",
          borderRadius: 10,
          marginBottom: "1.5rem",
          fontSize: "0.88rem",
          color: "var(--text-secondary)",
          lineHeight: 1.65,
          display: "flex",
          gap: "0.75rem",
        }}
      >
        <span style={{ flexShrink: 0, fontSize: "1rem" }}>💡</span>
        <span>
          <strong style={{ color: "var(--cm-red)", display: "block", marginBottom: 4, fontSize: "0.75rem", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Key Takeaway
          </strong>
          {formatText(content.takeaway)}
        </span>
      </div>

      {/* Next button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          paddingTop: "1.25rem",
          marginTop: "0.5rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button className="btn btn-primary" onClick={onComplete}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
