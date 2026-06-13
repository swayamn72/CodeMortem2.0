"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
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
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isPremiumActive = user?.isPremium && (
    !user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !user) {
    return (
      <div className="auth-page">
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }


  return (
    <>
      <Navbar activeTab="dashboard" />

      <main className={styles.dashboard}>
        {/* Welcome Header */}
        <div className={styles.welcomeSection}>
          <div>
            <h1 className={styles.welcomeTitle}>
              Welcome back, <span style={{ color: getRankColor(user.rating) }}>{user.username}</span>
            </h1>
            <p className={styles.welcomeSubtitle}>
              <span
                className="badge badge-rating"
                style={{
                  color: getRankColor(user.rating),
                  borderColor: getRankColor(user.rating),
                  border: `1px solid ${getRankColor(user.rating)}30`,
                  background: `${getRankColor(user.rating)}15`,
                }}
              >
                {user.rating.toFixed(0)} — {user.rankTitle}
              </span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/match/queue"
              className="btn btn-primary btn-lg btn-pulse"
              style={!user.cfVerified ? { opacity: 0.5, pointerEvents: 'none' } : {}}
              aria-disabled={!user.cfVerified}
            >
              ⚡ Find a Match
            </Link>
            <Link
              href="/match/solo"
              className="btn btn-secondary btn-lg"
              style={!user.cfVerified ? { opacity: 0.5, pointerEvents: 'none' } : {}}
              aria-disabled={!user.cfVerified}
            >
              👤 Play Solo
            </Link>
          </div>

          {/* CF not linked warning */}
          {!user.cfVerified && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '0.75rem',
              padding: '0.65rem 1rem',
              background: 'rgba(255, 165, 0, 0.08)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              borderRadius: '8px',
              fontSize: 'var(--font-size-sm)',
            }}>
              <span>⚠️</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Matchmaking requires a verified Codeforces account.
              </span>
              <Link href="/settings" style={{ color: '#ffa500', fontWeight: 600, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                Link CF →
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: getRankColor(user.rating) }}>
              {user.rating.toFixed(0)}
            </div>
            <div className="stat-label">Rating</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{user.matchesPlayed}</div>
            <div className="stat-label">Matches</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{user.matchesWon}</div>
            <div className="stat-label">Wins</div>
          </div>

          <div className="card stat-card">
            <div className="stat-value">{user.totalProblemsSolved}</div>
            <div className="stat-label">Problems Solved</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">
              {user.cfVerified ? "✓" : "—"}
            </div>
            <div className="stat-label">CF Linked</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionGrid}>
            <Link href="/match/queue" className={`card ${styles.actionCard}`}>
              <span className={styles.actionIcon}>⚔️</span>
              <h3>Ranked Match</h3>
              <p>Find an opponent and compete for rating</p>
            </Link>

            <Link href="/learn" className={`card ${styles.actionCard}`}>
              <span className={styles.actionIcon}>🌳</span>
              <h3>Learning Path</h3>
              <p>Learn Segment Trees interactively</p>
            </Link>

            <Link href="/leaderboard" className={`card ${styles.actionCard}`}>
              <span className={styles.actionIcon}>🏆</span>
              <h3>Leaderboard</h3>
              <p>See the top rated players globally</p>
            </Link>

            <Link href={`/profile/${user.username}`} className={`card ${styles.actionCard}`}>
              <span className={styles.actionIcon}>📊</span>
              <h3>My Profile</h3>
              <p>View your rating history and stats</p>
            </Link>

            <Link href="/settings" className={`card ${styles.actionCard}`}>
              <span className={styles.actionIcon}>{user.cfVerified ? '✓' : '🔗'}</span>
              <h3>{user.cfVerified ? `CF: ${user.cfHandle}` : 'Link Codeforces'}</h3>
              <p>{user.cfVerified ? `Rating: ${user.cfRating ?? 'N/A'}` : 'Required for matchmaking — link now'}</p>
            </Link>

            {isPremiumActive ? (
              <Link href="/premium" className={`card ${styles.actionCard}`} style={{ borderColor: "rgba(255,215,0,0.25)", background: "rgba(255,215,0,0.04)" }}>
                <span className={styles.actionIcon}>👑</span>
                <h3 style={{ color: "#ffd700" }}>Premium Active</h3>
                <p>
                  {user.premiumPlan ?? "Premium"} ·{" "}
                  {user.premiumExpiresAt
                    ? `Expires ${new Date(user.premiumExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                    : "Active"}
                </p>
              </Link>
            ) : (
              <Link href="/premium" className={`card ${styles.actionCard}`} style={{ borderColor: "rgba(0,240,255,0.15)", background: "rgba(0,240,255,0.03)" }}>
                <span className={styles.actionIcon}>👑</span>
                <h3>Go Premium</h3>
                <p>Unlock Practice Bank, editorials & contests — from ₹500/month</p>
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
