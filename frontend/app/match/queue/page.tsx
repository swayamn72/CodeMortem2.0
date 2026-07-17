"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQueueStore } from "@/stores/queueStore";
import { connectGameSocket, GAME_WS_URL } from "@/hooks/useGameSocket";
import styles from "./page.module.css";


export default function QueuePage() {
  const { user, tokens, isAuthenticated } = useAuthStore();
  const { status, opponent, countdown, searchTime, setStatus, setOpponent, setCountdown, setWs, setSearchTime, leaveQueue, reset, joinQueue } = useQueueStore();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  const connectWs = useCallback(() => {
    if (!tokens?.accessToken) return;

    connectGameSocket(tokens.accessToken, {
      onOpen: (ws) => {
        console.log("[ws] connected");
        setWs(ws);
        wsRef.current = ws;
        // Auto join queue
        ws.send(JSON.stringify({ type: "join_queue" }));
        setStatus("searching");

        // Start search timer
        searchTimerRef.current = setInterval(() => {
          setSearchTime(useQueueStore.getState().searchTime + 1);
        }, 1000);
      },
      onMessage: (msg) => {
        switch (msg.type) {
          case "queue_joined":
            setStatus("searching");
            break;

          case "match_preparing": {
            setOpponent((msg.data?.opponent as { username: string; rating: number }) || null);
            setStatus("preparing");
            if (searchTimerRef.current) clearInterval(searchTimerRef.current);
            break;
          }

          case "match_found": {
            setStatus("found");
            setOpponent(msg.data!.opponent as { username: string; rating: number });
            if (searchTimerRef.current) clearInterval(searchTimerRef.current);

            let count = (msg.data!.countdown as number) || 10;
            setCountdown(count);
            setStatus("countdown");

            countdownRef.current = setInterval(() => {
              count--;
              setCountdown(count);
              if (count <= 0) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setStatus("in_match");
                if (msg.data!.matchId) {
                  router.push(`/match/${msg.data!.matchId}`);
                }
              }
            }, 1000);
            break;
          }

          case "queue_timeout":
            setStatus("idle");
            setErrorMsg("No opponents found within 3 minutes. Please try again.");
            if (searchTimerRef.current) clearInterval(searchTimerRef.current);
            break;

          case "queue_left":
            setStatus("idle");
            break;

          case "error":
            setErrorMsg((msg.data?.message as string) || "Something went wrong. Please try again.");
            setStatus("idle");
            if (searchTimerRef.current) clearInterval(searchTimerRef.current);
            break;
        }
      },
      onClose: () => console.log("[ws] disconnected"),
      onError: (err) => console.error("[ws] error:", err),
    }).then((ws) => {
      if (!ws) {
        setErrorMsg("Failed to connect. Please try again.");
      }
    });
  }, [tokens, setWs, setStatus, setOpponent, setCountdown, setSearchTime, router]);


  useEffect(() => {
    if (mounted && isAuthenticated) {
      connectWs();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      reset();
    };
  }, [mounted, isAuthenticated, connectWs, reset]);


  const handleCancel = () => {
    leaveQueue();
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (wsRef.current) wsRef.current.close();
    router.push("/dashboard");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!mounted || !user) return null;

  // Block entry if CF handle not verified
  if (!user.cfVerified) {
    return (
      <div className={styles.queuePage}>
        <div className={styles.rings}>
          <div className={styles.ring} style={{ animationDelay: "0s" }} />
          <div className={styles.ring} style={{ animationDelay: "1s" }} />
          <div className={styles.ring} style={{ animationDelay: "2s" }} />
        </div>
        <div className={styles.queueContent}>
          <Link href="/" className="navbar-brand" style={{ marginBottom: "var(--space-2xl)" }}>
            <span className="logo-icon">☠</span>
            Code<span className="brand-accent">Mortem</span>
          </Link>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔗</div>
            <h1 className={styles.queueTitle} style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>
              Codeforces Required
            </h1>
            <p className={styles.queueSubtext} style={{ marginBottom: "2rem", lineHeight: 1.7 }}>
              Matchmaking uses real Codeforces problems. You need to link and verify
              your Codeforces account before you can join a match.
            </p>
            <Link href="/settings" className="btn btn-primary">
              ⚙️ Link Codeforces Account
            </Link>
            <div style={{ marginTop: "1rem" }}>
              <Link href="/dashboard" className="btn btn-secondary btn-sm">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.queuePage}>
      {/* Animated background rings */}
      <div className={styles.rings}>
        <div className={styles.ring} style={{ animationDelay: "0s" }} />
        <div className={styles.ring} style={{ animationDelay: "1s" }} />
        <div className={styles.ring} style={{ animationDelay: "2s" }} />
      </div>

      <div className={styles.queueContent}>
        <Link href="/" className="navbar-brand" style={{ marginBottom: "var(--space-2xl)" }}>
          <span className="logo-icon">☠</span>
          Code<span className="brand-accent">Mortem</span>
        </Link>

        {/* Error banner */}
        {errorMsg && (
          <div style={{
            background: "rgba(255,59,59,0.12)", border: "1px solid rgba(255,59,59,0.4)",
            borderRadius: 12, padding: "12px 18px", marginBottom: 24,
            color: "#ff6b6b", fontSize: 14, textAlign: "center", maxWidth: 420,
          }}>
            ⚠️ {errorMsg}
            <button onClick={() => { setErrorMsg(""); setStatus("searching"); connectWs(); }}
              style={{ marginLeft: 12, background: "none", border: "none", color: "var(--cm-cyan)", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              Try Again
            </button>
          </div>
        )}

        {(status === "searching") && (
          <>
            <div className={styles.searchingAnim}>
              <div className={styles.radar} />
            </div>
            <h1 className={styles.queueTitle}>Finding Opponent...</h1>
            <p className={styles.queueSubtext}>
              Searching within ±{200 + Math.floor(searchTime / 10) * 50} rating
            </p>
            <p className={styles.searchTimer}>
              {formatTime(searchTime)}
            </p>
            <div className={styles.playerCard}>
              <span className={styles.playerRating} style={{ color: "var(--cm-cyan)" }}>
                {user.rating.toFixed(0)}
              </span>
              <span className={styles.playerName}>{user.username}</span>
              <span className={styles.playerRank}>{user.rankTitle}</span>
            </div>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}

        {/* Intermediate state: opponent matched, problems being prepared */}
        {status === "preparing" && opponent && (
          <>
            <h1 className={styles.queueTitle}>
              <span className={styles.matchFoundText}>⚔️ Opponent Found!</span>
            </h1>
            <div className={styles.vsContainer}>
              <div className={styles.playerCard}>
                <span className={styles.playerRating} style={{ color: "var(--cm-cyan)" }}>
                  {user.rating.toFixed(0)}
                </span>
                <span className={styles.playerName}>{user.username}</span>
                <span className={styles.playerRank}>{user.rankTitle}</span>
              </div>
              <div className={styles.vsText}>VS</div>
              <div className={styles.playerCard}>
                <span className={styles.playerRating} style={{ color: "var(--cm-red)" }}>
                  {opponent.rating?.toFixed(0) ?? "—"}
                </span>
                <span className={styles.playerName}>{opponent.username}</span>
              </div>
            </div>
            <p className={styles.queueSubtext} style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--cm-cyan)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Selecting problems from Codeforces...
            </p>
          </>
        )}

        {(status === "found" || status === "countdown") && opponent && (
          <>
            <h1 className={styles.queueTitle}>
              <span className={styles.matchFoundText}>⚔️ MATCH FOUND</span>
            </h1>

            <div className={styles.vsContainer}>
              <div className={styles.playerCard}>
                <span className={styles.playerRating} style={{ color: "var(--cm-cyan)" }}>
                  {user.rating.toFixed(0)}
                </span>
                <span className={styles.playerName}>{user.username}</span>
                <span className={styles.playerRank}>{user.rankTitle}</span>
              </div>

              <div className={styles.vsText}>VS</div>

              <div className={styles.playerCard}>
                <span className={styles.playerRating} style={{ color: "var(--cm-red)" }}>
                  {opponent.rating.toFixed(0)}
                </span>
                <span className={styles.playerName}>{opponent.username}</span>
              </div>
            </div>

            <div className={styles.countdownDisplay}>
              <span className={styles.countdownNumber}>{countdown}</span>
              <span className={styles.countdownLabel}>Match starts in</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
