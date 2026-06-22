"use client";

import { useState } from "react";
import type { HintItem } from "../registry/types";

interface HintPanelProps {
  hints: HintItem[];
}

export default function HintPanel({ hints }: HintPanelProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "var(--text-muted)",
          marginBottom: "4px",
        }}
      >
        Hints — reveal one at a time
      </div>

      {hints.map((hint, idx) => {
        const isOpen = openIdx === idx;
        const isPast = openIdx !== null && idx < openIdx;
        return (
          <div
            key={idx}
            style={{
              background: isOpen
                ? "rgba(0,240,255,0.04)"
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                isOpen
                  ? "rgba(0,240,255,0.2)"
                  : isPast
                  ? "rgba(0,255,136,0.15)"
                  : "rgba(255,255,255,0.07)"
              }`,
              borderRadius: "8px",
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: isOpen
                  ? "var(--text-primary)"
                  : isPast
                  ? "var(--cm-green)"
                  : "var(--text-secondary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                userSelect: "none",
                textAlign: "left",
              }}
            >
              <span>
                {isPast && !isOpen ? "✓ " : ""}
                {hint.title}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  transform: isOpen ? "rotate(90deg)" : "none",
                  transition: "transform 0.2s",
                  flexShrink: 0,
                  marginLeft: "8px",
                }}
              >
                ▶
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "12px 14px 14px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {hint.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
