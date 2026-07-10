"use client";

import { useRef, useEffect } from "react";
import type { ContentBlock } from "./RichLessonTypes";

// ── Config passed by each module ──────────────────────────────────────────────
export interface ModuleConfig {
  /** Short label shown above the title, e.g. "🌳 Segment Trees · Intermediate" */
  moduleLabel: string;
  /** CSS colour string for the accent, e.g. "var(--cm-cyan)" */
  accentColor: string;
  /** Numeric RGB triple for rgba(), e.g. "0,240,255" */
  accentRGB: string;
}

// ── Inline text formatter ─────────────────────────────────────────────────────
// Handles: **bold**, `code`, _italic_, base^exp (superscript)
export function fmt(text: string, accentColor: string, accentRGB: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|[A-Za-z0-9]+\^-?[0-9]+)/g);
  return parts.map((chunk, i) => {
    if (chunk.startsWith("**") && chunk.endsWith("**"))
      return (
        <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
          {chunk.slice(2, -2)}
        </strong>
      );
    if (chunk.startsWith("`") && chunk.endsWith("`"))
      return (
        <code
          key={i}
          style={{
            fontFamily: "var(--font-mono, 'Fira Code', monospace)",
            background: `rgba(${accentRGB},0.12)`,
            color: accentColor,
            borderRadius: "4px",
            padding: "1px 6px",
            fontSize: "0.87em",
            border: `1px solid rgba(${accentRGB},0.18)`,
          }}
        >
          {chunk.slice(1, -1)}
        </code>
      );
    if (chunk.startsWith("_") && chunk.endsWith("_"))
      return (
        <em key={i} style={{ color: "var(--text-secondary)", opacity: 0.85 }}>
          {chunk.slice(1, -1)}
        </em>
      );
    // base^exp → <sup>
    const caretIdx = chunk.indexOf("^");
    if (caretIdx > 0 && caretIdx < chunk.length - 1) {
      const base = chunk.slice(0, caretIdx);
      const exp = chunk.slice(caretIdx + 1);
      return (
        <span key={i}>
          {base}
          <sup style={{ fontSize: "0.72em", verticalAlign: "super", lineHeight: 0 }}>{exp}</sup>
        </span>
      );
    }
    return <span key={i}>{chunk}</span>;
  });
}

// ── Scroll-to-top hook: call with the lessonId that just changed ──────────────
export function useScrollToTop(lessonId: string) {
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [lessonId]);
  return contentRef;
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function ModuleHeading({
  title,
  moduleLabel,
  accentColor,
  accentRGB,
}: {
  title: string;
  moduleLabel: string;
  accentColor: string;
  accentRGB: string;
}) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: accentColor,
          marginBottom: "0.4rem",
          opacity: 0.75,
        }}
      >
        {moduleLabel}
      </div>
      <h1
        style={{
          fontSize: "1.85rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "-0.5px",
          lineHeight: 1.2,
          marginBottom: "0.6rem",
        }}
      >
        {title}
      </h1>
      <div
        style={{
          height: 3,
          width: 52,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          borderRadius: 4,
        }}
      />
    </div>
  );
}

export function NarrationStep({
  children,
  idx,
  accentColor,
  accentRGB,
}: {
  children: string;
  idx: number;
  accentColor: string;
  accentRGB: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem 1.25rem",
        background: idx % 2 === 0 ? `rgba(${accentRGB},0.03)` : "transparent",
        borderRadius: 8,
        borderLeft: `3px solid rgba(${accentRGB},0.28)`,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: `rgba(${accentRGB},0.12)`,
          border: `1px solid rgba(${accentRGB},0.35)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: accentColor,
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
        {fmt(children, accentColor, accentRGB)}
      </p>
    </div>
  );
}

export function RichTextBlock({
  text,
  idx,
  accentColor,
  accentRGB,
}: {
  text: string;
  idx: number;
  accentColor: string;
  accentRGB: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem 1.25rem",
        background: idx % 2 === 0 ? `rgba(${accentRGB},0.03)` : "transparent",
        borderRadius: 8,
        borderLeft: `3px solid rgba(${accentRGB},0.28)`,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: `rgba(${accentRGB},0.12)`,
          border: `1px solid rgba(${accentRGB},0.35)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: accentColor,
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
        {fmt(text, accentColor, accentRGB)}
      </p>
    </div>
  );
}

