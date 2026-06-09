"use client";

import { useState, useCallback } from "react";
import type { BitPattern } from "./types";
import { BIT_PATTERNS } from "./constants";

// ─── Shared Helpers ───────────────────────────────────────────────────────────

function toBin(n: number, bits = 8): string {
  const unsigned = n >>> 0;
  return (unsigned >>> 0).toString(2).padStart(bits, "0").slice(-bits);
}
function toHex(n: number): string {
  return "0x" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

const cellStyle = (isSet: boolean, highlight = false): React.CSSProperties => ({
  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontWeight: 700, fontSize: 14,
  transition: "all 0.15s",
  background: highlight ? "rgba(0,240,255,0.25)" : isSet ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.05)",
  border: highlight ? "1px solid var(--cm-cyan)" : isSet ? "1px solid rgba(0,240,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
  color: highlight ? "var(--cm-cyan)" : isSet ? "var(--cm-cyan)" : "var(--text-secondary)",
});

const toolCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "1.5rem",
  marginTop: "1.5rem",
};

const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: "0.8px",
  textTransform: "uppercase" as const, color: "var(--text-secondary)", marginBottom: 8, display: "block",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)",
  fontFamily: "monospace", fontSize: 14, width: "100%", boxSizing: "border-box" as const,
};

// ─── Tool 1: Binary ↔ Decimal Converter (Lesson 1) ────────────────────────────

export function BinaryConverter() {
  const [decimal, setDecimal] = useState(13);
  const [bits, setBits] = useState(8);
  const value = decimal & ((1 << bits) - 1);
  const binStr = toBin(value, bits);

  function toggleBit(i: number) {
    const newVal = decimal ^ (1 << (bits - 1 - i));
    setDecimal(bits === 8 ? (newVal & 0xff) : newVal & ((1 << bits) - 1));
  }

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>
        Binary ↔ Decimal Converter
      </h3>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={label}>Decimal</span>
          <input
            type="number"
            style={inputStyle}
            value={decimal}
            onChange={e => setDecimal(parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <span style={label}>Bit Width</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[8, 16, 32].map(b => (
              <button key={b} onClick={() => setBits(b)}
                style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: bits === b ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.05)",
                  border: bits === b ? "1px solid var(--cm-cyan)" : "1px solid rgba(255,255,255,0.1)",
                  color: bits === b ? "var(--cm-cyan)" : "var(--text-secondary)" }}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <span style={label}>Click any bit to flip it</span>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: "1rem" }}>
        {binStr.split("").map((b, i) => (
          <div key={i} onClick={() => toggleBit(i)} style={cellStyle(b === "1")}>
            {b}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <span style={label}>Hex</span>
          <span style={{ fontFamily: "monospace", color: "var(--cm-cyan)", fontSize: 14 }}>{toHex(value)}</span>
        </div>
        <div>
          <span style={label}>Formula</span>
          <span style={{ fontFamily: "monospace", color: "var(--text-secondary)", fontSize: 12 }}>
            {binStr.split("").map((b, i) => b === "1" ? `2^${bits-1-i}` : null).filter(Boolean).join(" + ") || "0"} = {value}
          </span>
        </div>
      </div>

      <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(0,240,255,0.05)", borderRadius: 8, borderLeft: "3px solid var(--cm-cyan)", fontSize: 13, color: "var(--text-secondary)" }}>
        A bit is called <strong style={{ color: "var(--cm-cyan)" }}>set</strong> when it is 1, and <strong style={{ color: "var(--text-secondary)" }}>cleared</strong> when it is 0.
        &nbsp;Negative numbers use two's complement: <strong style={{ color: "var(--cm-cyan)" }}>-13</strong> in 32-bit = <code style={{ fontSize: 11 }}>0b11111111111111111111111111110011</code>
      </div>
    </div>
  );
}

// ─── Tool 2: Operator Sandbox (Lesson 2) ──────────────────────────────────────

type Op = "&" | "|" | "^" | "~" | "<<" | ">>";

export function OperatorSandbox() {
  const [a, setA] = useState(88);   // 01011000
  const [b, setB] = useState(87);   // 01010111
  const [op, setOp] = useState<Op>("&");
  const [hovered, setHovered] = useState(-1);
  const bits = 8;

  function compute(a: number, b: number, op: Op): number {
    switch (op) {
      case "&": return a & b;
      case "|": return a | b;
      case "^": return a ^ b;
      case "~": return (~a) & 0xff;
      case "<<": return (a << (b & 7)) & 0xff;
      case ">>": return (a >> (b & 7)) & 0xff;
    }
  }

  const result = compute(a, b, op);
  const aStr = toBin(a, bits);
  const bStr = toBin(b, bits);
  const rStr = toBin(result, bits);

  const ops: Op[] = ["&", "|", "^", "~", "<<", ">>"];

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Operator Sandbox</h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 100 }}>
          <span style={label}>A (decimal)</span>
          <input type="number" style={inputStyle} value={a} onChange={e => setA(parseInt(e.target.value) || 0)} />
        </div>
        {op !== "~" && (
          <div style={{ flex: 1, minWidth: 100 }}>
            <span style={label}>{op === "<<" || op === ">>" ? "Shift Amount" : "B (decimal)"}</span>
            <input type="number" style={inputStyle} value={b} onChange={e => setB(parseInt(e.target.value) || 0)} />
          </div>
        )}
        <div>
          <span style={label}>Operator</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {ops.map(o => (
              <button key={o} onClick={() => setOp(o)}
                style={{ padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontFamily: "monospace",
                  background: op === o ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.05)",
                  border: op === o ? "1px solid var(--cm-cyan)" : "1px solid rgba(255,255,255,0.1)",
                  color: op === o ? "var(--cm-cyan)" : "var(--text-secondary)" }}>
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 13 }}>
        {[{ label: "A", str: aStr, val: a }, ...(op !== "~" ? [{ label: "B", str: bStr, val: b }] : []), { label: `A ${op} ${op !== "~" ? "B" : ""}`, str: rStr, val: result }].map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ width: 80, color: "var(--text-secondary)", textAlign: "right", paddingRight: 8, borderRight: "1px solid rgba(255,255,255,0.1)" }}>
              {row.label} = {row.val}
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {row.str.split("").map((bit, i) => (
                <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(-1)}
                  style={cellStyle(bit === "1", i === hovered)}>
                  {bit}
                </div>
              ))}
            </div>
          </div>
        ))}
        {hovered >= 0 && (
          <div style={{ marginTop: "0.5rem", padding: "6px 12px", background: "rgba(0,240,255,0.08)", borderRadius: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            Bit {bits - 1 - hovered} (2^{bits - 1 - hovered} = {1 << (bits - 1 - hovered)}): A={aStr[hovered]} {op} {op !== "~" ? `B=${bStr[hovered]}` : ""} = {rStr[hovered]}
          </div>
        )}
      </div>
      <div style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--text-secondary)", background: "rgba(0,240,255,0.04)", padding: "0.5rem 1rem", borderRadius: 8 }}>
        All bitwise operators run at the same speed as addition on modern CPUs — a single machine instruction.
      </div>
    </div>
  );
}

