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

  /** Mark a single lesson as complete */
  markLessonComplete: (moduleId: string, lessonId: string) => void;

  /** Check if a specific lesson is complete */
  isLessonComplete: (moduleId: string, lessonId: string) => boolean;

  /** Check if ALL provided lessonIds are complete for a module */
  isModuleComplete: (moduleId: string, allLessonIds: string[]) => boolean;

  /** Get the count of completed lessons for a module */
  getCompletedCount: (moduleId: string) => number;

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
        } catch (err) {
          console.error("Failed to fetch progress from backend:", err);
        }
      },

      clearProgress: () => {
        set({ completedLessons: {} });
      },
    }),
    {
      name: "codemortem-progress",
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
