"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response: { credential: string }) => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const initGoogle = () => {
    if (!window.google || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: googleBtnRef.current.offsetWidth || 360,
    });
  };

  // Re-init when ref is ready
  useEffect(() => {
    if (window.google) initGoogle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={initGoogle}
        strategy="afterInteractive"
      />

      <div className="auth-page">
        <div className="card auth-card">
          <Link href="/" className="navbar-brand" style={{ marginBottom: "var(--space-xl)", display: "flex" }}>
            <span className="logo-icon">☠</span>
            Code<span className="brand-accent">Mortem</span>
          </Link>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your grind</p>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(255, 45, 85, 0.1)",
                border: "1px solid rgba(255, 45, 85, 0.3)",
                borderRadius: "var(--radius-md)",
                color: "var(--cm-red)",
                fontSize: "var(--font-size-sm)",
                marginBottom: "var(--space-md)",
              }}
            >
              {error}
            </div>
          )}

          {/* Google Sign-In button */}
          <div style={{ marginBottom: "var(--space-md)" }}>
            {googleLoading ? (
              <button
                disabled
                className="btn btn-secondary"
                style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
              >
                Signing in with Google...
              </button>
            ) : (
              <div
                ref={googleBtnRef}
                id="google-signin-btn-login"
                style={{ width: "100%", minHeight: "44px" }}
              />
            )}
          </div>

          <div className="auth-divider">or sign in with email</div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", marginTop: "var(--space-sm)" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "var(--font-size-sm)",
              color: "var(--text-secondary)",
              marginTop: "var(--space-lg)",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
