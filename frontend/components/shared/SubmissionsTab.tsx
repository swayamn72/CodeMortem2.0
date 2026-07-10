import React from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import type { LPSubmission } from "@/components/course/types";
import { getVerdictColor, getVerdictLabel } from "@/lib/verdicts";
import { Lock, FileText, X } from "lucide-react";

export function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}

export interface SubmissionsTabProps {
  submissions: LPSubmission[];
  loading: boolean;
  isGuest: boolean;
  onViewCode: (sub: LPSubmission) => void;
}

export function SubmissionsTab({ submissions, loading, isGuest, onViewCode }: SubmissionsTabProps) {
  if (isGuest) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Lock size={32} color="var(--text-muted)" />
        </div>
        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Sign in to view history</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Your submission history is saved when you&apos;re logged in.<br />
          Log in to track your past attempts.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        Loading submissions…
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <FileText size={28} color="var(--text-muted)" />
        </div>
        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>No submissions yet</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Submit your solution to see history here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px",
        color: "var(--text-muted)", marginBottom: 8, padding: "0 4px",
      }}>Last {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}</div>

      {submissions.map((sub, i) => {
        const isAC = sub.verdict === "accepted";
        const verdictColor = isAC ? "var(--cm-green)" : "var(--cm-red)";
        const verdictBg = isAC ? "rgba(0,255,136,0.08)" : "rgba(255,80,80,0.08)";
        const verdictBorder = isAC ? "rgba(0,255,136,0.25)" : "rgba(255,80,80,0.25)";
        const label = getVerdictLabel(sub.verdict);
        const date = new Date(sub.submittedAt);
        const timeAgo = formatTimeAgo(date);

        return (
          <div
            key={sub.id + i}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 4px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              fontSize: 12,
            }}
          >
            {/* Verdict badge */}
            <span style={{
              flexShrink: 0, minWidth: 80, textAlign: "center",
              padding: "3px 8px", borderRadius: 999, fontWeight: 700, fontSize: 11,
              background: verdictBg,
              border: `1px solid ${verdictBorder}`,
              color: verdictColor,
              whiteSpace: "nowrap",
            }}>
              {label}
            </span>

            {/* Lang */}
            <span style={{ color: "var(--text-muted)", flexShrink: 0, minWidth: 32, textAlign: "center" }}>
              {sub.language === "cpp" ? "C++" : "Py"}
            </span>

            {/* Pass rate */}
            <span style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
              {sub.testsPassed}/{sub.testsTotal}
            </span>

            {/* Exec time */}
            {sub.executionTime != null ? (
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                {(sub.executionTime * 1000).toFixed(0)}ms
              </span>
            ) : <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>—</span>}

            {/* Time ago */}
            <span style={{ flex: 1, color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>
              {timeAgo}
            </span>

            {/* View Code */}
            <button
              onClick={() => onViewCode(sub)}
              title="View submitted code"
              style={{
                flexShrink: 0, padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              {"</>"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export interface SubmissionCodeViewerModalProps {
  viewCodeSub: LPSubmission;
  onClose: () => void;
}

export function SubmissionCodeViewerModal({ viewCodeSub, onClose }: SubmissionCodeViewerModalProps) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
      }}
    >
      <div style={{
        background: "#12121a", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, padding: 24, width: "90%", maxWidth: 800,
        maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "1px", color: "var(--text-muted)",
            }}>Submission — {new Date(viewCodeSub.submittedAt).toLocaleString()}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                background: getVerdictColor(viewCodeSub.verdict) + "18",
                border: `1px solid ${getVerdictColor(viewCodeSub.verdict)}55`,
                color: getVerdictColor(viewCodeSub.verdict),
              }}>{getVerdictLabel(viewCodeSub.verdict)}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {viewCodeSub.testsPassed}/{viewCodeSub.testsTotal} passed
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {viewCodeSub.language === "cpp" ? "C++" : "Python"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}
          ><X size={20} /></button>
        </div>
        <div style={{ height: 400, overflow: "hidden", background: "#0b0b10", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
          <CodeEditor
            value={viewCodeSub.sourceCode}
            language={viewCodeSub.language}
            onChange={() => { }}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}
