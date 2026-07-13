"use client";

import React from "react";
import { useProgressStore } from "@/stores/progressStore";
import styles from "@/app/learn/segment-tree/page.module.css";

export interface RichSidebarLesson {
  id: string;
  title: string;
  content: { type: string };
}

export interface RichSidebarProblemGroup {
  partLabel: string;
  lessons: RichSidebarLesson[];
}

export interface RichCourseSidebarProps {
  moduleId: string;
  problems: RichSidebarProblemGroup[];
  activeLesson: string;
  setActiveLesson: (id: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  allCompleted: boolean;
  headerIcon: React.ReactNode;
  headerTitle: string;
  headerSubtitle: string;
}

export default function RichCourseSidebar({
  moduleId,
  problems,
  activeLesson,
  setActiveLesson,
  sidebarCollapsed,
  setSidebarCollapsed,
  allCompleted,
  headerIcon,
  headerTitle,
  headerSubtitle,
}: RichCourseSidebarProps) {
  const { isLessonComplete } = useProgressStore();

  return (
    <aside
      className={styles.sidebar}
      style={{
        width: sidebarCollapsed ? "48px" : "280px",
        minWidth: sidebarCollapsed ? "48px" : "280px",
        padding: "var(--space-md) 0",
        borderRight: "1px solid var(--border-primary)",
        overflow: "hidden",
        overflowY: "auto",
        transition: "width 0.22s ease, min-width 0.22s ease",
      }}
    >
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
              <span>{headerIcon}</span> {headerTitle}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {headerSubtitle}
            </div>
          </div>
        )}
        <button
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setSidebarCollapsed((c: boolean) => !c)}
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

      {sidebarCollapsed && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            paddingTop: "8px",
          }}
        >
          {problems.flatMap((p) => p.lessons).map((l) => {
            const done = isLessonComplete(moduleId, l.id);
            const active = activeLesson === l.id;
            const isC = l.content.type === "challenge";
            const isMCQLesson = l.content.type === "mcq";

            let icon = "📖";
            if (isC) icon = "💻";
            else if (isMCQLesson) icon = "🧩";

            return (
              <button
                key={l.id}
                title={l.title}
                onClick={() => setActiveLesson(l.id)}
                style={{
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active
                    ? "rgba(0, 240, 255, 0.15)"
                    : done
                    ? "rgba(0, 255, 136, 0.07)"
                    : "transparent",
                  border: active
                    ? "1px solid var(--cm-cyan)"
                    : "1px solid transparent",
                  borderRadius: "8px",
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
                {done ? (
                  <span style={{ fontSize: "13px" }}>✓</span>
                ) : (
                  icon
                )}
              </button>
            );
          })}
          {/* Collapsed Badge Icon */}
          <button
            title="Completion Badge"
            onClick={() => {
              if (allCompleted) setActiveLesson("badge");
            }}
            disabled={!allCompleted}
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: activeLesson === "badge" ? "rgba(255, 68, 68, 0.1)" : "transparent",
              border: activeLesson === "badge" ? "1px solid var(--cm-red)" : "1px solid transparent",
              borderRadius: "8px",
              cursor: allCompleted ? "pointer" : "not-allowed",
              fontSize: "14px",
              opacity: allCompleted ? 1 : 0.4,
              marginTop: "8px",
            }}
          >
            {isLessonComplete(moduleId, "badge") ? (
              <span style={{ color: "var(--cm-green)", fontSize: "13px" }}>✓</span>
            ) : !allCompleted ? (
              "🔒"
            ) : (
              "🏆"
            )}
          </button>
        </div>
      )}

      {!sidebarCollapsed && (
        <>
          {problems.map((problem) => {
            const allDone = problem.lessons.every((l) =>
              isLessonComplete(moduleId, l.id)
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
                  const done = isLessonComplete(moduleId, lesson.id);
                  const active = activeLesson === lesson.id;
                  const isC = lesson.content.type === "challenge";
                  const isMCQLesson = lesson.content.type === "mcq";
                  const isPrem = isC && (lesson.content as any).data?.premium === true;
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
                        ) : isMCQLesson ? (
                          "🧩"
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
                {isLessonComplete(moduleId, "badge") ? (
                  <span
                    style={{ color: "var(--cm-green)", fontSize: "13px" }}
                  >
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
  );
}
