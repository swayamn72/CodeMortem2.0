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
  isPremium: boolean;
  premiumExpiresAt: string | null;
  premiumPlan: string | null;
  emailVerified: boolean;
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
  loginWithGoogle: (idToken: string) => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  register: (username: string, email: string, password: string, otp: string) => Promise<{ somaiyaPremium?: boolean }>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
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

      loginWithGoogle: async (idToken: string) => {
        const res = await api.post("/auth/google", { idToken });
        set({
          user: res.user,
          tokens: res.tokens,
          isAuthenticated: true,
        });
      },

      sendOtp: async (email: string) => {
        await api.post("/auth/send-otp", { email });
      },

      register: async (username: string, email: string, password: string, otp: string) => {
        const res = await api.post("/auth/register", { username, email, password, otp });
        set({
          user: res.user,
          tokens: res.tokens,
          isAuthenticated: true,
        });
        return { somaiyaPremium: res.somaiyaPremium ?? false };
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

      refreshUser: async () => {
        try {
          const user = await api.get("/users/me");
          set({ user });
        } catch {
          // ignore
        }
      },
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
