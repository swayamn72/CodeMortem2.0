"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { MatchQuestion } from "@/stores/matchStore";
import { useAuthStore } from "@/stores/authStore";
import styles from "./ProblemPanel.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://codemortem.centralindia.cloudapp.azure.com/api/v1";

interface StatementData {
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
}

interface ProblemPanelProps {
  question: MatchQuestion | null;
}

/**
 * StatementMarkdown renders problem text with full math support.
 *
 * For CF-source problems (isCF=true) we convert backtick spans `...` → $...$
 * so remark-math picks them up as inline LaTeX. This matches the CF HTML scraper
 * which wraps math in backtick spans. For non-CF problems backticks remain as
 * literal inline code.
 */
function StatementMarkdown({
  source,
  isCF,
}: {
  source: string;
  isCF: boolean;
}) {
  const text = isCF
    ? source
        // backtick spans → inline LaTeX
        .replace(/`([^`]+)`/g, "$$$1$")
        // normalize single \n to hard break (two spaces + \n)
        .replace(/(?<!\n)\n(?!\n)/g, "  \n")
    : source;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p: ({ children, ...props }: any) => <p className={styles.statementP} {...props}>{children}</p>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function ProblemPanel({ question }: ProblemPanelProps) {
  const { tokens } = useAuthStore();
  const [stmtData, setStmtData] = useState<StatementData | null>(null);
  const [stmtLoading, setStmtLoading] = useState(false);
  const [stmtError, setStmtError] = useState("");

  const q = question?.question;
  const needsLazyLoad = q?.source === "codeforces" && !q.statement && q.cfContestId && q.cfIndex;
  const isCF = q?.source === "codeforces";

  const loadStatement = useCallback(async () => {
    if (!q || !tokens?.accessToken) return;
    setStmtLoading(true);
    setStmtError("");
    try {
      const res = await fetch(
        `${API_URL}/cf/statement/${q.cfContestId}/${q.cfIndex}`,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setStmtData(data);
    } catch {
      setStmtError("Could not load statement — view on Codeforces instead.");
    } finally {
      setStmtLoading(false);
    }
  }, [q, tokens]);

  // Auto-load when a CF problem is selected
  useEffect(() => {
    if (needsLazyLoad && !stmtData) {
      loadStatement();
    }
    // Reset when problem changes
    return () => {
      setStmtData(null);
      setStmtError("");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.questionIndex]);

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

  // Merge: prefer lazy-loaded over pre-loaded (pre-loaded may be empty for CF problems)
  const statement     = stmtData?.statement    || q?.statement    || "";
  const inputFormat   = stmtData?.inputFormat  || q?.inputFormat  || "";
  const outputFormat  = stmtData?.outputFormat || q?.outputFormat || "";
  const constraints   = stmtData?.constraints  || q?.constraints  || "";
  const examples      = stmtData?.examples     || q?.examples     || [];

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.qNumber}>Q{question.questionIndex}</span>
          <h2 className={styles.title}>{q?.title}</h2>
        </div>
        <div className={styles.meta}>
          {q?.cfRating && (
            <span className={styles.badge} style={{ color: "#2196f3", borderColor: "#2196f340", background: "#2196f315" }}>
              CF {q.cfRating}
            </span>
          )}
          <span className={styles.points}>+{question.pointsValue} pts</span>
          {question.solvedBy && (
            <span className={`verdict ${question.solvedBy === "you" ? "verdict-ac" : "verdict-wa"}`}>
              {question.solvedBy === "you" ? "✓ Solved" : "✗ Taken"}
            </span>
          )}
        </div>
        {q?.cfUrl && (
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <a href={q.cfUrl} target="_blank" rel="noopener noreferrer" className={styles.cfLink}>
              ↗ View on Codeforces
            </a>
            {stmtError && (
              <button
                onClick={loadStatement}
                style={{ fontSize: 12, color: "var(--cm-cyan)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Retry load
              </button>
            )}
          </div>
        )}
      </div>

      {/* Statement body */}
      <div className={styles.content}>
        {stmtLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "3rem 0", color: "var(--text-muted)" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid rgba(0,240,255,0.15)",
              borderTopColor: "var(--cm-cyan)",
              animation: "spin 0.8s linear infinite",
            }} />
            <span style={{ fontSize: 14 }}>Loading problem statement…</span>
          </div>
        ) : stmtError ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ marginBottom: "1rem" }}>⚠️ {stmtError}</p>
            {q?.cfUrl && (
              <a href={q.cfUrl} target="_blank" rel="noopener noreferrer" className={styles.cfLink}>
                Open on Codeforces →
              </a>
            )}
          </div>
        ) : (
          <>
            {statement && (
              <section className={styles.section}>
                <h3>Problem Statement</h3>
                <div className={styles.statement}>
                  <StatementMarkdown source={statement} isCF={!!isCF} />
                </div>
              </section>
            )}
            {inputFormat && (
              <section className={styles.section}>
                <h3>Input Format</h3>
                <div className={styles.statement}>
                  <StatementMarkdown source={inputFormat} isCF={!!isCF} />
                </div>
              </section>
            )}
            {outputFormat && (
              <section className={styles.section}>
                <h3>Output Format</h3>
                <div className={styles.statement}>
                  <StatementMarkdown source={outputFormat} isCF={!!isCF} />
                </div>
              </section>
            )}
            {constraints && (
              <section className={styles.section}>
                <h3>Constraints</h3>
                <div className={styles.statement}>
                  <StatementMarkdown source={constraints} isCF={!!isCF} />
                </div>
              </section>
            )}
            {examples && examples.length > 0 && (
              <section className={styles.section}>
                <h3>Examples</h3>
                {examples.map((ex, i) => (
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
            {q?.tags && q.tags.length > 0 && (
              <section className={styles.section}>
                <h3>Tags</h3>
                <div className={styles.tags}>
                  {q.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
