const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("codemortem-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.tokens?.accessToken ?? null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("codemortem-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.tokens?.refreshToken ?? null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private async request(method: string, path: string, body?: unknown) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const newTokens = await refreshRes.json();

            // Update localStorage
            const stored = localStorage.getItem("codemortem-auth");
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.state.tokens = newTokens;
              localStorage.setItem("codemortem-auth", JSON.stringify(parsed));

              // Trigger storage event so Zustand can pick up the new state potentially
              window.dispatchEvent(new Event("storage"));
            }

            // Retry original request with new token
            headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
            res = await fetch(`${this.baseUrl}${path}`, {
              method,
              headers,
              body: body ? JSON.stringify(body) : undefined,
            });
          } else {
            // Refresh failed, clear auth and force login
            const stored = localStorage.getItem("codemortem-auth");
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.state.tokens = null;
              parsed.state.user = null;
              parsed.state.isAuthenticated = false;
              localStorage.setItem("codemortem-auth", JSON.stringify(parsed));
              window.dispatchEvent(new Event("storage"));

              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
            }
          }
        } catch (e) {
          // ignore network errors on refresh and proceed to bubble 401
        }
      }
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || `Request failed with status ${res.status}`);
    }

    return data;
  }

  get(path: string) {
    return this.request("GET", path);
  }

  post(path: string, body?: unknown) {
    return this.request("POST", path, body);
  }

  put(path: string, body?: unknown) {
    return this.request("PUT", path, body);
  }

  delete(path: string) {
    return this.request("DELETE", path);
  }
}

export const api = new ApiClient(API_BASE);