function highlight(code: string) {
  if (!code) return null;
  const parts = code.split(/(\bstruct\b|\bint\b|\bvoid\b|\blong\b|\bconst\b|\bvector\b|\bif\b|\belse\b|\breturn\b|\bclass\b|\bdef\b|\bself\b|\bimport\b|\bprint\b|\bfor\b|\bin\b|\bwhile\b|\btrue\b|\bfalse\b|\busing\b|\bnamespace\b|\bstd\b|\bauto\b|#.*|\/\/.*|".*?"|'.*?')/);
  return parts.map((part, i) => {
    if (part.startsWith("//") || part.startsWith("#")) {
      return <span key={i} style={{ color: "#546e7a", fontStyle: "italic" }}>{part}</span>;
    }
    if (part.startsWith('"') || part.startsWith("'")) {
      return <span key={i} style={{ color: "#c3e88d" }}>{part}</span>;
    }
    switch (part) {
      case "struct": case "class": case "def": case "if": case "else":
      case "return": case "for": case "in": case "while": case "import":
      case "using": case "namespace": case "true": case "false":
        return <span key={i} style={{ color: "#c792ea", fontWeight: 500 }}>{part}</span>;
      case "int": case "void": case "long": case "vector": case "self": case "const": case "auto":
        return <span key={i} style={{ color: "#82aaff", fontWeight: 500 }}>{part}</span>;
      case "std": case "print":
        return <span key={i} style={{ color: "#ffcb6b" }}>{part}</span>;
      default:
        return <span key={i} style={{ color: "#cdd3de" }}>{part}</span>;
    }
  });
}

export function RichCodeBlock({
  language,
  code,
  accentColor,
  accentRGB,
}: {
  language: string;
  code: string;
  accentColor: string;
  accentRGB: string;
}) {
  return (
    <div
      style={{
        borderRadius: "10px",
        overflow: "hidden",
        border: `1px solid rgba(${accentRGB},0.14)`,
        background: "rgba(0,0,0,0.38)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          background: `rgba(${accentRGB},0.05)`,
          borderBottom: `1px solid rgba(${accentRGB},0.10)`,
        }}
      >
        {["#FF5F56", "#FFBD2E", "#27C93F"].map((c) => (
          <span
            key={c}
            style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }}
          />
        ))}
        <span
          style={{
            marginLeft: "10px",
            fontSize: "11px",
            color: accentColor,
            fontFamily: "var(--font-mono, monospace)",
            opacity: 0.65,
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          {language}
        </span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "16px 18px",
          fontFamily: "var(--font-mono, 'Fira Code', monospace)",
          fontSize: "13px",
          lineHeight: 1.65,
          color: "var(--text-primary)",
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        {highlight(code)}
      </pre>
    </div>
  );
}

export function RichDiagramBlock({
  diagram,
  caption,
  accentColor,
  accentRGB,
}: {
  diagram: string;
  caption?: string;
  accentColor: string;
  accentRGB: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          background: "rgba(0,0,0,0.42)",
          border: `1px solid rgba(${accentRGB},0.18)`,
          borderRadius: "10px",
          padding: "18px 22px",
          overflowX: "auto",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: "var(--font-mono, 'Fira Code', monospace)",
            fontSize: "12.5px",
            lineHeight: 1.72,
            color: accentColor,
            whiteSpace: "pre",
          }}
        >
          {diagram}
        </pre>
      </div>
      {caption && (
        <p
          style={{
            margin: 0,
            fontSize: "11.5px",
            color: "var(--text-muted)",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

const CALLOUT_CFG = {
  insight: {
    icon: "💡",
    getStyle: (rgb: string) => ({
      bg: `rgba(${rgb},0.07)`,
      border: `rgba(${rgb},0.28)`,
      labelColor: `rgba(${rgb},1)`,
    }),
    label: "Insight",
  },
  warning: {
    icon: "⚠️",
    getStyle: () => ({
      bg: "rgba(255,204,0,0.07)",
      border: "rgba(255,204,0,0.28)",
      labelColor: "#FFCC00",
    }),
    label: "Watch Out",
  },
  rule: {
    icon: "✅",
    getStyle: () => ({
      bg: "rgba(0,255,136,0.06)",
      border: "rgba(0,255,136,0.25)",
      labelColor: "var(--cm-green)",
    }),
    label: "Rule",
  },
  gotcha: {
    icon: "🔥",
    getStyle: () => ({
      bg: "rgba(255,80,80,0.07)",
      border: "rgba(255,80,80,0.25)",
      labelColor: "rgba(255,80,80,0.9)",
    }),
    label: "Gotcha",
  },
} as const;

export function RichCalloutBlock({
  variant,
  title,
  body,
  accentColor,
  accentRGB,
}: {
  variant: "insight" | "warning" | "rule" | "gotcha";
  title: string;
  body: string;
  accentColor: string;
  accentRGB: string;
}) {
  const cfg = CALLOUT_CFG[variant];
  const { bg, border, labelColor } = cfg.getStyle(accentRGB);
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "10px",
        padding: "14px 18px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1.4 }}>{cfg.icon}</span>
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: labelColor,
            marginBottom: "5px",
          }}
        >
          {cfg.label} — {title}
        </div>
        <div
          style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.75 }}
        >
          {fmt(body, accentColor, accentRGB)}
        </div>
      </div>
    </div>
  );
}

// ── Generic block renderer (call this from module-specific LessonRenderers) ───
export function RenderBlock({
  block,
  textIdx,
  accentColor,
  accentRGB,
}: {
  block: ContentBlock;
  textIdx: number;
  accentColor: string;
  accentRGB: string;
}) {
  switch (block.kind) {
    case "text":
      return (
        <RichTextBlock
          text={block.text}
          idx={textIdx}
          accentColor={accentColor}
          accentRGB={accentRGB}
        />
      );
    case "code":
      return (
        <RichCodeBlock
          language={block.language}
          code={block.code}
          accentColor={accentColor}
          accentRGB={accentRGB}
        />
      );
    case "diagram":
      return (
        <RichDiagramBlock
          diagram={block.diagram}
          caption={block.caption}
          accentColor={accentColor}
          accentRGB={accentRGB}
        />
      );
    case "callout":
      return (
        <RichCalloutBlock
          variant={block.variant}
          title={block.title}
          body={block.body}
          accentColor={accentColor}
          accentRGB={accentRGB}
        />
      );
  }
}

// ── Key Takeaway card ─────────────────────────────────────────────────────────
export function TakeawayCard({
  takeaway,
  accentColor,
  accentRGB,
}: {
  takeaway: string;
  accentColor: string;
  accentRGB: string;
}) {
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: `rgba(${accentRGB},0.05)`,
        border: `1px solid rgba(${accentRGB},0.22)`,
        borderRadius: 10,
        marginBottom: "1.5rem",
        fontSize: "0.88rem",
        color: "var(--text-secondary)",
        lineHeight: 1.7,
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
    >
      <span style={{ flexShrink: 0, fontSize: "1rem", marginTop: 1 }}>💡</span>
      <span>
        <strong
          style={{
            color: accentColor,
            display: "block",
            marginBottom: 4,
            fontSize: "0.72rem",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
          }}
        >
          Key Takeaway
        </strong>
        {fmt(takeaway, accentColor, accentRGB)}
      </span>
    </div>
  );
}

// ── Continue button row ───────────────────────────────────────────────────────
export function ContinueButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        paddingTop: "1.25rem",
        marginTop: "0.5rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <button className="btn btn-accent" onClick={onClick}>
        {label}
      </button>
    </div>
  );
}