// ─── Tool 3: Shift Visualizer (Lesson 3) ──────────────────────────────────────

export function ShiftVisualizer() {
  const [base, setBase] = useState(12);
  const [shift, setShift] = useState(0);

  const result = shift >= 0 ? (base << shift) : (base >> (-shift));
  const overflow = shift > 0 && result > 255;
  const displayBits = 8;
  const baseBin = toBin(base, displayBits);
  const resultBin = overflow ? "OVERFLOW" : toBin(result & 0xff, displayBits);

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Shift Visualizer</h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <span style={label}>Value</span>
          <input type="number" style={inputStyle} value={base} onChange={e => setBase(parseInt(e.target.value) || 0)} min={0} max={255} />
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <span style={label}>Shift: {shift >= 0 ? `<< ${shift}` : `>> ${-shift}`}</span>
        <input type="range" min={-7} max={7} value={shift} onChange={e => setShift(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "var(--cm-cyan)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
          <span>≫ 7</span><span>0</span><span>≪ 7</span>
        </div>
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 13 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span style={{ width: 80, color: "var(--text-secondary)", textAlign: "right", paddingRight: 8 }}>Before</span>
          <div style={{ display: "flex", gap: 3 }}>
            {baseBin.split("").map((b, i) => <div key={i} style={cellStyle(b === "1")}>{b}</div>)}
          </div>
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>= {base}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 80, color: overflow ? "var(--cm-red)" : "var(--cm-green)", textAlign: "right", paddingRight: 8 }}>After</span>
          {overflow ? (
            <span style={{ color: "var(--cm-red)", fontWeight: 700, fontSize: 14, padding: "4px 12px", background: "rgba(255,69,0,0.1)", border: "1px solid var(--cm-red)", borderRadius: 6 }}>⚠ OVERFLOW — bits pushed beyond range!</span>
          ) : (
            <div style={{ display: "flex", gap: 3 }}>
              {resultBin.split("").map((b, i) => <div key={i} style={cellStyle(b === "1")}>{b}</div>)}
            </div>
          )}
          {!overflow && <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>= {result & 0xff}</span>}
        </div>
      </div>

      <div style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--text-secondary)", padding: "0.5rem 1rem", background: "rgba(0,240,255,0.04)", borderRadius: 8 }}>
        {shift >= 0
          ? `x << ${shift} multiplies by 2^${shift} = ${1 << shift}. Result: ${base} × ${1 << shift} = ${base * (1 << shift)}`
          : `x >> ${-shift} divides by 2^${-shift} = ${1 << -shift} (floor). Result: ${base} ÷ ${1 << -shift} = ${Math.floor(base / (1 << -shift))}`}
      </div>
    </div>
  );
}

