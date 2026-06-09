"use client";

import { useState, useEffect } from "react";
import { useProgressStore } from "@/stores/progressStore";

import CourseLayout from "@/components/course/CourseLayout";
import ChallengeIde from "@/components/course/ChallengeIde";
import Mcq from "@/components/course/Mcq";

import {
  BinaryConverter, OperatorSandbox, ShiftVisualizer, BitmaskFlagBoard,
  BitIsolationStepper, XorChainExplorer, SubsetVisualizer,
  PatternExplainer, BuiltinExplorer,
} from "./learn/bit-manipulation/BitManipInteractiveTools";
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
  const isChallenge = activeLesson.startsWith("challenge");

  const { markLessonComplete, isLessonComplete } = useProgressStore();

  // All non-badge lesson IDs
  const nonBadgeLessonIds = BIT_MANIP_COURSE.lessons
    .filter(l => l.id !== "badge")
    .map(l => l.id);

  const allLessonsComplete = nonBadgeLessonIds.every(id =>
    isLessonComplete(BIT_MANIP_COURSE.moduleId, id)
  );

  useEffect(() => {
    if (activeLesson === "badge" && allLessonsComplete) {
      markLessonComplete(BIT_MANIP_COURSE.moduleId, "badge");
    }
  }, [activeLesson, allLessonsComplete, markLessonComplete]);

  const go = (from: string, to: string) => {
    markLessonComplete(BIT_MANIP_COURSE.moduleId, from);
    // Prevent navigating to badge unless everything else is done
    if (to === "badge" && !allLessonsComplete) return;
    setActiveLesson(to);
  };

  // ── Challenge view — full-height IDE, sidebar stays accessible ───────────────
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

      // ═══ LESSON 1: Binary Basics ═════════════════════════════════════════════
      case "lesson1": return (<>
        <LessonHeading num="Lesson 1" title="Binary — Bits, Positions, and Decimal Conversion" />

        <Section title="What is a Bit?">
          <P>Every piece of data in a computer is stored as <strong>bits</strong> — tiny switches that are either off (0) or on (1). A bit is called <strong style={{ color: "var(--cm-cyan)" }}>set</strong> when it is 1, and <strong>cleared</strong> when it is 0.</P>
          <P>We always read bits from right to left. The rightmost bit is the <strong>0th bit</strong> (0-indexed). If a problem says "the i-th bit", it means 0-indexed from the right.</P>
        </Section>

        <Section title="Positional Value — Reading Binary Numbers">
          <P>Each bit position represents a power of 2. The 0th bit is worth 2⁰ = 1, the 1st bit is worth 2¹ = 2, and so on. To convert from binary to decimal, add up the values of all set bits.</P>
          <CodeBlock code={`// Example: 1101₂
//   Pos:  3  2  1  0  (0-indexed, right-to-left)
//   Bit:  1  1  0  1
//   Val:  8  4  2  1
//
// Add up the set bits: 8 + 4 + 0 + 1 = 13₁₀`} />
          <Callout icon="💡">To convert decimal to binary, repeatedly divide by 2 and read the remainders bottom-to-top.</Callout>
        </Section>

        <Section title="Three Essential Numbers">
          <TrickTable rows={[
            ["1 << k",  "The number with ONLY bit k set",        "1 << 3 = 8 = 1000₂"],
            ["0",       "All bits cleared — the empty set",      "0 = 00000000₂"],
            ["(1<<N)-1","All N low bits set — the full set",     "(1<<4)-1 = 15 = 1111₂"],
          ]} />
          <P>These three forms appear constantly in bit manipulation. Internalize them now.</P>
        </Section>


        <NavBtn label="Next: The Six Operators →" onClick={() => go("lesson1", "lesson2")} />
      </>);

      // ═══ LESSON 2: The Six Bitwise Operators ═════════════════════════════════
      case "lesson2": return (<>
        <LessonHeading num="Lesson 2" title="The Six Bitwise Operators" />

        <Section title="Overview">
          <P>Six operators act directly on the binary bits of integers, bit-by-bit in parallel. On modern CPUs they typically compile to a single instruction — the same speed as integer addition.</P>
          <TrickTable rows={[
            ["a & b",   "AND — 1 only where BOTH bits are 1",    "01011000 & 01010111 = 01010000"],
            ["a | b",   "OR — 1 where EITHER bit is 1",          "01011000 | 01010111 = 01011111"],
            ["a ^ b",   "XOR — 1 where bits DIFFER",             "01011000 ^ 01010111 = 00001111"],
            ["~a",      "NOT — flip every bit",                  "~01011000 = 10100111"],
            ["a << k",  "Left shift — multiply by 2ᵏ",           "5 << 3 = 40"],
            ["a >> k",  "Right shift — divide by 2ᵏ (floor)",   "40 >> 3 = 5"],
          ]} />
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

        <Section title="XOR: The Secret Weapon">
          <P>While AND and OR are intuitive, XOR is the secret weapon of competitive programming. Two properties enable solving classic problems in O(N) time and O(1) space — no hash maps needed:</P>
          <TrickTable rows={[
            ["x ^ x = 0", "Self-Annihilation", "Any number XORed with itself cancels to 0."],
            ["x ^ 0 = x", "Identity",          "Any number XORed with 0 remains unchanged."],
          ]} />
          <Callout icon="💡">XOR is also commutative (<code>a^b = b^a</code>) and associative (<code>(a^b)^c = a^(b^c)</code>). This means: if you XOR an array where every number appears twice except one, all pairs cancel and only the lone number remains.</Callout>
        </Section>


        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson2", "challenge1")} />
      </>);

      // ═══ LESSON 3: Shifts + CP Pitfalls ══════════════════════════════════════
      case "lesson3": return (<>
        <LessonHeading num="Lesson 3" title="Shift Operations and CP Pitfalls" />

        <Section title="Left Shift: Multiplying by 2ᵏ">
          <P><code>x &lt;&lt; k</code> shifts all bits k positions left, inserting zeros at the right. Equivalent to multiplying x by 2^k.</P>
          <CodeBlock code={`int x = 5;      // 0b00000101 = 5
x << 1;         // 0b00001010 = 10  (×2)
x << 3;         // 0b00101000 = 40  (×8)

// Key idiom: the mask with only bit k set
int mask = 1 << k;  // used constantly in bit manipulation`} />
        </Section>

        <Section title="Right Shift: Dividing by 2ᵏ">
          <P><code>x &gt;&gt; k</code> shifts all bits k positions right — floor(x / 2^k) for non-negative integers.</P>
          <CodeBlock code={`int x = 40;     // 0b00101000 = 40
x >> 1;         // 0b00010100 = 20  (÷2)
x >> 3;         // 0b00000101 = 5   (÷8)`} />
        </Section>

        <Section title="Common CP Bugs with Shifts — Learn These Now">
          <Callout icon="🐛" color="var(--cm-red)"><strong>Bug 1 — The 1LL Trap:</strong> The literal <code>1</code> is a 32-bit int. Shifting it left by 31 or more is overflow or undefined behavior. For large bit positions, always write <code>1LL &lt;&lt; k</code>.<br/><br/>
            <code>// WRONG — overflow for k ≥ 31:</code><br/>
            <code>long long mask = 1 &lt;&lt; 40;  // undefined behavior!</code><br/>
            <code>// RIGHT:</code><br/>
            <code>long long mask = 1LL &lt;&lt; 40; // correct</code>
          </Callout>

          <Callout icon="🐛" color="var(--cm-red)"><strong>Bug 2 — Precedence Nightmare:</strong> Bitwise operators (<code>&amp;</code>, <code>|</code>, <code>^</code>) have LOWER precedence than comparison operators (<code>==</code>, <code>!=</code>). Always parenthesize.<br/><br/>
            <code>// WRONG: evaluates as x &amp; (1 == 0) = x &amp; 0 = always 0</code><br/>
            <code>if (x &amp; 1 == 0) &#123; ... &#125;</code><br/>
            <code>// RIGHT:</code><br/>
            <code>if ((x &amp; 1) == 0) &#123; ... &#125;</code>
          </Callout>

          <Callout icon="⚠️" color="var(--cm-yellow)"><strong>Bug 3 — Signed shift into the sign bit:</strong> <code>1 &lt;&lt; 31</code> on a 32-bit signed integer is Undefined Behavior in C++. Use <code>1u &lt;&lt; 31</code> or <code>1LL &lt;&lt; 31</code> instead.</Callout>

          <Callout icon="⚠️" color="var(--cm-yellow)"><strong>Bug 4 — Right-shifting negatives:</strong> Right-shifting a negative signed integer is implementation-defined in C++. On GCC (Codeforces) it performs an arithmetic shift (preserves the sign bit). For portability, cast to unsigned before doing logical shifts.</Callout>
        </Section>

        <ShiftVisualizer />
        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson3", "challenge2")} />
      </>);

      // ═══ MCQ 1 ══════════════════════════════════════════════════════════════
      case "mcq1": return (
        <Mcq questions={BM_MCQ_1} nextLabel="Start Part 2 →" onNext={() => go("mcq1", "lesson4")} />
      );

      // ═══ LESSON 4: Bit Masking ═══════════════════════════════════════════════
      case "lesson4": return (<>
        <LessonHeading num="Lesson 4" title="Bit Masking — The Four Core Idioms" />

        <Section title="The Four Core Idioms">
          <P>These four patterns are the foundation of all bit manipulation. Memorize them.</P>
          <TrickTable rows={[
            ["n |= (1 << k)",  "Set bit k to 1",          "n=0b100 → set k=0 → 0b101"],
            ["n &= ~(1 << k)", "Clear bit k to 0",         "n=0b111 → clear k=1 → 0b101"],
            ["n ^= (1 << k)",  "Toggle bit k",             "n=0b101 → toggle k=2 → 0b001"],
            ["(n >> k) & 1",   "Check bit k (returns 0 or 1)", "n=0b101, k=2 → 1"],
          ]} />
          <CodeBlock code={`int n = 0b10100;
n |= (1 << 0);          // set bit 0:    n = 0b10101
n &= ~(1 << 4);         // clear bit 4:  n = 0b00101
n ^= (1 << 2);          // toggle bit 2: n = 0b00001
int b = (n >> 0) & 1;  // check bit 0:  b = 1`} />
        </Section>

        <Section title="CP Use Case: Tracking Visited Nodes">
          <P>Instead of a boolean array, a bitmask compactly tracks which items from a set have been visited. For N ≤ 20, a single 32-bit integer represents any subset of N items.</P>
          <CodeBlock code={`// N cities. Bit i is 1 if city i was visited.
int visited = 0;
visited |= (1 << 0);            // Visit city 0
visited |= (1 << 2);            // Visit city 2
// visited is now 0b101 (5)

bool city1 = (visited & (1 << 1)) != 0;  // false
bool city2 = (visited & (1 << 2)) != 0;  // true

// "Full" mask — all N cities visited:
bool allDone = (visited == (1 << N) - 1);`} />
          <Callout icon="💡">The pattern <code>(1 &lt;&lt; N) - 1</code> creates a mask with all N bits set. This is one of the most frequently used idioms in competitive programming.</Callout>
        </Section>

        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson4", "challenge3")} />
      </>);

      // ═══ LESSON 5: Isolating and Counting Bits ═══════════════════════════════
      case "lesson5": return (<>
        <LessonHeading num="Lesson 5" title="Isolating and Counting Bits" />

        <Section title="Two's Complement — How -n Works">
          <P>To understand the key tricks in this lesson, you first need to know how computers store negative numbers: <strong>two's complement</strong>.</P>
          <P>To compute <code>-x</code>: flip all bits (bitwise NOT), then add 1. This is always true in C++ for signed integers.</P>
          <CodeBlock code={`// +13 = 0b00001101
// Flip:  0b11110010  (that's ~13)
// +1:    0b11110011  = -13 in two's complement

// Key: -x = ~x + 1`} />
          <Callout icon="💡">This matters because the trick <code>n &amp; -n</code> works <em>because</em> of two's complement. The math falls out naturally.</Callout>
        </Section>

        <Section title="The Three Essential Expressions">
          <TrickTable rows={[
            ["n & (-n)",             "Isolate the lowest set bit",  "n=12 (1100) → 0100 (4)"],
            ["n & (n-1)",            "Clear the lowest set bit",    "n=12 (1100) → 1000 (8)"],
            ["__builtin_popcount(n)","Count all set bits",          "popcount(12) = 2"],
          ]} />
          <P><strong>Why does <code>n &amp; -n</code> work?</strong> Because <code>-n = ~n + 1</code>. Adding 1 to <code>~n</code> propagates a carry up to the lowest set bit position in <code>n</code>. When you AND with the original <code>n</code>, only that one bit survives — everything below it differs.</P>
          <Callout icon="🏗️" color="var(--cm-yellow)"><strong>Fenwick Tree Connection:</strong> <code>n &amp; -n</code> is the entire engine of the Binary Indexed Tree (Fenwick Tree) — a data structure used in nearly every CP contest for range sum queries. When you eventually study it, you'll see this exact expression in every update and query.</Callout>
        </Section>

        <Section title="Kernighan's Popcount — O(set bits)">
          <CodeBlock code={`int count = 0;
while (n) {
    n &= (n - 1);   // clears the lowest set bit each iteration
    count++;
}
// Runs exactly (number of set bits) iterations — NOT O(32).`} />
          <Callout icon="💡">For sparse integers (few set bits), Kernighan's is dramatically faster than checking every bit position. A number with 3 set bits takes only 3 iterations.</Callout>
        </Section>

        <NavBtn label="Next: XOR Properties →" onClick={() => go("lesson5", "lesson6")} />
      </>);

      // ═══ LESSON 6: XOR Properties ════════════════════════════════════════════
      case "lesson6": return (<>
        <LessonHeading num="Lesson 6" title="XOR Properties and Applications" />

        <Section title="XOR Identities">
          <TrickTable rows={[
            ["a ^ a = 0",         "XOR with itself cancels out",   "5 ^ 5 = 0"],
            ["a ^ 0 = a",         "XOR with 0 is identity",        "5 ^ 0 = 5"],
            ["a ^ b = b ^ a",     "Commutative",                   "3^5 = 5^3"],
            ["(a^b)^c = a^(b^c)", "Associative",                   "Pairs cancel anywhere"],
          ]} />
        </Section>

        <Section title="Classic Application: Find the Single Non-Duplicate">
          <CodeBlock code={`// [4, 1, 2, 1, 2]
// 4 ^ 1 ^ 2 ^ 1 ^ 2
// = 4 ^ (1^1) ^ (2^2)
// = 4 ^ 0 ^ 0 = 4  ✓
//
// All pairs cancel to 0. The lone survivor remains.`} />
          <P>Because XOR is commutative and associative, the order doesn't matter — pairs will always find each other and cancel, no matter where they appear in the array.</P>
        </Section>

        <Section title="XOR Prefix Arrays">
          <CodeBlock code={`// XOR prefix array — enables range XOR queries in O(1):
// xor_prefix[i] = a[0] ^ a[1] ^ ... ^ a[i-1]
vector<int> xp(n + 1, 0);
for (int i = 0; i < n; i++) xp[i+1] = xp[i] ^ a[i];

// XOR of a[l..r]:
int range_xor = xp[r+1] ^ xp[l];
// Works because xp[r+1] ^ xp[l] cancels elements before l.`} />
        </Section>

        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson6", "challenge4")} />
      </>);

      // ═══ LESSON 7: Subset Enumeration ════════════════════════════════════════
      case "lesson7": return (<>
        <LessonHeading num="Lesson 7" title="Subset Enumeration" />

        <Section title="Iterating All 2ᴺ Subsets">
          <P>For N items, there are exactly 2^N subsets. An integer with N bits can represent any of them — bit i is 1 if item i is in the subset.</P>
          <CodeBlock code={`// Iterate all 2^N subsets:
for (int mask = 0; mask < (1 << N); mask++) {
    for (int i = 0; i < N; i++)
        if (mask & (1 << i))
            // item i is in this subset

// mask = 0b000 = {} (empty)
// mask = 0b001 = {item 0}
// mask = 0b010 = {item 1}
// mask = 0b011 = {item 0, item 1}  ... etc.`} />
          <Callout icon="💡">N ≤ 20 is the threshold where 2^N ≈ 10⁶ is feasible. Whenever a problem says N ≤ 20 and asks about subsets or selections, think bitmask enumeration.</Callout>
        </Section>

        <Section title="Iterating All Submasks — O(3ᴺ) Total">
          <CodeBlock code={`// Enumerate all non-empty submasks of 'mask':
for (int s = mask; s > 0; s = (s - 1) & mask)
    // process submask s

// The expression (s-1) & mask:
// (s-1) clears the lowest set bit of s and sets all bits below it
// & mask then zeroes out any bits outside our original mask`} />
          <Callout icon="📐"><strong>Why O(3^N) total?</strong> Consider each of the N bit positions independently. A bit can be: (1) zero in mask — always zero, no choice; (2) one in mask but zero in submask s; or (3) one in both. That's 3 states per bit, and 3^N total iterations summed across all masks. It's not O(2^N × 2^N) = O(4^N).</Callout>
          <Callout icon="⚠️" color="var(--cm-yellow)">The loop never processes s = 0 (the empty submask). If you need to handle the empty set, do so separately after the loop.</Callout>
        </Section>

        <Section title="CP Applications">
          <ul style={{ color: "var(--text-secondary)", lineHeight: 2.1, paddingLeft: "1.25rem", fontSize: "0.95rem" }}>
            <li><strong>Brute force on small N</strong> — try all subsets when N ≤ 20</li>
            <li><strong>Visited state tracking</strong> — "which cities have I visited?" = one int</li>
            <li><strong>Subset DP</strong> — compute answers for all subsets, building up from smaller ones</li>
          </ul>
        </Section>

        <SubsetVisualizer />
        <NavBtn label="Next: Checkpoint 2 →" onClick={() => go("lesson7", "mcq2")} />
      </>);

      // ═══ MCQ 2 ══════════════════════════════════════════════════════════════
      case "mcq2": return (
        <Mcq questions={BM_MCQ_2} nextLabel="Start Part 3 →" onNext={() => go("mcq2", "lesson8")} />
      );

      // ═══ LESSON 8: Pattern Recognition ══════════════════════════════════════
      case "lesson8": return (<>
        <LessonHeading num="Lesson 8" title="Recognizing Bit Manipulation Problems" />

        <Section title="The Most Important Skill">
          <P>Knowing the techniques is only half the battle. The other half is <strong>recognizing when to use them</strong>. When you read a problem and see certain clues, your brain should immediately map them to the right technique.</P>
          <P>This lesson trains that pattern recognition. Study this table until the mappings feel instinctive.</P>
        </Section>

        <Section title="Problem Pattern Recognition Table">
          <div style={{ overflowX: "auto", marginBottom: "1.25rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(255,255,255,0.02)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              <thead>
                <tr>
                  {["Problem Clue / Signal", "Technique", "Key Expression"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: "var(--text-secondary)", borderBottom: "1px solid rgba(255,255,255,0.1)", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Is the number odd or even?", "Parity check", "(n & 1) == 0 → even"],
                  ["Is N a power of two?", "Power-of-two check", "n > 0 && !(n & (n-1))"],
                  ["Every element appears twice, except one", "XOR cancellation", "XOR all elements together"],
                  ["Toggle between two values or states", "XOR toggle", "state ^= flag"],
                  ["N ≤ 20 — choose or visit items", "Subset enumeration", "for(mask = 0; mask < (1<<N); mask++)"],
                  ["Compact boolean array / visited flags", "Bitmask as a set", "mask |= (1<<i); mask & (1<<i)"],
                  ["Count or process individual set bits", "Popcount / Kernighan", "__builtin_popcount(n); n & (n-1)"],
                  ["Find or isolate the lowest set bit", "n & -n", "Fenwick Tree foundation"],
                  ["Range XOR queries in O(1)", "XOR prefix array", "xp[r+1] ^ xp[l]"],
                  ["Divisibility by 2^k", "Shift/mask", "(n & ((1<<k) - 1)) == 0"],
                ].map(([clue, technique, expr], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-primary)" }}>{clue}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--cm-cyan)", fontWeight: 600 }}>{technique}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{expr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="How to Use This in a Contest">
          <ol style={{ color: "var(--text-secondary)", lineHeight: 2.3, paddingLeft: "1.25rem", fontSize: "0.95rem" }}>
            <li>Read the problem constraints first — <strong style={{ color: "var(--cm-cyan)" }}>N ≤ 20</strong> is your loudest signal for bitmasks</li>
            <li>Look for <strong style={{ color: "var(--cm-cyan)" }}>parity / odd-even</strong> → <code>(n &amp; 1)</code></li>
            <li>Look for <strong style={{ color: "var(--cm-cyan)" }}>exactly one different element</strong> → XOR all values</li>
            <li>Look for <strong style={{ color: "var(--cm-cyan)" }}>toggling, switching states</strong> → XOR with a flag</li>
            <li>Look for <strong style={{ color: "var(--cm-cyan)" }}>compact boolean tracking</strong> → bitmask as a set</li>
          </ol>
        </Section>

        <PatternExplainer />
        <NavBtn label="Next: Masks as Sets →" onClick={() => go("lesson8", "lesson9")} />
      </>);

      // ═══ LESSON 9: Masks as Sets ═════════════════════════════════════════════
      case "lesson9": return (<>
        <LessonHeading num="Lesson 9" title="Masks as Sets" />

        <Section title="The Core Mental Model">
          <P>A bitmask is not just a number — it is a <strong>compact set</strong>. If you have N elements (indexed 0 to N-1), a single integer represents any subset: bit i is 1 if element i is "in" the set, 0 if it is not.</P>
          <Callout icon="💡">This mental shift — "a bitmask IS a set" — is what separates beginners from intermediate CP programmers. Once you see integers as sets, operations like union, intersection, and complement become obvious.</Callout>
        </Section>

        <Section title="Set Operations in Code">
          <CodeBlock code={`// Universe: elements {0, 1, 2, ..., N-1}
// Full set (all N elements): (1 << N) - 1
int full = (1 << N) - 1;

// ── Membership ──────────────────────────────────────────────
bool has(int mask, int i)    { return (mask >> i) & 1; }

// ── Modification ────────────────────────────────────────────
int add(int mask, int i)     { return mask | (1 << i); }
int remove(int mask, int i)  { return mask & ~(1 << i); }
int toggle(int mask, int i)  { return mask ^ (1 << i); }

// ── Set Algebra ─────────────────────────────────────────────
int unionOf(int a, int b)    { return a | b; }
int intersect(int a, int b)  { return a & b; }
int complement(int mask)     { return full ^ mask; }  // = ~mask & full

// ── Iteration: visit all elements in the set ────────────────
for (int i = 0; i < N; i++)
    if (mask & (1 << i))
        // element i is in the set`} />
        </Section>

        <Section title="Worked Example">
          <CodeBlock code={`// N = 4 elements: A=bit0, B=bit1, C=bit2, D=bit3
int mask = 0;
mask = add(mask, 0);      // {A}         = 0001
mask = add(mask, 2);      // {A, C}      = 0101
mask = remove(mask, 0);   // {C}         = 0100
mask = add(mask, 3);      // {C, D}      = 1100

has(mask, 1) → false  // B is not in {C, D}
has(mask, 2) → true   // C is in {C, D}

// Union of {A,B} and {B,C} = {A,B,C}
int ab = 0b0011, bc = 0b0110;
int abc = unionOf(ab, bc);  // 0b0111 = 7`} />
        </Section>

        <Section title="Why This Matters">
          <P>This set-based view is the bridge to more advanced CP techniques:</P>
          <ul style={{ color: "var(--text-secondary)", lineHeight: 2.1, paddingLeft: "1.25rem", fontSize: "0.95rem" }}>
            <li><strong>State compression in DP</strong> — "which cities have I visited?" becomes a single int</li>
            <li><strong>Subset enumeration</strong> — "try all subsets" becomes a simple for-loop</li>
            <li><strong>Set intersection/union</strong> — checking common elements in O(1) instead of O(N)</li>
          </ul>
        </Section>

        <NavBtn label="Next: Common Beginner Bugs →" onClick={() => go("lesson9", "lesson10")} />
      </>);

      // ═══ LESSON 10: Common Beginner Bugs ═════════════════════════════════════
      case "lesson10": return (<>
        <LessonHeading num="Lesson 10" title="Common Beginner Bugs in Bit Manipulation" />

        <Section title="Why This Lesson Exists">
          <P>These bugs are responsible for a huge share of wrong answers in competitive programming. They're invisible — the code compiles and runs, but silently produces incorrect output. Knowing them ahead of time will save you hours in contests.</P>
        </Section>

        <Section title="Bug 1 — The 1LL Trap">
          <CodeBlock code={`// WRONG — 1 is a 32-bit int. Shift by 31+ causes UB/overflow.
long long mask = 1 << 40;   // Undefined Behavior! Output: garbage

// RIGHT — use 1LL to promote to 64-bit before shifting
long long mask = 1LL << 40; // Correct: 2^40 = 1099511627776

// Safe rule: whenever bit positions can reach 31 or above, use 1LL`} />
          <Callout icon="🐛" color="var(--cm-red)">This is the #1 bit manipulation bug from beginner CP programmers. Problems with constraints 1 ≤ N ≤ 10⁹ require up to bit 30. Always use <code>1LL</code> when in doubt — it costs nothing and prevents UB.</Callout>
        </Section>

        <Section title="Bug 2 — Operator Precedence">
          <CodeBlock code={`// WRONG: evaluated as x & (1 == 0) = x & 0 = 0. Always false!
if (x & 1 == 0) { ... }

// RIGHT: always parenthesize bitwise operations in conditions
if ((x & 1) == 0) { ... }

// Same trap applies to OR and XOR:
if (x | 2 == 2) { ... }          // WRONG
if ((x | 2) == 2) { ... }        // RIGHT`} />
          <Callout icon="🐛" color="var(--cm-red)">Bitwise operators (<code>&amp;</code>, <code>|</code>, <code>^</code>) have LOWER precedence than comparison operators (<code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>). They bind more loosely than you expect. <strong>Default: always parenthesize.</strong></Callout>
        </Section>

        <Section title="Bug 3 — __builtin_popcount with 64-bit Values">
          <CodeBlock code={`long long x = 1000000000000000000LL; // ~10^18, needs 60 bits

// WRONG: silently truncates top 32 bits, gives wrong count
int cnt = __builtin_popcount(x);

// RIGHT: use the 'll' suffix for 64-bit integers
int cnt = __builtin_popcountll(x);

// Same applies to clz and ctz:
int zeros = __builtin_clzll(x);   // 64-bit leading zeros
int trail = __builtin_ctzll(x);   // 64-bit trailing zeros`} />
          <Callout icon="⚠️" color="var(--cm-yellow)">The non-<code>ll</code> versions accept <code>unsigned int</code> (32-bit). Passing a <code>long long</code> causes C++ to silently truncate the top 32 bits — <em>no warning, no error</em>. Always check which version you're using.</Callout>
        </Section>

        <Section title="Bug 4 — The Broken Submask Loop">
          <CodeBlock code={`// CORRECT submask enumeration:
for (int s = mask; s > 0; s = (s - 1) & mask) { ... }

// MISTAKE 1: forgetting '& mask' — iterates ALL positive ints, not submasks!
for (int s = mask; s > 0; s--) { ... }  // WRONG

// MISTAKE 2: using 's != 0' is fine, but easy to confuse when mask = 0
// If mask = 0, the loop body never runs. Handle the empty set separately.`} />
        </Section>

        <Section title="Bug 5 — Shifting by the Bit Width">
          <CodeBlock code={`int x = 1;
// WRONG: shifting a 32-bit int by exactly 32 is Undefined Behavior in C++
int zero = x << 32;  // UB! Do NOT assume this is 0.

// RIGHT: guard the shift or use a larger type
if (k < 32) result = x << k;       // guard
long long result = 1LL << k;       // safe up to k = 63`} />
          <Callout icon="⚠️" color="var(--cm-yellow)">In C++, shifting by an amount ≥ the bit width of the type is Undefined Behavior. Different platforms give different results. Never rely on it.</Callout>
        </Section>

        <NavBtn label="Next: Builtins & std::bitset →" onClick={() => go("lesson10", "lesson11")} />
      </>);

      // ═══ LESSON 11: Builtins and std::bitset ═════════════════════════════════
      case "lesson11": return (<>
        <LessonHeading num="Lesson 11" title="Builtins and std::bitset" />

        <Section title="GCC Built-in Functions">
          <Callout icon="🚫" color="var(--cm-red)"><strong>The long long Trap:</strong> <code>__builtin_popcount(n)</code> takes a 32-bit int. If you pass a 64-bit integer (constraints up to 10¹⁸), it silently truncates the top 32 bits. Always use the <code>ll</code> suffix for 64-bit: <code>__builtin_popcountll(n)</code>.</Callout>

          <TrickTable rows={[
            ["__builtin_popcount(n)",   "Count set bits (32-bit)",       "popcount(12) = 2"],
            ["__builtin_popcountll(n)", "Count set bits (64-bit)",       "use when n can exceed 32 bits"],
            ["__builtin_clz(n)",        "Count leading zeros (32-bit)",  "clz(12) = 28"],
            ["__builtin_clzll(n)",      "Count leading zeros (64-bit)",  "use for 64-bit n"],
            ["__builtin_ctz(n)",        "Count trailing zeros (32-bit)", "ctz(12) = 2"],
            ["__builtin_ctzll(n)",      "Count trailing zeros (64-bit)", "use for 64-bit n"],
            ["__builtin_parity(n)",     "0 = even popcount, 1 = odd",   "parity(12) = 0"],
          ]} />

          <Callout icon="ℹ️" color="var(--cm-yellow)"><strong>About #pragma GCC target(&quot;popcnt&quot;):</strong> Some competitive programmers add this pragma to hint the compiler to use the hardware POPCNT instruction. It is <em>not required</em> — modern GCC already uses it in optimized builds, and some online judges reject pragmas. Only add it if you understand what it does.</Callout>
        </Section>

        <Section title="C++20 Standard — &lt;bit&gt;">
          <TrickTable rows={[
            ["std::popcount(n)",       "Count set bits",              "popcount(12u) = 2"],
            ["std::has_single_bit(n)", "Power of two check",          "has_single_bit(8u) = true"],
            ["std::bit_ceil(n)",       "Round up to power of two",    "bit_ceil(5u) = 8"],
            ["std::bit_floor(n)",      "Round down to power of two",  "bit_floor(5u) = 4"],
            ["std::countl_zero(n)",    "Count leading zeros",         "countl_zero(0b1100u) = 28"],
            ["std::countr_zero(n)",    "Count trailing zeros",        "countr_zero(0b1100u) = 2"],
          ]} />
          <Callout icon="💡">These functions require <code>#include &lt;bit&gt;</code> and C++20. All take <strong>unsigned</strong> integers — passing signed values causes a compile error, not a silent bug.</Callout>
        </Section>

        <Section title="std::bitset&lt;N&gt; — Breaking the 64-bit Limit">
          <P>A regular <code>long long</code> handles up to 64 bits. For problems requiring 10⁵ boolean states (like Knapsack DP or graph reachability), use <code>std::bitset&lt;N&gt;</code>. It packs bits internally and runs bitwise operations in <strong>O(N/64)</strong> time.</P>
          <CodeBlock code={`#include <bitset>
using namespace std;

// Bitset of 10^5 bits, all initialized to 0
bitset<100005> bs1, bs2;

bs1.set(5);             // Set bit 5 to 1
bs1.reset(5);           // Clear bit 5 to 0
bs1.flip(5);            // Toggle bit 5
bool b = bs1.test(5);   // Check if bit 5 is set

// O(N/64) fast bitwise operations across the whole set!
bitset<100005> result = bs1 | bs2;
bs1 <<= 2;              // Shift entire bitset left by 2
int count = bs1.count(); // Total number of set bits`} />
        </Section>

        <BuiltinExplorer />
        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson11", "challenge5")} />
      </>);

      // ═══ BADGE ══════════════════════════════════════════════════════════════
      case "badge": return !allLessonsComplete ? (
        // ── Locked state ───────────────────────────────────────────────────────
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "5rem", marginBottom: "1.5rem", filter: "grayscale(1)", opacity: 0.5 }}>🔢</div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>
            Badge Locked
          </h1>
          <p style={{ color: "var(--text-muted)", maxWidth: 420, margin: "0 auto 2rem", lineHeight: 1.8, fontSize: "0.95rem" }}>
            Complete all lessons and challenges to claim your badge.
          </p>
          {/* Progress bar */}
          <div style={{ maxWidth: 340, margin: "0 auto 2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <span>Progress</span>
              <span style={{ fontWeight: 700 }}>
                {nonBadgeLessonIds.filter(id => isLessonComplete(BIT_MANIP_COURSE.moduleId, id)).length} / {nonBadgeLessonIds.length}
              </span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.round((nonBadgeLessonIds.filter(id => isLessonComplete(BIT_MANIP_COURSE.moduleId, id)).length / nonBadgeLessonIds.length) * 100)}%`,
                background: "linear-gradient(90deg, var(--cm-cyan), #00b3cc)",
                borderRadius: 8,
                transition: "width 0.4s ease",
                boxShadow: "0 0 8px rgba(0,240,255,0.4)",
              }} />
            </div>
          </div>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 20, padding: "2.5rem 3.5rem" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem", filter: "grayscale(1)", opacity: 0.3 }}>🏆</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "0.5rem" }}>Achievement Badge</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Bit Wizard — Level 1</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>🔒 Finish all sections to unlock</div>
          </div>
        </div>
      ) : (
        // ── Unlocked state ────────────────────────────────────────────────────
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🔢</div>
          <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "var(--cm-cyan)", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>
            Bit Manipulation — Easy
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--cm-green)", fontWeight: 700, marginBottom: "1.5rem" }}>Course Complete!</p>
          <p style={{ color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto 2.5rem", lineHeight: 1.85, fontSize: "0.95rem" }}>
            You&apos;ve mastered binary representation, all six bitwise operators, shifts, masking idioms, XOR tricks, Kernighan&apos;s popcount, subset enumeration, pattern recognition, masks-as-sets, common CP bugs, builtins, and solved 6 coding challenges — from Easy to Hard.
          </p>
          <div style={{ display: "inline-block", background: "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,255,136,0.05))", border: "2px solid var(--cm-cyan)", borderRadius: 20, padding: "2.5rem 3.5rem", boxShadow: "0 0 40px rgba(0,240,255,0.12)" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>🏆</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cm-cyan)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "0.5rem" }}>Achievement Badge</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.4rem" }}>Bit Wizard — Level 1</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>11 lessons · 6 challenges · 2 checkpoints</div>
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
