"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import { api } from "@/lib/api";
import type { LPTestResult } from "./types";
import { CODE_TEMPLATES, MIN_CPP_TEMPLATE, MIN_PYTHON_TEMPLATE, ESCAPE_CPP_TEMPLATE, ESCAPE_PYTHON_TEMPLATE, ESCAPE_CPP_REFERENCE, SAMPLE_TEST_CASES } from "./constants";
import styles from "@/app/learn/segment-tree/page.module.css";

interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  diffColor: string;
  tag: string;
}

const CHALLENGES: Challenge[] = [
  { id: "challenge1", title: "Range Sum Queries",     difficulty: "Easy",   diffColor: "var(--cm-green)",  tag: "READ & SUBMIT"  },
  { id: "challenge2", title: "Range Min Queries",     difficulty: "Easy",   diffColor: "var(--cm-green)",  tag: "FILL IN BLANKS" },
  { id: "challenge3", title: "Range Max Queries",     difficulty: "Easy",   diffColor: "var(--cm-green)",  tag: "FILL IN BLANKS" },
  { id: "challenge4", title: "Cheapest Escape Route", difficulty: "Medium", diffColor: "var(--cm-yellow)", tag: "FROM SCRATCH"   },
];

interface ChallengeIdeProps {
  activeLesson: string;
  setActiveLesson: (id: string) => void;
  onPartComplete: () => void;
}

