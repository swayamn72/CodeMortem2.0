import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import { useAuthStore } from "./authStore";

/**
 * Tracks which individual lessons/exercises the user has completed,
 * keyed by moduleId. Persisted to localStorage so it survives page refreshes.
 *
 * moduleId → Set of completed lessonIds
 */

interface ProgressState {
  /** completedLessons["segment-tree-easy"] = ["lesson1", "mcq1", "challenge1", ...] */
  completedLessons: Record<string, string[]>;

  /**
   * earnedBadges["bit-manipulation-easy"] = "2026-06-16T14:00:00.000Z"
   * Maps badgeId (= moduleId) to ISO timestamp of when it was earned.
   */
  earnedBadges: Record<string, string>;

  /** Mark a single lesson as complete */
  markLessonComplete: (moduleId: string, lessonId: string) => void;

  /** Check if a specific lesson is complete */
  isLessonComplete: (moduleId: string, lessonId: string) => boolean;

  /** Check if ALL provided lessonIds are complete for a module */
  isModuleComplete: (moduleId: string, allLessonIds: string[]) => boolean;

  /** Get the count of completed lessons for a module */
  getCompletedCount: (moduleId: string) => number;

  /** Award a badge for a completed module (idempotent) */
  awardBadge: (moduleId: string) => void;

  /** Check if a badge has been earned */
  hasBadge: (moduleId: string) => boolean;

  /** Scan completedLessons and award any missing badges (migration / sync fix) */
  migrateBadges: () => void;

  /** Reset progress for a module (for testing/dev) */
  resetModule: (moduleId: string) => void;

  /** Fetch progress from the backend and populate the store */
  syncWithBackend: () => Promise<void>;

  /** Clear all progress (e.g., on logout) */
  clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: {},
      earnedBadges: {},

      markLessonComplete: (moduleId, lessonId) => {
        const current = get().completedLessons[moduleId] ?? [];
        if (current.includes(lessonId)) return; // already marked

        const newLessons = [...current, lessonId];
        set((state) => ({
          completedLessons: {
            ...state.completedLessons,
            [moduleId]: newLessons,
          },
        }));

        // Auto-award badge when the "badge" lesson is marked complete
        if (lessonId === "badge") {
          get().awardBadge(moduleId);
        }

        // If authenticated, persist to backend
        if (useAuthStore.getState().isAuthenticated) {
          api.post("/users/me/progress", {
            moduleId,
            completedLessons: newLessons,
          }).catch(err => console.error("Failed to sync progress:", err));
        }
      },

      isLessonComplete: (moduleId, lessonId) => {
        return (get().completedLessons[moduleId] ?? []).includes(lessonId);
      },

      isModuleComplete: (moduleId, allLessonIds) => {
        const completed = get().completedLessons[moduleId] ?? [];
        return allLessonIds.every((id) => completed.includes(id));
      },

      getCompletedCount: (moduleId) => {
        return (get().completedLessons[moduleId] ?? []).length;
      },

      awardBadge: (moduleId) => {
        const existing = get().earnedBadges[moduleId];
        if (existing) return; // already awarded — idempotent
        set((state) => ({
          earnedBadges: {
            ...state.earnedBadges,
            [moduleId]: new Date().toISOString(),
          },
        }));
      },

      hasBadge: (moduleId) => {
        return !!get().earnedBadges[moduleId];
      },

      migrateBadges: () => {
        // Award badges for any module where the "badge" lesson is complete
        // but earnedBadges doesn't yet have an entry. This handles:
        //  1. Users who completed a course before the badge system existed
        //  2. Progress synced from the backend (which doesn't track earnedBadges)
        const { completedLessons, earnedBadges } = get();
        const missing: Record<string, string> = {};
        Object.entries(completedLessons).forEach(([moduleId, lessons]) => {
          if (lessons.includes("badge") && !earnedBadges[moduleId]) {
            missing[moduleId] = new Date().toISOString();
          }
        });
        if (Object.keys(missing).length > 0) {
          set((s) => ({ earnedBadges: { ...s.earnedBadges, ...missing } }));
        }
      },

      resetModule: (moduleId) => {
        set((state) => ({
          completedLessons: { ...state.completedLessons, [moduleId]: [] },
        }));
      },

      syncWithBackend: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;
        try {
          const res = await api.get("/users/me/progress");
          set({ completedLessons: res });
          // After syncing from backend, award any badges whose lesson is already complete
          get().migrateBadges();
        } catch (err) {
          console.error("Failed to fetch progress from backend:", err);
        }
      },

      clearProgress: () => {
        set({ completedLessons: {}, earnedBadges: {} });
      },
    }),
    {
      name: "codemortem-progress",
      onRehydrateStorage: () => (state) => {
        // After localStorage is loaded, award any badges whose lesson is already complete
        if (state) state.migrateBadges();
      },
    }

  )
);

// Automatically sync progress when auth state changes
if (typeof window !== "undefined") {
  useAuthStore.subscribe((state, prevState) => {
    // On login: sync from backend
    if (state.isAuthenticated && !prevState.isAuthenticated) {
      useProgressStore.getState().syncWithBackend();
    } 
    // On logout: clear local progress
    else if (!state.isAuthenticated && prevState.isAuthenticated) {
      useProgressStore.getState().clearProgress();
    }
  });

  // Also try to sync once on initial load if already authenticated
  if (useAuthStore.getState().isAuthenticated) {
    useProgressStore.getState().syncWithBackend();
  }
}
