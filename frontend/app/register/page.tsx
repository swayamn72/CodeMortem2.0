"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

const SOMAIYA_DOMAIN = "@somaiya.edu";
const OTP_LENGTH = 6;
const COOLDOWN_SECS = 60;

export default function RegisterPage() {
  // Step 1 fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [somaiyaBanner, setSomaiyaBanner] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  // OTP cooldown
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const isSomaiya = email.toLowerCase().endsWith(SOMAIYA_DOMAIN);

  // Cleanup cooldown timer
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECS);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  // Step 1 submit — send OTP
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    try {
      await sendOtp(email);
      setStep(2);
      startCooldown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("60 seconds")) {
        setStep(2);
        startCooldown();
      } else {
        setError(msg || "Failed to send verification code");
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP input handler
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    if (digit && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      pasted.split("").forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      const next = Math.min(pasted.length, OTP_LENGTH - 1);
      setTimeout(() => otpRefs.current[next]?.focus(), 0);
      e.preventDefault();
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await sendOtp(email);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      startCooldown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 submit — verify OTP + register
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join("");
    if (otpStr.length < OTP_LENGTH) { setError("Please enter all 6 digits"); return; }
    setError("");
    setLoading(true);
    try {
      const result = await register(username, email, password, otpStr);
      if (result.somaiyaPremium) {
        setSuccessBanner(true);
        setTimeout(() => router.push("/dashboard"), 2800);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
      text: "signup_with",
      shape: "rectangular",
      width: googleBtnRef.current.offsetWidth || 360,
    });
  };

  useEffect(() => { if (window.google) initGoogle(); }, []);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} strategy="afterInteractive" />

      <div className="auth-page">
        <div className="card auth-card" style={{ maxWidth: 420 }}>
          <Link href="/" className="navbar-brand" style={{ marginBottom: "var(--space-xl)", display: "flex" }}>
            <span className="logo-icon">☠</span>
            Code<span className="brand-accent">Mortem</span>
          </Link>

          {/* Success banner (Somaiya premium) */}
          {successBanner && (
            <div style={{
              padding: "12px 16px", marginBottom: "var(--space-md)",
              background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.3)",
              borderRadius: "var(--radius-md)", textAlign: "center",
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🎓</div>
              <div style={{ fontWeight: 700, color: "var(--cm-cyan)", marginBottom: 4 }}>Somaiya Premium Activated!</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>3 months of CodeMortem Premium — free. Redirecting…</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px", background: "rgba(255,45,85,0.1)",
              border: "1px solid rgba(255,45,85,0.3)", borderRadius: "var(--radius-md)",
              color: "var(--cm-red)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-md)",
            }}>
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <h1 className="auth-title">Join the Arena</h1>
              <p className="auth-subtitle">Create your account and start competing</p>

              {/* Google Sign-Up */}
              <div style={{ marginBottom: "var(--space-md)" }}>
                {googleLoading ? (
                  <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.7 }}>
                    Creating account with Google...
                  </button>
                ) : (
                  <div ref={googleBtnRef} id="google-signup-btn-register" style={{ width: "100%", minHeight: "44px" }} />
                )}
              </div>

              <div className="auth-divider">or register with email</div>

              {/* Somaiya teaser */}
              {isSomaiya && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", marginBottom: 16,
                  background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.25)",
                  borderRadius: "var(--radius-md)",
                }}>
                  <span style={{ fontSize: "1.2rem" }}>🎓</span>
                  <span style={{ fontSize: 13, color: "var(--cm-cyan)", fontWeight: 600 }}>
                    Somaiya students get 3 months Premium free!
                  </span>
                </div>
              )}

              <form className="auth-form" onSubmit={handleStep1}>
                <div className="input-group">
                  <label className="input-label" htmlFor="username">Username</label>
                  <input id="username" type="text" className="input" placeholder="your_handle"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    required autoComplete="username" maxLength={30} />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-email">Email</label>
                  <input id="reg-email" type="email" className="input" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email" />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-password">Password</label>
                  <input id="reg-password" type="password" className="input" placeholder="At least 8 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="new-password" minLength={8} />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
                  <input id="confirm-password" type="password" className="input" placeholder="Confirm your password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    required autoComplete="new-password" />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ width: "100%", marginTop: "var(--space-sm)" }}>
                  {loading ? "Sending code…" : "Continue →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="auth-title" style={{ fontSize: "1.5rem" }}>Verify your email</h1>
              <p className="auth-subtitle" style={{ marginBottom: "var(--space-lg)" }}>
                We sent a 6-digit code to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
              </p>

              {isSomaiya && !successBanner && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", marginBottom: 16,
                  background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.25)",
                  borderRadius: "var(--radius-md)",
                }}>
                  <span style={{ fontSize: "1.2rem" }}>🎓</span>
                  <span style={{ fontSize: 13, color: "var(--cm-cyan)", fontWeight: 600 }}>
                    Verify to activate your free 3-month Premium!
                  </span>
                </div>
              )}

              <form onSubmit={handleStep2}>
                {/* OTP digit inputs */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: "var(--space-lg)" }}
                  onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={{
                        width: 48, height: 56, textAlign: "center", fontSize: "1.5rem",
                        fontWeight: 800, fontFamily: "var(--font-mono)",
                        background: "var(--surface-color)",
                        border: digit ? "2px solid var(--cm-cyan)" : "1px solid var(--border-primary)",
                        borderRadius: 10, color: "var(--text-primary)",
                        outline: "none", transition: "border-color 0.15s",
                        caretColor: "var(--cm-cyan)",
                      }}
                    />
                  ))}
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading || otp.join("").length < OTP_LENGTH}
                  style={{ width: "100%", marginBottom: "var(--space-md)" }}>
                  {loading ? "Verifying…" : "Verify & Create Account"}
                </button>
              </form>

              {/* Resend */}
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                Didn&apos;t receive it?{" "}
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  style={{
                    background: "none", border: "none", padding: 0,
                    color: cooldown > 0 ? "var(--text-muted)" : "var(--cm-cyan)",
                    cursor: cooldown > 0 ? "default" : "pointer",
                    fontWeight: 600, fontSize: 13,
                  }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              {/* Back */}
              <button
                onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }}
                style={{
                  background: "none", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", fontSize: 13, marginTop: 12,
                  display: "block", width: "100%", textAlign: "center",
                }}
              >
                ← Change email
              </button>
            </>
          )}

          {step === 1 && (
            <p style={{ textAlign: "center", fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", marginTop: "var(--space-lg)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ fontWeight: 600 }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
