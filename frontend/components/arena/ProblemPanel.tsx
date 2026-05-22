"use client";

import type { MatchQuestion } from "@/stores/matchStore";
import styles from "./ProblemPanel.module.css";

interface ProblemPanelProps {
  question: MatchQuestion | null;
}

export default function ProblemPanel({ question }: ProblemPanelProps) {
  if (!question) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📄</span>
          <p>Select a question from the sidebar</p>
        </div>
      </div>
    );
  }

  const q = question.question;

  const difficultyLabel = (diff: number) => {
    if (diff <= 1) return { text: "Warm-up", color: "#00c853" };
    if (diff <= 2) return { text: "Easy", color: "#00c853" };
    if (diff <= 3) return { text: "Easy-Med", color: "#03a89e" };
    if (diff <= 4) return { text: "Medium", color: "#2979ff" };
    if (diff <= 5) return { text: "Med-Hard", color: "#aa00e6" };
    if (diff <= 6) return { text: "Hard", color: "#ff8c00" };
    return { text: "Expert", color: "#ff1744" };
  };

  const diff = difficultyLabel(question.questionIndex);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.qNumber}>Q{question.questionIndex}</span>
          <h2 className={styles.title}>{q.title}</h2>
        </div>
        <div className={styles.meta}>
          <span className={styles.badge} style={{ color: diff.color, borderColor: `${diff.color}40`, background: `${diff.color}15` }}>
            {diff.text}
          </span>
          <span className={styles.points}>+{question.pointsValue} pts</span>
          
          {q.source === "codeforces" && q.cfRating && (
            <span className={styles.badge} style={{ color: "#2196f3", borderColor: "#2196f340", background: "#2196f315" }}>
              CF {q.cfRating}
            </span>
          )}
          
          {question.solvedBy && (
            <span className={`verdict ${question.solvedBy === "you" ? "verdict-ac" : "verdict-wa"}`}>
              {question.solvedBy === "you" ? "✓ Solved" : "✗ Taken"}
            </span>
          )}
        </div>
        {q.source === "codeforces" && q.cfUrl && (
          <div style={{ marginTop: '0.5rem' }}>
            <a href={q.cfUrl} target="_blank" rel="noopener noreferrer" className={styles.cfLink}>
              ↗ View on Codeforces
            </a>
          </div>
        )}
      </div>

      {/* Statement */}
      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Problem Statement</h3>
          <div className={styles.statement} dangerouslySetInnerHTML={{ __html: formatStatement(q.statement) }} />
        </section>

        <section className={styles.section}>
          <h3>Input Format</h3>
          <div className={styles.formatBlock}>{q.inputFormat}</div>
        </section>

        <section className={styles.section}>
          <h3>Output Format</h3>
          <div className={styles.formatBlock}>{q.outputFormat}</div>
        </section>

        <section className={styles.section}>
          <h3>Constraints</h3>
          <div className={styles.constraints} dangerouslySetInnerHTML={{ __html: formatConstraints(q.constraints) }} />
        </section>

        {/* Examples */}
        {q.examples && q.examples.length > 0 && (
          <section className={styles.section}>
            <h3>Examples</h3>
            {q.examples.map((ex, i) => (
              <div key={i} className={styles.example}>
                <div className={styles.exampleBlock}>
                  <div className={styles.exampleLabel}>Input</div>
                  <pre className={styles.examplePre}>{ex.input}</pre>
                </div>
                <div className={styles.exampleBlock}>
                  <div className={styles.exampleLabel}>Output</div>
                  <pre className={styles.examplePre}>{ex.output}</pre>
                </div>
                {ex.explanation && (
                  <div className={styles.explanation}>
                    <strong>Explanation:</strong> {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Tags */}
        {q.tags && q.tags.length > 0 && (
          <section className={styles.section}>
            <h3>Tags</h3>
            <div className={styles.tags}>
              {q.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function formatStatement(text: string): string {
  return text
    .replace(/\n/g, "<br/>")
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function formatConstraints(text: string): string {
  return text
    .replace(/\n/g, "<br/>")
    .replace(/(\d+)\s*≤\s*(\w+)\s*≤\s*(\d+)/g, '<span style="font-family: var(--font-mono)">$1 ≤ $2 ≤ $3</span>')
    .replace(/(\d+)\s*<=\s*(\w+)\s*<=\s*(\d+)/g, '<span style="font-family: var(--font-mono)">$1 ≤ $2 ≤ $3</span>');
}
