"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useProgressStore } from "@/stores/progressStore";
import styles from "./page.module.css";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  tagColor: string;
  icon: string;
  difficulty: "Easy" | "Medium" | "Hard";
  lessons: number;
  href: string;
  available: boolean;
  allLessonIds?: string[]; // all lesson IDs used for progress tracking
}

const MODULES: Module[] = [
  {
    id: "segment-tree-easy",
    title: "Segment Tree",
    subtitle: "Range queries & point updates",
    description:
      "Master the fundamentals of Segment Trees with interactive visualizations. Learn how to answer range sum queries and perform point updates in O(log N) time.",
    tag: "Easy",
    tagColor: "#00ff88",
    icon: "/assets/segment tree easy.png",
    difficulty: "Easy",
    lessons: 13,
    href: "/learn/segment-tree",
    available: true,
    allLessonIds: [
      "lesson1", "lesson2", "mcq1",
      "lesson3", "lesson4", "lesson5", "lesson5b", "lesson7", "mcq2",
      "lesson6", "challenge1", "challenge2", "challenge3", "challenge4", "badge",
    ],
  },
  {
    id: "bit-manipulation-easy",
    title: "Bit Manipulation",
    subtitle: "Bitwise operators, masking & XOR tricks",
    description:
      "Master bitwise operations from first principles. Learn masking, XOR tricks, popcount, subset enumeration, and the 12 most-used bit idioms in competitive programming.",
    tag: "Easy",
    tagColor: "#00ff88",
    icon: "🔢",
    difficulty: "Easy",
    lessons: 20,
    href: "/learn/bit-manipulation",
    available: true,
    allLessonIds: [
      "lesson1", "lesson2", "challenge1",
      "lesson3", "challenge2", "mcq1",
      "lesson4", "challenge3", "lesson4b",
      "lesson5", "lesson5b",
      "lesson6", "challenge4",
      "lesson7", "mcq2",
      "lesson8", "lesson8b", "lesson9", "challenge5",
      "badge",
    ],
  },
  {
    id: "segment-tree-medium",
    title: "Segment Tree",
    subtitle: "Lazy propagation & range updates",
    description:
      "Level up with lazy propagation for efficient range updates. Tackle harder problems requiring deferred computation tricks.",
    tag: "Medium",
    tagColor: "#ffd700",
    icon: "🌳",
    difficulty: "Medium",
    lessons: 10,
    href: "#",
    available: false,
  },
  {
    id: "segment-tree-hard",
    title: "Segment Tree",
    subtitle: "Merge sort tree & persistent ST",
    description:
      "Advanced techniques including merge sort trees, fractional cascading, and persistent segment trees for competitive programming.",
    tag: "Hard",
    tagColor: "#ff2d55",
    icon: "🔥",
    difficulty: "Hard",
    lessons: 8,
    href: "#",
    available: false,
  },
];

function getRankColor(rating: number): string {
  if (rating < 1200) return "#808080";
  if (rating < 1400) return "#00c853";
  if (rating < 1600) return "#03a89e";
  if (rating < 1900) return "#2979ff";
  if (rating < 2100) return "#aa00e6";
  if (rating < 2400) return "#ff8c00";
  return "#ff1744";
}

