"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import { api } from "@/lib/api";
import type { ChallengeConfig, LPTestResult } from "./types";
import styles from "@/app/learn/segment-tree/page.module.css";

// ── Starter templates shown in the editor on load ─────────────────────────────
const TEMPLATES: Record<"cpp" | "python", string> = {
  cpp:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    // your code goes here

    return 0;
}`,
  python:
`import sys
input = sys.stdin.readline

# your code goes here
`,
};

interface ChallengeIdeProps {
  challenge: ChallengeConfig;
  onComplete: () => void;
  navigate: (lessonId: string) => void;
}

const verdictColor = (v: string) => {
  if (v === "accepted") return "var(--cm-green)";
  if (v === "pending") return "var(--text-secondary)";
  if (v === "running") return "var(--cm-cyan)";
  return "var(--cm-red)";
};
const verdictLabel = (v: string) => {
  const map: Record<string, string> = {
    accepted: "✓ AC",
    pending: "○ Pending",
    running: "⟳ Running…",
    wrong_answer: "✗ WA",
    compile_error: "✗ CE",
    runtime_error: "✗ RE",
    time_limit_exceeded: "⏱ TLE",
    memory_limit_exceeded: "🪣 MLE",
  };
  return map[v] ?? v;
};

export default function ChallengeIde({ challenge, onComplete, navigate }: ChallengeIdeProps) {
  // ── Resize refs ──────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [leftPct, setLeftPct] = useState(40);
  const [editorPct, setEditorPct] = useState(62);

  const onHDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setLeftPct(Math.min(70, Math.max(20, ((ev.clientX - r.left) / r.width) * 100)));
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

  const onVDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!rightPanelRef.current) return;
      const r = rightPanelRef.current.getBoundingClientRect();
      setEditorPct(Math.min(85, Math.max(25, ((ev.clientY - r.top) / r.height) * 100)));
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

  // ── State ────────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<"cpp" | "python">("cpp");
  const [code, setCode] = useState(TEMPLATES.cpp);
  const [leftTab, setLeftTab] = useState<"statement" | "hints" | "editorial">("statement");
  const [consoleTab, setConsoleTab] = useState<"cases" | "stdout">("cases");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(1);
  const [consoleError, setConsoleError] = useState("");
  const [testResults, setTestResults] = useState<LPTestResult[]>([]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset when challenge changes — restore the starter template
  useEffect(() => {
    setCode(TEMPLATES[lang]);
    setHasSubmitted(false);
    setHintsRevealed(1);
    setShowSuccess(false);
    setConsoleError("");
    setLeftTab("statement");
    setConsoleTab("cases");
    const pending = challenge.sampleCases.map((s, i): LPTestResult => ({
      testIndex: i, verdict: "pending",
      input: s.input, output: "", expected: s.expected,
      stderr: "", compileOutput: "", executionTime: "", memory: 0,
    }));
    setTestResults(pending);
    setActiveCaseIdx(0);
  }, [challenge.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swap template when language changes (only if user hasn't written their own code)
  useEffect(() => {
    const otherLang: "cpp" | "python" = lang === "cpp" ? "python" : "cpp";
    if (code === TEMPLATES[otherLang] || code === TEMPLATES[lang] || code.trim() === "") {
      setCode(TEMPLATES[lang]);
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Run ──────────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setConsoleTab("cases");

    const initial: LPTestResult[] = challenge.sampleCases.map((s, i) => ({
      testIndex: i, verdict: "pending",
      input: s.input, output: "", expected: s.expected,
      stderr: "", compileOutput: "", executionTime: "", memory: 0,
    }));
    const results = [...initial];
    setTestResults([...results]);
    setActiveCaseIdx(0);

    try {
      for (let i = 0; i < challenge.sampleCases.length; i++) {
        results[i] = { ...results[i], verdict: "running" };
        setTestResults([...results]);

        const res = await api.post("/learning-path/run", {
          code,
          language: lang,
          input: challenge.sampleCases[i].input,
        });

        const compileErr = res.compileOutput?.trim();
        const runtimeErr = res.stderr?.trim();
        const backendStatus: string = (res.status ?? "").toLowerCase();
        let verdict: string;
        let actualOutput = "";

        if (compileErr) {
          verdict = "compile_error";
        } else if (backendStatus.includes("time limit")) {
          verdict = "time_limit_exceeded";
        } else if (backendStatus.includes("memory limit")) {
          verdict = "memory_limit_exceeded";
        } else if (runtimeErr || backendStatus.includes("runtime")) {
          verdict = "runtime_error";
        } else {
          actualOutput = (res.output ?? "").trim();
          verdict = actualOutput === challenge.sampleCases[i].expected.trim() ? "accepted" : "wrong_answer";
        }

        results[i] = {
          testIndex: i, verdict,
          input: challenge.sampleCases[i].input,
          output: actualOutput || res.output || "",
          expected: challenge.sampleCases[i].expected,
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
    } catch (err: any) {
      setConsoleError(err.message || "Execution failed.");
      setConsoleTab("stdout");
    } finally {
      setIsRunning(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setHasSubmitted(true);
    setConsoleTab("cases");
    setTestResults([]);

    try {
      const res = await api.post("/learning-path/submit", {
        code,
        language: lang,
        challengeId: challenge.backendId,
      });
      const formatted: LPTestResult[] = res.results.map((r: any) => ({
        testIndex: r.testIndex, verdict: r.verdict,
        executionTime: r.executionTime, memory: r.memory,
        input: r.input, output: r.output, expected: r.expected,
        stderr: r.stderr, compileOutput: r.compileOutput,
      }));
      setTestResults(formatted);
      setActiveCaseIdx(0);
      if (res.verdict === "accepted") {
        onComplete();
        setShowSuccess(true);
      }
    } catch (err: any) {
      setConsoleError(err.message || "Submission failed.");
      setConsoleTab("stdout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeResult = testResults[activeCaseIdx];

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        background: "var(--bg-primary)",
        position: "relative",
      }}
    >
      {/* ── Top chrome bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 44,
          background: "#0d0d12",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 12, fontWeight: 700,
            color: challenge.diffColor,
            background: `${challenge.diffColor}18`,
            padding: "2px 10px", borderRadius: 999,
            border: `1px solid ${challenge.diffColor}55`,
          }}
        >
          {challenge.difficulty}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{challenge.title}</span>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, marginTop: 44, overflow: "hidden" }}>
        {/* ── Left: problem statement ── */}
        <div
          style={{
            width: `${leftPct}%`,
            display: "flex", flexDirection: "column",
            minHeight: 0, background: "#0f0f16",
            borderRight: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex", gap: 4,
              padding: "8px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "#0d0d12",
            }}
          >
            {(["statement", "hints", "editorial"] as const).map(tab => {
              const locked = tab === "editorial" && !hasSubmitted;
              return (
                <button
                  key={tab}
                  onClick={() => !locked && setLeftTab(tab)}
                  disabled={locked}
                  style={{
                    padding: "4px 12px", borderRadius: 6,
                    cursor: locked ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 700,
                    background: leftTab === tab ? "rgba(0,240,255,0.12)" : "transparent",
                    border: leftTab === tab ? "1px solid rgba(0,240,255,0.3)" : "1px solid transparent",
                    color: locked ? "var(--text-muted)" : leftTab === tab ? "var(--cm-cyan)" : "var(--text-secondary)",
                    textTransform: "capitalize",
                  }}
                >
                  {locked ? "🔒 Editorial" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
            {leftTab === "statement" && (
              <div>
                <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--cm-cyan)" }}>
                  {challenge.title}
                </h2>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem", fontSize: 14 }}>
                  {challenge.statement}
                </p>

                {[
                  ["CONSTRAINTS", challenge.constraints],
                  ["INPUT FORMAT", challenge.inputFormat],
                  ["OUTPUT FORMAT", challenge.outputFormat],
                ].map(([label, text]) => (
                  <div key={label} style={{ marginBottom: "1rem" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                      {label}
                    </span>
                    <p style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", margin: 0 }}>
                      {text}
                    </p>
                  </div>
                ))}

                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
                  EXAMPLES
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {challenge.sampleCases.slice(0, 4).map((s, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8, padding: "10px 14px",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                        {s.label || `Case ${i + 1}`}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                        <span style={{ color: "var(--text-secondary)" }}>In: </span>
                        <span style={{ color: "var(--text-primary)" }}>{s.input}</span>
                        <br />
                        <span style={{ color: "var(--text-secondary)" }}>Out: </span>
                        <span style={{ color: "var(--cm-green)" }}>{s.expected}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === "hints" && (
              <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Hints &amp; Tips
                </div>
                {challenge.hints.map((hint, idx) => (
                  <details
                    key={idx}
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden" }}
                  >
                    <summary style={{
                      padding: "12px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      listStyle: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      userSelect: "none",
                    }}>
                      <span>Hint {idx + 1}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>▶</span>
                    </summary>
                    <div style={{ padding: "12px 14px 14px 14px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {hint}
                    </div>
                  </details>
                ))}
              </div>
            )}

            {leftTab === "editorial" && hasSubmitted && (
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--cm-cyan)" }}>Editorial</h3>
                {challenge.editorial.split(/```(cpp|python)?\n?([\s\S]*?)```/g).reduce<React.ReactNode[]>((acc, part, i, arr) => {
                  // Every 3rd chunk starting at index 1 is the language, index 2 is the code
                  if (i % 3 === 0) {
                    // Plain text segment — split on \n\n for paragraphs, **bold**
                    part.split("\n\n").forEach((para, j) => {
                      if (!para.trim()) return;
                      const isBold = para.startsWith("**") && para.includes("**");
                      acc.push(
                        <p key={`p-${i}-${j}`} style={{ fontSize: 14, color: isBold ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.75, marginBottom: "0.75rem", fontWeight: isBold ? 700 : 400 }}>
                          {para.replace(/\*\*/g, "")}
                        </p>
                      );
                    });
                  } else if (i % 3 === 2) {
                    // Code segment
                    const lang = arr[i - 1] || "cpp";
                    acc.push(
                      <div key={`code-${i}`} style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cm-cyan)", letterSpacing: "0.5px", marginBottom: 4, textTransform: "uppercase" }}>{lang === "python" ? "Python" : "C++"}</div>
                        <pre style={{ background: "#0b0b10", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid var(--cm-cyan)", borderRadius: "0 8px 8px 0", padding: "0.9rem 1rem", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#cdd3de", lineHeight: 1.7, overflowX: "auto", margin: 0 }}>
                          <code>{part}</code>
                        </pre>
                      </div>
                    );
                  }
                  return acc;
                }, [])}
              </div>
            )}
          </div>
        </div>

        {/* ── Horizontal resize divider ── */}
        <div
          onMouseDown={onHDividerDown}
          style={{
            width: 5, background: "transparent",
            cursor: "col-resize", flexShrink: 0,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        />

        {/* ── Right: editor + console ── */}
        <div
          ref={rightPanelRef}
          style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          {/* Language toggle + run/submit */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px",
              background: "#0d0d12",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}
          >
            {(["cpp", "python"] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: "3px 12px", borderRadius: 6,
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                  background: lang === l ? "rgba(0,240,255,0.12)" : "transparent",
                  border: lang === l ? "1px solid rgba(0,240,255,0.3)" : "1px solid transparent",
                  color: lang === l ? "var(--cm-cyan)" : "var(--text-secondary)",
                }}
              >
                {l === "cpp" ? "C++" : "Python"}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              style={{
                padding: "5px 16px", borderRadius: 6, cursor: "pointer",
                fontSize: 12, fontWeight: 700,
                background: "rgba(0,255,136,0.12)",
                border: "1px solid rgba(0,255,136,0.3)",
                color: "var(--cm-green)",
                opacity: isRunning || isSubmitting ? 0.5 : 1,
              }}
            >
              {isRunning ? "Running…" : "▶ Run"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              style={{
                padding: "5px 16px", borderRadius: 6, cursor: "pointer",
                fontSize: 12, fontWeight: 700,
                background: "rgba(0,240,255,0.12)",
                border: "1px solid rgba(0,240,255,0.3)",
                color: "var(--cm-cyan)",
                opacity: isRunning || isSubmitting ? 0.5 : 1,
              }}
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>

          {/* Editor */}
          <div style={{ flex: `0 0 ${editorPct}%`, minHeight: 0, overflow: "hidden" }}>
            <CodeEditor
              language={lang}
              value={code}
              onChange={v => setCode(v ?? "")}
            />
          </div>

          {/* Vertical resize divider */}
          <div
            onMouseDown={onVDividerDown}
            style={{
              height: 5, background: "transparent",
              cursor: "row-resize", flexShrink: 0,
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          />

          {/* Console */}
          <div
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              minHeight: 0, background: "#0d0d12",
            }}
          >
            <div
              style={{
                display: "flex", gap: 4,
                padding: "6px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {(["cases", "stdout"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setConsoleTab(tab)}
                  style={{
                    padding: "3px 10px", borderRadius: 4,
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    background: consoleTab === tab ? "rgba(0,240,255,0.1)" : "transparent",
                    border: "none",
                    color: consoleTab === tab ? "var(--cm-cyan)" : "var(--text-secondary)",
                  }}
                >
                  {tab === "cases" ? "Test Cases" : "Output"}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
              {consoleTab === "cases" && (
                <>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {testResults.map((r, i) => {
                      const isHidden = hasSubmitted && i >= challenge.sampleCases.length;
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveCaseIdx(i)}
                          style={{
                            padding: "4px 12px", borderRadius: 6,
                            cursor: "pointer", fontSize: 12, fontWeight: 700,
                            background: i === activeCaseIdx ? `${verdictColor(r.verdict)}18` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${i === activeCaseIdx ? verdictColor(r.verdict) : "rgba(255,255,255,0.1)"}`,
                            color: verdictColor(r.verdict),
                          }}
                        >
                          {isHidden ? "🔒" : ""}{verdictLabel(r.verdict)} {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  {activeResult && (() => {
                    const isHidden = hasSubmitted && activeCaseIdx >= challenge.sampleCases.length;
                    if (isHidden) {
                      return (
                        <div
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 8, padding: "16px 14px",
                            fontFamily: "monospace", fontSize: 12,
                            display: "flex", flexDirection: "column", alignItems: "center",
                            gap: 8, textAlign: "center",
                          }}
                        >
                          <span style={{ fontSize: 22 }}>🔒</span>
                          <div style={{ color: verdictColor(activeResult.verdict), fontWeight: 700, fontSize: 13 }}>
                            {verdictLabel(activeResult.verdict)}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11, lineHeight: 1.6 }}>
                            Failed on hidden test case #{activeCaseIdx + 1}.<br />
                            Hidden test inputs and expected outputs are not shown.
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 8, padding: "10px 14px",
                          fontFamily: "monospace", fontSize: 12,
                        }}
                      >
                        <div style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
                          Input: {activeResult.input}
                        </div>
                        <div style={{ color: "var(--cm-green)", marginBottom: 4 }}>
                          Expected: {activeResult.expected}
                        </div>
                        {activeResult.verdict !== "pending" && (
                          <div style={{ color: verdictColor(activeResult.verdict) }}>
                            Got: {activeResult.output || activeResult.compileOutput || activeResult.stderr}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
              {consoleTab === "stdout" && (
                <pre
                  style={{
                    fontFamily: "monospace", fontSize: 12,
                    color: consoleError ? "var(--cm-red)" : "var(--text-primary)",
                    whiteSpace: "pre-wrap", margin: 0,
                  }}
                >
                  {consoleError || "No output yet."}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ★ SUCCESS MODAL ★ */}
      {showSuccess && (
        <div
          onClick={() => setShowSuccess(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
            animation: "fadeIn 0.25s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "linear-gradient(135deg, #0d0d18 0%, #111122 100%)",
              border: "1px solid rgba(0,240,255,0.25)",
              borderRadius: "20px",
              padding: "48px 40px 36px",
              width: "min(480px, 90vw)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,240,255,0.08)",
              animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {/* Background glow orbs */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)" }} />
              <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%)" }} />
            </div>

            {/* Mascot with pulse ring */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
              <div style={{
                position: "absolute", inset: "-12px",
                borderRadius: "50%",
                border: "2px solid rgba(0,240,255,0.4)",
                animation: "ping 1.4s ease-out infinite",
              }} />
              <div style={{
                fontSize: "72px", lineHeight: 1,
                filter: "drop-shadow(0 0 20px rgba(0,240,255,0.6))",
                animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
              }}>
                💀
              </div>
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: "26px", fontWeight: 800, color: "var(--text-primary)",
              margin: "0 0 6px", letterSpacing: "-0.5px",
            }}>
              Challenge Complete!
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 8px" }}>
              {challenge.title}
            </p>

            {/* Pass rate badge */}
            <div style={{ marginBottom: "28px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)",
                borderRadius: "999px", padding: "4px 14px",
                fontSize: "13px", fontWeight: 700, color: "var(--cm-green)",
              }}>
                ✓ {testResults.filter(r => r.verdict === "accepted").length}/{testResults.length} test cases passed
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => { setShowSuccess(false); navigate(challenge.nextLesson); }}
                style={{
                  width: "100%", padding: "13px",
                  background: "linear-gradient(135deg, var(--cm-cyan), #00b3cc)",
                  border: "none", borderRadius: "10px",
                  color: "#000", fontSize: "14px", fontWeight: 800,
                  cursor: "pointer", letterSpacing: "0.3px",
                  boxShadow: "0 4px 20px rgba(0,240,255,0.35)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,240,255,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,240,255,0.35)"; }}
              >
                {challenge.nextLabel}
              </button>
              <button
                onClick={() => setShowSuccess(false)}
                style={{
                  width: "100%", padding: "11px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                Stay &amp; Explore Solution
              </button>
            </div>

            {/* Dismiss hint */}
            <p style={{ marginTop: "16px", fontSize: "11px", color: "var(--text-muted)" }}>
              Click anywhere outside to dismiss
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
