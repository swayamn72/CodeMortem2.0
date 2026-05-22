"use client";

import { useState } from "react";
import { useMatchStore } from "@/stores/matchStore";
import styles from "./HintPanel.module.css";

const HINT_LABELS = [
  { level: 1, name: "Nudge", icon: "💡", desc: "Which direction to think", cost: 50 },
  { level: 2, name: "Technique", icon: "🔧", desc: "The algorithm/approach to use", cost: 100 },
  { level: 3, name: "Skeleton", icon: "📝", desc: "Pseudocode outline", cost: 150 },
];

interface HintPanelProps {
  questionIndex: number;
  isSolo: boolean;
}

export default function HintPanel({ questionIndex, isSolo }: HintPanelProps) {
  const { ws, hints, hintsPending } = useMatchStore();
  const [expanded, setExpanded] = useState(false);
  const [confirmLevel, setConfirmLevel] = useState<number | null>(null);

  const questionHints = hints[questionIndex] || [];
  const currentLevel = questionHints.length; // 0, 1, 2, or 3
  const nextLevel = currentLevel + 1;

  const requestHint = (level: number) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (hintsPending) return;

    const codeState = useMatchStore.getState().codeStates[questionIndex];

    ws.send(JSON.stringify({
      type: "request_hint",
      questionIndex,
      hintLevel: level,
      code: codeState?.code || "",
    }));

    useMatchStore.getState().setHintsPending(true);
    setConfirmLevel(null);
  };

  return (
    <div className={styles.hintPanel}>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleBtn} ${expanded ? styles.toggleBtnActive : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.toggleIcon}>💡</span>
        <span>AI Hints</span>
        {currentLevel > 0 && (
          <span className={styles.hintBadge}>{currentLevel}/3</span>
        )}
        <span className={styles.chevron}>{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className={styles.hintBody}>
          {/* Hint Level Indicators */}
          <div className={styles.levelIndicators}>
            {HINT_LABELS.map((h) => (
              <div
                key={h.level}
                className={`${styles.levelDot} ${h.level <= currentLevel ? styles.levelDotFilled : ""}`}
                title={`Level ${h.level}: ${h.name}`}
              />
            ))}
          </div>

          {/* Received Hints */}
          {questionHints.map((hint, idx) => {
            const label = HINT_LABELS[idx];
            return (
              <div key={idx} className={styles.hintCard}>
                <div className={styles.hintCardHeader}>
                  <span className={styles.hintIcon}>{label?.icon}</span>
                  <span className={styles.hintLabel}>
                    Level {idx + 1}: {label?.name}
                  </span>
                </div>
                <div className={styles.hintText}>{hint}</div>
              </div>
            );
          })}

          {/* Loading State */}
          {hintsPending && (
            <div className={styles.hintLoading}>
              <div className={styles.loadingDots}>
                <span /><span /><span />
              </div>
              <span>Generating hint...</span>
            </div>
          )}

          {/* Request Next Hint */}
          {currentLevel < 3 && !hintsPending && (
            <div className={styles.requestSection}>
              {confirmLevel === nextLevel ? (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmText}>
                    {isSolo ? (
                      <>Get a <strong>{HINT_LABELS[nextLevel - 1]?.name}</strong> hint? (Free in solo mode)</>
                    ) : (
                      <>Get a <strong>{HINT_LABELS[nextLevel - 1]?.name}</strong> hint for <span className={styles.costHighlight}>-{HINT_LABELS[nextLevel - 1]?.cost} pts</span>?</>
                    )}
                  </p>
                  <div className={styles.confirmActions}>
                    <button
                      className={styles.confirmYes}
                      onClick={() => requestHint(nextLevel)}
                    >
                      Yes, get hint
                    </button>
                    <button
                      className={styles.confirmNo}
                      onClick={() => setConfirmLevel(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={styles.requestBtn}
                  onClick={() => setConfirmLevel(nextLevel)}
                >
                  <span>{HINT_LABELS[nextLevel - 1]?.icon}</span>
                  <span>Get {HINT_LABELS[nextLevel - 1]?.name} Hint</span>
                  {!isSolo && (
                    <span className={styles.costBadge}>-{HINT_LABELS[nextLevel - 1]?.cost} pts</span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* All hints used */}
          {currentLevel >= 3 && (
            <div className={styles.allUsed}>
              <span>✨</span> All hints used for this question
            </div>
          )}
        </div>
      )}
    </div>
  );
}
