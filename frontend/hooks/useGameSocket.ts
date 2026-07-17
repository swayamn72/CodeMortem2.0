/**
 * useGameSocket — shared WebSocket connect utility for queue + solo pages.
 *
 * Performs a /users/me preflight to ensure the access token is fresh
 * (the api interceptor auto-refreshes if expired) before opening the WS.
 * Both queue/page.tsx and solo/page.tsx use this — solo gains the preflight
 * it previously lacked.
 */

import { api } from "@/lib/api";

export const GAME_WS_URL: string =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/game";

interface GameSocketHandlers {
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (msg: { type: string; data?: Record<string, unknown> }) => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

/**
 * connectGameSocket — opens a WS connection to the game server.
 *
 * 1. Returns null immediately if no accessToken is provided.
 * 2. Runs GET /users/me — if the JWT is expired the api interceptor refreshes
 *    it before this resolves, so the WS token will always be fresh.
 * 3. Constructs WebSocket, wires the supplied handlers, and returns the socket.
 * 4. Returns null on preflight failure (caller should surface an error to the
 *    user via their existing errorMsg state).
 */
export async function connectGameSocket(
  accessToken: string | undefined | null,
  handlers: GameSocketHandlers
): Promise<WebSocket | null> {
  if (!accessToken) return null;

  try {
    await api.get("/users/me");
  } catch (err) {
    console.error("[game-ws] /users/me preflight failed:", err);
    return null;
  }

  const ws = new WebSocket(`${GAME_WS_URL}?token=${accessToken}`);

  if (handlers.onOpen) {
    ws.addEventListener("open", () => handlers.onOpen!(ws));
  }

  if (handlers.onMessage) {
    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          data?: Record<string, unknown>;
        };
        handlers.onMessage!(msg);
      } catch {
        console.warn("[game-ws] failed to parse message:", event.data);
      }
    });
  }

  if (handlers.onClose) {
    ws.addEventListener("close", handlers.onClose);
  }

  if (handlers.onError) {
    ws.addEventListener("error", handlers.onError);
  }

  return ws;
}
