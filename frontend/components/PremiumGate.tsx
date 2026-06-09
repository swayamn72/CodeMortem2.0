"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

interface PremiumGateProps {
  children: React.ReactNode;
  featureName?: string;
}

/**
 * Wraps premium-only content. Shows an upgrade prompt to non-premium users.
 */
export default function PremiumGate({ children, featureName = "this feature" }: PremiumGateProps) {
  const user = useAuthStore((s) => s.user);

  const isPremiumActive = user?.isPremium && (
    !user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
  );

  if (isPremiumActive) return <>{children}</>;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      padding: "3rem 2rem",
      textAlign: "center",
    }}>
      {/* Lock icon */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(0,240,255,0.1), rgba(0,255,136,0.05))",
        border: "2px solid rgba(0,240,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "2rem", marginBottom: "1.5rem",
        boxShadow: "0 0 30px rgba(0,240,255,0.1)",
      }}>
        👑
      </div>

      <h2 style={{
        fontSize: "1.75rem", fontWeight: 800,
        color: "var(--text-primary)", marginBottom: "0.5rem", letterSpacing: "-0.5px",
      }}>
        Premium Feature
      </h2>
      <p style={{
        fontSize: "0.95rem", color: "var(--text-secondary)",
        maxWidth: 380, lineHeight: 1.75, marginBottom: "2rem",
      }}>
        Unlock {featureName} and more with CodeMortem Premium.
        Practice Bank, bonus editorials, and timed contests — built for serious competitors.
      </p>

      {/* Mini plan preview */}
      <div style={{
        display: "flex", gap: 16, marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center",
      }}>
        <div style={{
          background: "var(--surface-color)", border: "1px solid var(--border-primary)",
          borderRadius: 12, padding: "16px 24px", minWidth: 140,
        }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Monthly</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)" }}>₹500</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>per month</div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, rgba(0,240,255,0.07), rgba(0,255,136,0.04))",
          border: "2px solid rgba(0,240,255,0.3)",
          borderRadius: 12, padding: "16px 24px", minWidth: 140, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg, var(--cm-cyan), #00cc88)",
            color: "#0a0a0f", fontSize: 10, fontWeight: 800, letterSpacing: 1,
            padding: "3px 12px", borderRadius: 100, whiteSpace: "nowrap",
          }}>
            BEST VALUE
          </div>
          <div style={{ fontSize: 12, color: "var(--cm-cyan)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Quarterly</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)" }}>₹1,200</div>
          <div style={{ fontSize: 12, color: "var(--cm-green)", fontWeight: 600 }}>Save ₹300</div>
        </div>
      </div>

      <Link
        href="/premium"
        className="btn btn-primary"
        style={{ fontSize: "1rem", padding: "12px 36px", display: "inline-block" }}
      >
        Unlock Premium →
      </Link>

      {!user && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
          <Link href="/login" style={{ color: "var(--cm-cyan)" }}>Log in</Link> or{" "}
          <Link href="/register" style={{ color: "var(--cm-cyan)" }}>create an account</Link> first.
        </p>
      )}


    </div>
  );
}
