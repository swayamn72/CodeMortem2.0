"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "@/app/learn/segment-tree/page.module.css";
import { useProgressStore } from "@/stores/progressStore";
import { useAuthStore } from "@/stores/authStore";
import BadgeCard from "@/components/BadgeCard";
import { getBadgeDef } from "@/lib/badges";

// ── Subcomponents ──
import McqCheckpoint from "./learn/segment-tree/McqCheckpoint";
import TreeVisualizer from "./learn/segment-tree/TreeVisualizer";

import CourseLayout from "@/components/course/CourseLayout";
import ChallengeIde from "@/components/course/ChallengeIde";
import { SEGMENT_TREE_COURSE } from "./learn/segment-tree/config";
import { ST_CHALLENGES } from "./learn/segment-tree/constants";


// ── Data ──
import {
  NAIVE_NARRATIONS,
  TREE_BUILD_NARRATIONS,
  TREE_QUERY_NARRATIONS,
  TREE_UPDATE_NARRATIONS,
  MCQ_PART_1,
  MCQ_PART_2,
  TREE_NODES,
  TEMPLATE_LINES,
} from "./learn/segment-tree/constants";

import type { Lesson } from "./learn/segment-tree/types";

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/** Basic C++ / Python syntax highlighter for the code walkthrough panel */
function renderHighlightedCode(code: string) {
  if (!code) return <span className={styles.synNormal}>{"\n"}</span>;
  const parts = code.split(/(\bstruct\b|\bint\b|\bvoid\b|\blong\b|\bconst\b|\bvector\b|\bif\b|\belse\b|\breturn\b|\bclass\b|\bdef\b|\bself\b|\bimport\b|\bprint\b|\bfor\b|\bin\b|\bwhile\b|#.*|\/\/.*)/);
  return parts.map((part, i) => {
    if (part.startsWith("//") || part.startsWith("#")) {
      return <span key={i} className={styles.synComment}>{part}</span>;
    }
    switch (part) {
      case "struct": case "class": case "def": case "if": case "else":
      case "return": case "for": case "in": case "while": case "import":
        return <span key={i} className={styles.synKeyword}>{part}</span>;
      case "int": case "void": case "long": case "vector": case "self":
        return <span key={i} className={styles.synType}>{part}</span>;
      default:
        return <span key={i} className={styles.synNormal}>{part}</span>;
    }
  });
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────

// The stable ID used as the key in the progress store


// Every lesson/exercise that must be completed to finish the module


// Part membership for quick lookup


export default function SegmentTreePath() {
  const [activeLesson, setActiveLesson] = useState("lesson1");
  const isChallenge = activeLesson.startsWith("challenge");

  const { markLessonComplete, isLessonComplete, earnedBadges } = useProgressStore();
  const { user } = useAuthStore();
  const isPremiumActive = user?.isPremium && (
    !user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
  );

  const badgeDef = getBadgeDef(SEGMENT_TREE_COURSE.moduleId);
  const badgeEarnedAt = earnedBadges[SEGMENT_TREE_COURSE.moduleId];
  const profileHref = user?.username ? `/profile/${user.username}` : "/profile";

  const part1Complete = SEGMENT_TREE_COURSE.lessons.filter(l => l.part === 1).every((l) => isLessonComplete(SEGMENT_TREE_COURSE.moduleId, l.id));
  const part2Complete = SEGMENT_TREE_COURSE.lessons.filter(l => l.part === 2).every((l) => isLessonComplete(SEGMENT_TREE_COURSE.moduleId, l.id));
  const part3Complete = SEGMENT_TREE_COURSE.lessons.filter(l => l.part === 3).every((l) => isLessonComplete(SEGMENT_TREE_COURSE.moduleId, l.id));

  const completeLessonAndGo = (lessonId: string, nextLessonId?: string) => {
    markLessonComplete(SEGMENT_TREE_COURSE.moduleId, lessonId);
    if (nextLessonId) setActiveLesson(nextLessonId);
  };

  useEffect(() => {
    if (activeLesson === "badge") {
      markLessonComplete(SEGMENT_TREE_COURSE.moduleId, "badge");
    }
  }, [activeLesson, markLessonComplete]);

  // ── MCQ State ──
  const [mcqAnswers1, setMcqAnswers1] = useState<Record<number, number>>({});
  const [mcqChecked1, setMcqChecked1] = useState<Record<number, boolean>>({});
  const [mcqAnswers2, setMcqAnswers2] = useState<Record<number, number>>({});
  const [mcqChecked2, setMcqChecked2] = useState<Record<number, boolean>>({});

  // ── Lesson 2: N/Q Slider State ──
  const [sliderN, setSliderN] = useState(1000);
  const [sliderQ, setSliderQ] = useState(1000);

  // ── Lesson 5b: Array Representation State ──
  const [highlightedNode, setHighlightedNode] = useState<number | null>(null);

  // ── Lesson 1: Naive Simulation ──
  const naiveArray = [3, 1, 2, 5, 8, 7, 6, 4];
  const [naiveStep, setNaiveStep] = useState(0);
  const [naiveQueryIdx, setNaiveQueryIdx] = useState(0);
  const [naiveScannedCount, setNaiveScannedCount] = useState(0);
  const [naiveRunningSum, setNaiveRunningSum] = useState(0);
  const [isNaiveAutoplay, setIsNaiveAutoplay] = useState(false);
  const naiveAutoplayRef = useRef<NodeJS.Timeout | null>(null);

  const naiveQueries = [
    { label: "Q1: Sum[1, 5]", l: 1, r: 5, steps: [1, 2, 3, 4, 5, 6], baseStep: 1 },
    { label: "Q2: Sum[0, 2]", l: 0, r: 2, steps: [7, 8, 9, 10], baseStep: 7 },
    { label: "Q3: Sum[4, 7]", l: 4, r: 7, steps: [11, 12, 13, 14, 15], baseStep: 11 },
  ];

  // ── Lesson 3/4/5: Segment Tree Simulator ──
  const [treeBuildStep, setTreeBuildStep] = useState(0);
  const [treeQueryStep, setTreeQueryStep] = useState(0);
  const [treeUpdateStep, setTreeUpdateStep] = useState(0);

  // ── Lesson 6: Code Walkthrough ──
  const [walkthroughLine, setWalkthroughLine] = useState<number>(4);

  // ─── Node overlap class helper (lesson 4) ───
  const getQueryNodeOverlap = (nodeId: number): string => {
    const step = treeQueryStep;
    if (step === 0) return styles.nodeNeutralCircle;
    if (step === 1) { if (nodeId === 1) return styles.nodeOverlapPartial; }
    if (step === 2) { if (nodeId === 1 || nodeId === 2) return styles.nodeOverlapPartial; }
    if (step === 3) { if ([1, 2, 4].includes(nodeId)) return styles.nodeOverlapPartial; }
    if (step === 4) {
      if ([1, 2, 4].includes(nodeId)) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
    }
    if (step === 5) {
      if ([1, 2, 4].includes(nodeId)) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9) return styles.nodeOverlapFull;
    }
    if (step === 6) {
      if ([1, 2, 4].includes(nodeId)) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9 || nodeId === 5) return styles.nodeOverlapFull;
    }
    if (step === 7) {
      if ([1, 2, 4].includes(nodeId)) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9 || nodeId === 5) return styles.nodeOverlapFull;
      if (nodeId === 3) return styles.nodeOverlapPartial;
    }
    if (step === 8) {
      if ([1, 2, 3, 4].includes(nodeId)) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9 || nodeId === 5) return styles.nodeOverlapFull;
      if (nodeId === 6) return styles.nodeOverlapFull;
    }
    if (step === 9) {
      if ([1, 2, 3, 4].includes(nodeId)) return styles.nodeOverlapPartial;
      if (nodeId === 8 || nodeId === 7) return styles.nodeOverlapNone;
      if (nodeId === 9 || nodeId === 5 || nodeId === 6) return styles.nodeOverlapFull;
    }
    if (step === 10) {
      if (nodeId === 9 || nodeId === 5 || nodeId === 6) return styles.nodeOverlapFull;
      if (nodeId === 8 || nodeId === 7) return styles.nodeOverlapNone;
      if ([1, 2, 3, 4].includes(nodeId)) return styles.nodeOverlapPartial;
    }
    return styles.nodeNeutralCircle;
  };

  const getUpdateNodeState = (nodeId: number): string => {
    const step = treeUpdateStep;
    if (step >= 1 && nodeId === 11) return styles.nodeUpdateCircle;
    if (step >= 2 && nodeId === 5) return styles.nodeUpdateCircle;
    if (step >= 3 && nodeId === 2) return styles.nodeUpdateCircle;
    if (step >= 4 && nodeId === 1) return styles.nodeUpdateCircle;
    return styles.nodeNeutralCircle;
  };

  // ── Update display values for lesson 5 ──
  const updateDisplayValues: Record<number, number> = {};
  if (treeUpdateStep >= 1) updateDisplayValues[11] = 10;
  if (treeUpdateStep >= 2) updateDisplayValues[5] = 12;
  if (treeUpdateStep >= 3) updateDisplayValues[2] = 16;
  if (treeUpdateStep >= 4) updateDisplayValues[1] = 41;

  // ─────────────────────────────────────────────
  //  Naive autoplay
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (isNaiveAutoplay) {
      naiveAutoplayRef.current = setInterval(() => { handleNaiveNextStep(); }, 1500);
    } else {
      if (naiveAutoplayRef.current) clearInterval(naiveAutoplayRef.current);
    }
    return () => { if (naiveAutoplayRef.current) clearInterval(naiveAutoplayRef.current); };
  }, [isNaiveAutoplay, naiveStep, naiveQueryIdx]);

  const syncNaiveCounters = (step: number) => {
    if (step >= 1 && step <= 6) {
      setNaiveQueryIdx(0);
      const scanned = step - 1;
      setNaiveScannedCount(scanned);
      let sum = 0; for (let i = 0; i < scanned; i++) sum += naiveArray[1 + i];
      setNaiveRunningSum(sum);
    } else if (step >= 7 && step <= 10) {
      setNaiveQueryIdx(1);
      const scanned = step - 7;
      setNaiveScannedCount(scanned);
      let sum = 0; for (let i = 0; i < scanned; i++) sum += naiveArray[i];
      setNaiveRunningSum(sum);
    } else if (step >= 11 && step <= 15) {
      setNaiveQueryIdx(2);
      const scanned = step - 11;
      setNaiveScannedCount(scanned);
      let sum = 0; for (let i = 0; i < scanned; i++) sum += naiveArray[4 + i];
      setNaiveRunningSum(sum);
    } else {
      setNaiveScannedCount(0);
      setNaiveRunningSum(0);
    }
  };

  const handleNaiveNextStep = () => {
    if (naiveStep >= 16) { setIsNaiveAutoplay(false); return; }
    const next = naiveStep + 1;
    setNaiveStep(next);
    syncNaiveCounters(next);
  };

  const handleNaivePrevStep = () => {
    if (naiveStep <= 0) return;
    const prev = naiveStep - 1;
    setNaiveStep(prev);
    syncNaiveCounters(prev);
  };

  const selectNaiveQuery = (qIdx: number) => {
    setNaiveQueryIdx(qIdx);
    setNaiveStep(naiveQueries[qIdx].baseStep);
    setNaiveScannedCount(0);
    setNaiveRunningSum(0);
    setIsNaiveAutoplay(false);
  };

  const getScanningIndex = () => {
    if (naiveStep >= 2 && naiveStep <= 6) return 1 + (naiveStep - 2);
    if (naiveStep >= 8 && naiveStep <= 10) return naiveStep - 8;
    if (naiveStep >= 12 && naiveStep <= 15) return 4 + (naiveStep - 12);
    return -1;
  };

  const isIndexInActiveQuery = (idx: number) => {
    const q = naiveQueries[naiveQueryIdx];
    return naiveStep > 0 && naiveStep < 16 && idx >= q.l && idx <= q.r;
  };

  // ─────────────────────────────────────────────
  //  MCQ Handlers
  // ─────────────────────────────────────────────
  const handleMcqSelect1 = (qId: number, optIdx: number) => {
    if (mcqChecked1[qId]) return;
    setMcqAnswers1({ ...mcqAnswers1, [qId]: optIdx });
  };
  const handleMcqCheckAnswer1 = (qId: number) => {
    if (mcqAnswers1[qId] === undefined) return;
    const newChecked = { ...mcqChecked1, [qId]: true };
    setMcqChecked1(newChecked);
    if (newChecked[1] && newChecked[2] && mcqAnswers1[1] === MCQ_PART_1[0].answer && mcqAnswers1[2] === MCQ_PART_1[1].answer) {
      markLessonComplete(SEGMENT_TREE_COURSE.moduleId, "mcq1");
    }
  };
  const handleMcqSelect2 = (qId: number, optIdx: number) => {
    if (mcqChecked2[qId]) return;
    setMcqAnswers2({ ...mcqAnswers2, [qId]: optIdx });
  };
  const handleMcqCheckAnswer2 = (qId: number) => {
    if (mcqAnswers2[qId] === undefined) return;
    const newChecked = { ...mcqChecked2, [qId]: true };
    setMcqChecked2(newChecked);
    if (newChecked[1] && newChecked[2] && newChecked[3] &&
      mcqAnswers2[1] === MCQ_PART_2[0].answer &&
      mcqAnswers2[2] === MCQ_PART_2[1].answer &&
      mcqAnswers2[3] === MCQ_PART_2[2].answer) {
      markLessonComplete(SEGMENT_TREE_COURSE.moduleId, "mcq2");
    }
  };

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <CourseLayout
      config={SEGMENT_TREE_COURSE}
      activeLesson={activeLesson}
      setActiveLesson={setActiveLesson}
      isChallenge={isChallenge}
      isPremiumActive={isPremiumActive}
    >

      {/* ── Content Pane ── */}
      <section
        className={styles.contentPane}
        style={isChallenge ? { padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" } : {}}
      >
        <div
          className={isChallenge
            ? styles.challengeWrapper
            : (activeLesson === "lesson6" ? styles.contentContainerWide : styles.contentContainer)}
        >

          {/* ==================== LESSON 1 ==================== */}
          {activeLesson === "lesson1" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 1: The Naive Approach</h1>
                <p>Understanding range-sum queries and their baseline costs.</p>
              </div>
              <div className={styles.narration}>{NAIVE_NARRATIONS[naiveStep]}</div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Naive Range-Sum Simulator</span>
                  <div className={styles.animControls}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setNaiveStep(0); setNaiveScannedCount(0); setNaiveRunningSum(0); setIsNaiveAutoplay(false); }}>↺ Reset</button>
                    <button className="btn btn-secondary btn-sm" disabled={naiveStep === 0} onClick={handleNaivePrevStep}>◀ Prev</button>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsNaiveAutoplay(!isNaiveAutoplay)}>
                      {isNaiveAutoplay ? "⏸ Pause" : "▶ Autoplay"}
                    </button>
                    <button className="btn btn-secondary btn-sm" disabled={naiveStep >= 16} onClick={handleNaiveNextStep}>Next ▶</button>
                  </div>
                </div>

                <div className={styles.arrayRow}>
                  {naiveArray.map((val, idx) => {
                    const isScanning = idx === getScanningIndex();
                    const isQueryOverlap = isIndexInActiveQuery(idx);
                    let cellClass = styles.arrayCell;
                    if (isScanning) cellClass += ` ${styles.cellScanning}`;
                    else if (isQueryOverlap) cellClass += ` ${styles.cellActive}`;
                    return (
                      <div key={idx} className={cellClass}>
                        <span className={styles.cellVal}>{val}</span>
                        <span className={styles.cellIdx}>[{idx}]</span>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.queryPanel}>
                  <div className={styles.queryInfo}><strong>Select a Range Query to Animate:</strong></div>
                  <div className={styles.queryList}>
                    {naiveQueries.map((q, idx) => (
                      <button
                        key={idx}
                        className={`${styles.queryItem} ${naiveQueryIdx === idx ? styles.queryItemActive : ""}`}
                        onClick={() => selectNaiveQuery(idx)}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.counterGrid}>
                    <div className={styles.counterCard}>
                      <div className={styles.counterVal}>{naiveScannedCount}</div>
                      <div className={styles.counterLabel}>Scanned Elements / Operations</div>
                    </div>
                    <div className={styles.counterCard}>
                      <div className={styles.counterVal}>{naiveRunningSum}</div>
                      <div className={styles.counterLabel}>Accumulated Sum</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-glass" style={{ marginTop: "2rem" }}>
                <p>
                  <strong>Takeaway:</strong> In the naive approach, answering a query requires iterating through
                  the range [L, R] element by element. In the worst case (L = 0, R = N - 1), we perform N operations.
                  For Q queries, this becomes an O(N * Q) cost. Let&apos;s see how this scales.
                </p>
                <button className="btn btn-accent btn-sm" style={{ marginTop: "12px" }} onClick={() => completeLessonAndGo("lesson1", "lesson2")}>
                  Continue to Lesson 2 →
                </button>
              </div>
            </div>
          )}

          {/* ==================== LESSON 2 ==================== */}
          {activeLesson === "lesson2" && (() => {
            const ops = sliderN * sliderQ;
            const isTLE = ops > 1e8;
            const LOG_MIN = 2, LOG_MAX = 10, CHART_H = 220;
            const getBarH = (exp: number) => Math.round(((exp - LOG_MIN) / (LOG_MAX - LOG_MIN)) * CHART_H);
            const cpuLineBottom = Math.round(((8 - LOG_MIN) / (LOG_MAX - LOG_MIN)) * CHART_H);
            const chartBars = [
              { label: "N,Q = 10", ops: 1e2, exp: 2, color: "#00ff88" },
              { label: "N,Q = 100", ops: 1e4, exp: 4, color: "#ffd700" },
              { label: "N,Q = 1,000", ops: 1e6, exp: 6, color: "#ff8c00" },
              { label: "N,Q = 10⁵", ops: 1e10, exp: 10, color: "#ff2d55" },
            ];
            return (
              <div>
                <div className={styles.titleArea}>
                  <h1>Lesson 2: Why This Hurts</h1>
                  <p>Analyzing how O(N · Q) scales under competitive programming limits.</p>
                </div>
                <div className={styles.narration}>
                  Competitive programming platforms usually enforce a <strong>1.0-second time limit</strong>.
                  A standard CPU can handle about <strong>10⁸</strong> (100 million) basic operations per second.
                  When <strong>N = 10⁵</strong> and <strong>Q = 10⁵</strong>, a naive O(N · Q) algorithm
                  performs <strong>10¹⁰ operations</strong> — 100× over the limit — resulting in a{" "}
                  <strong style={{ color: "var(--cm-red)" }}>Time Limit Exceeded (TLE)</strong> verdict.
                </div>

                {/* Chart */}
                <div className={`${styles.animationCard} ${styles.dangerGlow}`}>
                  <div className={styles.animationHeader}>
                    <span className={styles.animationTitle}>Operation Count — Log Scale Chart</span>
                    <span className="badge badge-live" style={{ color: "var(--cm-red)" }}>TLE Zone</span>
                  </div>
                  <div style={{ position: "relative", height: `${CHART_H + 60}px`, display: "flex", alignItems: "flex-end", paddingBottom: "40px" }}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: `${CHART_H}px`, paddingRight: "12px", minWidth: "52px" }}>
                      {[10, 8, 6, 4, 2].map(exp => (
                        <span key={exp} style={{ fontSize: "11px", color: exp === 8 ? "var(--cm-red)" : "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: exp === 8 ? 700 : 400, lineHeight: 1 }}>
                          10{exp === 10 ? "¹⁰" : exp === 8 ? "⁸" : exp === 6 ? "⁶" : exp === 4 ? "⁴" : "²"}
                        </span>
                      ))}
                    </div>
                    <div style={{ flex: 1, position: "relative", height: `${CHART_H}px`, borderLeft: "1px solid var(--border-primary)", borderBottom: "2px solid var(--border-primary)" }}>
                      {[2, 4, 6, 8, 10].map(exp => {
                        const pct = ((exp - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
                        return (
                          <div key={exp} style={{ position: "absolute", bottom: `${pct}%`, left: 0, right: 0, borderTop: exp === 8 ? "none" : "1px solid rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                        );
                      })}
                      <div style={{ position: "absolute", bottom: `${cpuLineBottom / CHART_H * 100}%`, left: 0, right: 0, borderTop: "2px dashed var(--cm-red)", boxShadow: "0 0 8px rgba(255,45,85,0.6)", zIndex: 2 }}>
                        <span style={{ position: "absolute", right: 0, top: "-20px", fontSize: "11px", color: "var(--cm-red)", fontWeight: 700, background: "rgba(10,10,15,0.9)", padding: "2px 8px", borderRadius: "4px", border: "1px solid rgba(255,45,85,0.4)", whiteSpace: "nowrap" }}>
                          ⚡ CPU Limit ~10⁸ ops/sec
                        </span>
                      </div>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, top: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "0 24px" }}>
                        {chartBars.map((bar) => (
                          <div key={bar.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: bar.color, fontWeight: 700, marginBottom: "2px" }}>
                              10{bar.exp === 2 ? "²" : bar.exp === 4 ? "⁴" : bar.exp === 6 ? "⁶" : "¹⁰"} ops
                              {bar.exp > 8 && <span style={{ marginLeft: "4px" }}>☠️</span>}
                            </span>
                            <div style={{ width: "44px", height: `${getBarH(bar.exp)}px`, background: `linear-gradient(to top, ${bar.color}, ${bar.color}88)`, borderRadius: "4px 4px 0 0", boxShadow: bar.exp >= 10 ? `0 0 18px ${bar.color}88` : `0 0 8px ${bar.color}44` }} />
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", maxWidth: "70px", lineHeight: 1.3 }}>{bar.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sliders */}
                <div className={styles.animationCard} style={{ marginTop: "20px" }}>
                  <div className={styles.animationHeader}>
                    <span className={styles.animationTitle}>⚙️ Interactive Complexity Explorer</span>
                    {isTLE && <span style={{ background: "rgba(255,45,85,0.2)", border: "1px solid var(--cm-red)", color: "var(--cm-red)", fontSize: "var(--font-size-xs)", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-full)", animation: "blink 0.8s step-end infinite" }}>⚠️ TLE!</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    {[{ label: "Array Size (N)", val: sliderN, set: setSliderN }, { label: "Query Count (Q)", val: sliderQ, set: setSliderQ }].map(({ label, val, set }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", color: "var(--cm-cyan)", fontWeight: 700 }}>{val.toLocaleString()}</span>
                        </div>
                        <input type="range" min={1} max={100000} step={100} value={val} onChange={e => set(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--cm-cyan)", cursor: "pointer" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}><span>10</span><span>10⁵</span></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: isTLE ? "rgba(255,45,85,0.08)" : "rgba(0,240,255,0.05)", border: `1px solid ${isTLE ? "rgba(255,45,85,0.4)" : "rgba(0,240,255,0.2)"}`, borderRadius: "var(--radius-md)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.3s ease" }}>
                    <div>
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>O(N · Q) operations</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-2xl)", fontWeight: 800, color: isTLE ? "var(--cm-red)" : "var(--cm-green)", transition: "color 0.3s ease" }}>
                        {ops >= 1e9 ? `${(ops / 1e9).toFixed(1)}B` : ops >= 1e6 ? `${(ops / 1e6).toFixed(1)}M` : ops >= 1e3 ? `${(ops / 1e3).toFixed(1)}K` : ops.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Verdict</div>
                      <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, color: isTLE ? "var(--cm-red)" : "var(--cm-green)" }}>{isTLE ? "🔴 TLE" : "🟢 OK"}</div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-accent btn-sm" style={{ marginTop: "16px" }} onClick={() => completeLessonAndGo("lesson2", "mcq1")}>
                  Continue to Checkpoint →
                </button>
              </div>
            );
          })()}

          {/* ==================== MCQ 1 ==================== */}
          {activeLesson === "mcq1" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Checkpoint 1: The Naive Bottleneck</h1>
                <p>Validate your understanding of complexity constraints before proceeding.</p>
              </div>
              <McqCheckpoint
                questions={MCQ_PART_1}
                answers={mcqAnswers1}
                checked={mcqChecked1}
                onSelect={handleMcqSelect1}
                onCheck={handleMcqCheckAnswer1}
                allCorrect={part1Complete}
                nextLabel="Continue to Lesson 3: The Core Idea →"
                onNext={() => completeLessonAndGo("mcq1", "lesson3")}
              />
            </div>
          )}

          {/* ==================== LESSON 3 ==================== */}
          {activeLesson === "lesson3" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 3: The Core Idea</h1>
                <p>Building a binary tree to aggregate ranges bottom-up.</p>
              </div>
              <div className={styles.narration}>{TREE_BUILD_NARRATIONS[treeBuildStep]}</div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Segment Tree Construction Simulator</span>
                  <div className={styles.animControls}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTreeBuildStep(0)} disabled={treeBuildStep === 0}>↺ Reset</button>
                    {treeBuildStep < 3 ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setTreeBuildStep(Math.min(3, treeBuildStep + 1))}>Next Construction Step ▶</button>
                    ) : (
                      <button className="btn btn-accent btn-sm" onClick={() => setActiveLesson("lesson4")} style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>✓ Done — Lesson 4 →</button>
                    )}
                  </div>
                </div>

                <TreeVisualizer nodes={TREE_NODES} buildStep={treeBuildStep} />

                <div className="card-glass">
                  <strong>Takeaway:</strong> Each internal node stores the precomputed range sum of its two children.
                  Since we precompute everything once during building in O(N) time, we can query values later in logarithmic time.
                </div>

                {treeBuildStep === 3 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0, 255, 136, 0.06)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginTop: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>🌳</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--cm-green)", marginBottom: "2px" }}>Tree built!</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>You understand how a Segment Tree is constructed bottom-up.</div>
                      </div>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => completeLessonAndGo("lesson3", "lesson4")}>Next: Query →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== LESSON 4 ==================== */}
          {activeLesson === "lesson4" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 4: Answering a Query</h1>
                <p>Simulating O(log N) range-sum query traversal.</p>
              </div>
              <div className={styles.narration}>{TREE_QUERY_NARRATIONS[treeQueryStep]}</div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Range-Sum Query [1, 5] Simulator</span>
                  <div className={styles.animControls}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTreeQueryStep(0)} disabled={treeQueryStep === 0}>↺ Reset</button>
                    {treeQueryStep < 10 ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setTreeQueryStep(Math.min(10, treeQueryStep + 1))}>Next Query Step ▶</button>
                    ) : (
                      <button className="btn btn-accent btn-sm" onClick={() => completeLessonAndGo("lesson4", "lesson5")} style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>✓ Done — Lesson 5 →</button>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: "4px", fontSize: "10px", background: "var(--bg-primary)", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-primary)", zIndex: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255, 215, 0, 0.4)", border: "1.5px solid var(--cm-yellow)" }} /> Partial Overlap</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(0, 255, 136, 0.4)", border: "1.5px solid var(--cm-green)" }} /> Complete Overlap (Merge)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255, 45, 85, 0.3)", border: "1.5px solid var(--cm-red)" }} /> No Overlap (Skip)</div>
                  </div>
                  <TreeVisualizer nodes={TREE_NODES} getNodeClass={getQueryNodeOverlap} />
                </div>

                <div className={styles.counterGrid}>
                  <div className={styles.counterCard} style={{ borderColor: "var(--cm-purple)" }}>
                    <div className={styles.counterVal} style={{ color: "var(--cm-purple)" }}>{Math.min(treeQueryStep, 9)}</div>
                    <div className={styles.counterLabel}>Segment Tree Nodes Visited</div>
                  </div>
                  <div className={styles.counterCard}>
                    <div className={styles.counterVal}>5</div>
                    <div className={styles.counterLabel}>Naive Scanned Elements</div>
                  </div>
                </div>

                <div className={styles.takeawayCard} style={{ background: "rgba(0, 240, 255, 0.05)", borderColor: "var(--border-accent)" }}>
                  <span style={{ fontSize: "24px" }}>⚡</span>
                  <div><strong>O(log N) Query Efficiency:</strong> Instead of scanning all 5 elements naively, the tree aggregates the range sum using just 3 complete overlaps: node <strong>[1,1]</strong> (1), node <strong>[2,3]</strong> (7), and node <strong>[4,5]</strong> (15).</div>
                </div>

                {treeQueryStep === 10 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0, 255, 136, 0.06)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginTop: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>⚡</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--cm-green)", marginBottom: "2px" }}>Query complete!</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>You've seen how O(log N) query traversal works on a Segment Tree.</div>
                      </div>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => setActiveLesson("lesson5")}>Next: Point Update →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== LESSON 5 ==================== */}
          {activeLesson === "lesson5" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 5: Point Update</h1>
                <p>Updating an element and propagating changes back to the root.</p>
              </div>
              <div className={styles.narration}>{TREE_UPDATE_NARRATIONS[treeUpdateStep]}</div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Point Update: Set array[3] = 10 Simulator</span>
                  <div className={styles.animControls}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTreeUpdateStep(0)} disabled={treeUpdateStep === 0}>↺ Reset</button>
                    {treeUpdateStep < 4 ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setTreeUpdateStep(Math.min(4, treeUpdateStep + 1))}>Next Update Step ▶</button>
                    ) : (
                      <button className="btn btn-accent btn-sm" onClick={() => completeLessonAndGo("lesson5", "lesson5b")} style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>✓ Done — Array Rep →</button>
                    )}
                  </div>
                </div>

                <TreeVisualizer nodes={TREE_NODES} getNodeClass={getUpdateNodeState} updatedValues={updateDisplayValues} />

                <div className="card-glass">
                  <strong>Takeaway:</strong> A point update traverses from the target leaf up to the root,
                  re-evaluating only the nodes that overlap the updated index. This requires updating only
                  one node per tree level, yielding a strict O(log N) complexity.
                </div>

                {treeUpdateStep === 4 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0, 255, 136, 0.06)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginTop: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>🌟</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--cm-green)", marginBottom: "2px" }}>Part 2 complete!</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>You understand build, query, and update.</div>
                      </div>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => completeLessonAndGo("lesson5", "lesson5b")}>Array Representation →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== LESSON 5b: Array Representation ==================== */}
          {activeLesson === "lesson5b" && (() => {
            const arrNodes = TREE_NODES.map(n => ({ ...n }));
            const parentIdx = highlightedNode !== null && highlightedNode > 1 ? Math.floor(highlightedNode / 2) : null;
            const leftIdx = highlightedNode !== null ? highlightedNode * 2 : null;
            const rightIdx = highlightedNode !== null ? highlightedNode * 2 + 1 : null;

            return (
              <div>
                <div className={styles.titleArea}>
                  <h1>Lesson 6: Array Representation</h1>
                  <p>How a Segment Tree is stored in a flat 1-indexed array.</p>
                </div>
                <div className={styles.narration}>
                  A Segment Tree doesn't need pointer-based nodes. It is stored in a plain array where
                  the <strong>root lives at index 1</strong>. For any node at index <strong>i</strong>:
                  its <strong style={{ color: "var(--cm-cyan)" }}>left child</strong> is at <strong>2i</strong>,
                  its <strong style={{ color: "var(--cm-purple)" }}>right child</strong> at <strong>2i + 1</strong>,
                  and its <strong style={{ color: "var(--cm-orange)" }}>parent</strong> at <strong>⌊i/2⌋</strong>.
                  Click any node to see the relationships live.
                </div>

                <div className={styles.animationCard}>
                  <div className={styles.animationHeader}>
                    <span className={styles.animationTitle}>Tree ↔ Array Index Explorer</span>
                    {highlightedNode !== null && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)", color: "var(--cm-cyan)" }}>
                        node[{highlightedNode}] • left=[{highlightedNode * 2}] • right=[{highlightedNode * 2 + 1}] • parent=[{highlightedNode > 1 ? Math.floor(highlightedNode / 2) : "root"}]
                      </span>
                    )}
                  </div>

                  <TreeVisualizer
                    nodes={arrNodes}
                    showArrayIndex
                    highlightedNode={highlightedNode}
                    onNodeClick={(id) => setHighlightedNode(highlightedNode === id ? null : id)}
                  />

                  {/* Flat array visualization */}
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
                      tree[] — flat array (1-indexed, index 0 unused)
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {/* Index 0 placeholder */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", opacity: 0.3 }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>-</div>
                        <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>[0]</span>
                      </div>
                      {arrNodes.map(node => {
                        const isH = highlightedNode === node.id;
                        const isP = parentIdx === node.id;
                        const isLC = leftIdx === node.id;
                        const isRC = rightIdx === node.id;
                        let bg = "var(--bg-tertiary)", border = "1px solid var(--border-primary)", color = "var(--text-primary)";
                        if (isH) { bg = "rgba(0,240,255,0.2)"; border = "1px solid var(--cm-cyan)"; color = "var(--cm-cyan)"; }
                        else if (isP) { bg = "rgba(255,140,0,0.15)"; border = "1px solid var(--cm-orange)"; color = "var(--cm-orange)"; }
                        else if (isLC) { bg = "rgba(0,240,255,0.08)"; border = "1px solid var(--cm-cyan)"; }
                        else if (isRC) { bg = "rgba(168,85,247,0.1)"; border = "1px solid var(--cm-purple)"; }
                        return (
                          <div key={node.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer" }} onClick={() => setHighlightedNode(highlightedNode === node.id ? null : node.id)}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", background: bg, border, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color, transition: "all 0.2s ease" }}>{node.val}</div>
                            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: isH ? "var(--cm-cyan)" : "var(--text-muted)" }}>[{node.id}]</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "16px", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-xs)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 10, height: 10, borderRadius: "2px", background: "rgba(0,240,255,0.25)", border: "1.5px solid var(--cm-cyan)" }} /><span style={{ color: "var(--cm-cyan)" }}>Selected node (i)</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 10, height: 10, borderRadius: "2px", background: "rgba(255,140,0,0.2)", border: "1.5px solid var(--cm-orange)" }} /><span style={{ color: "var(--cm-orange)" }}>Parent (⌊i/2⌋)</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 10, height: 10, borderRadius: "2px", background: "rgba(0,240,255,0.12)", border: "1.5px solid var(--cm-cyan)" }} /><span>Left child (2i)</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 10, height: 10, borderRadius: "2px", background: "rgba(168,85,247,0.15)", border: "1.5px solid var(--cm-purple)" }} /><span style={{ color: "var(--cm-purple)" }}>Right child (2i+1)</span></div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0, 255, 136, 0.06)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginTop: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>📊</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--cm-green)", marginBottom: "2px" }}>Array mapping understood!</div>
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>You now know why the code uses <code style={{ fontFamily: "var(--font-mono)", color: "var(--cm-cyan)" }}>2*node</code> and <code style={{ fontFamily: "var(--font-mono)", color: "var(--cm-purple)" }}>2*node+1</code>.</div>
                    </div>
                  </div>
                  <button className="btn btn-accent btn-sm" onClick={() => completeLessonAndGo("lesson5b", "lesson7")}>Next: When to Use →</button>
                </div>
              </div>
            );
          })()}

          {/* ==================== LESSON 7 ==================== */}
          {activeLesson === "lesson7" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 7: When to Use a Segment Tree</h1>
                <p>Associativity is the key — any operation that combines two answers into one works.</p>
              </div>
              <div className={styles.narration}>
                A Segment Tree works for any query where the answer for a range can be <strong>computed by merging answers of sub-ranges</strong>.
                The technical term is an <strong style={{ color: "var(--cm-cyan)" }}>associative</strong> operation:
                one where <code style={{ fontFamily: "var(--font-mono)", color: "var(--cm-purple)" }}>merge(merge(a, b), c) === merge(a, merge(b, c))</code>.
                If your query satisfies this, a Segment Tree gives you <strong>O(log N)</strong> per query and update.
              </div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>✓ Operations that work with Segment Trees</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  {[
                    { op: "Range Sum", merge: "a + b", id: "0", color: "var(--cm-cyan)", icon: "Σ", example: "Sum of a[2..7]" },
                    { op: "Range Min", merge: "min(a, b)", id: "+∞", color: "var(--cm-green)", icon: "↓", example: "Minimum in a[l..r]" },
                    { op: "Range Max", merge: "max(a, b)", id: "-∞", color: "var(--cm-red)", icon: "↑", example: "Maximum in a[l..r]" },
                    { op: "Range GCD", merge: "gcd(a, b)", id: "0", color: "var(--cm-purple)", icon: "÷", example: "GCD of a[l..r]" },
                    { op: "Range AND", merge: "a & b", id: "all 1s", color: "var(--cm-yellow)", icon: "&", example: "Bitwise AND of range" },
                    { op: "Range OR", merge: "a | b", id: "0", color: "var(--cm-orange)", icon: "|", example: "Bitwise OR of range" },
                    { op: "Range XOR", merge: "a ^ b", id: "0", color: "var(--cm-cyan)", icon: "⊕", example: "XOR of a[l..r]" },
                  ].map(item => (
                    <div key={item.op} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", padding: "14px", transition: "border-color 0.2s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = item.color)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-primary)")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: `${item.color}22`, borderRadius: "6px", color: item.color, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{item.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--text-primary)" }}>{item.op}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: item.color, marginBottom: "4px" }}>merge(a, b) = {item.merge}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Identity: <span style={{ color: "var(--text-secondary)" }}>{item.id}</span></div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>e.g. {item.example}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0, 255, 136, 0.06)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🧩</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--cm-green)", marginBottom: "2px" }}>Concept understood!</div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>You know which operations are Segment-Tree-compatible and why.</div>
                  </div>
                </div>
                <button className="btn btn-accent btn-sm" onClick={() => completeLessonAndGo("lesson7", "mcq2")}>Checkpoint →</button>
              </div>
            </div>
          )}

          {/* ==================== MCQ 2 ==================== */}
          {activeLesson === "mcq2" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Checkpoint 2: Segment Tree Operations</h1>
                <p>Verify your understanding of Segment Tree structure, queries, and updates.</p>
              </div>
              <McqCheckpoint
                questions={MCQ_PART_2}
                answers={mcqAnswers2}
                checked={mcqChecked2}
                onSelect={handleMcqSelect2}
                onCheck={handleMcqCheckAnswer2}
                allCorrect={part2Complete}
                nextLabel="Continue to Code Walkthrough →"
                onNext={() => completeLessonAndGo("mcq2", "lesson6")}
              />
            </div>
          )}

          {/* ==================== LESSON 6: Code Walkthrough ==================== */}
          {activeLesson === "lesson6" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 8: Template Walkthrough</h1>
                <p>Click on any line of code to see its detailed explanation.</p>
              </div>

              <div className={styles.splitScreen}>
                <div className={styles.codePanel}>
                  {TEMPLATE_LINES.map((line) => (
                    <div
                      key={line.lineNum}
                      className={`${styles.codeLine} ${walkthroughLine === line.lineNum ? styles.codeLineActive : ""}`}
                      onClick={() => line.explanation && setWalkthroughLine(line.lineNum)}
                    >
                      <span className={styles.lineNumber}>{line.lineNum}</span>
                      <span className={styles.codeContent}>{renderHighlightedCode(line.code)}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.explPanel}>
                  <div className={styles.explHeader}>
                    <h3>Line {walkthroughLine} Explanation</h3>
                  </div>
                  <div className={styles.explBody}>
                    <p>
                      {TEMPLATE_LINES.find(l => l.lineNum === walkthroughLine)?.explanation ||
                        "Select a highlighted line to see its conceptual explanation here."}
                    </p>
                  </div>
                  <div style={{ marginTop: "auto" }}>
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => completeLessonAndGo("lesson6", "challenge1")}>
                      Proceed to Coding Challenge 1 💻
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== CHALLENGES ==================== */}
          {isChallenge && (
            <ChallengeIde
              challenge={ST_CHALLENGES[activeLesson]}
              onComplete={() => {
                markLessonComplete(SEGMENT_TREE_COURSE.moduleId, activeLesson);
              }}
              navigate={(nextId) => {
                markLessonComplete(SEGMENT_TREE_COURSE.moduleId, activeLesson);
                setActiveLesson(nextId);
              }}
            />
          )}

          {/* ==================== COMPLETION BADGE ==================== */}
          {activeLesson === "badge" && (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              {/* Celebration header */}
              <div style={{ marginBottom: "0.5rem", fontSize: 13, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "var(--cm-green)", opacity: 0.9 }}>
                ✦ COURSE COMPLETE ✦
              </div>
              <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem", letterSpacing: "-0.5px" }}>
                Segment Tree — Easy
              </h1>
              <p style={{ color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto 2.5rem", lineHeight: 1.85, fontSize: "0.93rem" }}>
                You&apos;ve mastered range queries and point updates with Segment Trees. You constructed trees bottom-up,
                answered range queries in O(log N), performed point updates, and completed 4 coding challenges.
              </p>

              {/* Animated badge */}
              {badgeDef && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
                  <BadgeCard badge={badgeDef} earned earnedAt={badgeEarnedAt} size="lg" animate />
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: "2.5rem", flexWrap: "wrap" }}>
                {[
                  ["8", "Lessons"],
                  ["4", "Challenges"],
                  ["2", "Checkpoints"],
                ].map(([val, label]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--cm-green)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Summary card */}
              <div className={styles.summaryCard} style={{ marginBottom: "2rem" }}>
                <h4>Key Complexities Mastered</h4>
                <div className={styles.summaryGrid}>
                  <div>
                    <div className={styles.summaryItemTitle}>Naive Complexity</div>
                    <div className={styles.summaryItemValue} style={{ color: "var(--cm-red)" }}>O(N) Query / O(1) Update</div>
                  </div>
                  <div>
                    <div className={styles.summaryItemTitle}>Segment Tree</div>
                    <div className={styles.summaryItemValue} style={{ color: "var(--cm-green)" }}>O(log N) Query / O(log N) Update</div>
                  </div>
                </div>
              </div>

              {/* CTAs */}

              <Link
                href={profileHref}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 12 }}
              >
                🏅 View on Profile
              </Link>
              <Link href="/learn" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                ← Back to Learn
              </Link>
            </div>
          )}

        </div>
      </section>
    </CourseLayout>
  );
}