export default function LearnPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getCompletedCount, isModuleComplete } = useProgressStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "var(--bg-primary)",
        }}
      >
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span className="logo-icon">☠</span>
          Code<span className="brand-accent">Mortem</span>
        </Link>
        <ul className="navbar-nav">
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/learn" className="active">
              Learn
            </Link>
          </li>
          <li>
            <Link href="/leaderboard">Leaderboard</Link>
          </li>
          <li>
            <Link href={`/profile/${user.username}`}>Profile</Link>
          </li>
        </ul>
        <div className="navbar-actions">
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-secondary)",
              marginRight: "8px",
            }}
          >
            <span
              style={{
                color: getRankColor(user.rating),
                fontWeight: 600,
              }}
            >
              {user.username}
            </span>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Grid background */}
      <div className="grid-bg" />

      {/* Main content */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.headerEyebrow}>LEARN & MASTER</p>
          <h1 className={styles.headerTitle}>
            Algorithm <span className={styles.highlight}>Modules</span>
          </h1>
          <p className={styles.headerSubtitle}>
            Step-by-step interactive lessons designed for competitive programmers.
            Complete modules to unlock new topics and climb the leaderboard.
          </p>
        </div>

        {/* Module Grid */}
        <div className={styles.grid}>
          {MODULES.map((mod) => {
            const completedCount = mod.allLessonIds ? getCompletedCount(mod.id) : 0;
            const totalCount = mod.allLessonIds?.length ?? 0;
            const isCompleted = mod.allLessonIds ? isModuleComplete(mod.id, mod.allLessonIds) : false;
            const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const inProgress = completedCount > 0 && !isCompleted;

            return (
              <div
                key={mod.id}
                className={`${styles.moduleCard} ${!mod.available ? styles.moduleCardLocked : ""} ${isCompleted ? styles.moduleCardCompleted : ""}`}
              >
                {/* Difficulty glow overlay */}
                <div
                  className={styles.cardGlow}
                  style={
                    {
                      "--glow-color": mod.available
                        ? (isCompleted ? "rgba(0,255,136,0.12)" : mod.tagColor + "22")
                        : "transparent",
                    } as React.CSSProperties
                  }
                />

                {/* Completed ribbon */}
                {isCompleted && (
                  <div className={styles.completedRibbon}>
                    <span>✓ COMPLETED</span>
                  </div>
                )}

                {/* Card header */}
                <div className={styles.cardHeader}>
                  <span className={styles.moduleIcon}>
                    {mod.icon.includes(".png") || mod.icon.includes(".svg") ? (
                      <img src={mod.icon} alt={mod.title} style={{ width: "64px", height: "64px", display: "block", objectFit: "contain" }} />
                    ) : (
                      mod.icon
                    )}
                  </span>
                  <span
                    className={styles.difficultyBadge}
                    style={{
                      color: mod.tagColor,
                      borderColor: mod.tagColor + "55",
                      background: mod.tagColor + "15",
                    }}
                  >
                    {mod.tag}
                  </span>
                </div>

                {/* Card body */}
                <h2 className={styles.moduleTitle}>{mod.title}</h2>
                <p className={styles.moduleSubtitle}>{mod.subtitle}</p>
                <p className={styles.moduleDescription}>{mod.description}</p>

                {/* Progress bar (only for available modules with progress) */}
                {mod.available && totalCount > 0 && (
                  <div className={styles.progressWrapper}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${progressPct}%`,
                          background: isCompleted
                            ? "linear-gradient(90deg, var(--cm-green), #00e676)"
                            : "linear-gradient(90deg, var(--cm-cyan), #00b8d4)",
                          boxShadow: isCompleted ? "0 0 8px rgba(0,255,136,0.5)" : "0 0 8px rgba(0,240,255,0.4)",
                        }}
                      />
                    </div>
                    <span className={styles.progressLabel}>
                      {isCompleted ? "✓ All done" : `${completedCount} / ${totalCount} lessons`}
                    </span>
                  </div>
                )}

                {/* Card footer */}
                <div className={styles.cardFooter}>
                  <span className={styles.lessonCount}>
                    📚 {mod.lessons} lessons
                  </span>

                  {mod.available ? (
                    <Link
                      href={mod.href}
                      className={isCompleted ? styles.resumeBtn : inProgress ? styles.resumeBtn : styles.startBtn}
                    >
                      {isCompleted ? "Review →" : inProgress ? "Continue →" : "Start Learning →"}
                    </Link>
                  ) : (
                    <span className={styles.comingSoonBadge}>🔒 Coming Soon</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
