"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProgressStore } from "@/stores/progressStore";
import { useAuthStore } from "@/stores/authStore";
import { getBadgeDef } from "@/lib/badges";
import BadgeCard from "@/components/BadgeCard";
import styles from "@/app/learn/segment-tree/page.module.css";

import { PROBLEMS, ALL_LESSON_IDS, MODULE_ID } from "@/components/learn/segment-tree-intermediate/registry";
import LessonRenderer from "@/components/learn/segment-tree-intermediate/renderer/LessonRenderer";
import ChallengeRenderer from "@/components/learn/segment-tree-intermediate/renderer/ChallengeRenderer";
import type { LessonConfig } from "@/components/learn/segment-tree-intermediate/registry/types";

// Derive flat lesson list from registry (badge appended separately)
const ALL_LESSONS: LessonConfig[] = PROBLEMS.flatMap((p) => p.lessons);

export default function SegmentTreeIntermediatePath() {
  const [activeLesson, setActiveLesson] = useState(ALL_LESSONS[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { markLessonComplete, isLessonComplete, earnedBadges } =
    useProgressStore();
  const { user } = useAuthStore();

  const activeLessonConfig = ALL_LESSONS.find((l) => l.id === activeLesson);
  const isChallenge = activeLessonConfig?.content.type === "challenge";
  const isBadge = activeLesson === "badge";

  // Auto-collapse sidebar on challenge/badge screens
  useEffect(() => {
    setSidebarCollapsed(isChallenge || isBadge);
  }, [isChallenge, isBadge]);

  // Auto-mark badge as complete on arrival
  useEffect(() => {
    if (isBadge) {
      markLessonComplete(MODULE_ID, "badge");
    }
  }, [isBadge, markLessonComplete]);

  const badgeDef = getBadgeDef(MODULE_ID);
  const badgeEarnedAt = earnedBadges[MODULE_ID];
  const profileHref = user?.username ? `/profile/${user.username}` : "/profile";

  // Helper: complete current lesson and navigate to next
  const completeAndNavigate = (lessonId: string, nextId?: string) => {
    markLessonComplete(MODULE_ID, lessonId);
    if (nextId) setActiveLesson(nextId);
  };

  // Build navigation order: all lessons + badge
  const navOrder = [...ALL_LESSONS.map((l) => l.id), "badge"];
  const currentIdx = navOrder.indexOf(activeLesson);
  const nextId = navOrder[currentIdx + 1] ?? undefined;

  // Next label for lesson/challenge buttons
  const nextConfig = nextId ? ALL_LESSONS.find((l) => l.id === nextId) : null;
  const nextLabel = isBadge
    ? undefined
    : nextId === "badge"
    ? "🏆 Claim Badge →"
    : nextConfig?.content.type === "challenge"
    ? `Next: ${nextConfig.title} →`
    : nextConfig
    ? `Next: ${nextConfig.title} →`
    : "Complete →";

  return (
    <div className={styles.container}>
      {/* ── Sidebar ── */}
      <aside
        className={styles.sidebar}
        style={{
          width: sidebarCollapsed ? "48px" : "280px",
          minWidth: sidebarCollapsed ? "48px" : "280px",
          padding: "var(--space-md) 0",
          borderRight: "1px solid var(--border-primary)",
          overflow: "hidden",
          overflowY: sidebarCollapsed ? "hidden" : "auto",
          transition: "width 0.22s ease, min-width 0.22s ease",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            padding: sidebarCollapsed ? "10px 0" : "0 12px 12px 16px",
            borderBottom: "1px solid var(--border-primary)",
            marginBottom: sidebarCollapsed ? 0 : "var(--space-md)",
            flexShrink: 0,
          }}
        >
          {!sidebarCollapsed && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "var(--font-size-md)",
                  color: "var(--text-primary)",
                }}
              >
                <span>🌳</span> Segment Trees
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Intermediate · 2 Problems
              </div>
            </div>
          )}
          <button
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((c) => !c)}
            style={{
              background: "transparent",
              border: "1px solid var(--border-primary)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              cursor: "pointer",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "16px",
              lineHeight: 1,
            }}
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Collapsed: icon list */}
        {sidebarCollapsed && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              paddingTop: 8,
            }}
          >
            {navOrder.map((id) => {
              const done = isLessonComplete(MODULE_ID, id);
              const active = activeLesson === id;
              const icon =
                done
                  ? "✓"
                  : id === "badge"
                  ? "🏆"
                  : ALL_LESSONS.find((l) => l.id === id)?.content.type ===
                    "challenge"
                  ? "💻"
                  : "📖";
              return (
                <button
                  key={id}
                  title={
                    ALL_LESSONS.find((l) => l.id === id)?.title ?? "Badge"
                  }
                  onClick={() => setActiveLesson(id)}
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active
                      ? "rgba(0,240,255,0.15)"
                      : done
                      ? "rgba(0,255,136,0.07)"
                      : "transparent",
                    border: active
                      ? "1px solid var(--cm-cyan)"
                      : "1px solid transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: done ? 11 : 14,
                    color: done
                      ? "var(--cm-green)"
                      : active
                      ? "var(--cm-cyan)"
                      : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        )}

        {/* Expanded: grouped lesson list */}
        {!sidebarCollapsed && (
          <>
            {PROBLEMS.map((problem) => {
              const allDone = problem.lessons.every((l) =>
                isLessonComplete(MODULE_ID, l.id)
              );
              return (
                <div key={problem.partLabel} className={styles.partGroup}>
                  <div className={styles.partTitle}>
                    <span>{problem.partLabel}</span>
                    {allDone && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--cm-green)",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        ✓ Done
                      </span>
                    )}
                  </div>
                  {problem.lessons.map((lesson) => {
                    const done = isLessonComplete(MODULE_ID, lesson.id);
                    const active = activeLesson === lesson.id;
                    const isC = lesson.content.type === "challenge";
                    return (
                      <button
                        key={lesson.id}
                        className={`${styles.lessonBtn} ${
                          active ? styles.lessonActive : ""
                        }`}
                        onClick={() => setActiveLesson(lesson.id)}
                      >
                        <span className={styles.iconWrap}>
                          {done ? (
                            <span
                              style={{
                                color: "var(--cm-green)",
                                fontSize: "13px",
                              }}
                            >
                              ✓
                            </span>
                          ) : isC ? (
                            "💻"
                          ) : (
                            "📖"
                          )}
                        </span>
                        <span style={{ flex: 1, textAlign: "left" }}>
                          {lesson.title}
                        </span>
                        {done && !active && (
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "var(--cm-green)",
                              flexShrink: 0,
                              opacity: 0.7,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Badge entry */}
            <div className={styles.partGroup}>
              <button
                className={`${styles.lessonBtn} ${
                  activeLesson === "badge" ? styles.lessonActive : ""
                }`}
                onClick={() => setActiveLesson("badge")}
              >
                <span className={styles.iconWrap}>
                  {isLessonComplete(MODULE_ID, "badge") ? (
                    <span
                      style={{ color: "var(--cm-green)", fontSize: "13px" }}
                    >
                      ✓
                    </span>
                  ) : (
                    "🏆"
                  )}
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>
                  Completion Badge
                </span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* ── Content pane ── */}
      <section
        className={styles.contentPane}
        style={
          isChallenge || isBadge
            ? {
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }
            : {}
        }
      >
        <div
          className={
            isChallenge || isBadge
              ? styles.challengeWrapper
              : styles.contentContainer
          }
        >
          {/* ── Conceptual Lessons ── */}
          {activeLessonConfig?.content.type === "conceptual" && (
            <LessonRenderer
              lessonId={activeLessonConfig.id}
              title={activeLessonConfig.title}
              content={activeLessonConfig.content.data}
              onComplete={() => completeAndNavigate(activeLessonConfig.id, nextId)}
              nextLabel={nextLabel}
            />
          )}

          {/* ── Challenge Lessons ── */}
          {activeLessonConfig?.content.type === "challenge" && (
            <ChallengeRenderer
              lessonId={activeLessonConfig.id}
              title={activeLessonConfig.title}
              content={activeLessonConfig.content.data}
              onComplete={() => completeAndNavigate(activeLessonConfig.id, nextId)}
              nextLabel={nextLabel}
            />
          )}

          {/* ── Badge screen ── */}
          {isBadge && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100%",
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              {badgeDef && (
                <BadgeCard
                  badge={badgeDef}
                  earned={!!badgeEarnedAt}
                  earnedAt={badgeEarnedAt}
                  size="lg"
                  animate
                />
              )}
              <h1
                style={{
                  marginTop: "24px",
                  fontSize: "var(--font-size-2xl)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                Segment Tree — Intermediate
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginTop: "8px",
                  maxWidth: "500px",
                  lineHeight: 1.7,
                }}
              >
                You&apos;ve mastered augmented segment trees, multi-field nodes,
                and the art of designing merge functions. Both problems — min+count
                and max subarray sum with updates — are solved.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "24px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Link href={profileHref} className="btn btn-accent">
                  View Profile →
                </Link>
                <Link href="/learn" className="btn btn-secondary">
                  Back to Modules
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
