"use client";

import { useState } from "react";
import { useMatchStore, type SolutionExplanation } from "@/stores/matchStore";
import styles from "./SolutionExplainer.module.css";

interface SolutionExplainerProps {
  questionIndex: number;
}

export default function SolutionExplainer({ questionIndex }: SolutionExplainerProps) {
  const { ws, explanations, explanationPending } = useMatchStore();
  const [visible, setVisible] = useState(false);

  const explanation = explanations[questionIndex];
  const isPending = explanationPending === questionIndex;

  const requestExplanation = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (isPending) return;

    const codeState = useMatchStore.getState().codeStates[questionIndex];

    ws.send(JSON.stringify({
      type: "request_explanation",
      questionIndex,
      code: codeState?.code || "",
    }));

    useMatchStore.getState().setExplanationPending(questionIndex);
    setVisible(true);
  };

  if (!explanation && !isPending && !visible) {
    return (
      <button className={styles.triggerBtn} onClick={requestExplanation}>
        <span>🧠</span> AI Explanation
      </button>
    );
  }

  return (
    <div className={styles.explainer}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🧠</span>
        <span className={styles.headerTitle}>AI Solution Explanation</span>
        <button className={styles.closeBtn} onClick={() => setVisible(false)}>✕</button>
      </div>

      {isPending && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Analyzing solution...</span>
        </div>
      )}

      {explanation && (
        <div className={styles.content}>
          {/* Key Insight */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>💡</span> Key Insight
            </h4>
            <p className={styles.insight}>{explanation.keyInsight}</p>
          </section>

          {/* Approach */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📋</span> Approach
            </h4>
            <p className={styles.approach}>{explanation.approach}</p>
          </section>

          {/* Complexity */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚡</span> Complexity
            </h4>
            <div className={styles.complexityGrid}>
              <div className={styles.complexityItem}>
                <span className={styles.complexityLabel}>Time</span>
                <code className={styles.complexityValue}>{explanation.timeComplexity}</code>
              </div>
              <div className={styles.complexityItem}>
                <span className={styles.complexityLabel}>Space</span>
                <code className={styles.complexityValue}>{explanation.spaceComplexity}</code>
              </div>
            </div>
          </section>

          {/* Pseudocode */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📝</span> Pseudocode
            </h4>
            <pre className={styles.pseudocode}>{explanation.pseudocode}</pre>
          </section>

          {/* Common Pitfalls */}
          {explanation.commonPitfalls && explanation.commonPitfalls.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>⚠️</span> Common Pitfalls
              </h4>
              <ul className={styles.pitfallList}>
                {explanation.commonPitfalls.map((p, i) => (
                  <li key={i} className={styles.pitfall}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Code Feedback */}
          {explanation.codeFeedback && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>💬</span> Your Code Feedback
              </h4>
              <p className={styles.feedback}>{explanation.codeFeedback}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
