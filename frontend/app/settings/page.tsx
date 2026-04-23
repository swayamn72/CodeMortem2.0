"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // CF linking state
  const [cfHandle, setCfHandle] = useState("");
  const [cfStep, setCfStep] = useState<"input" | "verify" | "linked">("input");
  const [cfToken, setCfToken] = useState("");
  const [cfLoading, setCfLoading] = useState(false);
  const [cfError, setCfError] = useState("");
  const [cfSuccess, setCfSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (user?.cfVerified && user?.cfHandle) {
      setCfStep("linked");
      setCfHandle(user.cfHandle);
    }
  }, [user]);

  const handleStartLink = async () => {
    if (!cfHandle.trim()) {
      setCfError("Please enter your Codeforces handle");
      return;
    }

    setCfLoading(true);
    setCfError("");

    try {
      const data = await api.post("/users/me/cf-link", { cfHandle: cfHandle.trim() });
      setCfToken(data.verifyToken || "CM_VERIFY_" + Math.random().toString(36).slice(2, 10).toUpperCase());
      setCfStep("verify");
      setCfSuccess("");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to start linking";
      setCfError(errMsg);
    } finally {
      setCfLoading(false);
    }
  };

  const handleVerify = async () => {
    setCfLoading(true);
    setCfError("");

    try {
      const data = await api.post("/users/me/cf-verify", { cfHandle: cfHandle.trim() });
      setCfStep("linked");
      setCfSuccess(`✅ Successfully linked to ${cfHandle}! CF Rating: ${data.cfRating || "N/A"}`);

      // Update user state
      if (user) {
        setUser({
          ...user,
          cfHandle: cfHandle.trim(),
          cfVerified: true,
          cfRating: data.cfRating || 0,
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Verification failed — make sure the token is in your CF bio";
      setCfError(errMsg);
    } finally {
      setCfLoading(false);
    }
  };

  if (!mounted || !user) return null;

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span className="logo-icon">☠</span>
          Code<span className="brand-accent">Mortem</span>
        </Link>
        <ul className="navbar-nav">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/leaderboard">Leaderboard</Link></li>
        </ul>
        <div className="navbar-actions">
          <Link href="/match/queue" className="btn btn-primary btn-sm">
            ⚡ Find Match
          </Link>
        </div>
      </nav>

      <main className={styles.settings}>
        <h1 className={styles.title}>⚙️ Settings</h1>

        {/* Codeforces Linking */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔗 Codeforces Account</h2>
          <div className="card" style={{ padding: "var(--space-xl)" }}>
            {cfStep === "linked" && (
              <div className={styles.linkedState}>
                <div className={styles.linkedIcon}>✅</div>
                <div>
                  <h3 className={styles.linkedTitle}>Account Linked</h3>
                  <p className={styles.linkedHandle}>
                    <a
                      href={`https://codeforces.com/profile/${cfHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cfLink}
                    >
                      {cfHandle}
                    </a>
                    {user.cfRating && (
                      <span className={styles.cfRating}> ({user.cfRating})</span>
                    )}
                  </p>
                  {cfSuccess && <p className={styles.successMsg}>{cfSuccess}</p>}
                </div>
              </div>
            )}

            {cfStep === "input" && (
              <div className={styles.cfForm}>
                <p className={styles.cfDesc}>
                  Link your Codeforces account to calibrate your starting rating.
                  Your CF rating will be used to set your initial CodeMortem rating.
                </p>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Codeforces handle (e.g. tourist)"
                    value={cfHandle}
                    onChange={(e) => setCfHandle(e.target.value)}
                    disabled={cfLoading}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleStartLink}
                    disabled={cfLoading}
                  >
                    {cfLoading ? "Loading..." : "Link Account"}
                  </button>
                </div>
              </div>
            )}

            {cfStep === "verify" && (
              <div className={styles.cfVerify}>
                <h3 className={styles.verifyTitle}>Verify Ownership</h3>
                <p className={styles.cfDesc}>
                  To verify you own <strong>{cfHandle}</strong>, add the following
                  token to your Codeforces profile bio (Organization or About section):
                </p>

                <div className={styles.tokenBox}>
                  <code className={styles.token}>{cfToken}</code>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigator.clipboard.writeText(cfToken)}
                  >
                    Copy
                  </button>
                </div>

                <div className={styles.verifySteps}>
                  <p>1. Go to <a href="https://codeforces.com/settings/social" target="_blank" rel="noopener noreferrer" className={styles.cfLink}>CF Settings → Social</a></p>
                  <p>2. Paste the token into your <strong>Organization</strong> field</p>
                  <p>3. Save, then click &quot;Verify&quot; below</p>
                </div>

                <div className={styles.verifyActions}>
                  <button
                    className="btn btn-primary"
                    onClick={handleVerify}
                    disabled={cfLoading}
                  >
                    {cfLoading ? "Verifying..." : "✓ Verify"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCfStep("input")}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {cfError && <p className={styles.errorMsg}>{cfError}</p>}
          </div>
        </section>

        {/* Account Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>👤 Account</h2>
          <div className="card" style={{ padding: "var(--space-xl)" }}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Username</span>
              <span className={styles.infoValue}>{user.username}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user.email || "—"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Rating</span>
              <span className={styles.infoValue} style={{ fontFamily: "var(--font-mono)" }}>
                {Math.round(user.rating)}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Member since</span>
              <span className={styles.infoValue}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ color: "var(--cm-red)" }}>⚠️ Danger Zone</h2>
          <div className="card" style={{ padding: "var(--space-xl)", borderColor: "rgba(255,45,85,0.2)" }}>
            <p className={styles.dangerDesc}>
              Logging out will clear your session. You can log back in anytime.
            </p>
            <button className="btn btn-secondary" onClick={() => { useAuthStore.getState().logout(); router.push("/"); }}>
              Log Out
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
