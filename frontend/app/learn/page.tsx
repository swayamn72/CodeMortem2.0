"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Binary, Sigma, TreePine, Zap, type LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useProgressStore } from "@/stores/progressStore";
import Navbar from "@/components/Navbar";
import { getModuleAssignment } from "@/components/learn/moduleAssignments";
import { SEGMENT_TREE_COURSE } from "@/components/learn/segment-tree/config";
import { ALL_LESSON_IDS as HLD_LESSON_IDS } from "@/components/learn/hld/registry";
import styles from "./page.module.css";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  tagColor: string;
  icon: string | LucideIcon;
  difficulty: "Easy" | "Medium" | "Hard";
  /** Course level — independent of difficulty badge. */
  level: "Beginner" | "Intermediate" | "Advanced";
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
    level: "Beginner",
    lessons: 18,
    href: "/learn/segment-tree",
    available: true,
    allLessonIds: SEGMENT_TREE_COURSE.allLessonIds,
  },
  {
    id: "bit-manipulation-easy",
    title: "Bit Manipulation",
    subtitle: "Bitwise operators, masking & XOR tricks",
    description:
      "Master bitwise operations from first principles. Learn masking, XOR tricks, popcount, subset enumeration, and the 12 most-used bit idioms in competitive programming.",
    tag: "Easy",
    tagColor: "#00ff88",
    icon: Binary,
    difficulty: "Easy",
    level: "Beginner",
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
    id: "combinatorics-beginner",
    title: "Combinatorics",
    subtitle: "Efficient precomputation & O(1) nCr",
    description:
      "Build a reusable C++ combinatorics library from scratch. Master modular arithmetic, binary exponentiation, Fermat's inverse, and classical counting models (grid paths, stars & bars, anagrams, inclusion-exclusion).",
    tag: "Beginner",
    tagColor: "#aa00e6",
    icon: Sigma,
    difficulty: "Easy",
    level: "Beginner",
    lessons: 29,
    href: "/learn/combinatorics",
    available: true,
    allLessonIds: [
      "lesson1", "challenge1",
      "lesson2", "challenge2",
      "lesson3", "challenge3",
      "lesson4", "challenge4",
      "lesson5", "challenge5", "mcq1",
      "lesson6", "challenge6",
      "lesson7", "challenge7",
      "lesson8", "challenge8",
      "lesson9", "challenge9",
      "lesson10", "challenge10",
      "lesson11", "challenge11", "mcq2",
      "lesson12", "challenge12",
      "lesson13", "challenge13",
      "badge",
    ],
  },
  {
    id: "segment-tree-medium",
    title: "Segment Tree",
    subtitle: "Augmented nodes & structural merge",
    description:
      "Level up with multi-field node design. Learn to track (min, count) pairs and compute max subarray sum under point updates — the two most important intermediate segment tree patterns.",
    tag: "Medium",
    tagColor: "#ffd700",
    icon: TreePine,
    difficulty: "Medium",
    level: "Intermediate",
    lessons: 7,
    href: "/learn/segment-tree-intermediate",
    available: true,
    allLessonIds: [
      "p1-motivation", "p1-insight", "p1-challenge",
      "p2-motivation", "p2-insight", "p2-challenge",
      "badge",
    ],
  },
  {
    id: "segment-tree-hard",
    title: "Segment Tree",
    subtitle: "Lazy propagation, merge sort tree & persistent ST",
    description:
      "Advanced techniques including lazy propagation for range updates, merge sort trees, fractional cascading, and persistent segment trees for competitive programming.",
    tag: "Hard",
    tagColor: "#ff2d55",
    icon: Zap,
    difficulty: "Hard",
    level: "Advanced",
    lessons: 8,
    href: "#",
    available: false,
  },
  {
    id: "hld-hard",
    title: "Heavy-Light Decomposition",
    subtitle: "Tree path queries, edge weights & lazy subtrees",
    description:
      "Master the most powerful tree data structure technique in competitive programming. Learn to decompose trees into chains, then use a Segment Tree to answer path queries, point updates, edge-weight queries, and lazy range updates — all in O(log² N).",
    tag: "Hard",
    tagColor: "#ff2d55",
    icon: Zap,
    difficulty: "Hard",
    level: "Advanced",
    lessons: HLD_LESSON_IDS.length,
    href: "/learn/hld",
    available: true,
    allLessonIds: HLD_LESSON_IDS,
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
      <Navbar activeTab="learn" />

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
                    {typeof mod.icon === "string" ? (
                      (mod.icon.includes(".png") || mod.icon.includes(".svg")) ? (
                        <img src={mod.icon} alt={mod.title} style={{ width: "64px", height: "64px", display: "block", objectFit: "contain" }} />
                      ) : (
                        mod.icon
                      )
                    ) : (
                      <mod.icon size={52} strokeWidth={1.5} color="currentColor" />
                    )}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    {/* Level pill — independent of difficulty */}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "999px",
                        padding: "1px 8px",
                        letterSpacing: "0.4px",
                      }}
                    >
                      {mod.level}
                    </span>
                  </div>
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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <Link
                        href={mod.href}
                        className={isCompleted ? styles.resumeBtn : inProgress ? styles.resumeBtn : styles.startBtn}
                      >
                        {isCompleted ? "Review →" : inProgress ? "Continue →" : "Start Learning →"}
                      </Link>

                    </div>
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
