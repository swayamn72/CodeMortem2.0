"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import { api } from "@/lib/api";
import type { ChallengeConfig, LPTestResult } from "./types";
import { getVerdictColor, getVerdictLabel } from "@/lib/verdicts";
import styles from "@/app/learn/segment-tree/page.module.css";
import { useAuthStore } from "@/stores/authStore";
import SuccessModal from "@/components/shared/SuccessModal";

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
  nextLabelOverride?: string;
}

function renderMarkdownText(text: string) {
  if (!text) return null;

  const blocks: { type: 'text' | 'code', content: string, lang?: string }[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    blocks.push({ type: 'code', lang: match[1] || 'cpp', content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return blocks.map((block, i) => {
    if (block.type === 'code') {
      const lineCount = block.content.split("\n").length;
      return (
        <div key={i} style={{ height: Math.min(lineCount * 21 + 24, 400), marginBottom: "1rem", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          <CodeEditor value={block.content} language={block.lang!} onChange={() => {}} readOnly={true} />
        </div>
      );
    }

    return block.content.split("\n\n").map((para, j) => {
      if (!para.trim()) return null;
      const parts = para.split(/(\*\*.*?\*\*|_.*?_|`.*?`|\^.*?\^)/g);
      return (
        <p key={`${i}-${j}`} style={{ marginBottom: "0.75rem", lineHeight: 1.6 }}>
          {parts.map((p, k) => {
            if (p.startsWith("**") && p.endsWith("**")) {
              return <strong key={k} style={{ color: "var(--text-primary)", fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
            }
            if (p.startsWith("_") && p.endsWith("_")) {
              return <em key={k}>{p.slice(1, -1)}</em>;
            }
            if (p.startsWith("`") && p.endsWith("`")) {
              return <code key={k} style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: 4, color: "var(--cm-cyan)", fontSize: "0.9em", fontFamily: "monospace" }}>{p.slice(1, -1)}</code>;
            }
            if (p.startsWith("^") && p.endsWith("^") && p.length > 2) {
              return <sup key={k} style={{ fontSize: "0.75em", lineHeight: 0 }}>{p.slice(1, -1)}</sup>;
            }
            return p.split("\n").flatMap((line, idx, arr) => idx < arr.length - 1 ? [line, <br key={`br-${k}-${idx}`} />] : [line]);
          })}
        </p>
      );
    });
  });
}

export default function ChallengeIde({ challenge, onComplete, navigate, nextLabelOverride }: ChallengeIdeProps) {
  const { user } = useAuthStore();
  const isPremiumActive = user?.isPremium && (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());

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
  const [consoleError, setConsoleError] = useState("");
  const [testResults, setTestResults] = useState<LPTestResult[]>([]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [resetType, setResetType] = useState<"starter" | "reference" | null>(null);

  // Reset when challenge changes — restore the starter template
  useEffect(() => {
    const defaultTemplate = challenge.templates?.[lang] || TEMPLATES[lang];
    setCode(defaultTemplate);
    setHasSubmitted(false);
    setShowSuccess(false);
    setConsoleError("");
    setLeftTab("statement");
    setConsoleTab("cases");
    const pending = challenge.sampleCases.map((s, i): LPTestResult => ({
      testIndex: i, verdict: "idle",
      input: s.input, output: "", expected: s.expected,
      stderr: "", compileOutput: "", executionTime: "", memory: 0,
    }));
    setTestResults(pending);
    setActiveCaseIdx(0);
  }, [challenge.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swap template when language changes (only if user hasn't written their own code)
  useEffect(() => {
    const otherLang: "cpp" | "python" = lang === "cpp" ? "python" : "cpp";
    const tOther = challenge.templates?.[otherLang] || TEMPLATES[otherLang];
    const tThis = challenge.templates?.[lang] || TEMPLATES[lang];
    if (code === tOther || code === tThis || code.trim() === "") {
      setCode(tThis);
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
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {challenge.title}
          {challenge.premium && <span style={{ fontSize: 12, marginLeft: 6 }} title="Premium Challenge">👑</span>}
        </span>
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
            {(["statement", "hints", ...(challenge.editorial ? ["editorial" as const] : [])] as const).map(tab => {
              const locked = tab === "editorial" && !hasSubmitted && !isPremiumActive;
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
                <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  {renderMarkdownText(challenge.statement)}
                </div>

                {[
                  ["CONSTRAINTS", challenge.constraints],
                  ["INPUT FORMAT", challenge.inputFormat],
                  ["OUTPUT FORMAT", challenge.outputFormat],
                ].map(([label, text]) => (
                  <div key={label} style={{ marginBottom: "1rem" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                      {label}
                    </span>
                    <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", margin: 0 }}>
                      {renderMarkdownText(text)}
                    </div>
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
                    <div style={{ padding: "12px 14px 14px 14px", fontSize: "13px", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {renderMarkdownText(hint)}
                    </div>
                  </details>
                ))}
              </div>
            )}

            {leftTab === "editorial" && (hasSubmitted || isPremiumActive) && (
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--cm-cyan)" }}>Editorial</h3>
                {challenge.editorial.split(/```(cpp|python)?\n?([\s\S]*?)```/g).reduce<React.ReactNode[]>((acc, part, i, arr) => {
                  if (i % 3 === 0) {
                    if (part.trim()) {
                      acc.push(
                        <div key={`text-${i}`} style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                          {renderMarkdownText(part)}
                        </div>
                      );
                    }
                  } else if (i % 3 === 2) {
                    const lang = arr[i - 1] || "cpp";
                    const cleanCode = part.trim();
                    const lineCount = cleanCode.split("\n").length;
                    acc.push(
                      <div key={`code-${i}`} style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cm-cyan)", letterSpacing: "0.5px", marginBottom: 4, textTransform: "uppercase" }}>{lang === "python" ? "Python" : "C++"}</div>
                        <div style={{ height: Math.min(lineCount * 21 + 24, 400), background: "#0b0b10", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid var(--cm-cyan)", borderRadius: "0 8px 8px 0", overflow: "hidden" }}>
                          <CodeEditor value={cleanCode} language={lang} onChange={() => {}} readOnly={true} />
                        </div>
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
          style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}
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
            {(challenge.templates || challenge.referenceTemplates) && (
              <button
                onClick={() => setShowTemplateModal(true)}
                style={{
                  padding: "3px 12px", borderRadius: 6,
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-secondary)",
                  marginLeft: 8,
                }}
              >
                Refer Template
              </button>
            )}
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
                            background: i === activeCaseIdx ? `${getVerdictColor(r.verdict)}18` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${i === activeCaseIdx ? getVerdictColor(r.verdict) : "rgba(255,255,255,0.1)"}`,
                            color: getVerdictColor(r.verdict),
                          }}
                        >
                          {isHidden ? "🔒" : ""}{getVerdictLabel(r.verdict)} {i + 1}
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
                          <div style={{ color: getVerdictColor(activeResult.verdict), fontWeight: 700, fontSize: 13 }}>
                            {getVerdictLabel(activeResult.verdict)}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11, lineHeight: 1.6 }}>
                            {activeResult.verdict === "accepted" ? "Passed" : "Failed on"} hidden test case #{activeCaseIdx + 1}.<br />
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
                          <div style={{ color: getVerdictColor(activeResult.verdict) }}>
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
        <SuccessModal
          title={challenge.title}
          testCount={testResults.length}
          passedCount={testResults.filter(r => r.verdict === "accepted").length}
          onClose={() => setShowSuccess(false)}
          onNext={() => {
            setShowSuccess(false);
            navigate(challenge.nextLesson);
          }}
          nextLabel={nextLabelOverride || challenge.nextLabel}
        />
      )}

      {/* ★ TEMPLATE MODAL ★ */}
      {showTemplateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTemplateModal(false);
          }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}
        >
          <div style={{
            background: "#12121a", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: 24, width: "90%", maxWidth: 800,
            maxHeight: "80vh", display: "flex", flexDirection: "column",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: 18 }}>Reference Template ({lang === "cpp" ? "C++" : "Python"})</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{
                  background: "transparent", border: "none", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 20, padding: 4,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ height: 400, overflow: "hidden", background: "#0b0b10", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
              <CodeEditor 
                value={challenge.referenceTemplates?.[lang] || challenge.templates?.[lang] || TEMPLATES[lang]} 
                language={lang} 
                onChange={() => {}} 
                readOnly={true} 
              />
            </div>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={() => setResetType("reference")}
                style={{
                  padding: "8px 16px", borderRadius: 6, cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  background: "transparent", border: "1px solid var(--cm-red)",
                  color: "var(--cm-red)",
                }}
              >
                Reset My Code to Template
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{
                  padding: "8px 16px", borderRadius: 6, cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  background: "var(--cm-cyan)", border: "none", color: "#000",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ★ RESET CONFIRM MODAL ★ */}
      {resetType && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetType(null);
          }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
          }}
        >
          <div style={{
            background: "#12121a", border: "1px solid rgba(255,100,100,0.2)",
            borderRadius: 12, padding: 32, width: "90%", maxWidth: 400,
            display: "flex", flexDirection: "column", alignItems: "center",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ margin: "0 0 12px 0", color: "var(--text-primary)", fontSize: 20 }}>
              Reset Code?
            </h2>
            <p style={{ margin: "0 0 28px 0", color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to {resetType === "starter" ? "reset your code" : "replace your code with the template"}? This will erase your current work and cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 16, width: "100%" }}>
              <button
                onClick={() => setResetType(null)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 8, cursor: "pointer",
                  fontSize: 14, fontWeight: 600,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-primary)", transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (resetType === "starter") {
                    setCode(challenge.templates?.[lang] || TEMPLATES[lang]);
                  } else {
                    setCode(challenge.referenceTemplates?.[lang] || challenge.templates?.[lang] || TEMPLATES[lang]);
                    setShowTemplateModal(false);
                  }
                  setResetType(null);
                }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 8, cursor: "pointer",
                  fontSize: 14, fontWeight: 600,
                  background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.4)",
                  color: "var(--cm-red)", transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,100,100,0.25)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,100,100,0.15)"}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
