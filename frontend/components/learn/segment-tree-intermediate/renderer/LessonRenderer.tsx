"use client";

import type { ConceptualContent } from "../registry/types";
import styles from "@/app/learn/segment-tree/page.module.css";

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
  return (
    <div>
      {/* Header */}
      <div className={styles.titleArea}>
        <h1>{title}</h1>
      </div>

      {/* Static narration card */}
      <div className={styles.animationCard}>
        <div
          className={styles.narration}
          style={{ 
            whiteSpace: "pre-wrap", 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px" 
          }}
        >
          {content.narrations.map((narration, idx) => (
            <p key={idx} style={{ margin: 0, lineHeight: 1.75 }}>
              {narration}
            </p>
          ))}
        </div>
      </div>

      {/* Takeaway */}
      <div className="card-glass" style={{ marginTop: "1.5rem" }}>
        <strong>Takeaway:</strong> {content.takeaway}
      </div>

      {/* Complete button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,255,136,0.06)",
          border: "1px solid rgba(0,255,136,0.3)",
          borderRadius: "var(--radius-md)",
          padding: "16px 20px",
          marginTop: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>✓</span>
          <div
            style={{
              fontWeight: 600,
              color: "var(--cm-green)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Lesson complete
          </div>
        </div>
        <button
          className="btn btn-accent btn-sm"
          onClick={onComplete}
          style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
