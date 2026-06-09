"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Panel, Group, Separator } from "react-resizable-panels";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/authStore";
import { useMatchStore } from "@/stores/matchStore";
import ProblemPanel from "@/components/arena/ProblemPanel";
import MatchTimer from "@/components/arena/MatchTimer";
import MatchResults from "@/components/arena/MatchResults";
import LanguageSelector from "@/components/editor/LanguageSelector";
import HintPanel from "@/components/arena/HintPanel";
import SolutionExplainer from "@/components/arena/SolutionExplainer";
import MatchReportView from "@/components/arena/MatchReport";
import styles from "./page.module.css";

const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className={styles.editorLoading}>Loading Monaco Editor...</div>
  ),
});

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/game";

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  
  const { user, tokens, isAuthenticated } = useAuthStore();
  const store = useMatchStore();
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"output" | "input">("output");

  // Mount check
  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auth guard
  useEffect(() => {
    if (mounted && !isAuthenticated) router.push("/login");
  }, [mounted, isAuthenticated, router]);

  // WebSocket connection
  const connectWs = useCallback(() => {
    if (!tokens?.accessToken || !matchId) return;

    const ws = new WebSocket(`${WS_URL}?token=${tokens.accessToken}`);
    wsRef.current = ws;
    store.setWs(ws);
    store.setMatchId(matchId);
    store.setMyId(user?.id || "");

    ws.onopen = () => {
      // Request match state
      ws.send(JSON.stringify({ type: "join_match", matchId }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      handleWsMessage(msg);
    };

    ws.onclose = () => {
      console.log("[arena-ws] disconnected");
      // Attempt reconnect if match is still active
      if (store.status === "active") {
        setTimeout(() => connectWs(), 2000);
      }
    };

    ws.onerror = (err) => {
      console.error("[arena-ws] error:", err);
    };
  }, [tokens, matchId, user]);

  const handleWsMessage = useCallback((msg: { type: string; data: Record<string, unknown> }) => {
    switch (msg.type) {
      case "match_state": {
        const d = msg.data;
        useMatchStore.setState({ isCF: d.isCF as boolean });
        store.setQuestions(d.questions as never);
        useMatchStore.setState({ isSolo: d.isSolo as boolean });
        if (!d.isSolo) {
          store.setOpponent(d.opponent as string);
        }
        store.setRemainingSeconds(d.remainingSeconds as number);
        store.setStatus("active");
        
        // Start client-side countdown
        timerRef.current = setInterval(() => {
          const current = useMatchStore.getState().remainingSeconds;
          if (current > 0) {
            store.setRemainingSeconds(current - 1);
          }
        }, 1000);
        break;
      }

      case "match_countdown": {
        store.setStatus("countdown");
        store.setRemainingSeconds(msg.data.seconds as number);
        break;
      }

      case "submission_result": {
        const result = msg.data as unknown as import("@/stores/matchStore").SubmissionResult;
        store.setSubmissionResult(result);
        
        if (result.verdict === "accepted" && result.isFirstSolve) {
          store.recordMySolve(result.questionIndex, result.points);
        }
        break;
      }

      case "cf_solved": {
        const d = msg.data;
        if (d.solvedBy === "you") {
          store.recordMySolve(d.questionIndex as number, d.points as number);
          store.setCFVerificationStatus(d.questionIndex as number, 'verified');
          store.setConsole(`✓ Codeforces submission verified! +${d.points} points!`, "success");
        } else if (d.solvedBy === "opponent") {
          store.recordOpponentSolve(d.questionIndex as number, d.opponentScore as number);
          store.setConsole(`⚠️ Opponent solved Q${d.questionIndex} on Codeforces! Their score: ${d.opponentScore}`, "error");
        }
        break;
      }

      case "run_result": {
        store.setRunResult(msg.data as unknown as import("@/stores/matchStore").RunResult);
        break;
      }

      case "opponent_solved": {
        const d = msg.data;
        store.recordOpponentSolve(d.questionIndex as number, d.opponentScore as number);
        store.setConsole(
          `⚠️ Opponent solved Q${d.questionIndex}! Their score: ${d.opponentScore}`,
          "error"
        );
        break;
      }

      case "match_end": {
        if (timerRef.current) clearInterval(timerRef.current);
        store.setMatchEnd(msg.data as unknown as import("@/stores/matchStore").MatchEndData);
        break;
      }

      case "heartbeat_ack":
        break;

      case "hint_response": {
        const h = msg.data;
        store.addHint(h.questionIndex as number, h.hintText as string);
        if (typeof h.newScore === "number") {
          const penalty = h.pointsDeducted as number;
          if (penalty > 0) {
            store.setConsole(`💡 Hint received (-${penalty} pts)`, "info");
          } else {
            store.setConsole(`💡 Hint received (free in solo mode)`, "info");
          }
        }
        break;
      }

      case "hint_loading":
        store.setHintsPending(true);
        break;

      case "explanation_response": {
        const e = msg.data;
        store.setExplanation(
          e.questionIndex as number,
          e.explanation as import("@/stores/matchStore").SolutionExplanation
        );
        break;
      }

      case "explanation_loading":
        store.setExplanationPending(msg.data.questionIndex as number);
        break;

      case "error":
        store.setConsole(`Error: ${(msg.data as { message: string }).message}`, "error");
        store.setHintsPending(false);
        store.setExplanationPending(null);
        break;
    }
  }, [store]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      connectWs();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mounted, isAuthenticated, connectWs]);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleSubmit = () => {
    if (store.isCF) {
      // In CF mode, the user must submit on Codeforces.
      const q = currentQuestion?.question;
      if (q?.cfUrl) {
        store.setConsole("Please submit your code on Codeforces. We will automatically detect your submission once it is accepted.", "info");
        window.open(q.cfUrl, '_blank', 'noopener,noreferrer');
      } else {
        store.setConsole("Codeforces URL not available for this problem.", "error");
      }
      return;
    }

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    const codeState = store.codeStates[store.activeQuestionIndex];
    if (!codeState?.code?.trim()) {
      store.setConsole("Cannot submit empty code.", "error");
      return;
    }

    store.setSubmitting(true);
    store.setConsole("⏳ Submitting... Judging against test cases...", "info");

    ws.send(JSON.stringify({
      type: "submit_code",
      questionIndex: store.activeQuestionIndex,
      language: codeState.language,
      code: codeState.code,
    }));
  };

  const handleRun = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const codeState = store.codeStates[store.activeQuestionIndex];
    if (!codeState?.code?.trim()) {
      store.setConsole("Cannot run empty code.", "error");
      return;
    }

    store.setRunning(true);
    store.setConsole("⏳ Running code...", "info");

    ws.send(JSON.stringify({
      type: "run_code",
      questionIndex: store.activeQuestionIndex,
      language: codeState.language,
      code: codeState.code,
      customInput,
    }));
  };

  const handleLanguageChange = (lang: string) => {
    store.updateLanguage(store.activeQuestionIndex, lang);
  };

  if (!mounted || !user) return null;

  const currentQuestion = store.questions.find(
    (q) => q.questionIndex === store.activeQuestionIndex
  );
  const currentCode = store.codeStates[store.activeQuestionIndex];

  return (
    <div className={styles.arena}>
      {/* Match End Modal */}
      {store.status === "ended" && store.matchEndData && (
        <MatchResults data={store.matchEndData} myId={user.id} />
      )}

      {/* Arena Header */}
      <header className={styles.arenaHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.brand}>
            <span style={{ color: "var(--cm-red)" }}>☠</span> CodeMortem
          </span>
          <span className="badge badge-live">LIVE</span>
        </div>

        <div className={styles.headerCenter}>
          <MatchTimer remainingSeconds={store.remainingSeconds} />
        </div>

        <div className={styles.headerRight}>
          <div className={styles.scoreBoard}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>You</span>
              <span className={`${styles.scoreNum} ${styles.myScore}`}>{store.myScore}</span>
            </div>
            {!store.isSolo && (
              <>
                <span className={styles.scoreSep}>—</span>
                <div className={styles.scoreItem}>
                  <span className={`${styles.scoreNum} ${styles.oppScore}`}>{store.opponentScore}</span>
                  <span className={styles.scoreLabel}>{store.opponentUsername || "Opponent"}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Arena Content */}
      <div className={styles.arenaBody}>
        <Group orientation="horizontal" id="arena-main-group">
          {/* Question Sidebar */}
          <Panel id="sidebar-panel" defaultSize={12} minSize={8} maxSize={25}>
            <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Questions</div>
          {store.questions.map((q) => {
            const isMySolved = store.mySolved.has(q.questionIndex);
            const isOppSolved = store.opponentSolved.has(q.questionIndex);
            const isActive = q.questionIndex === store.activeQuestionIndex;

            let tabClass = styles.qTab;
            if (isActive) tabClass += ` ${styles.qTabActive}`;
            if (isMySolved) tabClass += ` ${styles.qTabMySolved}`;
            else if (isOppSolved) tabClass += ` ${styles.qTabOppSolved}`;

            return (
              <button
                key={q.questionIndex}
                className={tabClass}
                onClick={() => store.setActiveQuestion(q.questionIndex)}
              >
                <span className={styles.qTabIdx}>Q{q.questionIndex}</span>
                <span className={styles.qTabPts}>+{q.pointsValue}</span>
                {isMySolved && <span className={styles.qTabIcon}>✓</span>}
                {!store.isSolo && isOppSolved && !isMySolved && <span className={styles.qTabIcon}>✗</span>}
              </button>
            );
          })}

          <div className={styles.sidebarDivider} />

          <div className={styles.sidebarStats}>
            <div className={styles.sidebarStat}>
              <span className={styles.sidebarStatLabel}>Solved</span>
              <span className={styles.sidebarStatValue}>{store.mySolved.size}/{store.isCF ? 5 : 7}</span>
            </div>
            <div className={styles.sidebarStat}>
              <span className={styles.sidebarStatLabel}>Score</span>
              <span className={styles.sidebarStatValue} style={{ color: "var(--cm-cyan)" }}>{store.myScore}</span>
            </div>
          </div>
            </aside>
          </Panel>

          <Separator id="sep-1" className={styles.resizeHandle} />

          {/* Problem Panel */}
          <Panel id="problem-panel" defaultSize={38} minSize={20}>
            <div className={styles.problemPanel}>
          <ProblemPanel question={currentQuestion || null} />
          {currentQuestion && (
            <HintPanel
              questionIndex={store.activeQuestionIndex}
              isSolo={store.isSolo}
            />
          )}
            </div>
          </Panel>

          <Separator id="sep-2" className={styles.resizeHandle} />

          {/* Editor + Console Panel */}
          <Panel id="editor-console-panel" defaultSize={50} minSize={30}>
            <Group orientation="vertical" id="editor-console-group">
              <Panel id="editor-panel" defaultSize={70} minSize={20}>
                <div className={styles.editorPanel}>
          {/* Editor Toolbar */}
          <div className={styles.editorToolbar}>
            <LanguageSelector
              value={currentCode?.language || "cpp"}
              onChange={handleLanguageChange}
            />
            <div className={styles.toolbarActions}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRun}
                disabled={store.isRunning || store.status !== "active"}
              >
                {store.isRunning ? "Running..." : "▶ Run"}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmit}
                disabled={store.isSubmitting || store.status !== "active" || store.mySolved.has(store.activeQuestionIndex)}
              >
                {store.mySolved.has(store.activeQuestionIndex) ? "✓ Solved" : store.isCF ? "Submit on CF" : store.isSubmitting ? "Judging..." : "Submit"}
              </button>
              {store.mySolved.has(store.activeQuestionIndex) && (
                <SolutionExplainer questionIndex={store.activeQuestionIndex} />
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className={styles.editorArea}>
            <CodeEditor
              value={currentCode?.code || ""}
              language={currentCode?.language || "cpp"}
              onChange={(code) => store.updateCode(store.activeQuestionIndex, code)}
              readOnly={store.status !== "active"}
            />
          </div>
        </div>
      </Panel>

              <Separator id="sep-3" className={styles.resizeHandleHorizontal} />

              <Panel id="console-panel" defaultSize={30} minSize={10}>
                {/* Console */}
                <div className={styles.console}>
            <div className={styles.consoleTabs}>
              <button
                className={`${styles.consoleTab} ${consoleTab === "output" ? styles.consoleTabActive : ""}`}
                onClick={() => setConsoleTab("output")}
              >
                Output
              </button>
              <button
                className={`${styles.consoleTab} ${consoleTab === "input" ? styles.consoleTabActive : ""}`}
                onClick={() => { setConsoleTab("input"); setShowCustomInput(true); }}
              >
                Custom Input
              </button>
            </div>

            <div className={styles.consoleBody}>
              {consoleTab === "output" ? (
                <pre
                  className={
                    store.consoleType === "success"
                      ? styles.consoleSuccess
                      : store.consoleType === "error"
                      ? styles.consoleError
                      : styles.consoleInfo
                  }
                >
                  {store.consoleOutput}
                </pre>
              ) : (
                <textarea
                  className={styles.customInput}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input here..."
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
