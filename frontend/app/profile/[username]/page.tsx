"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "./page.module.css";

interface ProfileUser {
  id: string;
  username: string;
  rating: number;
  ratingDeviation: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  totalProblemsSolved: number;
  rankTitle: string;
  cfHandle?: string;
  cfRating?: number;
  cfVerified: boolean;
  createdAt: string;
}

interface RatingEntry {
  matchId: string;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  recordedAt: string;
}

function getRankColor(rating: number): string {
  if (rating < 1200) return "#808080";
  if (rating < 1400) return "#00c853";
  if (rating < 1600) return "#03a89e";
  if (rating < 1900) return "#2979ff";
  if (rating < 2100) return "#aa00e6";
  if (rating < 2400) return "#ff8c00";
  return "#ff1744";
}

// SVG-based rating chart (no external lib needed)
function RatingChart({ history }: { history: RatingEntry[] }) {
  if (history.length < 2) {
    return (
      <div className={styles.chartEmpty}>
        <p>Play more matches to see your rating chart</p>
      </div>
    );
  }

  const width = 700;
  const height = 220;
  const pad = { top: 20, right: 20, bottom: 30, left: 50 };

  const ratings = history.map(h => h.ratingAfter);
  const minR = Math.min(...ratings) - 50;
  const maxR = Math.max(...ratings) + 50;

  const xScale = (i: number) => pad.left + (i / (history.length - 1)) * (width - pad.left - pad.right);
  const yScale = (r: number) => pad.top + ((maxR - r) / (maxR - minR)) * (height - pad.top - pad.bottom);

  // Build path
  const pathData = history
    .map((h, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(h.ratingAfter).toFixed(1)}`)
    .join(" ");

  // Area fill path
  const areaData = pathData
    + ` L ${xScale(history.length - 1).toFixed(1)} ${(height - pad.bottom)} L ${pad.left} ${(height - pad.bottom)} Z`;

  // Y-axis labels
  const yLabels = [];
  const step = Math.ceil((maxR - minR) / 4);
  for (let r = Math.floor(minR / step) * step; r <= maxR; r += step) {
    if (r >= minR) yLabels.push(r);
  }

  return (
    <div className={styles.chartContainer}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart}>
        {/* Grid lines */}
        {yLabels.map(r => (
          <g key={r}>
            <line x1={pad.left} y1={yScale(r)} x2={width - pad.right} y2={yScale(r)}
              stroke="var(--border-primary)" strokeWidth="1" strokeDasharray="4,4" />
            <text x={pad.left - 8} y={yScale(r) + 4}
              fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
              {r}
            </text>
          </g>
        ))}

        {/* Area gradient */}
        <defs>
          <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cm-cyan)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--cm-cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill="url(#ratingGrad)" />

        {/* Line */}
        <path d={pathData} fill="none" stroke="var(--cm-cyan)" strokeWidth="2" strokeLinejoin="round" />

        {/* Dots */}
        {history.map((h, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(h.ratingAfter)} r="3"
            fill="var(--bg-primary)" stroke={h.delta >= 0 ? "var(--cm-green)" : "var(--cm-red)"}
            strokeWidth="2">
            <title>{`${h.ratingAfter.toFixed(0)} (${h.delta >= 0 ? "+" : ""}${h.delta.toFixed(0)})`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [history, setHistory] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/users/${username}`);
        setProfile(data.user || data);

        try {
          const histData = await api.get(`/users/${username}/history?limit=50`);
          setHistory(histData.history || []);
        } catch {
          // demo rating history
          setHistory(generateDemoHistory());
        }
      } catch {
        // Demo profile
        setProfile({
          id: "demo",
          username,
          rating: 1847,
          ratingDeviation: 120,
          matchesPlayed: 42,
          matchesWon: 28,
          matchesDrawn: 3,
          totalProblemsSolved: 187,
          rankTitle: "Expert",
          cfVerified: false,
          createdAt: new Date().toISOString(),
        });
        setHistory(generateDemoHistory());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="auth-page">
        <h2>Player not found</h2>
      </div>
    );
  }

  const winRate =
    profile.matchesPlayed > 0
      ? ((profile.matchesWon / profile.matchesPlayed) * 100).toFixed(1)
      : "0.0";

  const lossCount = profile.matchesPlayed - profile.matchesWon - profile.matchesDrawn;

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span className="logo-icon">☠</span>
          Code<span className="brand-accent">Mortem</span>
        </Link>
        <ul className="navbar-nav">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/leaderboard">Leaderboard</Link></li>
        </ul>
        <div className="navbar-actions">
          <Link href="/match/queue" className="btn btn-primary btn-sm">
            ⚡ Find Match
          </Link>
        </div>
      </nav>

      <main className={styles.profile}>
        {/* Hero Card */}
        <div className={styles.heroCard}>
          <div className={styles.avatarSection}>
            <div
              className={styles.avatar}
              style={{ borderColor: getRankColor(profile.rating) }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1
                className={styles.username}
                style={{ color: getRankColor(profile.rating) }}
              >
                {profile.username}
              </h1>
              <span
                className={styles.rankTitle}
                style={{ color: getRankColor(profile.rating) }}
              >
                {profile.rankTitle}
              </span>
              {profile.cfVerified && profile.cfHandle && (
                <span className={styles.cfBadge}>
                  🔗 CF: {profile.cfHandle} ({profile.cfRating})
                </span>
              )}
            </div>
          </div>

          <div className={styles.ratingDisplay}>
            <span
              className={styles.ratingNumber}
              style={{ color: getRankColor(profile.rating) }}
            >
              {Math.round(profile.rating)}
            </span>
            <span className={styles.ratingLabel}>Rating</span>
            <span className={styles.rdLabel}>
              ±{Math.round(profile.ratingDeviation)} RD
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className="card stat-card">
            <div className="stat-value">{profile.matchesPlayed}</div>
            <div className="stat-label">Matches</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: "var(--cm-green)" }}>{profile.matchesWon}</div>
            <div className="stat-label">Wins</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: "var(--cm-red)" }}>{lossCount}</div>
            <div className="stat-label">Losses</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{winRate}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{profile.totalProblemsSolved}</div>
            <div className="stat-label">Problems Solved</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{profile.matchesDrawn}</div>
            <div className="stat-label">Draws</div>
          </div>
        </div>

        {/* Rating Chart */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📈 Rating History</h2>
          <div className={`card ${styles.chartCard}`}>
            <RatingChart history={history} />
          </div>
        </div>

        {/* Recent Matches */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🗡️ Recent Matches</h2>
          <div className={styles.matchList}>
            {history.slice(0, 10).map((entry, i) => (
              <div key={i} className={`card ${styles.matchItem}`}>
                <div className={styles.matchResult}>
                  <span className={entry.delta >= 0 ? styles.matchWin : styles.matchLoss}>
                    {entry.delta >= 0 ? "W" : "L"}
                  </span>
                </div>
                <div className={styles.matchInfo}>
                  <span className={styles.matchRating}>
                    {Math.round(entry.ratingBefore)} → {Math.round(entry.ratingAfter)}
                  </span>
                  <span className={styles.matchDate}>
                    {new Date(entry.recordedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={entry.delta >= 0 ? styles.deltaPositive : styles.deltaNegative}>
                  {entry.delta >= 0 ? "+" : ""}{Math.round(entry.delta)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

// Generate demo rating history for when API is unavailable
function generateDemoHistory(): RatingEntry[] {
  const entries: RatingEntry[] = [];
  let rating = 1500;
  const now = Date.now();

  for (let i = 0; i < 20; i++) {
    const delta = Math.round((Math.random() - 0.4) * 60); // slight upward bias
    const newRating = Math.max(800, rating + delta);

    entries.push({
      matchId: `demo-${i}`,
      ratingBefore: rating,
      ratingAfter: newRating,
      delta: newRating - rating,
      recordedAt: new Date(now - (20 - i) * 86400000).toISOString(),
    });

    rating = newRating;
  }

  return entries;
}
