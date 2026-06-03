"use client";

import type { MCQQuestion } from "./types";
import styles from "@/app/learn/segment-tree/page.module.css";

interface McqCheckpointProps {
  questions: MCQQuestion[];
  answers: Record<number, number>;
  checked: Record<number, boolean>;
  onSelect: (qId: number, optIdx: number) => void;
  onCheck: (qId: number) => void;
  allCorrect: boolean;
  nextLabel: string;
  onNext: () => void;
}

export default function McqCheckpoint({
  questions,
  answers,
  checked,
  onSelect,
  onCheck,
  allCorrect,
  nextLabel,
  onNext,
}: McqCheckpointProps) {
  return (
    <div className={styles.checkpointArea}>
      <h2 className={styles.checkpointTitle}>
        <span>⚡</span> MCQ Checkpoint ({questions.length} question{questions.length > 1 ? "s" : ""})
      </h2>

      {questions.map((q) => {
        const selectedOpt = answers[q.id];
        const isChecked = checked[q.id];
        const isCorrect = selectedOpt === q.answer;

        return (
          <div key={q.id} className={styles.mcqCard}>
            <div className={styles.questionText}>
              Q{q.id}: {q.question}
            </div>

            <div className={styles.optionsList}>
              {q.options.map((opt, oIdx) => {
                let optClass = styles.optionItem;
                let radioClass = styles.optionRadio;

                if (selectedOpt === oIdx) {
                  optClass += ` ${styles.optionSelected}`;
                  radioClass += ` ${styles.optionRadioSelected}`;
                }

                if (isChecked) {
                  if (oIdx === q.answer) {
                    optClass += ` ${styles.optionCorrect}`;
                    radioClass += ` ${styles.optionRadioCorrect}`;
                  } else if (selectedOpt === oIdx) {
                    optClass += ` ${styles.optionWrong}`;
                    radioClass += ` ${styles.optionRadioWrong}`;
                  }
                }

                return (
                  <button
                    key={oIdx}
                    className={optClass}
                    onClick={() => onSelect(q.id, oIdx)}
                    disabled={isChecked}
                  >
                    <div className={radioClass}>
                      {!isChecked && selectedOpt === oIdx && <div className={styles.innerDot} />}
                      {isChecked && oIdx === q.answer && (
                        <span style={{ color: "black", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                      )}
                      {isChecked && selectedOpt === oIdx && oIdx !== q.answer && (
                        <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✗</span>
                      )}
                    </div>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selectedOpt !== undefined && !isChecked && (
              <button
                className="btn btn-accent btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => onCheck(q.id)}
              >
                Check Answer
              </button>
            )}

            {isChecked && (
              <div className={`${styles.explanationBox} ${isCorrect ? styles.expCorrect : styles.expWrong}`}>
                <strong>{isCorrect ? "Correct!" : "Incorrect."}</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      <div
        className="card-glass"
        style={{
          border: "1px solid var(--cm-green)",
          background: "rgba(0, 255, 136, 0.03)",
          textAlign: "center",
          padding: "2rem",
          marginTop: "1.5rem",
        }}
      >
        <h3 style={{ color: "var(--cm-green)", marginBottom: "0.5rem" }}>
          {allCorrect ? "🎯 All correct!" : "💡 Keep it up!"}
        </h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          {allCorrect
            ? "You've nailed it. Time to move on."
            : "Feel free to review the lessons and try again, or jump ahead whenever you're ready."}
        </p>
        <button className="btn btn-primary" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
