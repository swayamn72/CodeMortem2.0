"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import styles from "./page.module.css";

declare global {
  interface Window {
    Razorpay: new (options: object) => { open: () => void };
  }
}

const FEATURES = [
  { label: "All module lessons", free: true, premium: true },
  { label: "Module coding challenges", free: true, premium: true },
  { label: "Completion badges", free: true, premium: true },
  { label: "Ranked matches & Solo practice", free: true, premium: true },
  { label: "Practice Bank (8+ bonus problems/module)", free: false, premium: true },
  { label: "Full editorials + C++ & Python solutions", free: false, premium: true },
  { label: "Post-module timed practice contests", free: false, premium: true },
  { label: "👑 Premium badge on leaderboard", free: false, premium: true },
];

export default function PremiumPage() {
  const { user, isAuthenticated, refreshUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly">("quarterly");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const isPremiumActive = user?.isPremium && (
    !user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
  );

  const handleUpgrade = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setLoading(true);
    try {
      // Create order on backend
      const order = await api.post("/subscription/create-order", { plan: selectedPlan });

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Razorpay script failed to load"));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        name: "CodeMortem",
        description: selectedPlan === "monthly" ? "Monthly Premium" : "Quarterly Premium (3 months)",
        order_id: order.orderId,
        prefill: {
          name: user?.username,
          email: user?.email,
        },
        theme: { color: "#00f0ff" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await api.post("/subscription/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan: selectedPlan,
            });
            setSuccess(true);
            await refreshUser();
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
      });
      rzp.open();
    } catch (err) {
      console.error("Upgrade failed:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar activeTab="premium" />

      <div className="grid-bg" />

      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>CODEMORTEM PREMIUM</div>
          <h1 className={styles.heroTitle}>
            Unlock Your Full<br />
            <span className={styles.heroAccent}>Competitive Potential</span>
          </h1>
          <p className={styles.heroSub}>
            Practice Bank, bonus problems, full editorials, and timed contests —
            everything you need to go from good to elite.
          </p>
        </div>

        {/* Already premium state */}
        {isPremiumActive ? (
          <div className={styles.alreadyPremium}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>👑</div>
            <h2 style={{ color: "var(--cm-cyan)", marginBottom: 8 }}>You&apos;re Premium!</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
              Plan: <strong style={{ color: "var(--text-primary)" }}>{user.premiumPlan ?? "—"}</strong>
            </p>
            {user.premiumExpiresAt && (
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Active until:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {new Date(user.premiumExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </strong>
              </p>
            )}
            <Link href="/learn" className="btn btn-primary" style={{ marginTop: 24, display: "inline-block" }}>
              Go to Learn →
            </Link>
          </div>
        ) : (
          <>
            {/* Success state */}
            {success && (
              <div className={styles.successCard}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🎉</div>
                <h2 style={{ color: "var(--cm-green)", marginBottom: 8 }}>Premium Activated!</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                  Welcome to CodeMortem Premium. Your Practice Bank is now unlocked.
                </p>
                <Link href="/learn" className="btn btn-primary">Start Practicing →</Link>
              </div>
            )}

            {!success && (
              <>
                {/* Plan cards */}
                <div className={styles.planGrid}>
                  {/* Monthly */}
                  <div
                    className={`${styles.planCard} ${selectedPlan === "monthly" ? styles.planCardSelected : ""}`}
                    onClick={() => setSelectedPlan("monthly")}
                  >
                    <div className={styles.planName}>Monthly</div>
                    <div className={styles.planPrice}>
                      <span className={styles.planCurrency}>₹</span>500
                    </div>
                    <div className={styles.planPer}>per month</div>
                    <ul className={styles.planFeatures}>
                      <li>Full Practice Bank access</li>
                      <li>All editorials unlocked</li>
                      <li>Practice contests</li>
                      <li>👑 Premium badge</li>
                    </ul>
                    <div className={styles.planSelect}>
                      {selectedPlan === "monthly" ? "✓ Selected" : "Select"}
                    </div>
                  </div>

                  {/* Quarterly */}
                  <div
                    className={`${styles.planCard} ${styles.planCardFeatured} ${selectedPlan === "quarterly" ? styles.planCardSelected : ""}`}
                    onClick={() => setSelectedPlan("quarterly")}
                  >
                    <div className={styles.bestValueBadge}>Best Value</div>
                    <div className={styles.planName}>Quarterly</div>
                    <div className={styles.planPrice}>
                      <span className={styles.planCurrency}>₹</span>1,200
                    </div>
                    <div className={styles.planPer}>for 3 months</div>
                    <div className={styles.planSavings}>Save ₹300 · ₹400/month</div>
                    <ul className={styles.planFeatures}>
                      <li>Everything in Monthly</li>
                      <li>3 months continuous access</li>
                      <li>Best value for students</li>
                      <li>Priority support</li>
                    </ul>
                    <div className={styles.planSelect}>
                      {selectedPlan === "quarterly" ? "✓ Selected" : "Select"}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div style={{ textAlign: "center", marginTop: 32 }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpgrade}
                    disabled={loading}
                    style={{ fontSize: "1.05rem", padding: "14px 48px", minWidth: 240 }}
                  >
                    {loading ? "Loading…" : `Get ${selectedPlan === "monthly" ? "Monthly" : "Quarterly"} Premium →`}
                  </button>
                  {!isAuthenticated && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
                      You&apos;ll be prompted to log in first.
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                    Secure payment via Razorpay · UPI, Cards, Net Banking accepted
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* Feature comparison */}
        <div className={styles.comparisonSection}>
          <h2 className={styles.comparisonTitle}>What&apos;s included</h2>
          <div className={styles.comparisonTable}>
            <div className={styles.comparisonHeader}>
              <div />
              <div style={{ textAlign: "center", color: "var(--text-secondary)", fontWeight: 600 }}>Free</div>
              <div style={{ textAlign: "center", color: "var(--cm-cyan)", fontWeight: 700 }}>Premium</div>
            </div>
            {FEATURES.map((f) => (
              <div key={f.label} className={styles.comparisonRow}>
                <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>{f.label}</div>
                <div style={{ textAlign: "center", fontSize: 16 }}>
                  {f.free ? <span style={{ color: "var(--cm-green)" }}>✓</span> : <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>—</span>}
                </div>
                <div style={{ textAlign: "center", fontSize: 16 }}>
                  {f.premium ? <span style={{ color: "var(--cm-cyan)" }}>✓</span> : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>


      </main>
    </>
  );
}
