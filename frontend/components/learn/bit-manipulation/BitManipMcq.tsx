"use client";

import { useState } from "react";
import type { MCQQuestion } from "./types";

interface BitManipMcqProps {
  questions: MCQQuestion[];
  nextLabel: string;
  onNext: () => void;
}

export default function BitManipMcq({ questions, nextLabel, onNext }: BitManipMcqProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const allCorrect = questions.every(q => answers[q.id] === q.answer && checked[q.id]);

  function select(qId: number, optIdx: number) {
    if (checked[qId]) return;
    setAnswers(a => ({ ...a, [qId]: optIdx }));
  }
  function check(qId: number) {
    if (answers[qId] === undefined) return;
    setChecked(c => ({ ...c, [qId]: true }));
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.4rem", color: "var(--cm-cyan)", marginBottom: "0.5rem" }}>
          ⚡ MCQ Checkpoint ({questions.length} questions)
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Answer all questions to proceed. You can re-read the lessons and try again — or just continue when ready.
        </p>
      </div>

      {questions.map(q => {
        const selected = answers[q.id];
        const isChecked = checked[q.id];
        const isCorrect = selected === q.answer;

        return (
          <div key={q.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
            <p style={{ fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
              Q{q.id}: {q.question}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {q.options.map((opt, oIdx) => {
                let bg = "rgba(255,255,255,0.03)";
                let border = "1px solid rgba(255,255,255,0.1)";
                let color = "var(--text-secondary)";
                if (selected === oIdx) { bg = "rgba(0,240,255,0.1)"; border = "1px solid rgba(0,240,255,0.4)"; color = "var(--cm-cyan)"; }
                if (isChecked && oIdx === q.answer) { bg = "rgba(0,255,136,0.1)"; border = "1px solid var(--cm-green)"; color = "var(--cm-green)"; }
                if (isChecked && selected === oIdx && oIdx !== q.answer) { bg = "rgba(255,69,0,0.1)"; border = "1px solid var(--cm-red)"; color = "var(--cm-red)"; }

                return (
                  <button key={oIdx} onClick={() => select(q.id, oIdx)} disabled={isChecked}
                    style={{ textAlign: "left", padding: "10px 14px", borderRadius: 8, cursor: isChecked ? "default" : "pointer", background: bg, border, color, fontSize: 14, fontWeight: selected === oIdx ? 600 : 400, transition: "all 0.15s" }}>
                    <span style={{ marginRight: 8, opacity: 0.6 }}>{String.fromCharCode(65 + oIdx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== undefined && !isChecked && (
              <button className="btn btn-accent btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => check(q.id)}>
                Check Answer
              </button>
            )}

            {isChecked && (
              <div style={{ marginTop: "0.75rem", padding: "10px 14px", borderRadius: 8, background: isCorrect ? "rgba(0,255,136,0.08)" : "rgba(255,69,0,0.08)", border: `1px solid ${isCorrect ? "var(--cm-green)" : "var(--cm-red)"}`, fontSize: 13, color: isCorrect ? "var(--cm-green)" : "var(--cm-red)", lineHeight: 1.6 }}>
                <strong>{isCorrect ? "Correct! " : "Incorrect. "}</strong>
                <span style={{ color: "var(--text-secondary)" }}>{q.explanation}</span>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${allCorrect ? "var(--cm-green)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "2rem", textAlign: "center", marginTop: "1rem" }}>
        <h3 style={{ color: allCorrect ? "var(--cm-green)" : "var(--cm-cyan)", marginBottom: "0.5rem" }}>
          {allCorrect ? "🎯 All correct!" : "💡 Keep going!"}
        </h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: 14 }}>
          {allCorrect ? "Excellent work. Move on to the next section." : "Answer and check all questions to unlock the button below, or skip ahead whenever ready."}
        </p>
        <button className="btn btn-primary" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
