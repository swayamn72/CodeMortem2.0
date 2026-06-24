"use client";

import { useState, useCallback } from "react";

// ─── Shared Styles ────────────────────────────────────────────────────────────

const toolCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "1.5rem",
  marginTop: "1.5rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: "0.8px",
  textTransform: "uppercase" as const, color: "var(--text-secondary)", marginBottom: 8, display: "block",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)",
  fontFamily: "monospace", fontSize: 14, width: "100%", boxSizing: "border-box" as const,
};

const monoBox = (color = "var(--cm-cyan)"): React.CSSProperties => ({
  fontFamily: "monospace", fontSize: 14, color,
  background: "rgba(0,0,0,0.3)", padding: "8px 14px",
  borderRadius: 8, display: "inline-block", fontWeight: 700,
});

// ─── Tool 1: Modular Arithmetic Sandbox (Lesson 1) ───────────────────────────

export function ModArithSandbox() {
  const [a, setA] = useState(999999999);
  const [b, setB] = useState(999999998);
  const [op, setOp] = useState<"+" | "*">("+");
  const MOD = 1_000_000_007;

  const result = op === "+" ? (a + b) % MOD : Number(BigInt(a) * BigInt(b) % BigInt(MOD));
  const overflowDanger = op === "*";

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-purple)", fontSize: "1rem" }}>
        Modular Arithmetic Sandbox
      </h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <span style={labelStyle}>A</span>
          <input type="number" style={inputStyle} value={a} onChange={e => setA(Number(e.target.value))} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
          {(["+", "*"] as const).map(o => (
            <button key={o} onClick={() => setOp(o)} style={{
              padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontFamily: "monospace",
              background: op === o ? "rgba(170,0,230,0.2)" : "rgba(255,255,255,0.05)",
              border: op === o ? "1px solid var(--cm-purple)" : "1px solid rgba(255,255,255,0.1)",
              color: op === o ? "var(--cm-purple)" : "var(--text-secondary)",
              borderRadius: 6, marginRight: 4,
            }}>{o}</button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <span style={labelStyle}>B</span>
          <input type="number" style={inputStyle} value={b} onChange={e => setB(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Raw result:</span>
          <span style={monoBox(overflowDanger ? "var(--cm-red)" : "var(--text-muted)")}>
            {op === "+" ? (a + b).toLocaleString() : `${a.toLocaleString()} × ${b.toLocaleString()} = (may overflow int64!)`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Mod 10⁹+7:</span>
          <span style={monoBox("var(--cm-green)")}>{result.toLocaleString()}</span>
        </div>
      </div>

      {overflowDanger && (
        <div style={{ marginTop: "1rem", padding: "0.6rem 1rem", background: "rgba(255,45,85,0.08)", borderLeft: "3px solid var(--cm-red)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)" }}>
          ⚠ With multiplication: always cast to <code style={{ color: "var(--cm-red)" }}>long long</code> first!
          Use <code style={{ color: "var(--cm-cyan)" }}>(long long)a * b % MOD</code> in C++, never <code>a * b % MOD</code> with int.
        </div>
      )}
      <div style={{ marginTop: "0.75rem", padding: "0.5rem 1rem", background: "rgba(170,0,230,0.05)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
        Identity: (a {op} b) mod M = ((a mod M) {op} (b mod M)) mod M
      </div>
    </div>
  );
}

// ─── Tool 2: Binary Exponentiation Stepper (Lesson 2) ────────────────────────

export function BinExpStepper() {
  const [base, setBase] = useState(3);
  const [exp, setExp] = useState(10);
  const [step, setStep] = useState(-1);

  function getSteps(base: number, exp: number, mod: number) {
    const steps: { exp: number; cur: number; result: number; note: string }[] = [];
    let result = 1, cur = base % mod, e = exp;
    while (e > 0) {
      if (e & 1) {
        steps.push({ exp: e, cur, result, note: `exp is ODD → multiply result by base (${result} × ${cur})` });
        result = Number(BigInt(result) * BigInt(cur) % BigInt(mod));
      } else {
        steps.push({ exp: e, cur, result, note: `exp is EVEN → just square base (${cur}² = ${Number(BigInt(cur) * BigInt(cur) % BigInt(mod))})` });
      }
      cur = Number(BigInt(cur) * BigInt(cur) % BigInt(mod));
      e >>= 1;
    }
    return { steps, finalResult: result };
  }

  const MOD = 1_000_000_007;
  const { steps, finalResult } = getSteps(base, exp, MOD);
  const curStep = Math.max(0, Math.min(step, steps.length - 1));

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-purple)", fontSize: "1rem" }}>
        Binary Exponentiation — Step by Step
      </h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>Base</span>
          <input type="number" style={inputStyle} value={base} onChange={e => { setBase(Number(e.target.value)); setStep(-1); }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>Exponent</span>
          <input type="number" style={inputStyle} value={exp} onChange={e => { setExp(Number(e.target.value)); setStep(-1); }} />
        </div>
      </div>
      <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Computing <span style={monoBox()}>{base}^{exp} mod 10⁹+7</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setStep(-1)}>Reset</button>
        <button className="btn btn-primary btn-sm" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1}>
          Next Step →
        </button>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
          Step {Math.max(0, step + 1)} / {steps.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.slice(0, step + 1).map((s, i) => (
          <div key={i} style={{ padding: "8px 14px", borderRadius: 8, background: i === step ? "rgba(170,0,230,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === step ? "rgba(170,0,230,0.4)" : "rgba(255,255,255,0.07)"}`, fontSize: 13 }}>
            <span style={{ fontFamily: "monospace", color: "var(--cm-purple)" }}>exp={s.exp}  </span>
            <span style={{ color: "var(--text-secondary)" }}>{s.note}</span>
          </div>
        ))}
      </div>

      {step >= steps.length - 1 && (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(0,255,136,0.08)", borderRadius: 8, color: "var(--cm-green)", fontWeight: 700 }}>
          ✓ {base}^{exp} mod 10⁹+7 = {finalResult}
        </div>
      )}
    </div>
  );
}

// ─── Tool 3: Modular Inverse Explorer (Lesson 3) ─────────────────────────────

export function ModInverseExplorer() {
  const [b, setB] = useState(3);
  const MOD = 1_000_000_007;

  function power(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n; base = base % mod;
    while (exp > 0n) {
      if (exp % 2n === 1n) result = result * base % mod;
      base = base * base % mod;
      exp >>= 1n;
    }
    return result;
  }

  const inv = Number(power(BigInt(b), BigInt(MOD - 2), BigInt(MOD)));
  const check = Number(power(BigInt(b), BigInt(b), BigInt(MOD)));

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-purple)", fontSize: "1rem" }}>
        Modular Inverse Explorer — Fermat's Little Theorem
      </h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={labelStyle}>B (find the modular inverse of B)</span>
        <input type="number" style={inputStyle} value={b} onChange={e => setB(Number(e.target.value))} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: 13 }}>
        {[
          { label: "B", val: b },
          { label: "P = 10⁹+7", val: "1,000,000,007" },
          { label: "B^(P-2) mod P", val: inv.toLocaleString() },
          { label: "Verify: B × B^(P-2) mod P", val: `${Number(BigInt(b) * BigInt(inv) % BigInt(MOD))} (should be 1)` },
        ].map(({ label, val }) => (
          <div key={label} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "monospace", color: "var(--cm-purple)", fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(170,0,230,0.06)", borderRadius: 8, borderLeft: "3px solid var(--cm-purple)", fontSize: 13, color: "var(--text-secondary)" }}>
        <strong style={{ color: "var(--cm-purple)" }}>Fermat's Little Theorem:</strong> For prime P and B not divisible by P,
        B^(P-1) ≡ 1 (mod P). Dividing both sides by B: B^(P-2) ≡ B⁻¹ (mod P).
        So: A/B mod P = A × B^(P-2) mod P.
      </div>
    </div>
  );
}

// ─── Tool 4: Factorial & nCr Calculator (Lessons 5 & 8) ──────────────────────

export function NcrCalculator() {
  const [n, setN] = useState(10);
  const [k, setK] = useState(3);
  const MOD = 1_000_000_007n;

  function power(b: bigint, e: bigint, m: bigint): bigint {
    let r = 1n; b = b % m;
    while (e > 0n) { if (e % 2n === 1n) r = r * b % m; b = b * b % m; e >>= 1n; }
    return r;
  }
  function fact(n: number): bigint {
    let r = 1n;
    for (let i = 2; i <= n; i++) r = r * BigInt(i) % MOD;
    return r;
  }
  function nCr(n: number, k: number): bigint {
    if (k < 0 || k > n) return 0n;
    const fn = fact(n), fk = fact(k), fnk = fact(n - k);
    const inv_fk = power(fk, MOD - 2n, MOD);
    const inv_fnk = power(fnk, MOD - 2n, MOD);
    return fn * inv_fk % MOD * inv_fnk % MOD;
  }

  const result = nCr(n, k);

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-purple)", fontSize: "1rem" }}>
        C(N, K) Calculator
      </h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>N</span>
          <input type="number" style={inputStyle} value={n} min={0} max={1000000} onChange={e => setN(Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>K</span>
          <input type="number" style={inputStyle} value={k} min={0} onChange={e => setK(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
        C({n}, {k}) = {n}! / ({k}! × {n - k}!) mod 10⁹+7
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--cm-purple)", fontFamily: "monospace" }}>
        = {result.toString()}
      </div>

      <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
        {[
          { label: `${n}! mod P`, val: fact(n).toString() },
          { label: `${k}! mod P`, val: fact(k).toString() },
          { label: `${n - k}! mod P`, val: fact(n - k).toString() },
        ].map(({ label, val }) => (
          <div key={label} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "monospace", color: "var(--cm-cyan)", fontWeight: 700, wordBreak: "break-all" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tool 5: Grid Path Visualizer (Lesson 9) ─────────────────────────────────

export function GridPathVisualizer() {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(5);
  const [hovered, setHovered] = useState<[number, number] | null>(null);
  const MOD = 1_000_000_007n;

  // Compute dp[r][c] = number of ways to reach cell (r,c) from (0,0)
  const dp: bigint[][] = Array.from({ length: rows }, () => Array(cols).fill(0n));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c === 0) { dp[r][c] = 1n; continue; }
      if (r > 0) dp[r][c] = (dp[r][c] + dp[r - 1][c]) % MOD;
      if (c > 0) dp[r][c] = (dp[r][c] + dp[r][c - 1]) % MOD;
    }
  }

  const maxVal = dp[rows - 1][cols - 1];
  const cellColor = (v: bigint) => {
    if (maxVal === 0n || v === 0n) return "rgba(255,255,255,0.05)";
    const ratio = Number(v) / Number(maxVal);
    return `rgba(170, 0, 230, ${0.08 + ratio * 0.5})`;
  };

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-purple)", fontSize: "1rem" }}>
        Grid Path Visualizer — hover a cell to see path count
      </h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div>
          <span style={labelStyle}>Rows</span>
          <input type="number" style={{ ...inputStyle, width: 100 }} value={rows} min={1} max={10} onChange={e => setRows(Math.min(10, Number(e.target.value)))} />
        </div>
        <div>
          <span style={labelStyle}>Columns</span>
          <input type="number" style={{ ...inputStyle, width: 100 }} value={cols} min={1} max={10} onChange={e => setCols(Math.min(10, Number(e.target.value)))} />
        </div>
      </div>

      <div style={{ display: "inline-flex", flexDirection: "column", gap: 3, marginBottom: "1rem" }}>
        {dp.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 3 }}>
            {row.map((val, c) => {
              const isHovered = hovered?.[0] === r && hovered?.[1] === c;
              const isStart = r === 0 && c === 0;
              const isEnd = r === rows - 1 && c === cols - 1;
              return (
                <div key={c}
                  onMouseEnter={() => setHovered([r, c])}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: 52, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6, cursor: "default", transition: "all 0.15s",
                    background: isStart ? "rgba(0,240,255,0.2)" : isEnd ? "rgba(0,255,136,0.3)" : isHovered ? "rgba(170,0,230,0.3)" : cellColor(val),
                    border: isHovered ? "2px solid var(--cm-purple)" : isStart ? "2px solid var(--cm-cyan)" : isEnd ? "2px solid var(--cm-green)" : "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                    color: isStart ? "var(--cm-cyan)" : isEnd ? "var(--cm-green)" : isHovered ? "var(--cm-purple)" : "var(--text-secondary)",
                  }}>
                  {val.toString()}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Total paths ({rows}×{cols} grid): <strong style={{ color: "var(--cm-purple)", fontFamily: "monospace" }}>C({rows + cols - 2}, {cols - 1}) = {dp[rows - 1][cols - 1].toString()}</strong>
      </div>
      <div style={{ marginTop: "0.5rem", fontSize: 12, color: "var(--text-muted)" }}>
        Each cell shows the number of paths from (0,0) to reach it using only right and down moves.
      </div>
    </div>
  );
}

// ─── Tool 6: Stars and Bars Visualizer (Lesson 10) ───────────────────────────

export function StarsBarsDiagram() {
  const [stars, setStars] = useState(5);
  const [bins, setBins] = useState(3);
  const [dividers, setDividers] = useState([2, 4]); // positions of dividers (0-indexed among stars+bars)

  const total = stars + bins - 1;

  function nCr(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    let num = 1, den = 1;
    for (let i = 0; i < k; i++) { num *= (n - i); den *= (i + 1); }
    return Math.round(num / den);
  }

  const ways = nCr(stars + bins - 1, bins - 1);

  // Compute distribution based on divider positions
  const sortedDivs = [...dividers].sort((a, b) => a - b);
  const counts: number[] = [];
  let prev = 0;
  for (const d of sortedDivs) {
    counts.push(d - prev);
    prev = d + 1;
  }
  counts.push(total - prev);

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-purple)", fontSize: "1rem" }}>
        Stars and Bars — Interactive
      </h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div>
          <span style={labelStyle}>Stars (N items)</span>
          <input type="number" style={{ ...inputStyle, width: 80 }} value={stars} min={0} max={12}
            onChange={e => { setStars(Number(e.target.value)); setDividers(Array.from({ length: bins - 1 }, (_, i) => i + 1)); }} />
        </div>
        <div>
          <span style={labelStyle}>Bins (K groups)</span>
          <input type="number" style={{ ...inputStyle, width: 80 }} value={bins} min={1} max={6}
            onChange={e => { setBins(Number(e.target.value)); setDividers(Array.from({ length: Number(e.target.value) - 1 }, (_, i) => i + 1)); }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", flexWrap: "wrap" }}>
        {Array.from({ length: total }, (_, i) => {
          const isDivider = sortedDivs.includes(i);
          return (
            <div key={i} onClick={() => {
              if (isDivider) setDividers(d => d.filter(x => x !== i));
              else if (dividers.length < bins - 1) setDividers(d => [...d, i].sort((a, b) => a - b));
            }} style={{
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, cursor: "pointer", fontSize: isDivider ? 18 : 16,
              background: isDivider ? "rgba(170,0,230,0.25)" : "rgba(0,240,255,0.12)",
              border: `1px solid ${isDivider ? "var(--cm-purple)" : "rgba(0,240,255,0.3)"}`,
              color: isDivider ? "var(--cm-purple)" : "var(--cm-cyan)",
              fontWeight: 700, transition: "all 0.15s",
            }}>
              {isDivider ? "│" : "★"}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {counts.map((c, i) => (
          <div key={i} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13 }}>
            Bin {i + 1}: <strong style={{ color: "var(--cm-purple)" }}>{c}</strong>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Total ways = C({stars}+{bins}-1, {bins}-1) = C({stars + bins - 1}, {bins - 1}) = <strong style={{ color: "var(--cm-purple)" }}>{ways}</strong>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
        Click a ★ to place/remove a divider │. With {bins} bins, you need exactly {bins - 1} dividers.
      </div>
    </div>
  );
}

// ─── Tool 7: Inclusion-Exclusion Visualizer (Lesson 13) ──────────────────────

export function InclusionExclusionVenn() {
  const [x, setX] = useState(30);

  const a = Math.floor(x / 2);
  const b = Math.floor(x / 3);
  const c = Math.floor(x / 5);
  const ab = Math.floor(x / 6);
  const ac = Math.floor(x / 10);
  const bc = Math.floor(x / 15);
  const abc = Math.floor(x / 30);
  const total = a + b + c - ab - ac - bc + abc;

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-purple)", fontSize: "1rem" }}>
        Inclusion-Exclusion — Multiples of 2, 3, or 5 in [1, X]
      </h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={labelStyle}>X</span>
        <input type="number" style={inputStyle} value={x} min={1} max={100} onChange={e => setX(Number(e.target.value))} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: 13, marginBottom: "1rem" }}>
        {[
          { label: "|mult of 2|  = ⌊X/2⌋", val: a, color: "rgba(0,240,255,0.7)", op: "+" },
          { label: "|mult of 3|  = ⌊X/3⌋", val: b, color: "rgba(170,0,230,0.7)", op: "+" },
          { label: "|mult of 5|  = ⌊X/5⌋", val: c, color: "rgba(0,255,136,0.7)", op: "+" },
          { label: "|mult of 6|  = ⌊X/6⌋", val: ab, color: "rgba(255,200,0,0.7)", op: "−" },
          { label: "|mult of 10| = ⌊X/10⌋", val: ac, color: "rgba(255,120,0,0.7)", op: "−" },
          { label: "|mult of 15| = ⌊X/15⌋", val: bc, color: "rgba(255,45,85,0.7)", op: "−" },
          { label: "|mult of 30| = ⌊X/30⌋", val: abc, color: "rgba(255,255,255,0.5)", op: "+" },
        ].map(({ label, val, color, op }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ color: "var(--text-secondary)" }}>{op} {label}</span>
            <strong style={{ color, fontFamily: "monospace" }}>{val}</strong>
          </div>
        ))}
      </div>

      <div style={{ padding: "0.75rem 1rem", background: "rgba(170,0,230,0.1)", borderRadius: 8, border: "1px solid rgba(170,0,230,0.3)", fontSize: 15, fontWeight: 700, color: "var(--cm-purple)" }}>
        Total in [1, {x}] = {total}
      </div>
    </div>
  );
}
