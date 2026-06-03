"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import styles from "../queue/page.module.css";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/game";

export default function SoloPage() {
  const { user, tokens, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("config"); // config, preparing, countdown
  const [countdown, setCountdown] = useState(3);
  
  const [duration, setDuration] = useState(30 * 60);
  const [ratingMin, setRatingMin] = useState(Math.max(800, Math.floor((user?.rating || 1200) - 200)));
  const [ratingMax, setRatingMax] = useState(Math.floor((user?.rating || 1200) + 200));
  const [numProblems, setNumProblems] = useState(5);

  useEffect(() => {
    setMounted(true);
    return () => {
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

    const ws = new WebSocket(`${WS_URL}?token=${tokens.accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[ws] connected for solo match");
      // Request solo match with config
      ws.send(JSON.stringify({ 
        type: "start_solo",
        durationSecs: duration,
        ratingMin: ratingMin,
        ratingMax: ratingMax,
        numProblems: numProblems
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "match_found":
          setStatus("countdown");
          
          let count = msg.data.countdown || 3;
          setCountdown(count);

          countdownRef.current = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              if (msg.data.matchId) {
                router.push(`/match/${msg.data.matchId}`);
              }
            }
          }, 1000);
          break;

        case "error":
          console.error("[ws] error:", msg.data);
          // Go back on error
          alert(msg.data?.message || "Failed to start solo match");
          router.push("/dashboard");
          break;
      }
    };

    ws.onclose = () => {
      console.log("[ws] disconnected");
    };

    ws.onerror = (err) => {
      console.error("[ws] error:", err);
    };
  }, [tokens, router]);

  useEffect(() => {
    // We no longer auto-connect. User clicks Start.

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  if (!mounted || !user) return null;

  // Block entry if CF handle not verified
  if (!user.cfVerified) {
    return (
      <div className={styles.queuePage}>
        <div className={styles.rings}>
          <div className={styles.ring} style={{ animationDelay: "0s", borderColor: "var(--cm-cyan)30" }} />
          <div className={styles.ring} style={{ animationDelay: "1s", borderColor: "var(--cm-cyan)20" }} />
          <div className={styles.ring} style={{ animationDelay: "2s", borderColor: "var(--cm-cyan)10" }} />
        </div>
        <div className={styles.queueContent}>
          <Link href="/" className="navbar-brand" style={{ marginBottom: "var(--space-2xl)" }}>
            <span className="logo-icon">☠</span>
            Code<span className="brand-accent">Mortem</span>
          </Link>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔗</div>
            <h1 className={styles.queueTitle} style={{ fontSize: "1.8rem", marginBottom: "0.75rem", color: "var(--cm-cyan)" }}>
              Codeforces Required
            </h1>
            <p className={styles.queueSubtext} style={{ marginBottom: "2rem", lineHeight: 1.7 }}>
              Solo practice uses real Codeforces problems tailored to your rating.
              Link your Codeforces account first to get started.
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
        <div className={styles.ring} style={{ animationDelay: "0s", borderColor: "var(--cm-cyan)30" }} />
        <div className={styles.ring} style={{ animationDelay: "1s", borderColor: "var(--cm-cyan)20" }} />
        <div className={styles.ring} style={{ animationDelay: "2s", borderColor: "var(--cm-cyan)10" }} />
      </div>

      <div className={styles.queueContent}>
        <Link href="/" className="navbar-brand" style={{ marginBottom: "var(--space-2xl)" }}>
          <span className="logo-icon">☠</span>
          Code<span className="brand-accent">Mortem</span>
        </Link>

        {status === "config" && (
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "left", background: "var(--surface-color)", padding: "2rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>Practice Setup</h1>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Duration (Minutes)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[15, 30, 45, 60].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => setDuration(mins * 60)}
                    className={`btn ${duration === mins * 60 ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1, padding: "0.5rem" }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Min Rating</label>
                <input 
                  type="number" 
                  className="input" 
                  value={ratingMin} 
                  onChange={e => setRatingMin(parseInt(e.target.value) || 800)}
                  min={800} max={3500} step={100}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Max Rating</label>
                <input 
                  type="number" 
                  className="input" 
                  value={ratingMax} 
                  onChange={e => setRatingMax(parseInt(e.target.value) || 3500)}
                  min={800} max={3500} step={100}
                />
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Number of Problems</label>
              <input 
                type="range" 
                min="1" max="7" 
                value={numProblems} 
                onChange={e => setNumProblems(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--cm-cyan)" }}
              />
              <div style={{ textAlign: "center", marginTop: "0.5rem", fontWeight: "bold" }}>{numProblems} Problems</div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
              onClick={() => {
                setStatus("preparing");
                connectWs();
              }}
            >
              🚀 Start Practice
            </button>
          </div>
        )}

        {status === "preparing" && (
          <>
            <div className={styles.searchingAnim}>
              <div className={styles.radar} style={{ background: "var(--cm-cyan)30" }} />
            </div>
            <h1 className={styles.queueTitle}>Generating Problem Set...</h1>
            <p className={styles.queueSubtext}>
              Preparing questions based on your rating
            </p>
          </>
        )}

        {status === "countdown" && (
          <>
            <h1 className={styles.queueTitle}>
              <span className={styles.matchFoundText} style={{ color: "var(--cm-cyan)" }}>👤 SOLO MATCH READY</span>
            </h1>

            <div className={styles.countdownDisplay}>
              <span className={styles.countdownNumber} style={{ color: "var(--cm-cyan)" }}>{countdown}</span>
              <span className={styles.countdownLabel}>Practice starts in</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
