"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PremiumGate from "@/components/PremiumGate";
import PracticeChallengeIde from "@/components/PracticeChallengeIde";
import { useProgressStore } from "@/stores/progressStore";
import type { ChallengeConfig } from "@/components/course/types";

// Import premium challenge sets per module
import {
  BM_PREMIUM_CHALLENGES,
  BM_PREMIUM_CHALLENGE_LIST,
} from "@/components/learn/bit-manipulation/premiumChallenges";

// Module → challenge map registry
const MODULE_CHALLENGES: Record<string, {
  list: ChallengeConfig[];
  map: Record<string, ChallengeConfig>;
  title: string;
  icon: string;
}> = {
  "bit-manipulation-easy": {
    list: BM_PREMIUM_CHALLENGE_LIST,
    map:  BM_PREMIUM_CHALLENGES,
    title: "Bit Manipulation — Practice Bank",
    icon: "🔢",
  },
  // More modules added here as content is created
};

export default function PracticeBankPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const moduleData = MODULE_CHALLENGES[moduleId];
  const { completedLessons, markLessonComplete } = useProgressStore();
  const [selectedId, setSelectedId] = useState<string>("");
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());

  // Initialize with first challenge
  useEffect(() => {
    if (moduleData?.list.length && !selectedId) {
      setSelectedId(moduleData.list[0].id);
    }
  }, [moduleId]);

  // Sync solved state from progress store
  useEffect(() => {
    if (!moduleData) return;
    const moduleLessons = completedLessons[moduleId] ?? [];
    const solved = new Set(
      moduleData.list
        .filter(c => moduleLessons.includes(c.id))
        .map(c => c.id)
    );
    setSolvedSet(solved);
  }, [completedLessons, moduleId]);

  const handleSolved = (id: string) => {
    markLessonComplete(moduleId, id);
    setSolvedSet(prev => new Set(prev).add(id));
  };

  // Unknown module — show fallback
  if (!moduleData) {
    return (
      <PremiumGate featureName="the Practice Bank">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
          <div style={{ fontSize: "2rem" }}>🚧</div>
          <h2 style={{ color: "var(--text-primary)" }}>Practice Bank coming soon</h2>
          <p style={{ color: "var(--text-secondary)" }}>We&apos;re adding bonus problems for this module.</p>
          <Link href="/learn" className="btn btn-secondary">Back to Learn</Link>
        </div>
      </PremiumGate>
    );
  }

  const selectedChallenge = selectedId ? moduleData.map[selectedId] : moduleData.list[0];
  const totalSolved = solvedSet.size;

  return (
    <PremiumGate featureName="the Practice Bank">
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 16px", height: 52,
          background: "#0d0d12", borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0, zIndex: 20,
        }}>
          <Link href="/learn" style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
          }}>
            ← Learn
          </Link>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
            {moduleData.icon} {moduleData.title}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: totalSolved === moduleData.list.length ? "var(--cm-green)" : "var(--text-muted)",
            background: "rgba(255,255,255,0.04)",
            padding: "3px 12px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {totalSolved}/{moduleData.list.length} solved
          </span>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1,
            color: "#ffd700", padding: "3px 10px",
            background: "rgba(255,215,0,0.08)",
            border: "1px solid rgba(255,215,0,0.2)", borderRadius: 6,
          }}>
            👑 PREMIUM
          </span>
        </div>

        {/* Main: sidebar + IDE */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Problem list sidebar */}
          <div style={{
            width: 260, flexShrink: 0,
            background: "#0f0f16", borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex", flexDirection: "column", overflowY: "auto",
          }}>
            <div style={{ padding: "12px 14px 8px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Problems
            </div>
            {moduleData.list.map((challenge, idx) => {
              const solved = solvedSet.has(challenge.id);
              const active = challenge.id === selectedId;
              return (
                <button
                  key={challenge.id}
                  onClick={() => setSelectedId(challenge.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", textAlign: "left",
                    background: active ? "rgba(0,240,255,0.07)" : "transparent",
                    border: "none",
                    borderLeft: active ? "3px solid var(--cm-cyan)" : "3px solid transparent",
                    cursor: "pointer", width: "100%",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Solved indicator */}
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800,
                    background: solved ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${solved ? "var(--cm-green)" : "rgba(255,255,255,0.1)"}`,
                    color: solved ? "var(--cm-green)" : "var(--text-muted)",
                  }}>
                    {solved ? "✓" : idx + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {challenge.title}
                    </div>
                    <div style={{ fontSize: 11, color: challenge.diffColor, marginTop: 1 }}>
                      {challenge.difficulty}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* IDE panel */}
          {selectedChallenge && (
            <PracticeChallengeIde
              challenge={selectedChallenge}
              onSolved={handleSolved}
              onNavigate={(nextId) => {
                if (nextId && moduleData.map[nextId]) setSelectedId(nextId);
              }}
            />
          )}
        </div>
      </div>
    </PremiumGate>
  );
}
