import { create } from "zustand";

interface Opponent {
  username: string;
  rating: number;
}

type QueueStatus = "idle" | "searching" | "found" | "countdown" | "in_match";

interface QueueState {
  status: QueueStatus;
  opponent: Opponent | null;
  countdown: number;
  matchId: string | null;
  searchTime: number;
  ws: WebSocket | null;

  joinQueue: () => void;
  leaveQueue: () => void;
  setStatus: (status: QueueStatus) => void;
  setOpponent: (opponent: Opponent) => void;
  setCountdown: (n: number) => void;
  setMatchId: (id: string) => void;
  setSearchTime: (t: number) => void;
  setWs: (ws: WebSocket | null) => void;
  reset: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  status: "idle",
  opponent: null,
  countdown: 10,
  matchId: null,
  searchTime: 0,
  ws: null,

  joinQueue: () => {
    const ws = get().ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "join_queue" }));
      set({ status: "searching", searchTime: 0 });
    }
  },

  leaveQueue: () => {
    const ws = get().ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "leave_queue" }));
    }
    set({ status: "idle", opponent: null, searchTime: 0 });
  },

  setStatus: (status) => set({ status }),
  setOpponent: (opponent) => set({ opponent }),
  setCountdown: (countdown) => set({ countdown }),
  setMatchId: (matchId) => set({ matchId }),
  setSearchTime: (searchTime) => set({ searchTime }),
  setWs: (ws) => set({ ws }),

  reset: () => set({
    status: "idle",
    opponent: null,
    countdown: 10,
    matchId: null,
    searchTime: 0,
  }),
}));
