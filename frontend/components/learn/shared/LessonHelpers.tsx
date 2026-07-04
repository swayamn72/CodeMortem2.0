import React from "react";
import CodeEditor from "@/components/editor/CodeEditor";

export function LessonHeading({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--cm-cyan)", marginBottom: "0.4rem", opacity: 0.8 }}>
        {num}
      </div>
      <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: "0.5rem" }}>
        {title}
      </h1>
      <div style={{ height: 3, width: 48, background: "linear-gradient(90deg, var(--cm-cyan), transparent)", borderRadius: 4 }} />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--cm-cyan)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 4, height: 18, background: "var(--cm-cyan)", borderRadius: 2, display: "inline-block", opacity: 0.7 }} />
        {title}
      </h2>
      <div style={{ paddingLeft: 14 }}>{children}</div>
    </div>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "0.85rem", fontSize: "0.96rem" }}>{children}</p>;
}

export function CodeBlock({ code }: { code: string }) {
  const lineCount = code.trim().split("\n").length;
  return (
    <div style={{
      height: Math.min(lineCount * 21 + 24, 400),
      background: "#0b0b10",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: "3px solid var(--cm-cyan)",
      borderRadius: "0 8px 8px 0",
      margin: "0.75rem 0 1.25rem",
      overflow: "hidden"
    }}>
      <CodeEditor value={code.trim()} language="cpp" onChange={() => {}} readOnly={true} />
    </div>
  );
}

export function Callout({ icon, color = "var(--cm-cyan)", children }: { icon: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", gap: "0.75rem", padding: "0.85rem 1rem",
      background: `${color}0d`, borderRadius: 8, borderLeft: `3px solid ${color}`,
      marginBottom: "1rem", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.65,
    }}>
      <span style={{ flexShrink: 0, fontSize: "1rem" }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function MathBox({ children, color = "var(--cm-purple)" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ padding: "0.85rem 1.25rem", background: `${color}0f`, border: `1px solid ${color}33`, borderRadius: 10, fontFamily: "monospace", fontSize: "1rem", color: color, fontWeight: 700, margin: "0.75rem 0 1.25rem", textAlign: "center" as const }}>
      {children}
    </div>
  );
}

export function TrickTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: "1.25rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(255,255,255,0.02)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
        <thead>
          <tr>
            {["Expression", "Effect", "Example"].map(h => (
              <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: "var(--text-secondary)", borderBottom: "1px solid rgba(255,255,255,0.1)", textTransform: "uppercase" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ padding: "7px 14px", fontFamily: "monospace", fontSize: 13, color: "var(--cm-cyan)" }}>{r[0]}</td>
              <td style={{ padding: "7px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{r[1]}</td>
              <td style={{ padding: "7px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NavBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1.5rem", marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <button className="btn btn-primary" onClick={onClick}>{label}</button>
    </div>
  );
}
