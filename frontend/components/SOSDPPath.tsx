"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useProgressStore } from "@/stores/progressStore";
import { useAuthStore } from "@/stores/authStore";
import { getBadgeDef } from "@/lib/badges";
import BadgeCard from "@/components/BadgeCard";

// Reuse the same CSS module as SegmentTreeIntermediatePath
import styles from "@/app/learn/segment-tree/page.module.css";

import { PROBLEMS, ALL_LESSON_IDS, MODULE_ID } from "@/components/learn/sos-dp/registry";
import { Zap } from "lucide-react";
import SOSDPLessonRenderer from "@/components/learn/sos-dp/renderer/LessonRenderer";
import type { LessonConfig } from "@/components/learn/sos-dp/registry/types";
import RichCourseSidebar from "@/components/learn/shared/RichCourseSidebar";

// Derive flat lesson list from registry
const ALL_LESSONS: LessonConfig[] = PROBLEMS.flatMap((p) => p.lessons);

export default function SOSDPPath() {
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
      <RichCourseSidebar
        moduleId={MODULE_ID}
        problems={PROBLEMS as any}
        activeLesson={activeLesson}
        setActiveLesson={setActiveLesson}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        allCompleted={allCompleted}
        headerIcon={<Zap size={14} color="#6366f1" />}
        headerTitle="Sum Over Subsets"
        headerSubtitle={`Hard · ${ALL_LESSON_IDS.length} steps`}
      />

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
            <SOSDPLessonRenderer
              lessonId={activeLessonConfig.id}
              title={activeLessonConfig.title}
              content={activeLessonConfig.content.data}
              onComplete={() =>
                completeAndNavigate(activeLessonConfig.id, nextId)
              }
              nextLabel={nextLabel}
            />
          )}

          {/* ── Challenges (Coming Later) ── */}
          {activeLessonConfig?.content.type === "challenge" && (
            <div>Challenges are coming soon for this module.</div>
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
                Sum Over Subsets DP
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginTop: "8px",
                  maxWidth: "520px",
                  lineHeight: 1.7,
                }}
              >
                You've braved the multiverse of subsets! More lessons and challenges for SOS DP will be coming soon.
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
