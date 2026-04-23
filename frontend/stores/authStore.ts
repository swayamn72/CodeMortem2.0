import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  ratingDeviation: number;
  cfHandle: string | null;
  cfRating: number | null;
  cfVerified: boolean;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  totalProblemsSolved: number;
  rankTitle: string;
  email: string;
  createdAt: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        set({
          user: res.user,
          tokens: res.tokens,
          isAuthenticated: true,
        });
      },

      register: async (username: string, email: string, password: string) => {
        const res = await api.post("/auth/register", { username, email, password });
        set({
          user: res.user,
          tokens: res.tokens,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      refreshTokens: async () => {
        const { tokens } = get();
        if (!tokens) return;

        try {
          const res = await api.post("/auth/refresh", {
            refreshToken: tokens.refreshToken,
          });
          set({ tokens: res });
        } catch {
          set({ user: null, tokens: null, isAuthenticated: false });
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: "codemortem-auth",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
