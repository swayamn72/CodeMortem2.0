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
  const [status, setStatus] = useState("preparing"); // preparing, countdown
  const [countdown, setCountdown] = useState(3);

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
      // Request solo match
      ws.send(JSON.stringify({ type: "start_solo" }));
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
    if (mounted && isAuthenticated) {
      connectWs();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [mounted, isAuthenticated, connectWs]);

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
