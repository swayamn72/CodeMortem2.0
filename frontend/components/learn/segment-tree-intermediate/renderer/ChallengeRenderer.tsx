"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { ChallengeContent, LPTestResult } from "../registry/types";
import styles from "@/app/learn/segment-tree/page.module.css";
import CodeEditor from "@/components/editor/CodeEditor";
import HintPanel from "../shared/HintPanel";
import { getVerdictText } from "@/lib/verdicts";
import SuccessModal from "@/components/shared/SuccessModal";
import { useAuthStore } from "@/stores/authStore";
import { RichCodeBlock, fmt } from "@/components/learn/shared/RichLessonPrimitives";
import { SubmissionsTab, SubmissionCodeViewerModal } from "@/components/shared/SubmissionsTab";
import type { LPSubmission } from "@/components/course/types";

// ── useCodeRunner hook ────────────────────────────────────────────────────────
// Encapsulates all run / submit / state logic so ChallengeRenderer stays clean.

const ACCENT_COLOR = "var(--cm-cyan)";
const ACCENT_RGB = "0,240,255";

function useCodeRunner(
  content: ChallengeContent,
  language: "cpp" | "python",
  code: string,
  onAccepted: () => void
) {
  const [testResults, setTestResults] = useState<LPTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset test results when challenge or language changes
  useEffect(() => {
    const pending = content.sampleTestCases.map(
      (s, i): LPTestResult => ({
        testIndex: i,
        verdict: "pending",
        input: s.input,
        output: "",
        expected: s.expected,
        stderr: "",
        compileOutput: "",
        executionTime: "",
        memory: 0,
      })
    );
    setTestResults(pending);
    setShowSuccess(false);
  }, [content.backendChallengeId, language]);

  const run = useCallback(async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);

    const samples = content.sampleTestCases;
    const initial = samples.map(
      (s, i): LPTestResult => ({
        testIndex: i,
        verdict: "pending",
        input: s.input,
        output: "",
        expected: s.expected,
        stderr: "",
        compileOutput: "",
        executionTime: "",
        memory: 0,
      })
    );
    setTestResults([...initial]);

    const results = [...initial];
    try {
      for (let i = 0; i < samples.length; i++) {
        results[i] = { ...results[i], verdict: "running" };
        setTestResults([...results]);

        const res = await api.post("/learning-path/run", {
          code,
          language,
          input: samples[i].input,
        });

        const compileErr = res.compileOutput?.trim();
        const runtimeErr = res.stderr?.trim();
        let verdict: string;
        let actualOutput = "";

        if (compileErr) {
          verdict = "compile_error";
        } else if (runtimeErr) {
          verdict = "runtime_error";
        } else {
          actualOutput = (res.output ?? "").trim();
          verdict =
            actualOutput === samples[i].expected.trim()
              ? "accepted"
              : "wrong_answer";
        }

        results[i] = {
          testIndex: i,
          verdict,
          input: samples[i].input,
          output: actualOutput || res.output || "",
          expected: samples[i].expected,
          stderr: runtimeErr || "",
          compileOutput: compileErr || "",
          executionTime: res.executionTime || "",
          memory: res.memory || 0,
        };

        if (compileErr) {
          for (let j = i + 1; j < results.length; j++) {
            results[j] = { ...results[j], verdict: "compile_error", compileOutput: compileErr };
          }
        }
        setTestResults([...results]);
        if (compileErr) break;
      }
    } catch (_) {
      /* network error — leave results as-is */
    } finally {
      setIsRunning(false);
    }
  }, [code, language, content, isRunning, isSubmitting]);

  const submit = useCallback(async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setTestResults([]);

    try {
      const res = await api.post("/learning-path/submit", {
        code,
        language,
        challengeId: content.backendChallengeId,
      });
      const formatted: LPTestResult[] = res.results.map((r: any) => ({
        testIndex: r.testIndex,
        verdict: r.verdict,
        executionTime: r.executionTime,
        memory: r.memory,
        input: r.input,
        output: r.output,
        expected: r.expected,
        stderr: r.stderr,
        compileOutput: r.compileOutput,
      }));
      setTestResults(formatted);
      if (res.verdict === "accepted") {
        onAccepted();
        setShowSuccess(true);
      }
    } catch (_) {
      /* network error */
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, content, isRunning, isSubmitting, onAccepted]);

  return { testResults, isRunning, isSubmitting, showSuccess, setShowSuccess, run, submit };
}

// ── Verdict summary helper ────────────────────────────────────────────────────

