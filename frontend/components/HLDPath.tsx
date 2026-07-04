"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useProgressStore } from "@/stores/progressStore";
import { useAuthStore } from "@/stores/authStore";
import { getBadgeDef } from "@/lib/badges";
import BadgeCard from "@/components/BadgeCard";

// Reuse the same CSS module as SegmentTreeIntermediatePath
import styles from "@/app/learn/segment-tree/page.module.css";

import { PROBLEMS, ALL_LESSON_IDS, MODULE_ID } from "@/components/learn/hld/registry";
import HLDLessonRenderer from "@/components/learn/hld/renderer/LessonRenderer";
import ChallengeRenderer from "@/components/learn/hld/renderer/ChallengeRenderer";
import type { LessonConfig } from "@/components/learn/hld/registry/types";

// Derive flat lesson list from registry
const ALL_LESSONS: LessonConfig[] = PROBLEMS.flatMap((p) => p.lessons);

export default function HLDPath() {
  const [activeLesson, setActiveLesson] = useState(ALL_LESSONS[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  const { markLessonComplete, isLessonComplete, earnedBadges } = useProgressStore();
  const { user } = useAuthStore();

  // Scroll to top when lesson changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeLesson]);

  const activeLessonConfig = ALL_LESSONS.find((l) => l.id === activeLesson);
  const isChallenge = activeLessonConfig?.content.type === "challenge";
  const isBadge = activeLesson === "badge";
  const allCompleted = ALL_LESSONS.every((l) => isLessonComplete(MODULE_ID, l.id));

  // Auto-collapse sidebar on challenge/badge screens
  useEffect(() => {
    setSidebarCollapsed(isChallenge || isBadge);
  }, [isChallenge, isBadge]);

  // Auto-mark badge as complete on arrival
  useEffect(() => {
    if (isBadge && allCompleted) markLessonComplete(MODULE_ID, "badge");
  }, [isBadge, allCompleted, markLessonComplete]);

  const badgeDef = getBadgeDef(MODULE_ID);
  const badgeEarnedAt = earnedBadges[MODULE_ID];
  const profileHref = user?.username ? `/profile/${user.username}` : "/profile";

  // Navigate to next lesson
  const completeAndNavigate = (lessonId: string, nextId?: string) => {
    markLessonComplete(MODULE_ID, lessonId);
    if (nextId) setActiveLesson(nextId);
  };

  // Build navigation order
  const navOrder = [...ALL_LESSONS.map((l) => l.id), "badge"];
  const currentIdx = navOrder.indexOf(activeLesson);
  const nextId = navOrder[currentIdx + 1] ?? undefined;

  // Next label
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

  // Premium gate
  const isPremiumActive =
    user?.isPremium &&
    (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());
  const isCurrentPremium =
    activeLessonConfig?.content.type === "challenge" &&
    (activeLessonConfig.content.data as any).premium === true;

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
                <span>🔥</span> Heavy-Light Decomp.
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Hard · {ALL_LESSON_IDS.length} steps
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

        {/* Collapsed icon strip */}
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
              const lesson = ALL_LESSONS.find((l) => l.id === id);
              const icon = done
                ? "✓"
                : id === "badge"
                ? "🏆"
                : lesson?.content.type === "challenge"
                ? "💻"
                : "📖";
              return (
                <button
                  key={id}
                  title={lesson?.title ?? "Badge"}
                  onClick={() => setActiveLesson(id)}
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active
                      ? "rgba(255,45,85,0.15)"
                      : done
                      ? "rgba(0,255,136,0.07)"
                      : "transparent",
                    border: active
                      ? "1px solid var(--cm-red)"
                      : "1px solid transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: done ? 11 : 14,
                    color: done
                      ? "var(--cm-green)"
                      : active
                      ? "var(--cm-red)"
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

        {/* Expanded lesson list */}
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
                    const isPrem =
                      isC && (lesson.content.data as any).premium === true;
                    return (
                      <button
                        key={lesson.id}
                        className={`${styles.lessonBtn} ${active ? styles.lessonActive : ""}`}
                        onClick={() => setActiveLesson(lesson.id)}
                        style={
                          active
                            ? {
                                borderLeftColor: "var(--cm-red)",
                                color: "var(--cm-red)",
                              }
                            : {}
                        }
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
                        {isPrem && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "var(--cm-yellow)",
                              background: "rgba(255,215,0,0.1)",
                              border: "1px solid rgba(255,215,0,0.25)",
                              borderRadius: 4,
                              padding: "1px 5px",
                              letterSpacing: "0.5px",
                            }}
                          >
                            PRO
                          </span>
                        )}
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
                onClick={() => {
                  if (allCompleted) setActiveLesson("badge");
                }}
                disabled={!allCompleted}
                style={
                  activeLesson === "badge"
                    ? { borderLeftColor: "var(--cm-red)", color: "var(--cm-red)" }
                    : !allCompleted
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}
                }
              >
                <span className={styles.iconWrap}>
                  {isLessonComplete(MODULE_ID, "badge") ? (
                    <span style={{ color: "var(--cm-green)", fontSize: "13px" }}>
                      ✓
                    </span>
                  ) : !allCompleted ? (
                    "🔒"
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
        ref={contentRef}
        className={styles.contentPane}
        style={
          isChallenge || isBadge
            ? { padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }
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
          {/* ── Conceptual lessons ── */}
          {activeLessonConfig?.content.type === "conceptual" && (
            <HLDLessonRenderer
              lessonId={activeLessonConfig.id}
              title={activeLessonConfig.title}
              content={activeLessonConfig.content.data}
              onComplete={() =>
                completeAndNavigate(activeLessonConfig.id, nextId)
              }
              nextLabel={nextLabel}
            />
          )}

          {/* ── Challenges ── */}
          {activeLessonConfig?.content.type === "challenge" && (
            isCurrentPremium && !isPremiumActive ? (
              /* Premium gate */
              <div className={styles.lockCard}>
                <div className={styles.lockIcon}>🔒</div>
                <h2 style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                  Premium Challenge
                </h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: 380, lineHeight: 1.6 }}>
                  This challenge requires a CodeMortem Premium subscription. Upgrade to unlock all 7 coding challenges.
                </p>
                <Link href="/pricing" className="btn btn-primary">
                  Upgrade to Premium →
                </Link>
              </div>
            ) : (
              <ChallengeRenderer
                key={activeLessonConfig.id}
                lessonId={activeLessonConfig.id}
                title={activeLessonConfig.title}
                content={activeLessonConfig.content.data as any}
                onComplete={() => markLessonComplete(MODULE_ID, activeLessonConfig.id)}
                onNavigate={nextId ? () => setActiveLesson(nextId) : undefined}
                nextLabel={nextLabel}
                isCompleted={isLessonComplete(MODULE_ID, activeLessonConfig.id)}
              />
            )
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
                Heavy-Light Decomposition
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginTop: "8px",
                  maxWidth: "520px",
                  lineHeight: 1.7,
                }}
              >
                You&apos;ve mastered HLD — from tree metrics and chain formation
                through path max/sum queries, edge weights, subtree operations,
                and lazy path range updates. This is elite-level competitive
                programming.
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
