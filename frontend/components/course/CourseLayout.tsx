"use client";

import { useState, useEffect } from "react";
import { useProgressStore } from "@/stores/progressStore";
import styles from "@/app/learn/segment-tree/page.module.css";
import type { CourseConfig } from "./types";

interface CourseLayoutProps {
  config: CourseConfig;
  activeLesson: string;
  setActiveLesson: (id: string) => void;
  /** true while a coding challenge is active (IDE takes full right panel) */
  isChallenge: boolean;
  children: React.ReactNode;
}

function lessonIcon(id: string, done: boolean): string {
  if (done) return "✓";
  if (id === "badge") return "🏆";
  if (id.startsWith("challenge")) return "💻";
  if (id.includes("mcq")) return "❓";
  return "📖";
}

export default function CourseLayout({
  config,
  activeLesson,
  setActiveLesson,
  isChallenge,
  children,
}: CourseLayoutProps) {
  // sidebarCollapsed is the single source of truth.
  // We auto-collapse when entering a challenge so the IDE gets full width,
  // but the toggle button ALWAYS works — even inside a challenge.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(isChallenge);
  }, [isChallenge]);

  const { isLessonComplete } = useProgressStore();

  const partComplete = (partNum: number) => {
    if (!config.parts[partNum - 1]) return false;
    return config.lessons
      .filter(l => l.part === partNum)
      .every(l => isLessonComplete(config.moduleId, l.id));
  };

  return (
    <div className={styles.container}>
      {/* ── Sidebar — always rendered, never hidden ── */}
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
        {/* Header: title (when expanded) + toggle button (always) */}
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
                  display: "flex", alignItems: "center", gap: 8,
                  fontWeight: 700, fontSize: "var(--font-size-md)", color: "var(--text-primary)",
                }}
              >
                <span>{config.icon}</span> {config.title}
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                {config.subtitle}
              </div>
            </div>
          )}

          {/* Toggle — always clickable including inside challenges */}
          <button
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{
              background: "transparent",
              border: "1px solid var(--border-primary)",
              borderRadius: 6,
              color: "var(--text-muted)",
              cursor: "pointer",
              width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 16, lineHeight: 1,
            }}
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        {/* COLLAPSED: icon-only list — always shown when collapsed so user can navigate */}
        {sidebarCollapsed && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingTop: 8 }}>
            {config.lessons.map(l => {
              const done = isLessonComplete(config.moduleId, l.id);
              const active = activeLesson === l.id;
              return (
                <button
                  key={l.id}
                  title={l.title}
                  onClick={() => setActiveLesson(l.id)}
                  style={{
                    width: 36, height: 36,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active
                      ? "rgba(0,240,255,0.15)"
                      : done
                      ? "rgba(0,255,136,0.07)"
                      : "transparent",
                    border: active ? "1px solid var(--cm-cyan)" : "1px solid transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: done ? 11 : 14,
                    color: done ? "var(--cm-green)" : active ? "var(--cm-cyan)" : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {lessonIcon(l.id, done)}
                </button>
              );
            })}
          </div>
        )}

        {/* EXPANDED: full lesson list */}
        {!sidebarCollapsed && (
          <>
            {config.parts.map(part => {
              const done = partComplete(part.number);
              return (
                <div key={part.number} className={styles.partGroup}>
                  <div className={styles.partTitle}>
                    <span>{part.title}</span>
                    {done && (
                      <span
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          color: "var(--cm-green)", fontSize: 11, fontWeight: 700,
                        }}
                      >
                        ✓ Done
                      </span>
                    )}
                  </div>
                  {config.lessons
                    .filter(l => l.part === part.number)
                    .map(l => {
                      const isDone = isLessonComplete(config.moduleId, l.id);
                      const isActive = activeLesson === l.id;
                      return (
                        <button
                          key={l.id}
                          className={`${styles.lessonBtn} ${isActive ? styles.lessonActive : ""}`}
                          onClick={() => setActiveLesson(l.id)}
                        >
                          <span
                            className={styles.iconWrap}
                            style={{ color: isDone ? "var(--cm-green)" : undefined, fontSize: 13 }}
                          >
                            {lessonIcon(l.id, isDone)}
                          </span>
                          <span style={{ flex: 1, textAlign: "left" }}>{l.title}</span>
                          {isDone && !isActive && (
                            <span
                              style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: "var(--cm-green)", flexShrink: 0, opacity: 0.7,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </>
        )}
      </aside>

      {/* ── Content / Challenge pane ── */}
      <section
        className={styles.contentPane}
        style={
          isChallenge
            ? { padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }
            : {}
        }
      >
        <div className={isChallenge ? styles.challengeWrapper : styles.contentContainer}>
          {children}
        </div>
      </section>
    </div>
  );
}
