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
      {/* Animated background rings (only show when preparing or in countdown) */}
      {status !== "config" && (
        <div className={styles.rings}>
          <div className={styles.ring} style={{ animationDelay: "0s", borderColor: "var(--cm-cyan)30" }} />
          <div className={styles.ring} style={{ animationDelay: "1s", borderColor: "var(--cm-cyan)20" }} />
          <div className={styles.ring} style={{ animationDelay: "2s", borderColor: "var(--cm-cyan)10" }} />
        </div>
      )}

      <div className={styles.queueContent}>
        <Link href="/" className="navbar-brand" style={{ marginBottom: "var(--space-2xl)" }}>
          <span className="logo-icon">☠</span>
          Code<span className="brand-accent">Mortem</span>
        </Link>

        {status === "config" && (
          <div style={{
            maxWidth: 500, margin: "0 auto", textAlign: "left",
            background: "linear-gradient(135deg, rgba(13,13,24,0.8), rgba(20,20,35,0.8))",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            padding: "2.5rem", borderRadius: "20px",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(0,240,255,0.05)"
          }}>
            <h1 style={{
              fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)",
              textAlign: "center", marginBottom: "2rem", letterSpacing: "-0.5px"
            }}>Practice Setup</h1>
            
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Duration</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[15, 30, 45, 60].map(mins => {
                  const isActive = duration === mins * 60;
                  return (
                    <button 
                      key={mins}
                      onClick={() => setDuration(mins * 60)}
                      style={{
                        flex: 1, padding: "0.6rem", borderRadius: "8px",
                        fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: isActive ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.03)",
                        border: isActive ? "1px solid var(--cm-cyan)" : "1px solid rgba(255,255,255,0.08)",
                        color: isActive ? "var(--cm-cyan)" : "var(--text-secondary)",
                      }}
                      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                    >
                      {mins}m
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "1.75rem", display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Min Rating</label>
                <input 
                  type="number" 
                  value={ratingMin} 
                  onChange={e => setRatingMin(parseInt(e.target.value) || 800)}
                  min={800} max={3500} step={100}
                  style={{
                    width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-primary)", padding: "12px 16px", borderRadius: "8px", fontSize: "1.05rem",
                    outline: "none", transition: "border-color 0.2s", fontFamily: "var(--font-mono)"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--cm-cyan)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Max Rating</label>
                <input 
                  type="number" 
                  value={ratingMax} 
                  onChange={e => setRatingMax(parseInt(e.target.value) || 3500)}
                  min={800} max={3500} step={100}
                  style={{
                    width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-primary)", padding: "12px 16px", borderRadius: "8px", fontSize: "1.05rem",
                    outline: "none", transition: "border-color 0.2s", fontFamily: "var(--font-mono)"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--cm-cyan)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            <div style={{ marginBottom: "2.5rem" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Number of Problems</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--cm-cyan)" }}>{numProblems}</span>
              </label>
              <input 
                type="range" 
                min="1" max="7" 
                value={numProblems} 
                onChange={e => setNumProblems(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--cm-cyan)", cursor: "pointer" }}
              />
            </div>

            <button 
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg, var(--cm-cyan), #00b3cc)",
                color: "#000", fontSize: "1.1rem", fontWeight: 800, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,240,255,0.3)", transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,240,255,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,240,255,0.3)"; }}
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
