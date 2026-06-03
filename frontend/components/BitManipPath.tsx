"use client";

import { useState, useEffect } from "react";
import { useProgressStore } from "@/stores/progressStore";

import CourseLayout from "@/components/course/CourseLayout";
import ChallengeIde from "@/components/course/ChallengeIde";
import Mcq from "@/components/course/Mcq";

import {
  BinaryConverter, OperatorSandbox, ShiftVisualizer, BitmaskFlagBoard,
  TricksSandbox, BitIsolationStepper, SetBitCounter, XorChainExplorer,
  SubsetVisualizer, PatternExplainer, BuiltinExplorer, LineExplainer,
} from "./learn/bit-manipulation/BitManipInteractiveTools";
import { WALKTHROUGH_LINES_CPP, WALKTHROUGH_LINES_PYTHON } from "./learn/bit-manipulation/constants";
import { BIT_MANIP_COURSE, BM_CHALLENGES, BM_MCQ_1, BM_MCQ_2 } from "./learn/bit-manipulation/config";

// ─── Shared lesson layout helpers ─────────────────────────────────────────────

function LessonHeading({ num, title }: { num: string; title: string }) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "0.85rem", fontSize: "0.96rem" }}>{children}</p>;
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre style={{
      background: "#0b0b10",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: "3px solid var(--cm-cyan)",
      borderRadius: "0 8px 8px 0",
      padding: "1.1rem 1.25rem",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: "0.82rem", overflowX: "auto",
      color: "#cdd3de", lineHeight: 1.75,
      margin: "0.75rem 0 1.25rem", whiteSpace: "pre-wrap",
    }}>
      <code>{code}</code>
    </pre>
  );
}