function verdictSummary(
  results: LPTestResult[],
  isRunning: boolean,
  isSubmitting: boolean
): { text: string; color: string } {
  if (isRunning || isSubmitting || results.some((r) => r.verdict === "running")) {
    return { text: "Running…", color: "var(--cm-cyan)" };
  }
  if (results.length === 0) return { text: "Run to test your code", color: "var(--text-muted)" };
  if (results.every((r) => r.verdict === "pending"))
    return { text: "Run to test your code", color: "var(--text-muted)" };
  if (results.every((r) => r.verdict === "accepted"))
    return { text: "Accepted ✓", color: "var(--cm-green)" };
  const failed = results.find(
    (r) => !["pending", "running", "accepted"].includes(r.verdict)
  );
  if (failed) {
    return { text: getVerdictText(failed.verdict), color: "var(--cm-red)" };
  }
  return { text: "Pending", color: "var(--text-muted)" };
}

// ── Main component ────────────────────────────────────────────────────────────

interface ChallengeRendererProps {
  lessonId: string;
  title: string;
  content: ChallengeContent;
  onComplete: () => void;
  onNavigate?: () => void;
  nextLabel?: string;
  isCompleted?: boolean;
}

export default function ChallengeRenderer({
  lessonId,
  title,
  content,
  onComplete,
  onNavigate,
  nextLabel = "Continue →",
  isCompleted = false,
}: ChallengeRendererProps) {
  const { user } = useAuthStore();
  const isPremiumActive = user?.isPremium === true;

  const [language, setLanguage] = useState<"cpp" | "python">("cpp");
  const [code, setCode] = useState(content.starterCode.cpp);
  const [leftTab, setLeftTab] = useState<"statement" | "hints" | "editorial" | "submissions">("statement");
  const [submissions, setSubmissions] = useState<LPSubmission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [viewCodeSub, setViewCodeSub] = useState<LPSubmission | null>(null);

  const loadSubmissions = async () => {
    if (!user || subsLoading) return;
    setSubsLoading(true);
    try {
      const res = await api.get(`/learning-path/submissions?challengeId=${content.backendChallengeId}`);
      setSubmissions(res.submissions ?? []);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setSubsLoading(false);
    }
  };
  const [showReference, setShowReference] = useState(false);
  const [activeCase, setActiveCase] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Reset editor when language or challenge changes
  useEffect(() => {
    setCode(
      language === "cpp" ? content.starterCode.cpp : content.starterCode.python
    );
    setShowReference(false);
    setHasSubmitted(false);
  }, [language, content.backendChallengeId]);

  // Drag-to-resize
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [leftPct, setLeftPct] = useState(40);
  const [editorPct, setEditorPct] = useState(65);

  const onHDivider = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const move = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(70, Math.max(20, pct)));
    };
    const up = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }, []);

  const onVDivider = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    const move = (ev: MouseEvent) => {
      if (!dragging.current || !rightRef.current) return;
      const rect = rightRef.current.getBoundingClientRect();
      const pct = ((ev.clientY - rect.top) / rect.height) * 100;
      setEditorPct(Math.min(85, Math.max(25, pct)));
    };
    const up = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }, []);

  // Use runner hook
  const { testResults, isRunning, isSubmitting, showSuccess, setShowSuccess, run, submit } =
    useCodeRunner(content, language, code, () => {
      onComplete();
      setHasSubmitted(true);
    });
  const { text: verdictText, color: verdictColor } = verdictSummary(
    testResults,
    isRunning,
    isSubmitting
  );
  const passedCount = testResults.filter((r) => r.verdict === "accepted").length;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        background: "var(--bg-primary)",
      }}
    >
      {/* ── Top chrome bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: "44px",
          background: "#0d0d12",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--cm-yellow)",
              background: "rgba(255,215,0,0.12)",
              padding: "2px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(255,215,0,0.3)",
            }}
          >
            Medium
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.8px",
              color: "var(--text-muted)",
              padding: "1px 8px",
              borderRadius: "4px",
              border: "1px solid var(--border-primary)",
              textTransform: "uppercase",
            }}
          >
            FROM SCRATCH
          </span>
        </div>

        {showSuccess && (
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--cm-green)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ✓ All tests passed — click &quot;{nextLabel}&quot; in the sidebar
          </div>
        )}
      </div>

      {/* ── Main split ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          style={{
            width: `${leftPct}%`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#0a0a10",
            flexShrink: 0,
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "#0d0d12",
              flexShrink: 0,
            }}
          >
            {(["statement", "hints", ...(content.editorial ? ["editorial" as const] : []), "submissions" as const] as const).map(t => {
              const locked = t === "editorial" && !(hasSubmitted || isCompleted || isPremiumActive);
              return (
                <button
                  key={t}
                  onClick={() => {
                    if (!locked) {
                      setLeftTab(t);
                      if (t === "submissions") loadSubmissions();
                    }
                  }}
                  disabled={locked}
                  style={{
                    padding: "11px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: locked ? "var(--text-muted)" : leftTab === t ? "var(--text-primary)" : "#6b7280",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      leftTab === t
                        ? "2px solid var(--cm-cyan)"
                        : "2px solid transparent",
                    cursor: locked ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    textTransform: "capitalize",
                  }}
                >
                  {locked ? "🔒 Editorial" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              )
            })}
          </div>

          {/* Panel body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 28px",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.75,
              color: "#c9d1d9",
            }}
          >
            {/* STATEMENT TAB */}
            {leftTab === "statement" && (
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    marginBottom: "16px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {title}
                </h2>

                {/* Problem statement */}
                <div
                  style={{ marginBottom: "20px", whiteSpace: "pre-wrap" }}
                >
                  {content.problemStatement.split("\n").map((line, i) => {
                    const parts = line.split(/(\*\*[^*]+\*\*|\b[A-Za-z0-9]+\^[0-9]+)/g);
                    return (
                      <p key={i} style={{ marginBottom: "6px" }}>
                        {parts.map((p, j) => {
                          if (p.startsWith("**") && p.endsWith("**")) {
                            return (
                              <strong key={j} style={{ color: "var(--text-primary)" }}>
                                {p.slice(2, -2)}
                              </strong>
                            );
                          }
                          const caretIdx = p.indexOf("^");
                          if (caretIdx > 0 && caretIdx < p.length - 1) {
                            return <span key={j}>{p.slice(0, caretIdx)}<sup>{p.slice(caretIdx + 1)}</sup></span>;
                          }
                          return <span key={j}>{p}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>

                {/* Input / Output format */}
                {[
                  { label: "Input Format", text: content.inputFormat },
                  { label: "Output Format", text: content.outputFormat },
                ].map(({ label, text }) => (
                  <div key={label} style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1.2px",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      {label}
                    </div>
                    <p style={{ color: "#9ca3af", fontSize: "13px" }}>{text}</p>
                  </div>
                ))}

                {/* Constraints */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1.2px",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Constraints
                  </div>
                  <ul
                    style={{
                      paddingLeft: "20px",
                      color: "#9ca3af",
                      fontSize: "13px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {content.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Sample */}
                <div style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1.2px",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Sample
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    {[
                      { label: "Input", val: content.sampleInput },
                      { label: "Output", val: content.sampleOutput },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            marginBottom: "4px",
                            fontWeight: 600,
                          }}
                        >
                          {label}
                        </div>
                        <pre
                          style={{
                            background: "#08080c",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontFamily: "var(--font-mono)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#e2e8f0",
                            margin: 0,
                            overflow: "auto",
                          }}
                        >
                          {val}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* HINTS TAB */}
            {leftTab === "hints" && <HintPanel hints={content.hints} />}

            {/* EDITORIAL TAB */}
            {leftTab === "editorial" && (hasSubmitted || isCompleted || isPremiumActive) && content.editorial && (
              <div>
                <h3 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--cm-cyan)" }}>Editorial</h3>
                {content.editorial.split(/```(cpp|python)?\n?([\s\S]*?)```/g).reduce<React.ReactNode[]>((acc, part, i, arr) => {
                  if (i % 3 === 0) {
                    if (part.trim()) {
                      acc.push(
                        <div key={`text-${i}`} style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: "1rem", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                          {fmt(part, ACCENT_COLOR, ACCENT_RGB)}
                        </div>
                      );
                    }
                  } else if (i % 3 === 2) {
                    const lang = arr[i - 1] || "cpp";
                    const cleanCode = part.trim();
                    acc.push(
                      <div key={`code-${i}`} style={{ marginBottom: "1.5rem" }}>
                        <RichCodeBlock
                          language={lang === "python" ? "Python" : "C++"}
                          code={cleanCode}
                          accentColor={ACCENT_COLOR}
                          accentRGB={ACCENT_RGB}
                        />
                      </div>
                    );
                  }
                  return acc;
                }, [])}
              </div>
            )}

            {/* SUBMISSIONS TAB */}
            {leftTab === "submissions" && (
              <SubmissionsTab
                submissions={submissions}
                loading={subsLoading}
                isGuest={!user}
                onViewCode={(sub) => setViewCodeSub(sub)}
              />
            )}
          </div>
        </div>

        {/* ── Horizontal drag divider ── */}
        <div
          onMouseDown={onHDivider}
          style={{
            width: "6px",
            background: "rgba(255,255,255,0.05)",
            cursor: "col-resize",
            flexShrink: 0,
            zIndex: 10,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,240,255,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
        />

        {/* ── RIGHT PANEL ── */}
        <div
          ref={rightRef}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Editor header */}
          <div className={styles.editorHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select
                className={styles.langSelector}
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as "cpp" | "python")
                }
              >
                <option value="cpp">C++</option>
                <option value="python">Python</option>
              </select>


            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={run}
                disabled={isRunning || isSubmitting}
              >
                {isRunning ? "Running…" : "▶ Run"}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={submit}
                disabled={isRunning || isSubmitting}
              >
                {isSubmitting ? "Judging…" : "Submit"}
              </button>
            </div>
          </div>

          {/* Monaco editor */}
          <div style={{ flex: editorPct / 100, minHeight: 0, overflow: "hidden" }}>
            <CodeEditor
              value={code}
              onChange={(v) => setCode(v ?? "")}
              language={language === "cpp" ? "cpp" : "python"}
            />
          </div>

          {/* Vertical drag divider */}
          <div
            onMouseDown={onVDivider}
            style={{
              height: "6px",
              background: "rgba(255,255,255,0.05)",
              cursor: "row-resize",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,240,255,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
          />

          {/* Console / results */}
          <div
            style={{
              flex: 1 - editorPct / 100,
              minHeight: 0,
              overflow: "auto",
              background: "#08080e",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "12px 16px",
            }}
          >
            {/* Verdict row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: verdictColor,
                }}
              >
                {verdictText}
              </span>
              {testResults.length > 0 && (
                <span
                  style={{ fontSize: "12px", color: "var(--text-muted)" }}
                >
                  {passedCount} / {testResults.length} sample cases
                </span>
              )}
            </div>

            {/* Test case tabs */}
            {testResults.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  {testResults.map((tc) => (
                    <button
                      key={tc.testIndex}
                      onClick={() => setActiveCase(tc.testIndex)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        background:
                          activeCase === tc.testIndex
                            ? "var(--bg-tertiary)"
                            : "transparent",
                        border: `1px solid ${tc.verdict === "running"
                            ? "rgba(0,240,255,0.4)"
                            : activeCase === tc.testIndex
                              ? "var(--border-accent)"
                              : "var(--border-primary)"
                          }`,
                        color:
                          activeCase === tc.testIndex
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                        transition: "all 0.15s",
                      }}
                    >
                      {tc.verdict === "accepted" ? (
                        <span style={{ color: "var(--cm-green)" }}>✓</span>
                      ) : tc.verdict === "running" ? (
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            border: "2px solid rgba(0,240,255,0.25)",
                            borderTopColor: "var(--cm-cyan)",
                            animation: "spin 0.65s linear infinite",
                          }}
                        />
                      ) : tc.verdict === "pending" ? (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "11px",
                          }}
                        >
                          –
                        </span>
                      ) : (
                        <span style={{ color: "var(--cm-red)" }}>✗</span>
                      )}
                      Case {tc.testIndex + 1}
                    </button>
                  ))}
                </div>

                {/* Active case detail */}
                {testResults[activeCase] && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {[
                      { label: "Input", val: testResults[activeCase].input },
                      testResults[activeCase].output
                        ? {
                          label: "Your Output",
                          val: testResults[activeCase].output ?? "",
                          red:
                            testResults[activeCase].verdict === "wrong_answer",
                        }
                        : null,
                      {
                        label: "Expected",
                        val: testResults[activeCase].expected,
                      },
                      testResults[activeCase].stderr
                        ? {
                          label: "Stderr",
                          val: testResults[activeCase].stderr ?? "",
                          red: true,
                        }
                        : null,
                      testResults[activeCase].compileOutput
                        ? {
                          label: "Compile Error",
                          val: testResults[activeCase].compileOutput ?? "",
                          red: true,
                        }
                        : null,
                    ]
                      .filter(Boolean)
                      .map(({ label, val, red }: any) => (
                        <div key={label}>
                          <div
                            style={{
                              fontSize: "10px",
                              fontFamily: "var(--font-sans)",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              color: red ? "var(--cm-red)" : "var(--text-muted)",
                              marginBottom: "4px",
                              fontWeight: 700,
                            }}
                          >
                            {label}
                          </div>
                          <pre
                            style={{
                              background: red
                                ? "rgba(255,45,85,0.05)"
                                : "#06060a",
                              border: `1px solid ${red
                                  ? "rgba(255,45,85,0.2)"
                                  : "rgba(255,255,255,0.05)"
                                }`,
                              padding: "8px 12px",
                              borderRadius: "6px",
                              color: red ? "var(--cm-red)" : "#e2e8f0",
                              margin: 0,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                            }}
                          >
                            {val}
                          </pre>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessModal
          title={title}
          testCount={testResults.length}
          passedCount={testResults.filter(r => r.verdict === "accepted").length}
          onClose={() => setShowSuccess(false)}
          onNext={onNavigate ? () => {
            setShowSuccess(false);
            onNavigate();
          } : undefined}
          nextLabel={nextLabel}
        />
      )}

      {viewCodeSub && (
        <SubmissionCodeViewerModal
          viewCodeSub={viewCodeSub}
          onClose={() => setViewCodeSub(null)}
        />
      )}
    </div>
  );
}
