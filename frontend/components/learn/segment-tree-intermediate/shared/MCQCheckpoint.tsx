"use client";

import { useState } from "react";
import type { MCQData } from "../registry/types";
import styles from "@/app/learn/segment-tree/page.module.css";
import { fmt } from "@/components/learn/shared/RichLessonPrimitives";

const ACCENT = "var(--cm-cyan)";
const ACCENT_RGB = "0,240,255";

interface MCQCheckpointProps {
  data: MCQData;
  onComplete: () => void;
  nextLabel?: string;
}

export default function MCQCheckpoint({
  data,
  onComplete,
  nextLabel = "Continue →",
}: MCQCheckpointProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const allCorrect =
    data.questions.length > 0 &&
    data.questions.every(
      (q) =>
        submitted[q.id] && answers[q.id] === q.answerIndex
    );

  function pick(qId: string, idx: number) {
    if (submitted[qId]) return;
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  function submit(qId: string) {
    if (answers[qId] === undefined) return;
    setSubmitted((prev) => ({ ...prev, [qId]: true }));
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.titleArea}>
        <h1>
          <span style={{ marginRight: "10px" }}>🧩</span>
          {data.title}
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {data.questions.map((q, qIdx) => {
          const isSubmitted = submitted[q.id];
          const chosen = answers[q.id];
          const isCorrect = isSubmitted && chosen === q.answerIndex;
          const isWrong = isSubmitted && chosen !== q.answerIndex;

          return (
            <div
              key={q.id}
              style={{
                background: isCorrect
                  ? "rgba(0,255,136,0.05)"
                  : isWrong
                  ? "rgba(255,80,80,0.05)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  isCorrect
                    ? "rgba(0,255,136,0.30)"
                    : isWrong
                    ? "rgba(255,80,80,0.25)"
                    : "rgba(255,255,255,0.08)"
                }`,
                borderRadius: "12px",
                padding: "22px 24px",
                transition: "border-color 0.25s",
              }}
            >
              {/* Question */}
              <div
                style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                  lineHeight: 1.6,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(0,240,255,0.15)",
                    color: "var(--cm-cyan)",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "24px",
                    marginRight: "10px",
                    flexShrink: 0,
                  }}
                >
                  {qIdx + 1}
                </span>
                {q.question}
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {q.options.map((opt, idx) => {
                  const isChosen = chosen === idx;
                  const isCorrectOpt = idx === q.answerIndex;

                  let bg = "rgba(255,255,255,0.03)";
                  let border = "rgba(255,255,255,0.10)";
                  let color = "var(--text-secondary)";
                  let icon = null as React.ReactNode;

                  if (isSubmitted) {
                    if (isCorrectOpt) {
                      bg = "rgba(0,255,136,0.10)";
                      border = "rgba(0,255,136,0.40)";
                      color = "var(--cm-green)";
                      icon = <span style={{ fontSize: "14px" }}>✓</span>;
                    } else if (isChosen && !isCorrectOpt) {
                      bg = "rgba(255,80,80,0.10)";
                      border = "rgba(255,80,80,0.35)";
                      color = "rgba(255,80,80,0.9)";
                      icon = <span style={{ fontSize: "14px" }}>✗</span>;
                    }
                  } else if (isChosen) {
                    bg = "rgba(0,240,255,0.10)";
                    border = "rgba(0,240,255,0.40)";
                    color = "var(--cm-cyan)";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => pick(q.id, idx)}
                      disabled={isSubmitted}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: "8px",
                        padding: "11px 14px",
                        cursor: isSubmitted ? "default" : "pointer",
                        textAlign: "left",
                        transition: "all 0.18s",
                        color,
                        fontSize: "var(--font-size-sm)",
                        fontWeight: isChosen ? 600 : 400,
                        lineHeight: 1.5,
                      }}
                    >
                      {/* Option letter */}
                      <span
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: isChosen
                            ? "rgba(0,240,255,0.18)"
                            : "rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          flexShrink: 0,
                          color: isChosen ? "var(--cm-cyan)" : "var(--text-muted)",
                        }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span style={{ flex: 1 }}>{opt.text}</span>
                      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Submit / Explanation */}
              {!isSubmitted ? (
                <button
                  onClick={() => submit(q.id)}
                  disabled={chosen === undefined}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: "14px", opacity: chosen === undefined ? 0.5 : 1 }}
                >
                  Check Answer
                </button>
              ) : (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 16px",
                    background: isCorrect
                      ? "rgba(0,255,136,0.06)"
                      : "rgba(255,80,80,0.06)",
                    border: `1px solid ${
                      isCorrect
                        ? "rgba(0,255,136,0.25)"
                        : "rgba(255,80,80,0.20)"
                    }`,
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: isCorrect ? "var(--cm-green)" : "rgba(255,80,80,0.9)",
                      marginRight: "6px",
                    }}
                  >
                    {isCorrect ? "✓ Correct!" : "✗ Not quite."}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete button — appears when all answered correctly */}
      {allCorrect && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0,255,136,0.06)",
            border: "1px solid rgba(0,255,136,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            marginTop: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🎯</span>
            <div
              style={{
                fontWeight: 600,
                color: "var(--cm-green)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              All questions correct — checkpoint passed!
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
      )}
    </div>
  );
}