function Callout({ icon, color = "var(--cm-cyan)", children }: { icon: string; color?: string; children: React.ReactNode }) {
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

function TrickTable({ rows }: { rows: [string, string, string][] }) {
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

function NavBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1.5rem", marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <button className="btn btn-primary" onClick={onClick}>{label}</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BitManipPath() {
  const [activeLesson, setActiveLesson] = useState("lesson1");
  const [walkthroughLang, setWalkthroughLang] = useState<"cpp" | "python">("cpp");
  const isChallenge = activeLesson.startsWith("challenge");

  const { markLessonComplete } = useProgressStore();

  useEffect(() => {
    if (activeLesson === "badge") markLessonComplete(BIT_MANIP_COURSE.moduleId, "badge");
  }, [activeLesson, markLessonComplete]);

  const go = (from: string, to: string) => {
    markLessonComplete(BIT_MANIP_COURSE.moduleId, from);
    setActiveLesson(to);
  };

  // ── Challenge view — full-height IDE, sidebar stays accessible ────────────────
  if (isChallenge) {
    const challenge = BM_CHALLENGES[activeLesson];
    return (
      <CourseLayout
        config={BIT_MANIP_COURSE}
        activeLesson={activeLesson}
        setActiveLesson={setActiveLesson}
        isChallenge
      >
        <ChallengeIde
          challenge={challenge}
          onComplete={() => markLessonComplete(BIT_MANIP_COURSE.moduleId, activeLesson)}
          navigate={setActiveLesson}
        />
      </CourseLayout>
    );
  }

  // ── Lesson content ────────────────────────────────────────────────────────────
  const lessonContent = (() => {
    switch (activeLesson) {

      // ═══ LESSON 1 ═══════════════════════════════════════════════════════════
      case "lesson1": return (<>
        <LessonHeading num="Lesson 1" title="The Binary Number System" />

        <Section title="Bits, Bytes, and 0-Indexing">
          <P>Every piece of data in a computer is stored as <strong>bits</strong> — tiny switches that are either off (0) or on (1). A bit is called <strong style={{ color: "var(--cm-cyan)" }}>set</strong> when it is 1, and <strong>cleared</strong> when it is 0.</P>
          <P>In CP, we always read bits from right to left, starting at the <strong>0-th bit</strong>. If a problem talks about the &quot;i-th bit,&quot; they mean 0-indexed.</P>
          <CodeBlock code={`// Example: 1101₂
//   Pos:  3  2  1  0  (0-indexed, right-to-left)
//   Bit:  1  1  0  1
//   Val:  8  4  2  1
// 1·8 + 1·4 + 0·2 + 1·1 = 8 + 4 + 0 + 1 = 13₁₀`} />
        </Section>

        <Section title="Two's Complement & The x & -x Trick">
          <P>Negative integers use <strong>two's complement</strong>: flip all bits, then add 1 (<code>~x + 1</code>).</P>
          <CodeBlock code={`// +13 = 0b00001101
//  Flip: 0b11110010  (bitwise NOT)
//  +1:   0b11110011  = -13 in 8-bit two's complement`} />
          <P>Because <code>-x</code> is formed by flipping all bits and adding 1, the operation <code>x &amp; -x</code> magically isolates the lowest set bit. This trick is the entire foundation of the <strong>Fenwick Tree (Binary Indexed Tree)</strong>!</P>
        </Section>

        <Section title="CP Traps: 1LL & Undefined Behavior">
          <Callout icon="⚠️" color="var(--cm-red)"><strong>The 1LL Trap:</strong> The #1 beginner bug. A standard <code>1</code> is a 32-bit int. Shifting it by 32 or more (e.g. <code>1 &lt;&lt; 40</code>) causes overflow. For constraints up to 10¹⁸, ALWAYS use <code>1LL &lt;&lt; i</code>.</Callout>
          <Callout icon="🚫" color="var(--cm-yellow)"><strong>Signed vs. Unsigned UB:</strong> Shifting into the sign bit (the 31st bit of a signed 32-bit int) is Undefined Behavior in C++. Clean CP code avoids UB — use <code>1u &lt;&lt; 31</code> or <code>1LL &lt;&lt; 31</code>.</Callout>
        </Section>

        <BinaryConverter />
        <NavBtn label="Next: The Six Operators →" onClick={() => go("lesson1", "lesson2")} />
      </>);

      // ═══ LESSON 2 ═══════════════════════════════════════════════════════════
      case "lesson2": return (<>
        <LessonHeading num="Lesson 2" title="The Six Bitwise Operators" />

        <Section title="Overview">
          <P>Six operators act directly on the binary bits of integers, bit-by-bit in parallel, at the same speed as integer addition.</P>
          <TrickTable rows={[
            ["a & b",   "AND — 1 only where BOTH bits are 1",    "01011000 & 01010111 = 01010000"],
            ["a | b",   "OR — 1 where EITHER bit is 1",          "01011000 | 01010111 = 01011111"],
            ["a ^ b",   "XOR — 1 where bits DIFFER",             "01011000 ^ 01010111 = 00001111"],
            ["~a",      "NOT — flip every bit",                  "~01011000 = 10100111"],
            ["a << k",  "Left shift — multiply by 2ᵏ",           "5 << 3 = 40"],
            ["a >> k",  "Right shift — divide by 2ᵏ (floor)",   "40 >> 3 = 5"],
          ]} />
          <Callout icon="⚡">All six operators compile to a single CPU instruction — same speed as addition.</Callout>
        </Section>

        <Section title="Truth Tables">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            {([["AND (&)", [[0,0,0],[0,1,0],[1,0,0],[1,1,1]]],
               ["OR (|)",  [[0,0,0],[0,1,1],[1,0,1],[1,1,1]]],
               ["XOR (^)", [[0,0,0],[0,1,1],[1,0,1],[1,1,0]]],
            ] as [string, number[][]][]).map(([title, rows]) => (
              <div key={title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, color: "var(--cm-cyan)", marginBottom: "0.6rem", fontSize: 13 }}>{title}</div>
                {rows.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, fontFamily: "monospace", fontSize: 12, lineHeight: 1.9, color: "var(--text-secondary)" }}>
                    <span>{r[0]}</span><span>{r[1]}</span>
                    <span style={{ marginLeft: "auto", color: r[2] ? "var(--cm-cyan)" : "rgba(255,255,255,0.25)", fontWeight: 700 }}>{r[2]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section title="The Magic of XOR (⊕)">
          <P>While AND and OR are intuitive, XOR is the secret weapon of competitive programming. It has two mathematical properties that allow you to solve classic CP problems (like finding the single non-repeating number in an array) in <strong style={{ color: "var(--cm-cyan)" }}>O(N) time and O(1) space</strong> without hash maps:</P>
          <TrickTable rows={[
            ["x ^ x = 0", "Self-Annihilation", "Any number XORed with itself cancels out to 0."],
            ["x ^ 0 = x", "Identity", "Any number XORed with 0 remains unchanged."],
          ]} />
        </Section>

        <Section title="Common CP Pitfalls">
          <Callout icon="🐛" color="var(--cm-red)"><strong>The Precedence Nightmare:</strong> Bitwise operators (<code>&amp;</code>, <code>|</code>, <code>^</code>) have LOWER precedence than relational operators (<code>==</code>, <code>!=</code>).<br/>
          If you write <code>if (x &amp; 1 == 0)</code>, C++ evaluates it as <code>if (x &amp; (1 == 0))</code>. <strong>Always use parentheses:</strong> <code>if ((x &amp; 1) == 0)</code>.</Callout>
          
          <Callout icon="🚫" color="var(--cm-yellow)"><strong>Shift Undefined Behavior:</strong> Shifting a 32-bit integer by 32 or more (e.g., <code>x &lt;&lt; 32</code>) is Undefined Behavior in C++. It does NOT cleanly wrap to 0.</Callout>
          
          <Callout icon="⚠️" color="var(--cm-yellow)"><strong>Right Shifting Negatives:</strong> Right shifting (<code>&gt;&gt;</code>) a negative signed integer is implementation-defined. GCC (Codeforces) performs an <em>arithmetic shift</em> (pads with 1s to preserve the sign), not a <em>logical shift</em> (pads with 0s).</Callout>
        </Section>

        <OperatorSandbox />
        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson2", "challenge1")} />
      </>);

      // ═══ LESSON 3 ═══════════════════════════════════════════════════════════
      case "lesson3": return (<>
        <LessonHeading num="Lesson 3" title="Shift Operations and Powers of Two" />

        <Section title="Left Shift: Multiplying by 2ᵏ">
          <P><code>x &lt;&lt; k</code> shifts all bits k positions left, inserting zeros at the right. Equivalent to multiplying x by 2^k (for non-negative x with no overflow).</P>
          <CodeBlock code={`int x = 5;      // 0b00000101 = 5
x << 1;         // 0b00001010 = 10  (×2)
x << 3;         // 0b00101000 = 40  (×8)`} />
        </Section>

        <Section title="Right Shift: Dividing by 2ᵏ">
          <P><code>x &gt;&gt; k</code> shifts all bits k positions right — floor(x / 2^k) for non-negative integers.</P>
          <CodeBlock code={`int x = 40;     // 0b00101000 = 40
x >> 1;         // 0b00010100 = 20  (÷2)
x >> 3;         // 0b00000101 = 5   (÷8)

// Signed negatives behave differently — use (unsigned)x >> k for portability`} />
          <Callout icon="⚠️" color="var(--cm-yellow)">Use <code>1u &lt;&lt; k</code> or <code>1LL &lt;&lt; k</code> near bit-width limits. Left-shifting into the sign bit of a signed integer is undefined behaviour in C++.</Callout>
        </Section>

        <ShiftVisualizer />
        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson3", "challenge2")} />
      </>);

      // ═══ MCQ 1 ══════════════════════════════════════════════════════════════
      case "mcq1": return (
        <Mcq questions={BM_MCQ_1} nextLabel="Start Part 2 →" onNext={() => go("mcq1", "lesson4")} />
      );

      // ═══ LESSON 4 ═══════════════════════════════════════════════════════════
      case "lesson4": return (<>
        <LessonHeading num="Lesson 4" title="Bit Masking and Flags" />

        <Section title="The Four Core Idioms">
          <TrickTable rows={[
            ["n |= (1 << k)",   "Set bit k to 1",           "n=0b100 → set k=0 → 0b101"],
            ["n &= ~(1 << k)",  "Clear bit k to 0",          "n=0b111 → clear k=1 → 0b101"],
            ["n ^= (1 << k)",   "Toggle bit k",              "n=0b101 → toggle k=2 → 0b001"],
            ["(n >> k) & 1",    "Check bit k (0 or 1)",      "n=0b101, k=2 → 1"],
          ]} />
          <CodeBlock code={`int n = 0b10100;
n |= (1 << 0);          // set bit 0:    n = 0b10101
n &= ~(1 << 4);         // clear bit 4:  n = 0b00101
n ^= (1 << 2);          // toggle bit 2: n = 0b00001
int b = (n >> 0) & 1;  // check bit 0:  b = 1`} />
        </Section>

        <Section title="CP Use Case: Graph Visited State (TSP)">
          <P>Instead of arrays, CP uses bitmasks to track visited states for dense graphs like the Travelling Salesperson Problem (N &le; 20).</P>
          <CodeBlock code={`// N cities. A bit is 1 if visited, 0 if not.
int mask = 0;
mask |= (1 << 0);            // Visit city 0
mask |= (1 << 2);            // Visit city 2
// mask is now 0b101 (5)

bool visited_city_1 = (mask & (1 << 1)) != 0;  // false
bool visited_city_2 = (mask & (1 << 2)) != 0;  // true`} />
        </Section>

        <BitmaskFlagBoard />
        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson4", "challenge3")} />
      </>);

      // ═══ LESSON 5 ═══════════════════════════════════════════════════════════
      case "lesson5": return (<>
        <LessonHeading num="Lesson 5" title="Isolating and Counting Bits" />

        <Section title="Key Expressions">
          <TrickTable rows={[
            ["n & (-n)",      "Isolate the lowest set bit",   "n=12 (1100) → 0100 (4)"],
            ["n & (n-1)",     "Clear the lowest set bit",      "n=12 (1100) → 1000 (8)"],
            ["__builtin_popcount(n)", "Count all set bits",   "popcount(12) = 2"],
          ]} />
        </Section>

        <Section title="Kernighan's Popcount — O(set bits)">
          <CodeBlock code={`int count = 0;
while (n) {
    n &= (n - 1);   // clears the lowest set bit each iteration
    count++;
}
// Runs exactly (number of set bits) iterations — not O(32).`} />
          <Callout icon="💡">For sparse integers (few set bits) Kernighan's is dramatically faster than checking every bit.</Callout>
        </Section>

        <BitIsolationStepper />
        <NavBtn label="Next: Counting up to N →" onClick={() => go("lesson5", "lesson5b")} />
      </>);

      // ═══ LESSON 5B ══════════════════════════════════════════════════════════
      case "lesson5b": return (<>
        <LessonHeading num="Lesson 5B" title="Counting Set Bits up to N" />

        <Section title="The O(log N) Algorithm">
          <P>For numbers 0 through 2^x − 1, each bit-column contributes exactly 2^(x-1) set bits. Total for the full block: <strong>x × 2^(x-1)</strong>.</P>
          <CodeBlock code={`int countBitsUpTo(int n) {
    int total = 0, rem = n;
    while (rem > 0) {
        int x   = std::bit_width((unsigned)rem) - 1;  // C++20
        int pow = 1 << x;
        total  += (long long)x * (pow >> 1);  // full block contribution
        total  += rem - pow + 1;               // MSB contributions
        rem    -= pow;
    }
    return total;
}`} />
        </Section>

        <SetBitCounter />
        <NavBtn label="Next: XOR Properties →" onClick={() => go("lesson5b", "lesson6")} />
      </>);

      // ═══ LESSON 6 ═══════════════════════════════════════════════════════════
      case "lesson6": return (<>
        <LessonHeading num="Lesson 6" title="XOR Properties and Applications" />

        <Section title="XOR Identities">
          <TrickTable rows={[
            ["a ^ a = 0",         "XOR with itself cancels out",    "5 ^ 5 = 0"],
            ["a ^ 0 = a",         "XOR with 0 is identity",         "5 ^ 0 = 5"],
            ["a ^ b = b ^ a",     "Commutative",                    "3^5 = 5^3"],
            ["(a^b)^c = a^(b^c)", "Associative",                    "Pairs cancel anywhere"],
          ]} />
        </Section>

        <Section title="Find the Single Non-Duplicate">
          <CodeBlock code={`// [4, 1, 2, 1, 2]
// 4 ^ 1 ^ 2 ^ 1 ^ 2
// = 4 ^ (1^1) ^ (2^2)
// = 4 ^ 0 ^ 0 = 4  ✓`} />
        </Section>

        <XorChainExplorer />
        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson6", "challenge4")} />
      </>);

      // ═══ LESSON 7 ═══════════════════════════════════════════════════════════
      case "lesson7": return (<>
        <LessonHeading num="Lesson 7" title="Subset Enumeration" />

        <Section title="Representing Subsets as Bitmasks">
          <CodeBlock code={`// N = 3 items — iterate all 2^N = 8 subsets:
for (int mask = 0; mask < (1 << N); mask++) {
    for (int i = 0; i < N; i++)
        if (mask & (1 << i))  // item i is in this subset

// All non-empty submasks of 'mask' — O(3^N) total:
for (int s = mask; s > 0; s = (s - 1) & mask)
    // process submask s`} />
          <Callout icon="📐">The 3^N bound: each bit has 3 states — absent, in mask not s, in both. Total across all masks = 3^N.</Callout>
        </Section>

        <SubsetVisualizer />
        <NavBtn label="Next: Checkpoint 2 →" onClick={() => go("lesson7", "mcq2")} />
      </>);

      // ═══ MCQ 2 ══════════════════════════════════════════════════════════════
      case "mcq2": return (
        <Mcq questions={BM_MCQ_2} nextLabel="Start Part 3 →" onNext={() => go("mcq2", "lesson8")} />
      );

      // ═══ LESSON 8 ═══════════════════════════════════════════════════════════
      case "lesson8": return (<>
        <LessonHeading num="Lesson 8" title="Bit Manipulation Cheat Sheet" />

        <Section title="Odd/Even and Divisibility">
          <CodeBlock code={`n & 1 == 0  →  even          // last bit is 0
n & 1 == 1  →  odd           // last bit is 1

// Divisible by 2^k?
(n & ((1 << k) - 1)) == 0   →  n divisible by 2^k

// Power of two check:
n > 0 && !(n & (n - 1))`} />
        </Section>

        <Section title="12 Battle-Tested Idioms">
          <P>A reference sheet of 12 patterns. Click any entry to see a worked example and plain-English explanation.</P>
          <PatternExplainer />
        </Section>

        <TricksSandbox />
        <NavBtn label="Next: Language Support →" onClick={() => go("lesson8", "lesson8b")} />
      </>);

      // ═══ LESSON 8B ══════════════════════════════════════════════════════════
      case "lesson8b": return (<>
        <LessonHeading num="Lesson 8B" title="Language and Compiler Support" />

        <Section title="GCC Built-ins">
          <Callout icon="⚠️" color="var(--cm-yellow)">Always add <code>#pragma GCC target(&quot;popcnt&quot;)</code> at the top of competitive submissions to enable the hardware POPCNT instruction.</Callout>
          
          <Callout icon="🚫" color="var(--cm-red)"><strong>The long long Trap:</strong> <code>__builtin_popcount(n)</code> takes a 32-bit int. If you pass a 64-bit int (e.g., constraints up to 10¹⁸), it silently truncates the top 32 bits and gives the wrong answer! Always use the <code>ll</code> suffix for 64-bit: <code>__builtin_popcountll(n)</code>.</Callout>
          
          <TrickTable rows={[
            ["__builtin_popcount(n)",   "Count set bits (32-bit)",           "popcount(12) = 2"],
            ["__builtin_popcountll(n)", "Count set bits (64-bit)",           "popcountll(1e18)"],
            ["__builtin_clz(n)",        "Count leading zeros",               "clz(12) = 28"],
            ["__builtin_ctzll(n)",      "Count trailing zeros (64-bit)",     "ctzll(12) = 2"],
            ["__builtin_parity(n)",     "0 even bits, 1 odd bits",           "parity(12) = 0"],
          ]} />
        </Section>

        <Section title="C++20 Standard — &lt;bit&gt;">
          <TrickTable rows={[
            ["std::popcount(n)",      "Count set bits",              "popcount(12u) = 2"],
            ["std::has_single_bit(n)","Power of two check",          "has_single_bit(8u) = true"],
            ["std::bit_ceil(n)",      "Round up to power of two",    "bit_ceil(5u) = 8"],
            ["std::bit_floor(n)",     "Round down to power of two",  "bit_floor(5u) = 4"],
            ["std::countl_zero(n)",   "Count leading zeros",         "countl_zero(0b1100u) = 28"],
            ["std::countr_zero(n)",   "Count trailing zeros",        "countr_zero(0b1100u) = 2"],
          ]} />
        </Section>

        <BuiltinExplorer />
        <NavBtn label="Next: std::bitset →" onClick={() => go("lesson8b", "lesson8c")} />
      </>);

      // ═══ LESSON 8C ══════════════════════════════════════════════════════════
      case "lesson8c": return (<>
        <LessonHeading num="Lesson 8C" title="Handling Massive Masks: std::bitset" />

        <Section title="Breaking the 64-Bit Limit">
          <P>Bitwise integers cap out at 64 bits (using <code>unsigned long long</code>). What happens when a problem requires tracking a mask of 10⁵ boolean states, such as in Knapsack DP or dense graph reachability?</P>
          <P>Enter <code>std::bitset&lt;N&gt;</code>. It acts like an array of bools but is packed internally, allowing bitwise operations across the entire set in <strong style={{ color: "var(--cm-cyan)" }}>O(N / 64)</strong> time.</P>
        </Section>

        <Section title="Bitset Operations">
          <CodeBlock code={`#include <bitset>
using namespace std;

// Create a bitset of size 10^5, all initialized to 0
bitset<100005> bs1, bs2;

bs1.set(5);           // Set bit 5 to 1
bs1.reset(5);         // Clear bit 5 to 0
bs1.flip(5);          // Toggle bit 5
bool b = bs1.test(5); // Check if bit 5 is 1 (or just bs1[5])

// O(N / 64) fast bitwise operations!
bitset<100005> result = bs1 | bs2;
bs1 <<= 2;            // Shift entire bitset left by 2

int count = bs1.count(); // Number of set bits`} />
        </Section>
        
        <NavBtn label="Next: Template Walkthrough →" onClick={() => go("lesson8c", "lesson9")} />
      </>);

      // ═══ LESSON 9 ═══════════════════════════════════════════════════════════
      case "lesson9": return (<>
        <LessonHeading num="Lesson 9" title="Template Walkthrough — Maximum XOR Pair" />
        <P>A complete greedy solution walked through line by line. Click any line to see a conceptual explanation.</P>

        <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
          {(["cpp", "python"] as const).map(lang => (
            <button key={lang} onClick={() => setWalkthroughLang(lang)}
              style={{ padding: "5px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: walkthroughLang === lang ? "rgba(0,240,255,0.12)" : "rgba(255,255,255,0.05)",
                border: walkthroughLang === lang ? "1px solid var(--cm-cyan)" : "1px solid rgba(255,255,255,0.12)",
                color: walkthroughLang === lang ? "var(--cm-cyan)" : "var(--text-secondary)" }}>
              {lang === "cpp" ? "C++" : "Python"}
            </button>
          ))}
        </div>

        <LineExplainer
          lines={walkthroughLang === "cpp" ? WALKTHROUGH_LINES_CPP : WALKTHROUGH_LINES_PYTHON}
          language={walkthroughLang}
        />
        <NavBtn label="Next: Final Challenge →" onClick={() => go("lesson9", "challenge5")} />
      </>);

      // ═══ BADGE ══════════════════════════════════════════════════════════════
      case "badge": return (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🔢</div>
          <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "var(--cm-cyan)", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>
            Bit Manipulation — Easy
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--cm-green)", fontWeight: 700, marginBottom: "1.5rem" }}>Course Complete!</p>
          <p style={{ color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 2.5rem", lineHeight: 1.85, fontSize: "0.95rem" }}>
            You have mastered binary foundations, the six bitwise operators, shift arithmetic, masking &amp; flags,
            XOR tricks, Kernighan&apos;s popcount, subset enumeration, 12 idioms, builtins, and the Maximum XOR Pair algorithm.
          </p>
          <div style={{ display: "inline-block", background: "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,255,136,0.05))", border: "2px solid var(--cm-cyan)", borderRadius: 20, padding: "2.5rem 3.5rem", boxShadow: "0 0 40px rgba(0,240,255,0.12)" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>🏆</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cm-cyan)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "0.5rem" }}>Achievement Badge</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.4rem" }}>Bit Wizard — Level 1</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>9 lessons · 5 challenges · 2 checkpoints</div>
          </div>
        </div>
      );

      default: return null;
    }
  })();

  return (
    <CourseLayout
      config={BIT_MANIP_COURSE}
      activeLesson={activeLesson}
      setActiveLesson={setActiveLesson}
      isChallenge={false}
    >
      {lessonContent}
    </CourseLayout>
  );
}
