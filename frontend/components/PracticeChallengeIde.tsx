"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import { api } from "@/lib/api";
import type { ChallengeConfig, LPSubmission } from "@/components/course/types";
import { RichCodeBlock, RenderBlock, fmt } from "@/components/learn/shared/RichLessonPrimitives";
import type { LPTestResult } from "@/components/learn/bit-manipulation/types";
import { getVerdictColor, getVerdictLabel } from "@/lib/verdicts";
import SuccessModal from "@/components/shared/SuccessModal";

interface PracticeChallengeIdeProps {
  challenge: ChallengeConfig;
  onSolved?: (id: string) => void;
  onNavigate?: (id: string) => void;
}

export default function PracticeChallengeIde({
  challenge,
  onSolved,
  onNavigate,
}: PracticeChallengeIdeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [leftPct, setLeftPct] = useState(42);
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

  const onVDividerMouseDown = useCallback((e: React.MouseEvent) => {
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

  const [lang, setLang] = useState<"cpp" | "python">("cpp");
  const [code, setCode] = useState("");
  const [leftTab, setLeftTab] = useState<"statement" | "hints" | "editorial">("statement");
  const [consoleTab, setConsoleTab] = useState<"cases" | "stdout">("cases");
  const [hintsRevealed, setHintsRevealed] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [consoleError, setConsoleError] = useState("");
  const [testResults, setTestResults] = useState<LPTestResult[]>([]);
  const [activeTestIdx, setActiveTestIdx] = useState(0);

  const samples = challenge.sampleCases ?? [];

  // Reset when challenge changes
  useEffect(() => {
    setCode("");
    setLeftTab("statement");
    setHintsRevealed(1);
    setHasSubmitted(false);
    setShowSuccess(false);
    setConsoleError("");
    setTestResults(
      samples.map((s, i): LPTestResult => ({
        testIndex: i, verdict: "pending",
        input: s.input, output: "", expected: s.expected,
        stderr: "", compileOutput: "", executionTime: "", memory: 0,
      }))
    );
    setActiveTestIdx(0);
    setConsoleTab("cases");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id, lang]);

  const handleRun = async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setConsoleTab("cases");
    const initial = samples.map((s, i): LPTestResult => ({
      testIndex: i, verdict: "pending",
      input: s.input, output: "", expected: s.expected,
      stderr: "", compileOutput: "", executionTime: "", memory: 0,
    }));
    setTestResults([...initial]);
    const results = [...initial];
    try {
      for (let i = 0; i < samples.length; i++) {
        results[i] = { ...results[i], verdict: "running" };
        setTestResults([...results]);
        const res = await api.post("/learning-path/run", {
          code, language: lang, input: samples[i].input,
        });
        const compErr = res.compileOutput?.trim();
        const rtErr = res.stderr?.trim();
        const actualOut = (res.output ?? "").trim();
        const verdict = compErr ? "compile_error"
          : rtErr ? "runtime_error"
          : actualOut === samples[i].expected.trim() ? "accepted" : "wrong_answer";
        results[i] = {
          testIndex: i, verdict,
          input: samples[i].input, output: actualOut,
          expected: samples[i].expected, stderr: rtErr || "",
          compileOutput: compErr || "", executionTime: res.executionTime || "", memory: res.memory || 0,
        };
        if (compErr) {
          for (let j = i + 1; j < results.length; j++)
            results[j] = { ...results[j], verdict: "compile_error", compileOutput: compErr };
        }
        setTestResults([...results]);
        if (compErr) break;
      }
    } catch (err: unknown) {
      setConsoleError(err instanceof Error ? err.message : "Execution failed.");
      setConsoleTab("stdout");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setHasSubmitted(true);
    setConsoleTab("cases");
    setTestResults([]);
    try {
      const res = await api.post("/learning-path/submit", {
        code, language: lang, challengeId: challenge.backendId,
      });
      const formatted: LPTestResult[] = res.results.map((r: LPTestResult) => ({
        testIndex: r.testIndex, verdict: r.verdict,
        executionTime: r.executionTime, memory: r.memory,
        input: r.input, output: r.output, expected: r.expected,
        stderr: r.stderr, compileOutput: r.compileOutput,
      }));
      setTestResults(formatted);
      setActiveTestIdx(0);
      if (res.verdict === "accepted") {
        setShowSuccess(true);
        onSolved?.(challenge.id);
      }
    } catch (err: unknown) {
      setConsoleError(err instanceof Error ? err.message : "Submission failed.");
      setConsoleTab("stdout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
      {/* Top chrome */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 44,
        background: "#0d0d12", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12, zIndex: 10,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: challenge.diffColor,
          background: `${challenge.diffColor}18`, padding: "2px 10px",
          borderRadius: 999, border: `1px solid ${challenge.diffColor}55`,
        }}>
          {challenge.difficulty}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{challenge.title}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", color: "var(--cm-cyan)",
          padding: "1px 8px", borderRadius: 4, border: "1px solid rgba(0,240,255,0.25)",
          textTransform: "uppercase",
        }}>
          👑 Premium
        </span>
      </div>

      {/* Main area below chrome */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, marginTop: 44, overflow: "hidden" }}>
        {/* Left: statement/hints/editorial */}
        <div style={{ width: `${leftPct}%`, display: "flex", flexDirection: "column", minHeight: 0, background: "#0f0f16", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0d0d12" }}>
            {(["statement", "hints", "editorial"] as const).map(tab => (
              <button key={tab}
                onClick={() => setLeftTab(tab)}
                disabled={tab === "editorial" && !hasSubmitted}
                style={{
                  padding: "4px 12px", borderRadius: 6, cursor: tab === "editorial" && !hasSubmitted ? "not-allowed" : "pointer",
                  fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                  background: leftTab === tab ? "rgba(0,240,255,0.12)" : "transparent",
                  border: leftTab === tab ? "1px solid rgba(0,240,255,0.3)" : "1px solid transparent",
                  color: tab === "editorial" && !hasSubmitted ? "var(--text-muted)" : leftTab === tab ? "var(--cm-cyan)" : "var(--text-secondary)",
                }}
              >
                {tab === "editorial" && !hasSubmitted ? "🔒 Editorial" : tab === "editorial" ? "Editorial" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
            {leftTab === "statement" && (
              <div>
                <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--cm-cyan)" }}>{challenge.title}</h2>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem", whiteSpace: "pre-wrap" }}>{challenge.statement}</p>
                {challenge.inputFormat && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Input Format</div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>{challenge.inputFormat}</p>
                  </div>
                )}
                {challenge.outputFormat && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Output Format</div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>{challenge.outputFormat}</p>
                  </div>
                )}
                {challenge.constraints && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Constraints</div>
                    <pre style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap" }}>{challenge.constraints}</pre>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Examples</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {samples.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{s.label ?? `Case ${i + 1}`}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        <span style={{ color: "var(--text-secondary)" }}>In: </span>
                        <span style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{s.input}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 2 }}>
                        <span style={{ color: "var(--text-secondary)" }}>Out: </span>
                        <span style={{ color: "var(--cm-green)" }}>{s.expected}</span>
                      </div>
                      {s.explanation && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{s.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === "hints" && (
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--cm-cyan)" }}>Hints</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "1rem" }}>Read only as many as you need.</p>
                {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
                  <details key={i} open style={{ marginBottom: 8 }}>
                    <summary style={{
                      cursor: "pointer", fontWeight: 700, fontSize: 13,
                      padding: "8px 12px", background: "rgba(255,255,255,0.04)",
                      borderRadius: 8, color: "var(--text-primary)", listStyle: "none",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ color: "var(--cm-cyan)" }}>→</span> Hint {i + 1}
                    </summary>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: "8px 12px 0", lineHeight: 1.65, margin: 0 }}>{hint}</p>
                  </details>
                ))}
                {hintsRevealed < challenge.hints.length && (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }}
                    onClick={() => setHintsRevealed(h => h + 1)}>
                    Show next hint ({hintsRevealed}/{challenge.hints.length})
                  </button>
                )}
              </div>
            )}

            {leftTab === "editorial" && hasSubmitted && challenge.editorial && (
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--cm-cyan)" }}>Editorial</h3>
                {Array.isArray(challenge.editorial) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {(() => {
                      let textCounter = 0;
                      return challenge.editorial.map((block, i) => {
                        const accentColor = "var(--cm-cyan)";
                        const accentRGB = "0,240,255";
                        const isText = block.kind === "text";
                        const textIdx = isText ? textCounter++ : -1;
                        return (
                          <RenderBlock 
                            key={i} 
                            block={block} 
                            textIdx={textIdx} 
                            accentColor={accentColor} 
                            accentRGB={accentRGB} 
                          />
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                    {challenge.editorial.split(/```(cpp|python)?\n?([\s\S]*?)```/g).reduce<React.ReactNode[]>((acc, part, i, arr) => {
                      if (i % 3 === 0) {
                        if (part.trim()) acc.push(<span key={`text-${i}`}>{part}</span>);
                      } else if (i % 3 === 2) {
                        const lang = arr[i - 1] || "cpp";
                        acc.push(
                          <div key={`code-${i}`} style={{ margin: "1rem 0" }}>
                            <RichCodeBlock
                              language={lang === "python" ? "Python" : "C++"}
                              code={part.trim()}
                              accentColor="var(--cm-cyan)"
                              accentRGB="0,240,255"
                            />
                          </div>
                        );
                      }
                      return acc;
                    }, [])}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Horizontal divider */}
        <div
          onMouseDown={onDividerMouseDown}
          style={{ width: 5, cursor: "col-resize", flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", background: "transparent" }}
        />

        {/* Right: editor + console */}
        <div ref={rightPanelRef} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Lang + Run/Submit bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", background: "#0d0d12",
            borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
          }}>
            {(["cpp", "python"] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "3px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: lang === l ? "rgba(0,240,255,0.12)" : "transparent",
                border: lang === l ? "1px solid rgba(0,240,255,0.3)" : "1px solid transparent",
                color: lang === l ? "var(--cm-cyan)" : "var(--text-secondary)",
              }}>
                {l === "cpp" ? "C++" : "Python"}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={handleRun} disabled={isRunning || isSubmitting} style={{
              padding: "5px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--cm-green)",
            }}>
              {isRunning ? "Running…" : "▶ Run"}
            </button>
            <button onClick={handleSubmit} disabled={isRunning || isSubmitting} style={{
              padding: "5px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: "rgba(0,240,255,0.12)", border: "1px solid rgba(0,240,255,0.3)", color: "var(--cm-cyan)",
            }}>
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>

          {/* Editor */}
          <div style={{ flex: `0 0 ${editorPct}%`, minHeight: 0, overflowY: "auto" }}>
            <CodeEditor
              language={lang === "cpp" ? "cpp" : "python"}
              value={code}
              onChange={v => setCode(v ?? "")}
            />
          </div>

          {/* Vertical divider */}
          <div onMouseDown={onVDividerMouseDown} style={{ height: 5, cursor: "row-resize", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.07)", background: "transparent" }} />

          {/* Console */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#0d0d12" }}>
            <div style={{ display: "flex", gap: 4, padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {(["cases", "stdout"] as const).map(tab => (
                <button key={tab} onClick={() => setConsoleTab(tab)} style={{
                  padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: consoleTab === tab ? "rgba(0,240,255,0.1)" : "transparent",
                  border: "none", color: consoleTab === tab ? "var(--cm-cyan)" : "var(--text-secondary)",
                }}>
                  {tab === "cases" ? "Test Cases" : "Output"}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
              {consoleTab === "cases" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {testResults.map((r, i) => (
                    <button key={i} onClick={() => setActiveTestIdx(i)} style={{
                      padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                      background: i === activeTestIdx ? `${getVerdictColor(r.verdict)}18` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${i === activeTestIdx ? getVerdictColor(r.verdict) : "rgba(255,255,255,0.1)"}`,
                      color: getVerdictColor(r.verdict),
                    }}>
                      {getVerdictLabel(r.verdict)} {i + 1}
                    </button>
                  ))}
                  {testResults.length > 0 && (
                    <div style={{ width: "100%", marginTop: 8, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      <div style={{ color: "var(--text-secondary)", marginBottom: 4, whiteSpace: "pre-wrap" }}>Input: {testResults[activeTestIdx]?.input}</div>
                      <div style={{ color: "var(--cm-green)", marginBottom: 4 }}>Expected: {testResults[activeTestIdx]?.expected}</div>
                      {testResults[activeTestIdx]?.verdict !== "pending" && (
                        <div style={{ color: getVerdictColor(testResults[activeTestIdx].verdict) }}>
                          Got: {testResults[activeTestIdx]?.output || testResults[activeTestIdx]?.compileOutput || testResults[activeTestIdx]?.stderr}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {consoleTab === "stdout" && (
                <pre style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: consoleError ? "var(--cm-red)" : "var(--text-primary)", whiteSpace: "pre-wrap", margin: 0 }}>
                  {consoleError || "No output yet."}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <SuccessModal
          title={challenge.title}
          testCount={testResults.length}
          passedCount={testResults.filter(r => r.verdict === "accepted").length}
          onClose={() => setShowSuccess(false)}
          onNext={challenge.nextLesson && onNavigate ? () => {
            setShowSuccess(false);
            onNavigate(challenge.nextLesson!);
          } : undefined}
          nextLabel={challenge.nextLabel ?? "Next →"}
        />
      )}
    </div>
  );
}