export default function ChallengeIde({ activeLesson, setActiveLesson, onPartComplete }: ChallengeIdeProps) {
  const challengeIdx = activeLesson === "challenge1" ? 0
                     : activeLesson === "challenge2" ? 1
                     : activeLesson === "challenge3" ? 2 : 3;
  const ch = CHALLENGES[challengeIdx];

  // ── Drag-to-resize refs & state ──
  const containerRef   = useRef<HTMLDivElement>(null);
  const rightPanelRef  = useRef<HTMLDivElement>(null);
  const isDragging     = useRef(false);
  const [leftPct,   setLeftPct]   = useState(38); // % of total width for left panel
  const [editorPct, setEditorPct] = useState(62); // % of right-panel height for editor

  // Horizontal divider (left ↔ right)
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor    = "col-resize";
    document.body.style.userSelect = "none";
    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect   = containerRef.current.getBoundingClientRect();
      const newPct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(70, Math.max(20, newPct)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor    = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
  }, []);

  // Vertical divider (editor ↕ console)
  const onVerticalDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor    = "row-resize";
    document.body.style.userSelect = "none";
    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !rightPanelRef.current) return;
      const rect   = rightPanelRef.current.getBoundingClientRect();
      const newPct = ((ev.clientY - rect.top) / rect.height) * 100;
      setEditorPct(Math.min(85, Math.max(25, newPct)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor    = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
  }, []);

  // ── State ──
  const [selectedLanguage, setSelectedLanguage] = useState<"cpp" | "python">("cpp");
  const [editorValue, setEditorValue] = useState("");
  const [runInput, setRunInput] = useState("5 5\n1 2 3 4 5\n2 0 2\n1 1 10\n2 0 2\n2 1 4\n2 0 4\n");
  const [consoleTab, setConsoleTab] = useState<"stdout" | "input" | "cases">("cases");
  const [leftTab, setLeftTab] = useState<"statement" | "cases" | "hints">("statement");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [consoleStdout, setConsoleStdout] = useState("");
  const [consoleError, setConsoleError] = useState("");
  const [testResults, setTestResults] = useState<LPTestResult[]>([]);
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
  const [showReference, setShowReference] = useState(false);

  // Build initial pending test results from sample cases whenever challenge changes
  const samples = SAMPLE_TEST_CASES[activeLesson] ?? [];

  useEffect(() => {
    // Load starter code template
    if (activeLesson === "challenge1") {
      setEditorValue(CODE_TEMPLATES.sum[selectedLanguage]);
    } else if (activeLesson === "challenge2") {
      setEditorValue(selectedLanguage === "cpp" ? MIN_CPP_TEMPLATE : MIN_PYTHON_TEMPLATE);
    } else if (activeLesson === "challenge3") {
      setEditorValue(CODE_TEMPLATES.max[selectedLanguage]);
    } else if (activeLesson === "challenge4") {
      setEditorValue(selectedLanguage === "cpp" ? ESCAPE_CPP_TEMPLATE : ESCAPE_PYTHON_TEMPLATE);
    }
    // Reset to pending sample cases
    const pending = samples.map((s, i): LPTestResult => ({
      testIndex: i,
      verdict: "pending",
      input: s.input,
      output: "",
      expected: s.expected,
      stderr: "",
      compileOutput: "",
      executionTime: "",
      memory: 0,
    }));
    setTestResults(pending);
    setActiveTestCaseIdx(0);
    setConsoleTab("cases");
  }, [activeLesson, selectedLanguage]);

  // ── Handlers ──
  const handleRunCode = async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setConsoleTab("cases");

    // Reset all samples to pending
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

        // Mark this case as actively running BEFORE the API call
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
          const expectedTrimmed = s.expected.trim();
          verdict = actualOutput === expectedTrimmed ? "accepted" : "wrong_answer";
        }

        results[i] = {
          testIndex: i,
          verdict,
          input: s.input,
          output: actualOutput || res.output || "",
          expected: s.expected,
          stderr: runtimeErr || "",
          compileOutput: compileErr || "",
          executionTime: res.executionTime || "",
          memory: res.memory || 0,
        };
        // On compile error: stamp all remaining pending cases with the same verdict
        // so the UI instantly shows Compile Error instead of staying on Running...
        if (compileErr) {
          for (let j = i + 1; j < results.length; j++) {
            results[j] = {
              ...results[j],
              verdict: "compile_error",
              compileOutput: compileErr,
            };
          }
        }
        setTestResults([...results]);
        if (compileErr) break;
      }
    } catch (err: any) {
      setConsoleError(err.message || "Execution failed. Check Judge0 connection.");
      setConsoleTab("stdout");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setConsoleTab("cases");
    setTestResults([]);
    const challengeId = activeLesson === "challenge1" ? "sum_segment_tree"
                      : activeLesson === "challenge2" ? "min_segment_tree"
                      : activeLesson === "challenge3" ? "max_segment_tree"
                      : "escape_route";
    try {
      const res = await api.post("/learning-path/submit", {
        code: editorValue,
        language: selectedLanguage,
        challengeId,
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
      setActiveTestCaseIdx(0);
      if (res.verdict === "accepted") {
        onPartComplete();
        setShowSuccess(true);
      }
    } catch (err: any) {
      setConsoleError(err.message || "Submission failed. Check Judge0 connection.");
      setConsoleTab("stdout");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helpers ──
  const todoHint = activeLesson === "challenge2" ? "/* ??? */" : "// TODO";

  // next lesson routing
  const nextLesson = activeLesson === "challenge1" ? "challenge2"
                   : activeLesson === "challenge2" ? "challenge3"
                   : activeLesson === "challenge3" ? "challenge4"
                   : "badge";
  const nextLabel  = activeLesson === "challenge1" ? "Next: Range Min →"
                   : activeLesson === "challenge2" ? "Next: Range Max →"
                   : activeLesson === "challenge3" ? "Next: Escape Route →"
                   : "🏆 Claim Your Badge";

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden", background: "var(--bg-primary)" }}
    >

      {/* ── Top chrome bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: "44px",
        background: "#0d0d12",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        {/* Left: difficulty + title + tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            fontSize: "12px", fontWeight: 700,
            color: ch.diffColor,
            background: `${ch.diffColor}18`,
            padding: "2px 10px", borderRadius: "999px",
            border: `1px solid ${ch.diffColor}55`,
          }}>
            {ch.difficulty}
          </span>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{ch.title}</span>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px",
            color: "var(--text-muted)", padding: "1px 8px",
            borderRadius: "4px", border: "1px solid var(--border-primary)",
            textTransform: "uppercase",
          }}>
            {ch.tag}
          </span>
        </div>

        {/* Right: Prev / Next challenge */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            disabled={challengeIdx === 0}
            onClick={() => setActiveLesson(CHALLENGES[challengeIdx - 1].id)}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "transparent", border: "1px solid var(--border-primary)",
              borderRadius: "6px", padding: "4px 10px",
              color: challengeIdx === 0 ? "var(--text-muted)" : "var(--text-primary)",
              fontSize: "12px", fontWeight: 600,
              cursor: challengeIdx === 0 ? "not-allowed" : "pointer",
              opacity: challengeIdx === 0 ? 0.4 : 1,
            }}
          >
            ‹ Prev
          </button>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", padding: "0 6px" }}>
            {challengeIdx + 1} / {CHALLENGES.length}
          </span>
          <button
            disabled={challengeIdx === CHALLENGES.length - 1}
            onClick={() => setActiveLesson(CHALLENGES[challengeIdx + 1].id)}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "transparent", border: "1px solid var(--border-primary)",
              borderRadius: "6px", padding: "4px 10px",
              color: challengeIdx === CHALLENGES.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
              fontSize: "12px", fontWeight: 600,
              cursor: challengeIdx === CHALLENGES.length - 1 ? "not-allowed" : "pointer",
              opacity: challengeIdx === CHALLENGES.length - 1 ? 0.4 : 1,
            }}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* ── Main resizable split ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", width: "100%", display: "flex" }}>
        {/* ══ LEFT PANEL: Problem Statement ══ */}
        <div
          style={{ width: `${leftPct}%`, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0a0a10", flexShrink: 0 }}
        >
          {/* Left tab bar */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0d0d12", flexShrink: 0 }}>
            {(["statement", "cases", "hints"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                style={{
                  padding: "11px 20px", fontSize: "13px", fontWeight: 600,
                  color: leftTab === t ? "var(--text-primary)" : "#6b7280",
                  background: "transparent", border: "none",
                  borderBottom: leftTab === t ? "2px solid var(--cm-cyan)" : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.15s",
                  textTransform: "capitalize", letterSpacing: "0.2px",
                }}
              >
                {t === "cases" ? "Test Cases" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Left panel body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

            {/* STATEMENT TAB */}
            {leftTab === "statement" && (
              <div style={{ fontFamily: "var(--font-sans)", lineHeight: 1.75, color: "#c9d1d9" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px", letterSpacing: "-0.3px" }}>
                  {ch.title}
                </h2>

                {activeLesson !== "challenge4" ? (
                  /* ── Challenges 1-3: standard segment tree statement ── */
                  <>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px", fontStyle: "italic" }}>
                      {activeLesson === "challenge1"
                        ? "The full solution is provided. Study it carefully, then submit."
                        : "Complete the missing parts of the Segment Tree implementation."}
                    </p>
                    <p style={{ marginBottom: "14px" }}>
                      You are given an array <em>A</em> of <em>N</em> integers and <em>Q</em> queries. Each query is one of two types:
                    </p>
                    <ul style={{ paddingLeft: "0", listStyle: "none", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <li style={{ display: "flex", gap: "10px" }}>
                        <span style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)", fontSize: "13px", background: "rgba(0,240,255,0.07)", padding: "2px 8px", borderRadius: "4px", flexShrink: 0 }}>1 idx val</span>
                        <span>Point update — set <em>A[idx] = val</em></span>
                      </li>
                      <li style={{ display: "flex", gap: "10px" }}>
                        <span style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)", fontSize: "13px", background: "rgba(0,240,255,0.07)", padding: "2px 8px", borderRadius: "4px", flexShrink: 0 }}>2 l r</span>
                        <span>
                          Range query — output the{" "}
                          <strong style={{ color: "var(--text-primary)" }}>
                            {activeLesson === "challenge1" ? "sum" : activeLesson === "challenge2" ? "minimum" : "maximum"}
                          </strong>{" "}
                          of <em>A[l…r]</em> (0-indexed, inclusive)
                        </span>
                      </li>
                    </ul>
                    {activeLesson !== "challenge1" && (
                      <>
                        <p style={{ marginBottom: "8px" }}>
                          <strong style={{ color: "var(--text-primary)" }}>Your task:</strong>{" "}
                          Fill in the{" "}
                          <span style={{ color: "var(--cm-red)", fontFamily: "var(--font-mono)", fontSize: "12px", background: "rgba(255,45,85,0.08)", padding: "1px 6px", borderRadius: "3px" }}>
                            {todoHint}
                          </span>{" "}
                          placeholders in the template:
                        </p>
                        <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px", color: "#9ca3af" }}>
                          {activeLesson === "challenge2" ? (
                            <>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>build()</code>: merge children using <strong style={{ color: "var(--text-primary)" }}>min</strong></li>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>update()</code>: merge children using <strong style={{ color: "var(--text-primary)" }}>min</strong></li>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>query()</code>: return identity for out-of-range</li>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>query()</code>: return <strong style={{ color: "var(--text-primary)" }}>min</strong> of left and right results</li>
                            </>
                          ) : (
                            <>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>build()</code>: change merge to <strong style={{ color: "var(--text-primary)" }}>max</strong></li>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>update()</code>: change merge to <strong style={{ color: "var(--text-primary)" }}>max</strong></li>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>query()</code>: correct identity value</li>
                              <li>In <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>query()</code>: return <strong style={{ color: "var(--text-primary)" }}>max</strong> of sub-results</li>
                            </>
                          )}
                        </ol>
                      </>
                    )}
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text-muted)", marginBottom: "10px" }}>Input Format</div>
                      <pre style={{ background: "#08080c", padding: "14px 16px", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", border: "1px solid rgba(255,255,255,0.06)", color: "#e2e8f0", margin: 0 }}>
                        {`N Q\nA[0] A[1] ... A[N-1]\n(Q lines of queries)`}
                      </pre>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text-muted)", marginBottom: "10px" }}>Sample</div>
                      <pre style={{ background: "#08080c", padding: "14px 16px", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", border: "1px solid rgba(255,255,255,0.06)", color: "#e2e8f0", margin: 0 }}>
                        {`5 5\n1 2 3 4 5\n2 0 2   → ${activeLesson === "challenge1" ? 6 : activeLesson === "challenge2" ? 1 : 3}\n1 1 10\n2 0 2   → ${activeLesson === "challenge1" ? 14 : activeLesson === "challenge2" ? 3 : 10}\n2 1 4   → ${activeLesson === "challenge1" ? 22 : activeLesson === "challenge2" ? 3 : 10}\n2 0 4   → ${activeLesson === "challenge1" ? 23 : activeLesson === "challenge2" ? 1 : 10}`}
                      </pre>
                    </div>
                  </>
                ) : (
                  /* ── Challenge 4: Cheapest Escape Route ── */
                  <>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px", fontStyle: "italic" }}>
                      Write the complete solution from scratch. The key insight is hidden in plain sight.
                    </p>
                    <p style={{ marginBottom: "14px" }}>
                      There are <em>N</em> cities in a line. Every city charges a base toll of{" "}
                      <strong style={{ color: "var(--cm-yellow)", fontFamily: "var(--font-mono)" }}>1000</strong> coins,
                      but each city offers a <strong style={{ color: "var(--cm-green)" }}>discount</strong>.
                      City <em>i</em> has discount <em>d[i]</em>, so it costs{" "}
                      <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>1000 - d[i]</code> to pass through.
                    </p>
                    <p style={{ marginBottom: "16px" }}>
                      For each query, pass through exactly{" "}
                      <strong style={{ color: "var(--text-primary)" }}>one city</strong> in{" "}
                      <em>[l, r]</em> — find the cheapest.
                    </p>
                    <ul style={{ paddingLeft: "0", listStyle: "none", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <li style={{ display: "flex", gap: "10px" }}>
                        <span style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)", fontSize: "13px", background: "rgba(0,240,255,0.07)", padding: "2px 8px", borderRadius: "4px", flexShrink: 0 }}>1 i v</span>
                        <span>City <em>i</em> changes its discount to <em>v</em></span>
                      </li>
                      <li style={{ display: "flex", gap: "10px" }}>
                        <span style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)", fontSize: "13px", background: "rgba(0,240,255,0.07)", padding: "2px 8px", borderRadius: "4px", flexShrink: 0 }}>2 l r</span>
                        <span>Print the <strong style={{ color: "var(--text-primary)" }}>minimum cost</strong> to pass through any one city in <em>[l, r]</em></span>
                      </li>
                    </ul>
                    {/* Constraints */}
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text-muted)", marginBottom: "8px" }}>Constraints</div>
                      <ul style={{ paddingLeft: "20px", color: "#9ca3af", fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <li>1 ≤ N, Q ≤ 10⁵</li>
                        <li>0 ≤ d[i] ≤ 999 · Base toll = 1000</li>
                        <li>All operations are <strong style={{ color: "var(--cm-yellow)" }}>1-indexed</strong></li>
                      </ul>
                    </div>
                    {/* Sample */}
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text-muted)", marginBottom: "10px" }}>Sample</div>
                      <pre style={{ background: "#08080c", padding: "14px 16px", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", border: "1px solid rgba(255,255,255,0.06)", color: "#e2e8f0", margin: 0 }}>
                        {`5 3\n100 300 200 500 400\n2 1 5   → 500\n2 2 4   → 500\n2 1 2   → 700`}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TEST CASES TAB */}
            {leftTab === "cases" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px", overflowY: "auto" }}>
                {testResults.length > 0 ? (() => {
                  const neutralVerdicts = ["accepted", "pending", "running"];
                  const hasRun = testResults.some(r => !["pending", "running"].includes(r.verdict));
                  const allAccepted = testResults.every(r => r.verdict === "accepted");
                  const anyFailed = testResults.some(r => !neutralVerdicts.includes(r.verdict));
                  const firstFailed = testResults.find(r => !neutralVerdicts.includes(r.verdict));
                  // Compile error is terminal — it overrides isStillRunning
                  const hasCompileError = testResults.some(r => r.verdict === "compile_error");
                  const isStillRunning = !hasCompileError && (testResults.some(r => r.verdict === "running" || r.verdict === "pending") || isRunning);

                  // Compute verdict string — isStillRunning always takes priority (unless compile error)
                  let verdictStr = "Pending";
                  let verdictColor = "var(--text-muted)";
                  if (isStillRunning) {
                    verdictStr = "Running...";
                    verdictColor = "var(--cm-cyan)";
                  } else if (!hasRun) {
                    verdictStr = "Run to check sample cases";
                    verdictColor = "var(--text-muted)";
                  } else if (anyFailed) {
                    const v = firstFailed!.verdict;
                    verdictStr = v === "wrong_answer" ? "Wrong Answer" : v === "compile_error" ? "Compile Error" : v === "runtime_error" ? "Runtime Error" : v === "time_limit_exceeded" ? "Time Limit Exceeded" : "Failed";
                    verdictColor = "var(--cm-red)";
                  } else if (allAccepted) {
                    verdictStr = "Accepted";
                    verdictColor = "var(--cm-green)";
                  }

                  const passedCount = testResults.filter(r => r.verdict === "accepted").length;
                  const currentRunningIdx = testResults.findIndex(r => r.verdict === "running");
                  
                  return (
                    <>
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: verdictColor, marginBottom: "4px", textTransform: "capitalize" }}>
                          {verdictStr}
                        </div>
                        {(hasRun || isStillRunning) && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {isStillRunning && !anyFailed
                              ? `Running case ${currentRunningIdx >= 0 ? currentRunningIdx + 1 : passedCount + 1} of ${samples.length}…`
                              : `${passedCount} / ${samples.length} testcases passed`}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                        {testResults.map((tc) => (
                          <button
                            key={tc.testIndex}
                            onClick={() => setActiveTestCaseIdx(tc.testIndex)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              background: activeTestCaseIdx === tc.testIndex ? "var(--bg-tertiary)" : "transparent",
                              border: `1px solid ${
                                tc.verdict === "running"
                                  ? "rgba(0,240,255,0.4)"
                                  : tc.verdict === "pending"
                                  ? "var(--border-primary)"
                                  : activeTestCaseIdx === tc.testIndex
                                  ? "var(--border-accent)"
                                  : "var(--border-primary)"
                              }`,
                              color: activeTestCaseIdx === tc.testIndex ? "var(--text-primary)" : "var(--text-secondary)",
                              transition: "all 0.2s"
                            }}
                          >
                            {tc.verdict === "accepted" ? (
                              <span style={{ color: "var(--cm-green)", fontSize: "14px" }}>✓</span>
                            ) : tc.verdict === "running" ? (
                              <span style={{
                                display: "inline-block",
                                width: "11px",
                                height: "11px",
                                borderRadius: "50%",
                                border: "2px solid rgba(0,240,255,0.25)",
                                borderTopColor: "var(--cm-cyan)",
                                animation: "spin 0.65s linear infinite",
                                flexShrink: 0,
                              }} />
                            ) : tc.verdict === "pending" ? (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: 1 }}>–</span>
                            ) : (
                              <span style={{ color: "var(--cm-red)", fontSize: "14px" }}>✗</span>
                            )}
                            Case {tc.testIndex + 1}
                          </button>
                        ))}
                      </div>

                      {/* Details for active case */}
                      {testResults[activeTestCaseIdx] && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          <div className={styles.tcDetailBlock}>
                            <div className={styles.tcDetailLabel} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Input</div>
                            <div className={styles.tcDetailVal} style={{ background: "#08080c", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>{testResults[activeTestCaseIdx].input}</div>
                          </div>
                          
                          {testResults[activeTestCaseIdx].output && (
                            <div className={styles.tcDetailBlock}>
                              <div className={styles.tcDetailLabel} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Actual Output</div>
                              <div className={styles.tcDetailVal} style={{ background: "#08080c", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", color: testResults[activeTestCaseIdx].verdict === "wrong_answer" ? "var(--cm-red)" : "inherit" }}>{testResults[activeTestCaseIdx].output}</div>
                            </div>
                          )}

                          {testResults[activeTestCaseIdx].expected && (
                            <div className={styles.tcDetailBlock}>
                              <div className={styles.tcDetailLabel} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Expected</div>
                              <div className={styles.tcDetailVal} style={{ background: "#08080c", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>{testResults[activeTestCaseIdx].expected}</div>
                            </div>
                          )}

                          {testResults[activeTestCaseIdx].stderr && (
                            <div className={styles.tcDetailBlock}>
                              <div className={styles.tcDetailLabel} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", color: "var(--cm-red)" }}>Stderr</div>
                              <div className={styles.tcDetailVal} style={{ background: "rgba(255,45,85,0.05)", border: "1px solid rgba(255,45,85,0.2)", padding: "12px", borderRadius: "8px", color: "var(--cm-red)" }}>{testResults[activeTestCaseIdx].stderr}</div>
                            </div>
                          )}
                          
                          {testResults[activeTestCaseIdx].compileOutput && (
                            <div className={styles.tcDetailBlock}>
                              <div className={styles.tcDetailLabel} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", color: "var(--cm-red)" }}>Compile Error</div>
                              <div className={styles.tcDetailVal} style={{ background: "rgba(255,45,85,0.05)", border: "1px solid rgba(255,45,85,0.2)", padding: "12px", borderRadius: "8px", color: "var(--cm-red)" }}>{testResults[activeTestCaseIdx].compileOutput}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })() : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
                    Run your code first, or submit to check all test cases.
                  </div>
                )}
              </div>
            )}

            {/* HINTS TAB */}
            {leftTab === "hints" && (() => {
              const hintSets: Record<string, { title: string; body: React.ReactNode }[]> = {
                challenge1: [
                  {
                    title: "Hint 1 — Reading the code",
                    body: <span>This challenge is <strong style={{ color: "var(--text-primary)" }}>read-only</strong>. Your goal is to understand the three parts: the <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>build</code>, <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>update</code>, and <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>query</code> functions. Identify what each does before moving on.</span>,
                  },
                  {
                    title: "Hint 2 — The merge step",
                    body: <span>The key is the merge line inside both <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>build</code> and <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>update</code>: <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>tree[node] = tree[2*node] + tree[2*node+1]</code>. Every other segment tree problem only changes this one line and the identity value.</span>,
                  },
                  {
                    title: "Hint 3 — Submitting",
                    body: <span>When you are ready, press <strong style={{ color: "var(--cm-green)" }}>Submit</strong>. The solution is already complete — all tests should pass without any edits.</span>,
                  },
                ],
                challenge2: [
                  {
                    title: "Hint 1 — Which operation changes?",
                    body: <span>The segment tree skeleton (build, update, query structure) is identical to the Sum Tree. Only one thing changes per function. Think about what you are storing per node.</span>,
                  },
                  {
                    title: "Hint 2 — The identity value",
                    body: <span>When a query range does not overlap a node at all, return a value that does not affect the result. For minimum, returning something too small is wrong. What is the safe identity for <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>min</code>? Think about the largest possible integer.</span>,
                  },
                  {
                    title: "Hint 3 — Specific identity",
                    body: <span>Return <code style={{ color: "var(--cm-yellow)", fontFamily: "var(--font-mono)" }}>INT_MAX</code> (or <code style={{ color: "var(--cm-yellow)", fontFamily: "var(--font-mono)" }}>LLONG_MAX</code> if using <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>long long</code>) for the out-of-range base case. If your tree stores <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>int</code> but you return <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>LLONG_MAX</code>, silent integer truncation will produce wrong answers.</span>,
                  },
                ],
                challenge3: [
                  {
                    title: "Hint 1 — Which operation changes?",
                    body: <span>The structure is the same as the Min and Sum trees. Find the single line in each of <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>build</code>, <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>update</code>, and <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>query</code> that differs from the min tree.</span>,
                  },
                  {
                    title: "Hint 2 — The identity value",
                    body: <span>The out-of-range return value must always lose to any real value in the array. What is the identity for <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>max</code>? Think about the smallest possible integer.</span>,
                  },
                  {
                    title: "Hint 3 — Specific identity",
                    body: <span>Return <code style={{ color: "var(--cm-yellow)", fontFamily: "var(--font-mono)" }}>INT_MIN</code> (or <code style={{ color: "var(--cm-yellow)", fontFamily: "var(--font-mono)" }}>LLONG_MIN</code>) for the out-of-range case. The array can contain negative numbers, so returning <code style={{ color: "var(--cm-yellow)", fontFamily: "var(--font-mono)" }}>0</code> would be silently wrong on those inputs.</span>,
                  },
                ],
                challenge4: [
                  {
                    title: "Hint 1 — What are you minimising?",
                    body: <span>The cost of city <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>i</code> is <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>1000 - d[i]</code>. Write out the expression for the minimum cost over range <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>[l, r]</code> and see if you can simplify it algebraically before writing any code.</span>,
                  },
                  {
                    title: "Hint 2 — The algebraic flip",
                    body: <span>Minimising <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>1000 - d[i]</code> over a range is equivalent to maximising <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>d[i]</code> over that range. You do not need a min tree — you need a <strong style={{ color: "var(--text-primary)" }}>range max tree on the discounts</strong>.</span>,
                  },
                  {
                    title: "Hint 3 — Indexing",
                    body: <span>Input queries are <strong style={{ color: "var(--cm-yellow)" }}>1-indexed</strong>. If your segment tree is 0-indexed internally, subtract 1 from <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>i</code>, <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>l</code>, and <code style={{ color: "var(--cm-cyan)", fontFamily: "var(--font-mono)" }}>r</code> when passing them into tree functions. The reference template keeps the tree 1-indexed to avoid this translation entirely.</span>,
                  },
                ],
              };
              const hints = hintSets[activeLesson] ?? hintSets["challenge2"];
              return (
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Hints &amp; Tips
                  </div>
                  {hints.map((hint, idx) => (
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
                        <span>{hint.title}</span>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>▶</span>
                      </summary>
                      <div style={{ padding: "12px 14px 14px 14px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        {hint.body}
                      </div>
                    </details>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Horizontal drag divider ── */}
        <div
          onMouseDown={onDividerMouseDown}
          style={{
            width: "6px",
            background: "rgba(255,255,255,0.05)",
            cursor: "col-resize",
            flexShrink: 0,
            transition: "background 0.15s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,240,255,0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        />

        {/* ══ RIGHT PANEL: Editor + Console ══ */}
        <div
          ref={rightPanelRef}
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}
        >
          {/* Editor header */}
          <div className={styles.editorHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select
                className={styles.langSelector}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as "cpp" | "python")}
              >
                <option value="cpp">C++</option>
                <option value="python">Python</option>
              </select>
            </div>
            <div className={styles.actionBtns}>
              {activeLesson === "challenge4" && (
                <button
                  onClick={() => setShowReference(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "rgba(255,215,0,0.08)",
                    border: "1px solid rgba(255,215,0,0.3)",
                    borderRadius: "6px",
                    color: "#fbbf24",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,215,0,0.14)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,215,0,0.08)"; }}
                >
                  📋 Refer Template
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                style={{ minWidth: "70px" }}
              >
                {isRunning ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                    Running
                  </span>
                ) : "▶ Run"}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                style={{ minWidth: "80px" }}
              >
                {isSubmitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                    Checking
                  </span>
                ) : "Submit"}
              </button>
            </div>
          </div>

          {/* Monaco Editor — dynamic height */}
          <div style={{ height: `${editorPct}%`, minHeight: 0, overflow: "hidden", position: "relative", background: "#1e1e1e" }}>
            <CodeEditor
              value={editorValue}
              language={selectedLanguage}
              onChange={setEditorValue}
              readOnly={activeLesson === "challenge1"}
            />
          </div>

          {/* ── Vertical drag divider (editor ↕ console) ── */}
          <div
            onMouseDown={onVerticalDividerMouseDown}
            style={{
              height: "6px",
              background: "rgba(255,255,255,0.05)",
              cursor: "row-resize",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
              transition: "background 0.15s ease",
              zIndex: 10,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,240,255,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
            ))}
          </div>

          {/* Console — fills remaining height */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#08080c" }}>
            <div className={styles.consoleTabs}>
              {(["stdout", "input", "cases"] as const).map((t) => (
                <button
                  key={t}
                  className={`${styles.consoleTab} ${consoleTab === t ? styles.consoleTabActive : ""}`}
                  onClick={() => setConsoleTab(t)}
                >
                  {t === "stdout" ? "Output" : t === "input" ? "Custom Input" : "Test Cases"}
                </button>
              ))}
            </div>

            <div className={styles.consoleBody}>
              {consoleTab === "stdout" && (
                <div style={{ padding: "var(--space-md)", flex: 1, overflowY: "auto" }}>
                  {consoleError ? (
                    <pre className={styles.consoleError}>{consoleError}</pre>
                  ) : consoleStdout ? (
                    <pre className={styles.consoleOutput}>{consoleStdout}</pre>
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      Run your code to see output here.
                    </div>
                  )}
                </div>
              )}
              {consoleTab === "input" && (
                <textarea
                  className={styles.customInputArea}
                  value={runInput}
                  onChange={(e) => setRunInput(e.target.value)}
                  placeholder="Enter custom input here..."
                />
              )}
              {consoleTab === "cases" && (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                  {testResults.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "12px" }}>
                      Submit your solution to see test case results.
                    </div>
                  ) : (() => {
                    const allPending = testResults.every(r => r.verdict === "pending");
                    if (allPending) return (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                        <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
                        Submit your code to run all test cases.
                      </div>
                    );
                    return (
                    <>
                      {/* Overall Verdict Header */}
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {testResults[0]?.verdict === "finished" ? (
                            <span style={{ color: "var(--text-secondary)", fontSize: "18px", fontWeight: 700 }}>Executed</span>
                          ) : (() => {
                            const neutralR = ["accepted", "finished", "pending", "running"];
                            // Compile error is terminal — overrides isStillRunning
                            const hasCompileErrorR = testResults.some(r => r.verdict === "compile_error");
                            const isStillRunningR = !hasCompileErrorR && (testResults.some(r => r.verdict === "running" || r.verdict === "pending") || isRunning);
                            const allPassed = testResults.every(r => r.verdict === "accepted");
                            const firstFail = testResults.find(r => !neutralR.includes(r.verdict));
                            if (isStillRunningR) return <span style={{ color: "var(--cm-cyan)", fontSize: "18px", fontWeight: 700 }}>Running...</span>;
                            if (allPassed) return <span style={{ color: "var(--cm-green)", fontSize: "18px", fontWeight: 700 }}>Accepted</span>;
                            if (!firstFail) return <span style={{ color: "var(--text-muted)", fontSize: "18px", fontWeight: 700 }}>Running...</span>;
                            const failMsg = firstFail.verdict === "wrong_answer" ? "Wrong Answer" : firstFail.verdict === "compile_error" ? "Compile Error" : firstFail.verdict === "runtime_error" ? "Runtime Error" : firstFail.verdict === "time_limit_exceeded" ? "Time Limit Exceeded" : "Failed";
                            return <span style={{ color: "var(--cm-red)", fontSize: "18px", fontWeight: 700 }}>{failMsg}</span>;
                          })()}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                          {testResults[0]?.verdict === "finished" ? "Custom Run (Correctness not checked)" : `${testResults.filter(r => r.verdict === "accepted").length} / ${testResults.length} testcases passed`}
                        </div>
                      </div>

                      {/* Test Case Pills */}
                      <div style={{ display: "flex", gap: "8px", padding: "12px 16px", overflowX: "auto" }}>
                        {testResults.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTestCaseIdx(i)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: activeTestCaseIdx === i
                                ? "1px solid rgba(255,255,255,0.2)"
                                : r.verdict === "running"
                                ? "1px solid rgba(0,240,255,0.3)"
                                : "1px solid transparent",
                              background: activeTestCaseIdx === i ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                              color: (r.verdict === "accepted" || r.verdict === "finished") ? "var(--text-primary)" : r.verdict === "running" || r.verdict === "pending" ? "var(--text-secondary)" : "var(--cm-red)",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              whiteSpace: "nowrap",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {r.verdict === "finished" ? (
                              <span style={{ color: "var(--cm-cyan)" }}>▶</span>
                            ) : r.verdict === "accepted" ? (
                              <span style={{ color: "var(--cm-green)" }}>✓</span>
                            ) : r.verdict === "running" ? (
                              <span style={{
                                display: "inline-block",
                                width: "11px",
                                height: "11px",
                                borderRadius: "50%",
                                border: "2px solid rgba(0,240,255,0.25)",
                                borderTopColor: "var(--cm-cyan)",
                                animation: "spin 0.65s linear infinite",
                                flexShrink: 0,
                              }} />
                            ) : r.verdict === "pending" ? (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>–</span>
                            ) : (
                              <span style={{ color: "var(--cm-red)" }}>✗</span>
                            )}
                            {testResults[0]?.verdict === "finished" ? "Custom" : `Case ${i + 1}`}
                          </button>
                        ))}
                      </div>

                      {/* Active Test Case Details */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {testResults[activeTestCaseIdx] && (() => {
                          const tc = testResults[activeTestCaseIdx];
                          return (
                            <>
                              <div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Input</div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                  {tc.input || "No input"}
                                </div>
                              </div>
                              {tc.output !== undefined && (
                                <div>
                                  <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "4px" }}>Actual Output</div>
                                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", wordBreak: "break-all", color: (tc.verdict === "finished") ? "var(--cm-cyan)" : (tc.verdict === "accepted" || tc.verdict === "finished") ? "var(--text-primary)" : "var(--cm-red)" }}>
                                    {tc.output || <span style={{ opacity: 0.5 }}>No output</span>}
                                  </div>
                                </div>
                              )}
                              {tc.expected !== "" && (
                                <div>
                                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Expected</div>
                                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                    {tc.expected}
                                  </div>
                                </div>
                              )}
                              {tc.stderr && (
                                <div>
                                  <div style={{ fontSize: "12px", color: "var(--cm-red)", marginBottom: "4px" }}>Standard Error</div>
                                  <div style={{ background: "rgba(255,0,0,0.1)", padding: "10px", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--cm-red)" }}>
                                    {tc.stderr}
                                  </div>
                                </div>
                              )}
                              {tc.compileOutput && (
                                <div>
                                  <div style={{ fontSize: "12px", color: "var(--cm-yellow)", marginBottom: "4px" }}>Compile Output</div>
                                  <div style={{ background: "rgba(255,255,0,0.05)", padding: "10px", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--cm-yellow)" }}>
                                    {tc.compileOutput}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </>
                    );
                  })()}
                </div>
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
              {ch.title}
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
                onClick={() => { setShowSuccess(false); setActiveLesson(nextLesson); }}
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
                {nextLabel}
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
      {/* ── Reference Template Modal (challenge4 only) ── */}
      {showReference && (
        <div
          onClick={() => setShowReference(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "820px",
              maxHeight: "85vh",
              background: "#0d0d14",
              border: "1px solid rgba(255,215,0,0.25)",
              borderRadius: "12px",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.1)",
            }}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "#0a0a10",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>📋</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>Segment Tree Template</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>Generic scaffold — adapt it to solve the problem</div>
                </div>
              </div>
              <button
                onClick={() => setShowReference(false)}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px", color: "var(--text-muted)",
                  width: "28px", height: "28px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: "16px", lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              margin: "14px 20px 0",
              padding: "10px 14px",
              background: "rgba(0,240,255,0.05)",
              border: "1px solid rgba(0,240,255,0.2)",
              borderRadius: "8px",
              fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6,
              flexShrink: 0,
            }}>
              💡 A standard segment tree structure — fill in the <code style={{ fontFamily: "var(--font-mono)", background: "rgba(0,240,255,0.08)", padding: "1px 5px", borderRadius: "3px" }}>// TODO</code> parts with the correct logic for this problem.
            </div>

            {/* Code block */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
              <pre style={{
                background: "#08080c",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                padding: "16px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: "12.5px",
                lineHeight: 1.65,
                color: "#e2e8f0",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowX: "auto",
              }}>
                {ESCAPE_CPP_REFERENCE}
              </pre>
            </div>

            {/* Footer actions */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: "10px",
              padding: "12px 20px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              background: "#0a0a10",
              flexShrink: 0,
            }}>
              <button
                onClick={() => { setEditorValue(ESCAPE_CPP_REFERENCE); setShowReference(false); }}
                style={{
                  background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.35)",
                  borderRadius: "6px", color: "#fbbf24",
                  fontSize: "12px", fontWeight: 600,
                  padding: "6px 14px", cursor: "pointer",
                }}
              >
                Load Scaffold into Editor
              </button>
              <button
                onClick={() => setShowReference(false)}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px", color: "var(--text-secondary)",
                  fontSize: "12px", fontWeight: 600,
                  padding: "6px 14px", cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