// ─── Tool 4: Bitmask Flag Board (Lesson 4) ────────────────────────────────────

const FLAG_LABELS = ["READ", "WRITE", "EXEC", "HIDDEN", "OWNER", "GROUP", "STICKY", "SUID"];

export function BitmaskFlagBoard() {
  const [mask, setMask] = useState(0b00000101); // READ + EXEC

  function toggle(bit: number) {
    setMask(m => m ^ (1 << bit));
  }

  const binStr = toBin(mask, 8);

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Bitmask Flag Board</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.5rem" }}>
        {FLAG_LABELS.map((flag, i) => {
          const isSet = !!(mask & (1 << i));
          return (
            <button key={flag} onClick={() => toggle(i)}
              style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
                background: isSet ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.04)",
                border: isSet ? "1px solid var(--cm-cyan)" : "1px solid rgba(255,255,255,0.1)",
                color: isSet ? "var(--cm-cyan)" : "var(--text-secondary)",
                transition: "all 0.15s" }}>
              {isSet ? "✓ " : ""}{flag}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "0.5rem 1rem", fontFamily: "monospace", fontSize: 13 }}>
        {[
          ["Binary", binStr],
          ["Decimal", mask.toString()],
          ["Hex", toHex(mask)],
        ].map(([k, v]) => (
          <><span key={k + "_k"} style={{ color: "var(--text-secondary)" }}>{k}</span>
          <span key={k + "_v"} style={{ color: "var(--cm-cyan)", fontWeight: 700 }}>{v}</span></>
        ))}
      </div>

      <div style={{ marginTop: "1rem", fontSize: 12, color: "var(--text-secondary)", padding: "0.5rem 1rem", background: "rgba(0,240,255,0.04)", borderRadius: 8 }}>
        <strong>Idioms:</strong> Set bit k: <code>mask |= (1&lt;&lt;k)</code> · Clear: <code>mask &amp;= ~(1&lt;&lt;k)</code> · Toggle: <code>mask ^= (1&lt;&lt;k)</code> · Check: <code>(mask &gt;&gt; k) &amp; 1</code>
      </div>
    </div>
  );
}

// ─── Tool 5: Tricks Sandbox (Lesson 4B) ──────────────────────────────────────

const TRICKS = [
  { label: "n & 1 (odd/even)", apply: (n: number) => n & 1, desc: "1 = odd, 0 = even" },
  { label: "n & (n-1)", apply: (n: number) => n & (n - 1), desc: "Clears lowest set bit" },
  { label: "n & -n", apply: (n: number) => n & (-n), desc: "Isolates lowest set bit" },
  { label: "n | (n+1)", apply: (n: number) => n | (n + 1), desc: "Sets last cleared bit" },
  { label: "n & (n+1)", apply: (n: number) => n & (n + 1), desc: "Clears all trailing ones" },
  { label: "~n + 1", apply: (n: number) => (~n + 1) & 0xff, desc: "Two's complement negation (8-bit)" },
];

