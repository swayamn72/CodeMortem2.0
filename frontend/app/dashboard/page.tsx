"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
import { LiquidGlassButton } from "@/components/LiquidGlassButton";
import { api } from "@/lib/api";
import {
  Swords, BookOpen, Trophy, User, Link2, Crown, X, Sparkles,
  TrendingUp, CheckCircle, BarChart3, Zap
} from "lucide-react";
import styles from "./page.module.css";

function getRankColor(rating: number): string {
  if (rating < 1200) return "#808080";
  if (rating < 1400) return "#00c853";
  if (rating < 1600) return "#03a89e";
  if (rating < 1900) return "#2979ff";
  if (rating < 2100) return "#aa00e6";
  if (rating < 2400) return "#ff8c00";
  return "#ff1744";
}

export default function DashboardPage() {
  const { user, isAuthenticated, refreshUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialDismissed, setTrialDismissed] = useState(false);

  const isPremiumActive = user?.isPremium && (
    !user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
  );

  const isSomaiya = user?.email?.toLowerCase().endsWith("@somaiya.edu");
  const trialEligible = !isPremiumActive && !isSomaiya && !user?.trialClaimedAt && !trialDismissed;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.push("/login");
  }, [mounted, isAuthenticated, router]);

  // Show trial banner after short delay so it feels premium, not spammy
  useEffect(() => {
    if (mounted && trialEligible) {
      const t = setTimeout(() => setShowTrialBanner(true), 1200);
      return () => clearTimeout(t);
    }
  }, [mounted, trialEligible]);

  const handleClaimTrial = async () => {
    setTrialLoading(true);
    try {
      await api.post("/subscription/claim-trial", {});
      await refreshUser();
      setShowTrialBanner(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      alert(msg);
    } finally {
      setTrialLoading(false);
    }
  };

  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      api.get("/matches/active").then(res => {
        if (res.data?.matchId) {
          setActiveMatchId(res.data.matchId);
        }
      }).catch(err => console.error("Failed to check active match:", err));
    }
  }, [mounted, isAuthenticated]);

  if (!mounted || !user) {
    return (
      <div className="auth-page">
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }



  const rankColor = getRankColor(user.rating);

  return (
    <>
      <Navbar activeTab="dashboard" />

      {/* Free Trial Floating Banner */}
      {showTrialBanner && (
        <div className="trial-offer-banner">
          <div className="trial-offer-icon">
            <Sparkles size={20} color="#fff" />
          </div>
          <div className="trial-offer-content">
            <div className="trial-offer-title">🎁 1 Month Free — Just for You</div>
            <div className="trial-offer-sub">Unlock Practice Bank, editorials &amp; contests. No credit card needed.</div>
          </div>
          <button
            className="trial-offer-btn"
            onClick={handleClaimTrial}
            disabled={trialLoading}
          >
            {trialLoading ? "Claiming…" : "Claim Free Month"}
          </button>
          <button
            className="trial-offer-close"
            onClick={() => { setShowTrialBanner(false); setTrialDismissed(true); }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid-bg" />

      <main className={styles.dashboard}>
        {activeMatchId && (
          <div style={{ margin: "20px 20px 0 20px", background: "rgba(0,220,180,0.1)", border: "1px solid rgba(0,220,180,0.3)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00dcb4", boxShadow: "0 0 10px #00dcb4", animation: "pulse 2s infinite" }} />
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: "#00dcb4", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Match in Progress!</h3>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>You have an active match. Rejoin before the time runs out.</p>
              </div>
            </div>
            <Link href={`/match/${activeMatchId}`} className="btn btn-primary">
              Rejoin Match
            </Link>
          </div>
        )}
        {/* ── Hero Header ── */}
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.heroBadge}>
              <span style={{ color: rankColor, fontWeight: 700 }}>{user.rankTitle}</span>
            </div>
            <h1 className={styles.heroTitle}>
              Welcome back,{" "}
              <span style={{ color: rankColor }}>{user.username}</span>
            </h1>
            <p className={styles.heroSub}>
              {isPremiumActive
                ? <>You have <strong style={{ color: "#ffd700" }}>Premium</strong> access. Keep pushing your limits.</>
                : "Ready to improve your competitive programming today?"}
            </p>
          </div>

          <div className={styles.heroCta}>
            <LiquidGlassButton
              href={user.cfVerified ? "/match/queue" : undefined}
              disabled={!user.cfVerified}
            >
              <Zap size={15} />
              Start Competing
            </LiquidGlassButton>
            <Link
              href="/match/solo"
              className="btn btn-secondary btn-lg"
              style={!user.cfVerified ? { opacity: 0.5, pointerEvents: "none" } : {}}
              aria-disabled={!user.cfVerified}
            >
              👤 Play Solo
            </Link>
          </div>

          {!user.cfVerified && (
            <div className={styles.cfWarning}>
              <span>⚠️</span>
              <span style={{ color: "var(--text-secondary)" }}>
                Matchmaking requires a verified Codeforces account.
              </span>
              <Link href="/settings" style={{ color: "#ffa500", fontWeight: 600, marginLeft: "auto", whiteSpace: "nowrap" }}>
                Link CF →
              </Link>
            </div>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div className={styles.statsGrid}>
          <div className="dash-stat-card">
            <div className="dash-stat-value" style={{ color: rankColor }}>{user.rating.toFixed(0)}</div>
            <div className="dash-stat-label">
              <TrendingUp size={10} style={{ display: "inline", marginRight: 4 }} />
              Rating
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-value">{user.matchesPlayed}</div>
            <div className="dash-stat-label">
              <Swords size={10} style={{ display: "inline", marginRight: 4 }} />
              Matches
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-value" style={{ color: "#00ff88" }}>{user.matchesWon}</div>
            <div className="dash-stat-label">
              <Trophy size={10} style={{ display: "inline", marginRight: 4 }} />
              Wins
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-value">{user.totalProblemsSolved}</div>
            <div className="dash-stat-label">
              <BarChart3 size={10} style={{ display: "inline", marginRight: 4 }} />
              Problems Solved
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-value" style={{ color: user.cfVerified ? "#00ff88" : "rgba(255,255,255,0.3)" }}>
              {user.cfVerified ? <CheckCircle size={28} /> : "—"}
            </div>
            <div className="dash-stat-label">CF Linked</div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionGrid}>

            <Link href="/match/queue" className="dash-action-card">
              <div className="dash-action-icon"><Swords size={18} /></div>
              <h3>Ranked Match</h3>
              <p>Find an opponent and compete for rating</p>
            </Link>

            <Link href="/learn" className="dash-action-card">
              <div className="dash-action-icon"><BookOpen size={18} /></div>
              <h3>Learning Path</h3>
              <p>Learn Segment Trees, HLD, Bit Manipulation interactively</p>
            </Link>

            <Link href="/leaderboard" className="dash-action-card">
              <div className="dash-action-icon"><Trophy size={18} /></div>
              <h3>Leaderboard</h3>
              <p>See the top-rated players globally</p>
            </Link>

            <Link href={`/profile/${user.username}`} className="dash-action-card">
              <div className="dash-action-icon"><User size={18} /></div>
              <h3>My Profile</h3>
              <p>View your rating history and stats</p>
            </Link>

            <Link href="/settings" className="dash-action-card">
              <div className="dash-action-icon" style={user.cfVerified ? { color: "#00ff88", background: "rgba(0,255,136,0.08)", borderColor: "rgba(0,255,136,0.15)" } : {}}>
                <Link2 size={18} />
              </div>
              <h3>{user.cfVerified ? `CF: ${user.cfHandle}` : "Link Codeforces"}</h3>
              <p>{user.cfVerified ? `Rating: ${user.cfRating ?? "N/A"}` : "Required for matchmaking — link now"}</p>
            </Link>

            {isPremiumActive ? (
              <Link href="/premium" className="dash-action-card" style={{ borderColor: "rgba(255,215,0,0.2)", background: "rgba(255,215,0,0.025)" }}>
                <div className="dash-action-icon" style={{ color: "#ffd700", background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.15)" }}>
                  <Crown size={18} />
                </div>
                <h3 style={{ color: "#ffd700" }}>Premium Active</h3>
                <p>
                  {user.premiumExpiresAt
                    ? `Expires ${new Date(user.premiumExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Your subscription is active"}
                </p>
              </Link>
            ) : (
              <Link href="/premium" className="dash-action-card" style={{ borderColor: "rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.025)" }}>
                <div className="dash-action-icon" style={{ color: "#a855f7", background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.15)" }}>
                  <Crown size={18} />
                </div>
                <h3>Go Premium</h3>
                <p>Unlock Practice Bank, editorials &amp; contests — from ₹500/month</p>
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
