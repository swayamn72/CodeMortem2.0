"use client";

import { useState } from "react";

export interface WalkthroughLine {
  lineNum: number;
  code: string;
  type?: "default" | "keyword" | "comment" | "highlight";
  explanation?: string;
}

interface LineExplainerProps {
  lines: WalkthroughLine[];
  language: "cpp" | "python";
}

const toolCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 14,
  padding: "1.4rem 1.6rem",
  marginTop: "1.5rem",
};

export default function LineExplainer({ lines, language }: LineExplainerProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const selected = selectedLine !== null ? lines.find(l => l.lineNum === selectedLine) : null;

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Line-by-Line Explainer — click any line</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" }}>
        <div style={{ background: "#0d0d12", borderRadius: 8, padding: "1rem", fontFamily: "monospace", fontSize: 13, overflowX: "auto" }}>
          {lines.map(line => (
            <div key={line.lineNum}
              onClick={() => setSelectedLine(selectedLine === line.lineNum ? null : line.lineNum)}
              style={{ display: "flex", gap: 12, padding: "2px 6px", borderRadius: 4, cursor: "pointer",
                background: selectedLine === line.lineNum ? "rgba(0,240,255,0.12)" : "transparent",
                borderLeft: selectedLine === line.lineNum ? "2px solid var(--cm-cyan)" : "2px solid transparent",
                transition: "all 0.12s" }}>
              <span style={{ color: "rgba(255,255,255,0.2)", minWidth: 20, textAlign: "right", userSelect: "none" }}>{line.lineNum}</span>
              <span style={{ color: line.type === "keyword" ? "#c792ea" : line.type === "comment" ? "#546e7a" : line.type === "highlight" ? "var(--cm-cyan)" : "#cdd3de", whiteSpace: "pre" }}>
                {line.code}
              </span>
            </div>
          ))}
        </div>
        <div style={{ position: "sticky", top: "1rem", background: "rgba(0,240,255,0.04)", borderRadius: 8, padding: "1rem", border: "1px solid rgba(0,240,255,0.15)", minHeight: 100, display: "flex", alignItems: selected ? "flex-start" : "center", justifyContent: "center" }}>
          {selected ? (
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cm-cyan)", letterSpacing: "0.5px", marginBottom: 8 }}>LINE {selected.lineNum}</div>
              <pre style={{ fontFamily: "monospace", fontSize: 13, color: "var(--cm-cyan)", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 6, marginBottom: 12, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{selected.code}</pre>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>{selected.explanation}</p>
            </div>
          ) : (
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>← Click a line to see its explanation</span>
          )}
        </div>
      </div>
    </div>
  );
}
