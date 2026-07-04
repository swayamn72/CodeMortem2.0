import React from "react";

interface SuccessModalProps {
  title: string;
  testCount: number;
  passedCount: number;
  onClose: () => void;
  onNext?: () => void;
  nextLabel?: string;
  stayLabel?: string;
}

export default function SuccessModal({
  title,
  testCount,
  passedCount,
  onClose,
  onNext,
  nextLabel = "Next →",
  stayLabel = "Stay here"
}: SuccessModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #0d0d18 0%, #111122 100%)",
          border: "1px solid rgba(0,240,255,0.25)",
          borderRadius: "20px",
          padding: "48px 40px 36px",
          width: "min(480px, 90vw)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,240,255,0.08)",
          animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Background glow orbs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%)" }} />
        </div>

        {/* Mascot with pulse ring */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
          <div style={{
            position: "absolute", inset: "-12px",
            borderRadius: "50%",
            border: "2px solid rgba(0,240,255,0.4)",
            animation: "ping 1.4s ease-out infinite",
          }} />
          <div style={{
            fontSize: "72px", lineHeight: 1,
            filter: "drop-shadow(0 0 20px rgba(0,240,255,0.6))",
            animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          }}>
            💀
          </div>
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: "26px", fontWeight: 800, color: "var(--text-primary)",
          margin: "0 0 6px", letterSpacing: "-0.5px",
        }}>
          Challenge Complete!
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 8px" }}>
          {title}
        </p>

        {/* Pass rate badge */}
        <div style={{ marginBottom: "28px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)",
            borderRadius: "999px", padding: "4px 14px",
            fontSize: "13px", fontWeight: 700, color: "var(--cm-green)",
          }}>
            ✓ {passedCount}/{testCount} test cases passed
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {onNext && (
            <button
              onClick={onNext}
              style={{
                background: "linear-gradient(90deg, rgba(0,240,255,0.1), rgba(0,255,136,0.1))",
                border: "1px solid rgba(0,255,136,0.4)",
                borderRadius: "12px", padding: "14px",
                color: "var(--cm-cyan)", fontSize: "15px", fontWeight: 700,
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(0,255,136,0.1)",
              }}
            >
              {nextLabel}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", padding: "14px",
              color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {stayLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
