"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useProgressStore } from "@/stores/progressStore";
import { useAuthStore } from "@/stores/authStore";
import { getBadgeDef } from "@/lib/badges";
import BadgeCard from "@/components/BadgeCard";
import styles from "@/app/learn/segment-tree/page.module.css";

import { PROBLEMS, ALL_LESSON_IDS, MODULE_ID } from "@/components/learn/segment-tree-intermediate/registry";
import LessonRenderer from "@/components/learn/segment-tree-intermediate/renderer/LessonRenderer";
import ChallengeRenderer from "@/components/learn/segment-tree-intermediate/renderer/ChallengeRenderer";
import MCQCheckpoint from "@/components/learn/shared/MCQCheckpoint";
import type { LessonConfig } from "@/components/learn/segment-tree-intermediate/registry/types";
import RichCourseSidebar from "@/components/learn/shared/RichCourseSidebar";

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
  const isMCQ = activeLessonConfig?.content.type === "mcq";
  const isBadge = activeLesson === "badge";
  const allCompleted = ALL_LESSONS.every((l) => isLessonComplete(MODULE_ID, l.id));

  // Auto-collapse sidebar on challenge/badge screens
  useEffect(() => {
    setSidebarCollapsed(isChallenge || isBadge);  // MCQ stays expanded
  }, [isChallenge, isBadge]);

  // Auto-mark badge as complete on arrival
  useEffect(() => {
    if (isBadge && allCompleted) markLessonComplete(MODULE_ID, "badge");
  }, [isBadge, allCompleted, markLessonComplete]);

  // Scroll content pane to top on every lesson change
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeLesson]);

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
      <RichCourseSidebar
        moduleId={MODULE_ID}
        problems={PROBLEMS as any}
        activeLesson={activeLesson}
        setActiveLesson={setActiveLesson}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        allCompleted={allCompleted}
        headerIcon="🌳"
        headerTitle="Segment Trees"
        headerSubtitle="Intermediate · 2 Problems"
      />

      {/* ── Content pane ── */}
      <section
        ref={contentRef}
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

          {/* ── MCQ Checkpoint Lessons ── */}
          {activeLessonConfig?.content.type === "mcq" && (
            <MCQCheckpoint
              data={activeLessonConfig.content.data}
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
              onComplete={() => markLessonComplete(MODULE_ID, activeLessonConfig.id)}
              onNavigate={nextId ? () => setActiveLesson(nextId) : undefined}
              nextLabel={nextLabel}
              isCompleted={isLessonComplete(MODULE_ID, activeLessonConfig.id)}
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
