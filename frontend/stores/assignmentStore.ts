import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AssignmentAttempt {
  id: string;
  userId: string;
  moduleId: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  timedOut: boolean;
  answers: Record<string, number>;
  submittedAt: string;
}

interface AssignmentState {
  attempts: AssignmentAttempt[];
  recordAttempt: (attempt: Omit<AssignmentAttempt, "id" | "submittedAt">) => void;
  clearAttempts: () => void;
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set) => ({
      attempts: [],
      recordAttempt: (attempt) => {
        const id = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${attempt.moduleId}-${Date.now()}`;

        set((state) => ({
          attempts: [
            ...state.attempts,
            {
              ...attempt,
              id,
              submittedAt: new Date().toISOString(),
            },
          ],
        }));
      },
      clearAttempts: () => set({ attempts: [] }),
    }),
    {
      name: "codemortem-assignment",
    }
  )
);
