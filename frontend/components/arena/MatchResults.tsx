"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/stores/matchStore";
import type { MatchEndData } from "@/stores/matchStore";
import MatchReportView from "./MatchReport";
import styles from "./MatchResults.module.css";

interface MatchResultsProps {
  data: MatchEndData;
  myId: string;
}

function AnimatedDelta({ value, delay }: { value: number; delay: number }) {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!show) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setCurrent(value);
        clearInterval(interval);
      } else {
        setCurrent(Math.round(increment * step));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [show, value]);

  if (!show) return <span className={styles.deltaPlaceholder}>...</span>;

  return (
    <span className={current >= 0 ? styles.deltaPositive : styles.deltaNegative}>
      {current >= 0 ? `+${current}` : current}
    </span>
  );
}

function AnimatedRating({ from, to, delay }: { from: number; to: number; delay: number }) {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(from);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!show) return;
    const duration = 1500;
    const steps = 60;
    const diff = to - from;
    const increment = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setCurrent(to);
        clearInterval(interval);
      } else {
        setCurrent(Math.round(from + increment * step));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [show, from, to]);

  return <span>{current}</span>;
}

export default function MatchResults({ data, myId }: MatchResultsProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const isPlayer1 = data.player1.userId === myId;
  const me = isPlayer1 ? data.player1 : data.player2;
  const opponent = isPlayer1 ? data.player2 : data.player1;
  const isWinner = data.winnerId === myId;
  const isDraw = data.winnerId === null;

  const resultText = isDraw ? "DRAW" : isWinner ? "VICTORY" : "DEFEAT";
  const resultColor = isDraw ? "var(--cm-orange)" : isWinner ? "var(--cm-green)" : "var(--cm-red)";
  const resultEmoji = isDraw ? "🤝" : isWinner ? "🏆" : "💀";

  return (
    <div className={`${styles.overlay} ${visible ? styles.visible : ""}`}>
      <div className={`${styles.modal} ${visible ? styles.modalVisible : ""}`}>
        {/* Result Header */}
        <div className={styles.resultHeader} style={{ background: `linear-gradient(135deg, ${resultColor}15, transparent)` }}>
          <span className={styles.resultEmoji}>{resultEmoji}</span>
          <h1 className={styles.resultText} style={{ color: resultColor }}>
            {resultText}
          </h1>
          <p className={styles.reason}>
            {data.reason === "timeout" ? "Time expired" : data.reason === "all_solved" ? "All problems solved" : data.reason}
          </p>
        </div>

        {/* Score Comparison */}
        <div className={styles.scoreComparison}>
          <div className={styles.playerResult}>
            <span className={styles.playerLabel}>You</span>
            <span className={styles.playerName}>{me.username}</span>
            <span className={styles.score} style={{ color: "var(--cm-cyan)" }}>{me.score}</span>
          </div>
          <div className={styles.vsLabel}>vs</div>
          <div className={styles.playerResult}>
            <span className={styles.playerLabel}>Opponent</span>
            <span className={styles.playerName}>{opponent.username}</span>
            <span className={styles.score} style={{ color: "var(--cm-red)" }}>{opponent.score}</span>
          </div>
        </div>

        {/* Rating Change */}
        <div className={styles.ratingSection}>
          <h3>Rating Change</h3>
          <div className={styles.ratingRow}>
            <div className={styles.ratingBox}>
              <span className={styles.ratingLabel}>Before</span>
              <span className={styles.ratingValue}>{Math.round(me.ratingBefore)}</span>
            </div>
            <div className={styles.ratingArrow}>
              →
            </div>
            <div className={styles.ratingBox}>
              <span className={styles.ratingLabel}>After</span>
              <span className={styles.ratingValue}>
                <AnimatedRating from={Math.round(me.ratingBefore)} to={Math.round(me.ratingAfter || me.ratingBefore)} delay={800} />
              </span>
            </div>
            <div className={styles.ratingBox}>
              <span className={styles.ratingLabel}>Delta</span>
              <span className={styles.ratingDelta}>
                <AnimatedDelta value={Math.round(me.delta || 0)} delay={1200} />
              </span>
            </div>
          </div>
        </div>

        {/* AI Performance Report */}
        <AIReportSection />

        {/* Actions */}
        <div className={styles.actions}>
          <button className="btn btn-primary btn-lg" onClick={() => router.push("/match/queue")}>
            ⚡ Play Again
          </button>
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function AIReportSection() {
  const { matchReport, matchReportPending, ws } = useMatchStore();

  if (matchReport) {
    return <MatchReportView report={matchReport} />;
  }

  if (matchReportPending) {
    return (
      <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
        <div style={{
          width: 24, height: 24, margin: "0 auto 8px",
          border: "2px solid var(--border-primary)",
          borderTopColor: "var(--cm-cyan)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        Generating AI performance report...
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "8px" }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "request_analysis" }));
            useMatchStore.getState().setMatchReportPending(true);
          }
        }}
        style={{ gap: "6px", display: "inline-flex", alignItems: "center" }}
      >
        <span>📊</span> Get AI Performance Report
      </button>
    </div>
  );
}