export function TricksSandbox() {
  const [n, setN] = useState(52); // 00110100
  const [activeTrick, setActiveTrick] = useState(0);
  const trick = TRICKS[activeTrick];
  const result = trick.apply(n) & 0xff;

  // Find changed bits
  const nBin = toBin(n, 8);
  const rBin = toBin(result, 8);
  const changed = nBin.split("").map((b, i) => b !== rBin[i]);

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Tricks Sandbox</h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={label}>Input n</span>
        <input type="number" style={inputStyle} value={n} onChange={e => setN(parseInt(e.target.value) || 0)} min={0} max={255} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.5rem" }}>
        {TRICKS.map((t, i) => (
          <button key={i} onClick={() => setActiveTrick(i)}
            style={{ padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "monospace",
              background: i === activeTrick ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.05)",
              border: i === activeTrick ? "1px solid var(--cm-cyan)" : "1px solid rgba(255,255,255,0.1)",
              color: i === activeTrick ? "var(--cm-cyan)" : "var(--text-secondary)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 13 }}>
        {[{ label: `n = ${n}`, bits: nBin }, { label: `result = ${result}`, bits: rBin }].map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ width: 100, color: "var(--text-secondary)", textAlign: "right", paddingRight: 8 }}>{row.label}</span>
            <div style={{ display: "flex", gap: 3 }}>
              {row.bits.split("").map((b, i) => (
                <div key={i} style={cellStyle(b === "1", ri === 1 && changed[i])}>{b}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--text-secondary)", padding: "0.5rem 1rem", background: "rgba(0,240,255,0.04)", borderRadius: 8 }}>
        <strong style={{ color: "var(--cm-cyan)" }}>{trick.label}:</strong> {trick.desc}
      </div>
    </div>
  );
}

// ─── Tool 6: Bit Isolation Stepper (Lesson 5) ─────────────────────────────────

export function BitIsolationStepper() {
  const [initial, setInitial] = useState(52); // 00110100
  const [step, setStep] = useState(0);

  // Precompute Kernighan steps
  function getSteps(n: number): number[] {
    const steps: number[] = [n];
    let cur = n;
    while (cur > 0) {
      cur = cur & (cur - 1);
      steps.push(cur);
    }
    return steps;
  }

  const steps = getSteps(initial);
  const curStep = Math.min(step, steps.length - 1);
  const cur = steps[curStep];
  const prev = steps[Math.max(0, curStep - 1)];
  const clearedBit = curStep > 0 ? prev & -prev : -1; // lowest set bit that was cleared

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Bit Isolation Stepper — Kernighan&apos;s Algorithm</h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={label}>Starting value n</span>
        <input type="number" style={inputStyle} value={initial} min={0} max={255}
          onChange={e => { setInitial(parseInt(e.target.value) || 0); setStep(0); }} />
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 13, marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <span style={{ width: 120, color: "var(--text-secondary)", paddingRight: 8 }}>n (current)</span>
          <div style={{ display: "flex", gap: 3 }}>
            {toBin(cur, 8).split("").map((b, i) => {
              const bitVal = 1 << (7 - i);
              const wasCleared = clearedBit > 0 && bitVal === clearedBit;
              return <div key={i} style={cellStyle(b === "1", wasCleared)}>{b}</div>;
            })}
          </div>
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>= {cur}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={curStep === 0}>← Prev</button>
        <button className="btn btn-primary btn-sm" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={curStep === steps.length - 1}>Next →</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setStep(0)}>Reset</button>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Iteration {curStep} / {steps.length - 1} — Count: <strong style={{ color: "var(--cm-cyan)" }}>{curStep}</strong>
        </span>
      </div>

      {curStep > 0 && (
        <div style={{ fontSize: 12, padding: "0.5rem 1rem", background: "rgba(0,240,255,0.05)", borderRadius: 8, color: "var(--text-secondary)" }}>
          Cleared bit position {Math.log2(clearedBit)} (value {clearedBit}) using n &amp;= (n-1). Running count: {curStep}
        </div>
      )}
      {curStep === steps.length - 1 && (
        <div style={{ marginTop: "0.5rem", fontSize: 13, padding: "0.5rem 1rem", background: "rgba(0,255,136,0.08)", borderRadius: 8, color: "var(--cm-green)", fontWeight: 600 }}>
          Done! Total set bits = {curStep}
        </div>
      )}
    </div>
  );
}

// ─── Tool 7: Set Bit Counter — Counting up to N (Lesson 5B) ──────────────────

export function SetBitCounter() {
  const [n, setN] = useState(13);
  const [showCalc, setShowCalc] = useState(false);

  function countBitsUpToN(n: number): { total: number; steps: string[] } {
    const steps: string[] = [];
    let rem = n, total = 0;
    while (rem > 0) {
      const x = Math.floor(Math.log2(rem));
      const pow = 1 << x;
      const contrib = x * (pow >> 1);
      const msb = rem - pow + 1;
      steps.push(`Highest power: 2^${x}=${pow}. Block contributes ${x}×${pow/2}=${contrib} bits. MSB contributes ${msb} more.`);
      total += contrib + msb;
      rem = rem - pow;
      if (rem > 0) steps.push(`Remaining: n=${rem}, continuing...`);
    }
    return { total, steps };
  }

  const { total, steps } = countBitsUpToN(n);

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Set Bit Counter — Count set bits from 1 to N</h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={label}>N</span>
        <input type="number" style={inputStyle} value={n} min={1} max={1000000}
          onChange={e => { setN(parseInt(e.target.value) || 1); setShowCalc(false); }} />
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => setShowCalc(true)} style={{ marginBottom: "1rem" }}>
        Count Set Bits
      </button>

      {showCalc && (
        <>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            {steps.map((s, i) => (
              <div key={i} style={{ padding: "4px 8px", marginBottom: 4, background: i % 2 === 0 ? "rgba(0,240,255,0.04)" : "transparent", borderRadius: 6 }}>
                Step {i + 1}: {s}
              </div>
            ))}
          </div>
          <div style={{ padding: "0.75rem 1rem", background: "rgba(0,255,136,0.08)", borderRadius: 8, color: "var(--cm-green)", fontWeight: 700, fontSize: 14 }}>
            Total set bits from 1 to {n} = {total}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tool 8: XOR Chain Explorer (Lesson 6) ────────────────────────────────────

export function XorChainExplorer() {
  const [input, setInput] = useState("4 1 2 1 2");
  const [step, setStep] = useState(-1);

  const nums = input.split(/\s+/).map(Number).filter(n => !isNaN(n));
  const maxStep = nums.length;

  let runningXor = 0;
  const steps = nums.map((n, i) => {
    const before = runningXor;
    runningXor ^= n;
    return { num: n, before, after: runningXor };
  });

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>XOR Chain Explorer</h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={label}>Enter numbers (space-separated, one element appears once)</span>
        <input type="text" style={inputStyle} value={input}
          onChange={e => { setInput(e.target.value); setStep(-1); }} />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setStep(-1)}>Reset</button>
        <button className="btn btn-primary btn-sm" onClick={() => setStep(s => Math.min(maxStep, s + 1))} disabled={step === maxStep}>
          Step →
        </button>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
          XOR so far: <strong style={{ color: "var(--cm-cyan)", marginLeft: 6 }}>{step >= 0 ? steps[Math.min(step, steps.length - 1)].after : 0}</strong>
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        {nums.map((n, i) => {
          const processed = i <= step;
          const cancelled = processed && step > i;
          const current = i === step;
          return (
            <div key={i} style={{
              padding: "6px 14px", borderRadius: 8, fontFamily: "monospace", fontWeight: 700, fontSize: 14,
              background: current ? "rgba(0,240,255,0.2)" : cancelled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
              border: current ? "1px solid var(--cm-cyan)" : "1px solid rgba(255,255,255,0.1)",
              color: current ? "var(--cm-cyan)" : cancelled ? "rgba(255,255,255,0.2)" : "var(--text-primary)",
              textDecoration: cancelled ? "line-through" : "none",
              transition: "all 0.2s",
            }}>
              {n}
            </div>
          );
        })}
      </div>

      {step === maxStep && nums.length > 0 && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(0,255,136,0.08)", borderRadius: 8, color: "var(--cm-green)", fontWeight: 700, fontSize: 14 }}>
          ✓ Survivor: {steps[steps.length - 1].after} — all pairs cancelled to 0!
        </div>
      )}
    </div>
  );
}

// ─── Tool 9: Subset Visualizer (Lesson 7) ─────────────────────────────────────

export function SubsetVisualizer() {
  const [items, setItems] = useState("A B C");
  const labels = items.split(/\s+/).filter(Boolean).slice(0, 5);
  const n = labels.length;
  const count = 1 << n;

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Subset Visualizer (up to 5 items)</h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={label}>Item labels (space-separated, max 5)</span>
        <input type="text" style={inputStyle} value={items} onChange={e => setItems(e.target.value)} placeholder="A B C D E" />
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
        {n} items → 2^{n} = <strong style={{ color: "var(--cm-cyan)" }}>{count}</strong> subsets
      </div>

      <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {Array.from({ length: count }, (_, mask) => (
          <div key={mask} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
            <span style={{ fontFamily: "monospace", color: "var(--text-secondary)", width: 40, fontSize: 12 }}>
              {toBin(mask, n)}
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: 12, width: 24, textAlign: "center" }}>{mask}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {labels.map((lbl, i) => {
                const isSet = !!(mask & (1 << (n - 1 - i)));
                return (
                  <span key={i} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: isSet ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: isSet ? "var(--cm-cyan)" : "rgba(255,255,255,0.2)",
                    border: isSet ? "1px solid rgba(0,240,255,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                    {lbl}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tool 10: Pattern Explainer (Lesson 8) ────────────────────────────────────

export function PatternExplainer() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Pattern Explainer — 12 Battle-Tested Idioms</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {BIT_PATTERNS.map(p => (
          <div key={p.id} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: expanded === p.id ? "rgba(0,240,255,0.08)" : "rgba(255,255,255,0.03)",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "var(--text-primary)" }}>
              <span style={{ color: expanded === p.id ? "var(--cm-cyan)" : "var(--text-secondary)", fontWeight: 700, fontSize: 12 }}>
                {expanded === p.id ? "▼" : "▶"}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
              <code style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                {p.expression.split("\n")[0].slice(0, 40)}{p.expression.length > 40 ? "…" : ""}
              </code>
            </button>
            {expanded === p.id && (
              <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <pre style={{ margin: "0 0 12px", padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 6, fontFamily: "monospace", fontSize: 13, color: "var(--cm-cyan)", overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  {p.expression}
                </pre>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--text-secondary)" }}>
                  <strong>Example: </strong>{p.example}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                  <strong>Why it works: </strong>{p.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tool 11: Builtin Explorer (Lesson 8B) ────────────────────────────────────

export function BuiltinExplorer() {
  const [n, setN] = useState(300); // 0b100101100

  function popcount(x: number): number {
    let c = 0; let v = x >>> 0;
    while (v) { v &= v - 1; c++; }
    return c;
  }
  function clz(x: number): number {
    if (x === 0) return 32;
    let c = 0; let v = x >>> 0;
    while (!(v & 0x80000000)) { v <<= 1; c++; }
    return c;
  }
  function ctz(x: number): number {
    if (x === 0) return 32;
    let c = 0; let v = x;
    while (!(v & 1)) { v >>= 1; c++; }
    return c;
  }
  function ffs(x: number): number {
    if (x === 0) return 0;
    return ctz(x) + 1;
  }
  function bitWidth(x: number): number {
    if (x === 0) return 0;
    return 32 - clz(x);
  }
  function parity(x: number): number {
    return popcount(x) % 2;
  }
  function bitCeil(x: number): number {
    if (x <= 1) return 1;
    return 1 << bitWidth(x - 1);
  }
  function bitFloor(x: number): number {
    if (x === 0) return 0;
    return 1 << (bitWidth(x) - 1);
  }

  const v = Math.max(0, n) >>> 0;
  const rows = [
    { fn: "__builtin_popcount(n)", cpp: `__builtin_popcount(${v})`, py: `bin(${v}).count('1')`, result: popcount(v), desc: "Number of set bits (population count)" },
    { fn: "__builtin_clz(n)", cpp: `__builtin_clz(${v})`, py: `${v}.bit_length() to compute`, result: clz(v), desc: "Count of leading zeros (from MSB)" },
    { fn: "__builtin_ctz(n)", cpp: `__builtin_ctz(${v})`, py: `Not built-in; use loop`, result: ctz(v), desc: "Count of trailing zeros (from LSB)" },
    { fn: "__builtin_ffs(n)", cpp: `__builtin_ffs(${v})`, py: `Not built-in`, result: ffs(v), desc: "Index of first (rightmost) set bit, 1-indexed (0 if none)" },
    { fn: "__builtin_parity(n)", cpp: `__builtin_parity(${v})`, py: `bin(${v}).count('1') % 2`, result: parity(v), desc: "Parity of set bit count (0 = even, 1 = odd)" },
    { fn: "bit_width(n) (C++20)", cpp: `std::bit_width(${v}u)`, py: `(${v}).bit_length()`, result: bitWidth(v), desc: "Minimum number of bits to represent n" },
    { fn: "bit_ceil(n) (C++20)", cpp: `std::bit_ceil(${v}u)`, py: `Not built-in`, result: bitCeil(v), desc: "Round up to nearest power of two" },
    { fn: "bit_floor(n) (C++20)", cpp: `std::bit_floor(${v}u)`, py: `1 << (${v}.bit_length()-1)`, result: bitFloor(v), desc: "Round down to nearest power of two" },
    { fn: "popcount (C++20)", cpp: `std::popcount(${v}u)`, py: `bin(${v}).count('1')`, result: popcount(v), desc: "C++20 standard library popcount (same result as __builtin_popcount)" },
  ];

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Built-in Explorer</h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={label}>Input n (binary: {toBin(v, 12)})</span>
        <input type="number" style={inputStyle} value={n} min={0} onChange={e => setN(parseInt(e.target.value) || 0)} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "monospace" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {["Function", "Result", "C++", "Python", "Description"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "var(--text-secondary)", fontWeight: 700, fontSize: 11, letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <td style={{ padding: "8px 10px", color: "var(--cm-cyan)" }}>{r.fn}</td>
                <td style={{ padding: "8px 10px", color: "var(--cm-green)", fontWeight: 700 }}>{r.result}</td>
                <td style={{ padding: "8px 10px", color: "var(--text-secondary)", fontSize: 11 }}>{r.cpp}</td>
                <td style={{ padding: "8px 10px", color: "var(--text-secondary)", fontSize: 11 }}>{r.py}</td>
                <td style={{ padding: "8px 10px", color: "var(--text-secondary)", fontSize: 12 }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--text-secondary)", padding: "0.5rem 1rem", background: "rgba(255,200,0,0.06)", borderRadius: 8, borderLeft: "3px solid var(--cm-yellow)" }}>
        <strong>Note:</strong> Some competitive programmers add <code>#pragma GCC target("popcnt")</code> to hint the compiler to use the hardware POPCNT instruction. It is <em>not required</em> — modern GCC already uses it in optimized builds. Some online judges also reject pragmas. Only add it if you understand what it does.
      </div>
    </div>
  );
}

// ─── Tool 12: Line Explainer (Lesson 9) ──────────────────────────────────────

export function LineExplainer({ lines, language }: { lines: import("./types").WalkthroughLine[]; language: "cpp" | "python" }) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const selected = selectedLine !== null ? lines.find(l => l.lineNum === selectedLine) : null;

  return (
    <div style={toolCard}>
      <h3 style={{ marginBottom: "1rem", color: "var(--cm-cyan)", fontSize: "1rem" }}>Line-by-Line Explainer — click any line</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: "#0d0d12", borderRadius: 8, padding: "1rem", fontFamily: "monospace", fontSize: 13, overflowX: "auto" }}>
          {lines.map(line => (
            <div key={line.lineNum}
              onClick={() => setSelectedLine(selectedLine === line.lineNum ? null : line.lineNum)}
              style={{ display: "flex", gap: 12, padding: "2px 6px", borderRadius: 4, cursor: "pointer",
                background: selectedLine === line.lineNum ? "rgba(0,240,255,0.12)" : "transparent",
                borderLeft: selectedLine === line.lineNum ? "2px solid var(--cm-cyan)" : "2px solid transparent",
                transition: "all 0.12s" }}>
              <span style={{ color: "rgba(255,255,255,0.2)", minWidth: 20, textAlign: "right", userSelect: "none" }}>{line.lineNum}</span>
              <span style={{ color: line.type === "keyword" ? "#c792ea" : line.type === "comment" ? "#546e7a" : line.type === "highlight" ? "var(--cm-cyan)" : "#cdd3de", whiteSpace: "pre" }}>
                {line.code}
              </span>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(0,240,255,0.04)", borderRadius: 8, padding: "1rem", border: "1px solid rgba(0,240,255,0.15)", minHeight: 100, display: "flex", alignItems: selected ? "flex-start" : "center", justifyContent: "center" }}>
          {selected ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cm-cyan)", letterSpacing: "0.5px", marginBottom: 8 }}>LINE {selected.lineNum}</div>
              <pre style={{ fontFamily: "monospace", fontSize: 13, color: "var(--cm-cyan)", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 6, marginBottom: 12, whiteSpace: "pre-wrap" }}>{selected.code}</pre>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>{selected.explanation}</p>
            </div>
          ) : (
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>← Click a line to see its explanation</span>
          )}
        </div>
      </div>
    </div>
  );
}
