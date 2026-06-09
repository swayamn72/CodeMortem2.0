"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import { api } from "@/lib/api";
import type { LPTestResult } from "./types";
import { BIT_CHALLENGES, SAMPLE_TEST_CASES } from "./constants";
import styles from "@/app/learn/segment-tree/page.module.css";

interface BitManipChallengeIdeProps {
  activeLesson: string;
  setActiveLesson: (id: string) => void;
  onPartComplete: () => void;
}

const NEXT_LESSON: Record<string, string> = {
  challenge1: "lesson3",
  challenge2: "mcq1",
  challenge3: "lesson4b",
  challenge4: "lesson7",
  challenge5: "badge",
};
const NEXT_LABEL: Record<string, string> = {
  challenge1: "Next: Shift Operations →",
  challenge2: "→ Checkpoint 1",
  challenge3: "Next: Lesson 4B →",
  challenge4: "Next: Lesson 7 →",
  challenge5: "🏆 Claim Your Badge",
};

export default function BitManipChallengeIde({
  activeLesson,
  setActiveLesson,
  onPartComplete,
}: BitManipChallengeIdeProps) {
  const challenge = BIT_CHALLENGES.find(c => c.id === activeLesson)!;
  const samples = SAMPLE_TEST_CASES[activeLesson] ?? [];

  // ── Resize refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [leftPct, setLeftPct] = useState(40);
  const [editorPct, setEditorPct] = useState(62);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setLeftPct(Math.min(70, Math.max(20, ((ev.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const onVerticalDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !rightPanelRef.current) return;
      const rect = rightPanelRef.current.getBoundingClientRect();
      setEditorPct(Math.min(85, Math.max(25, ((ev.clientY - rect.top) / rect.height) * 100)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // ── State ──
  const [selectedLanguage, setSelectedLanguage] = useState<"cpp" | "python">("cpp");
  const [editorValue, setEditorValue] = useState("");
  const [consoleTab, setConsoleTab] = useState<"stdout" | "cases">("cases");
  const [leftTab, setLeftTab] = useState<"statement" | "hints" | "editorial">("statement");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [consoleStdout, setConsoleStdout] = useState("");
  const [consoleError, setConsoleError] = useState("");
  const [testResults, setTestResults] = useState<LPTestResult[]>([]);
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(1); // start showing first hint

  // Reset when changing challenge
  useEffect(() => {
    setEditorValue("");
    setHasSubmitted(false);
    setHintsRevealed(1);
    setShowSuccess(false);
    setConsoleError("");
    setConsoleStdout("");
    setLeftTab("statement");
    const pending = samples.map((s, i): LPTestResult => ({
      testIndex: i, verdict: "pending",
      input: s.input, output: "", expected: s.expected,
      stderr: "", compileOutput: "", executionTime: "", memory: 0,
    }));
    setTestResults(pending);
    setActiveTestCaseIdx(0);
    setConsoleTab("cases");
  }, [activeLesson, selectedLanguage]);

  // ── Run ──
  const handleRunCode = async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setConsoleTab("cases");
    const initial = samples.map((s, i): LPTestResult => ({
      testIndex: i, verdict: "pending",
      input: s.input, output: "", expected: s.expected,
      stderr: "", compileOutput: "", executionTime: "", memory: 0,
    }));
    setTestResults([...initial]);
    setActiveTestCaseIdx(0);

    const results = [...initial];
    try {
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        results[i] = { ...results[i], verdict: "running" };
        setTestResults([...results]);

        const res = await api.post("/learning-path/run", {
          code: editorValue,
          language: selectedLanguage,
          input: s.input,
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
          verdict = actualOutput === s.expected.trim() ? "accepted" : "wrong_answer";
        }

        results[i] = {
          testIndex: i, verdict,
          input: s.input, output: actualOutput || res.output || "",
          expected: s.expected, stderr: runtimeErr || "",
          compileOutput: compileErr || "", executionTime: res.executionTime || "", memory: res.memory || 0,
        };
        if (compileErr) {
          for (let j = i + 1; j < results.length; j++) {
            results[j] = { ...results[j], verdict: "compile_error", compileOutput: compileErr };
          }
        }
        setTestResults([...results]);
        if (compileErr) break;
      }
    } catch (err: any) {
      setConsoleError(err.message || "Execution failed.");
      setConsoleTab("stdout");
    } finally {
      setIsRunning(false);
    }
  };

  // ── Submit ──
  const handleSubmitCode = async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setHasSubmitted(true);
    setConsoleTab("cases");
    setTestResults([]);

    try {
      const res = await api.post("/learning-path/submit", {
        code: editorValue,
        language: selectedLanguage,
        challengeId: challenge.backendId,
      });
      const formatted: LPTestResult[] = res.results.map((r: any) => ({
        testIndex: r.testIndex, verdict: r.verdict,
        executionTime: r.executionTime, memory: r.memory,
        input: r.input, output: r.output, expected: r.expected,
        stderr: r.stderr, compileOutput: r.compileOutput,
      }));
      setTestResults(formatted);
      setActiveTestCaseIdx(0);
      if (res.verdict === "accepted") {
        onPartComplete();
        setShowSuccess(true);
      }
    } catch (err: any) {
      setConsoleError(err.message || "Submission failed.");
      setConsoleTab("stdout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verdictColor = (v: string) => {
    if (v === "accepted") return "var(--cm-green)";
    if (v === "pending") return "var(--text-secondary)";
    if (v === "running") return "var(--cm-cyan)";
    return "var(--cm-red)";
  };
  const verdictLabel = (v: string) => {
    if (v === "accepted") return "✓ AC";
    if (v === "pending") return "○ Pending";
    if (v === "running") return "⟳ Running…";
    if (v === "wrong_answer") return "✗ WA";
    if (v === "compile_error") return "✗ CE";
    if (v === "runtime_error") return "✗ RE";
    if (v === "time_limit_exceeded") return "⏱ TLE";
    return v;
  };

  if (!challenge) return null;

  return (
    <div ref={containerRef} style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* ── Top chrome ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, background: "#0d0d12", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, zIndex: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: challenge.diffColor, background: `${challenge.diffColor}18`, padding: "2px 10px", borderRadius: 999, border: `1px solid ${challenge.diffColor}55` }}>
          {challenge.difficulty}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{challenge.title}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", color: "var(--text-muted)", padding: "1px 8px", borderRadius: 4, border: "1px solid var(--border-primary)", textTransform: "uppercase" }}>
          FROM SCRATCH
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, marginTop: 44, overflow: "hidden" }}>
        {/* ── Left Panel ── */}
        <div style={{ width: `${leftPct}%`, display: "flex", flexDirection: "column", minHeight: 0, background: "#0f0f16", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0d0d12" }}>
            {(["statement", "hints", "editorial"] as const).map(tab => (
              <button key={tab} onClick={() => setLeftTab(tab)}
                disabled={tab === "editorial" && !hasSubmitted}
                style={{ padding: "4px 12px", borderRadius: 6, cursor: tab === "editorial" && !hasSubmitted ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, background: leftTab === tab ? "rgba(0,240,255,0.12)" : "transparent", border: leftTab === tab ? "1px solid rgba(0,240,255,0.3)" : "1px solid transparent", color: tab === "editorial" && !hasSubmitted ? "var(--text-muted)" : leftTab === tab ? "var(--cm-cyan)" : "var(--text-secondary)", textTransform: "capitalize" }}>
                {tab === "editorial" && !hasSubmitted ? "🔒 Editorial" : tab === "editorial" ? "Editorial" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
            {leftTab === "statement" && (
              <div>
                <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--cm-cyan)" }}>{challenge.title}</h2>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>{challenge.statement}</p>
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Constraints</strong>
                  <p style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", marginTop: 4 }}>{challenge.constraints}</p>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Input Format</strong>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{challenge.inputFormat}</p>
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <strong style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Output Format</strong>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{challenge.outputFormat}</p>
                </div>
                <strong style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Examples</strong>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  {samples.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{s.label || `Case ${i + 1}`}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                        <span style={{ color: "var(--text-secondary)" }}>In: </span><span style={{ color: "var(--text-primary)" }}>{s.input}</span>
                        <br />
                        <span style={{ color: "var(--text-secondary)" }}>Out: </span><span style={{ color: "var(--cm-green)" }}>{s.expected}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === "hints" && (
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--cm-cyan)" }}>Hints</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "1rem" }}>Hints are progressive — read only as many as you need.</p>
                {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
                  <details key={i} open style={{ marginBottom: 8 }}>
                    <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, color: "var(--text-primary)", listStyle: "none", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--cm-cyan)" }}>→</span> Hint {i + 1}
                    </summary>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: "8px 12px 0", lineHeight: 1.6, margin: 0 }}>{hint}</p>
                  </details>
                ))}
                {hintsRevealed < challenge.hints.length && (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => setHintsRevealed(h => h + 1)}>
                    Show next hint ({hintsRevealed}/{challenge.hints.length})
                  </button>
                )}
                {hintsRevealed >= challenge.hints.length && (
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: "0.5rem" }}>All hints revealed.</p>
                )}
              </div>
            )}

            {leftTab === "editorial" && hasSubmitted && (
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--cm-cyan)" }}>Editorial</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{challenge.editorial}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div onMouseDown={onDividerMouseDown} style={{ width: 5, background: "transparent", cursor: "col-resize", flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)" }} />

        {/* ── Right Panel ── */}
        <div ref={rightPanelRef} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Language toggle + run/submit */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#0d0d12", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            {(["cpp", "python"] as const).map(lang => (
              <button key={lang} onClick={() => setSelectedLanguage(lang)}
                style={{ padding: "3px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, background: selectedLanguage === lang ? "rgba(0,240,255,0.12)" : "transparent", border: selectedLanguage === lang ? "1px solid rgba(0,240,255,0.3)" : "1px solid transparent", color: selectedLanguage === lang ? "var(--cm-cyan)" : "var(--text-secondary)" }}>
                {lang === "cpp" ? "C++" : "Python"}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={handleRunCode} disabled={isRunning || isSubmitting}
              style={{ padding: "5px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--cm-green)" }}>
              {isRunning ? "Running…" : "▶ Run"}
            </button>
            <button onClick={handleSubmitCode} disabled={isRunning || isSubmitting}
              style={{ padding: "5px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, background: "rgba(0,240,255,0.12)", border: "1px solid rgba(0,240,255,0.3)", color: "var(--cm-cyan)" }}>
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>

          {/* Editor */}
          <div style={{ flex: `0 0 ${editorPct}%`, minHeight: 0, overflowY: "auto" }}>
            <CodeEditor
              language={selectedLanguage === "cpp" ? "cpp" : "python"}
              value={editorValue}
              onChange={v => setEditorValue(v ?? "")}
            />
          </div>

          {/* Vertical divider */}
          <div onMouseDown={onVerticalDividerMouseDown} style={{ height: 5, background: "transparent", cursor: "row-resize", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.07)" }} />

          {/* Console */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#0d0d12" }}>
            <div style={{ display: "flex", gap: 4, padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {(["cases", "stdout"] as const).map(tab => (
                <button key={tab} onClick={() => setConsoleTab(tab)}
                  style={{ padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600, background: consoleTab === tab ? "rgba(0,240,255,0.1)" : "transparent", border: "none", color: consoleTab === tab ? "var(--cm-cyan)" : "var(--text-secondary)" }}>
                  {tab === "cases" ? "Test Cases" : "Output"}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
              {consoleTab === "cases" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {testResults.map((r, i) => (
                    <button key={i} onClick={() => setActiveTestCaseIdx(i)}
                      style={{ padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, background: i === activeTestCaseIdx ? `${verdictColor(r.verdict)}18` : "rgba(255,255,255,0.04)", border: `1px solid ${i === activeTestCaseIdx ? verdictColor(r.verdict) : "rgba(255,255,255,0.1)"}`, color: verdictColor(r.verdict) }}>
                      {verdictLabel(r.verdict)} {i + 1}
                    </button>
                  ))}
                  {testResults.length > 0 && (
                    <div style={{ width: "100%", marginTop: 8, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontFamily: "monospace", fontSize: 12 }}>
                      <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>Input: {testResults[activeTestCaseIdx]?.input}</div>
                      <div style={{ color: "var(--cm-green)" }}>Expected: {testResults[activeTestCaseIdx]?.expected}</div>
                      {testResults[activeTestCaseIdx]?.verdict !== "pending" && (
                        <div style={{ color: verdictColor(testResults[activeTestCaseIdx].verdict) }}>
                          Got: {testResults[activeTestCaseIdx]?.output || testResults[activeTestCaseIdx]?.compileOutput || testResults[activeTestCaseIdx]?.stderr}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {consoleTab === "stdout" && (
                <pre style={{ fontFamily: "monospace", fontSize: 12, color: consoleError ? "var(--cm-red)" : "var(--text-primary)", whiteSpace: "pre-wrap", margin: 0 }}>
                  {consoleError || consoleStdout || "No output yet."}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Success overlay ── */}
      {showSuccess && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--surface-color)", border: "1px solid var(--cm-green)", borderRadius: 16, padding: "2rem", textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
            <h2 style={{ color: "var(--cm-green)", marginBottom: "0.5rem" }}>Accepted!</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>All test cases passed.</p>
            <button className="btn btn-primary" onClick={() => { setShowSuccess(false); setActiveLesson(NEXT_LESSON[activeLesson]); }}>
              {NEXT_LABEL[activeLesson]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
