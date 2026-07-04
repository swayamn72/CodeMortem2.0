"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProgressStore } from "@/stores/progressStore";
import { useAuthStore } from "@/stores/authStore";
import BadgeCard from "@/components/BadgeCard";
import { getBadgeDef } from "@/lib/badges";

import CourseLayout from "@/components/course/CourseLayout";
import ChallengeIde from "@/components/course/ChallengeIde";
import Mcq from "@/components/course/Mcq";

import {
  BinaryConverter, OperatorSandbox, ShiftVisualizer, BitmaskFlagBoard,
  BitIsolationStepper, XorChainExplorer, SubsetVisualizer,
  PatternExplainer, BuiltinExplorer,
} from "./learn/bit-manipulation/BitManipInteractiveTools";
import { BIT_MANIP_COURSE, BM_CHALLENGES, BM_MCQ_1, BM_MCQ_2 } from "./learn/bit-manipulation/config";

import { LessonHeading, Section, P, CodeBlock, Callout, TrickTable, NavBtn } from "./learn/shared/LessonHelpers";

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BitManipPath() {
  const [activeLesson, setActiveLesson] = useState("lesson1");
  const isChallenge = activeLesson.startsWith("challenge");

  const { markLessonComplete, isLessonComplete, earnedBadges } = useProgressStore();
  const { user } = useAuthStore();
  const isPremiumActive = user?.isPremium && (
    !user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
  );

  // All non-badge lesson IDs
  const nonBadgeLessonIds = BIT_MANIP_COURSE.lessons
    .filter(l => l.id !== "badge")
    .map(l => l.id);

  const allLessonsComplete = nonBadgeLessonIds.every(id =>
    isLessonComplete(BIT_MANIP_COURSE.moduleId, id)
  );

  // Badge data (available at component level for the badge screen)
  const badgeDef = getBadgeDef(BIT_MANIP_COURSE.moduleId);
  const badgeEarnedAt = earnedBadges[BIT_MANIP_COURSE.moduleId];
  const profileHref = user?.username ? `/profile/${user.username}` : "/profile";

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
          <P>We always read bits from right to left. The rightmost bit is the <strong>0th bit</strong> (0-indexed). If a problem says &quot;the i-th bit&quot;, it means 0-indexed from the right.</P>
        </Section>

        <Section title="Positional Value — Reading Binary Numbers">
          <P>Each bit position represents a power of 2. The 0th bit is worth 2^0 = 1, the 1st bit is worth 2^1 = 2, and so on. To convert from binary to decimal, add up the values of all set bits.</P>
          <CodeBlock code={`// Example: 1101 in binary
//   Pos:  3  2  1  0  (0-indexed, right-to-left)
//   Bit:  1  1  0  1
//   Val:  8  4  2  1
//
// Add up the set bits: 8 + 4 + 0 + 1 = 13 in decimal`} />
          <P>To convert <strong>decimal to binary</strong>, repeatedly divide the number by 2 and record each remainder. Then read the remainders from bottom to top.</P>
          <CodeBlock code={`// Convert 13 to binary:
//   13 / 2 = 6  remainder 1   (bit 0)
//    6 / 2 = 3  remainder 0   (bit 1)
//    3 / 2 = 1  remainder 1   (bit 2)
//    1 / 2 = 0  remainder 1   (bit 3)
//
// Read remainders bottom-to-top: 1101
// So 13 in decimal = 1101 in binary`} />
        </Section>

        <Section title="Shift Operators: << and >>">
          <P>Before understanding the three essential numbers below, you need to know the two <strong>shift operators</strong>. They move all the bits inside a number to the left or to the right by a given number of positions.</P>

          <P><strong style={{ color: "var(--cm-cyan)" }}>Left Shift ({"<<"})</strong> — shifts all bits to the left by k positions. Zeros are inserted on the right side to fill the gaps. Each left shift by 1 is equivalent to multiplying the number by 2.</P>
          <CodeBlock code={`// Left Shift: x << k  (shift bits left by k positions)
//
// Example: 5 << 1
//   5 in binary:   00000101
//   shift left 1:  00001010   (each bit moved one position left, 0 fills the right)
//   result:        10 in decimal
//   Notice: 5 * 2 = 10. Left shift by 1 = multiply by 2.
//
// Example: 5 << 3
//   5 in binary:   00000101
//   shift left 3:  00101000   (bits moved 3 positions left, three 0s fill the right)
//   result:        40 in decimal
//   Notice: 5 * 2^3 = 5 * 8 = 40. Left shift by k = multiply by 2^k.
//
// Example: 1 << 0 = 1      (no shift at all)
// Example: 1 << 1 = 2      (binary: 10)
// Example: 1 << 2 = 4      (binary: 100)
// Example: 1 << 3 = 8      (binary: 1000)
// Example: 1 << 4 = 16     (binary: 10000)`} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>Right Shift ({">>"}) </strong> — shifts all bits to the right by k positions. The bits that fall off the right side are discarded. For non-negative integers, each right shift by 1 is equivalent to integer division by 2 (rounding down).</P>
          <CodeBlock code={`// Right Shift: x >> k  (shift bits right by k positions)
//
// Example: 40 >> 1
//   40 in binary:  00101000
//   shift right 1: 00010100   (each bit moved one position right, leftmost filled with 0)
//   result:        20 in decimal
//   Notice: 40 / 2 = 20. Right shift by 1 = divide by 2.
//
// Example: 40 >> 3
//   40 in binary:  00101000
//   shift right 3: 00000101   (bits moved 3 positions right, three rightmost bits lost)
//   result:        5 in decimal
//   Notice: 40 / 2^3 = 40 / 8 = 5. Right shift by k = divide by 2^k (floor).
//
// Example: 7 >> 1
//   7 in binary:   00000111
//   shift right 1: 00000011   (the rightmost 1 falls off and is lost)
//   result:        3 in decimal
//   Notice: 7 / 2 = 3.5, but integer division floors it to 3.`} />

          <Callout icon="*" color="var(--cm-cyan)">Summary: <code>x {"<<"} k</code> multiplies x by 2^k. <code>x {">>"} k</code> divides x by 2^k (rounding down). Shifting by k is far faster than actual multiplication or division on a CPU, but in competitive programming we use it primarily for bit manipulation patterns, not for speed.</Callout>
        </Section>

        <Section title="Three Essential Numbers">
          <P>Now that you understand shifts, here are three number patterns that appear constantly in bit manipulation. Each one uses the left shift operator to construct a useful binary value.</P>
          <TrickTable rows={[
            ["1 << k",  "The number with ONLY bit k set",        "1 << 3 = 8 = 1000 in binary"],
            ["0",       "All bits cleared — the empty set",      "0 = 00000000 in binary"],
            ["(1<<N)-1","All N low bits set — the full set",     "(1<<4)-1 = 15 = 1111 in binary"],
          ]} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>Pattern 1: <code>1 {"<<"} k</code></strong> — This creates a number where only the k-th bit is set to 1, and every other bit is 0. The number 1 in binary is just <code>...0001</code>. Left-shifting it by k positions moves that single 1 to position k. This is how you create a &quot;mask&quot; to target a specific bit.</P>
          <CodeBlock code={`// 1 << k creates a "mask" with only bit k turned on:
//
// 1 << 0  =  1   =  00000001   (bit 0 is set)
// 1 << 1  =  2   =  00000010   (bit 1 is set)
// 1 << 2  =  4   =  00000100   (bit 2 is set)
// 1 << 3  =  8   =  00001000   (bit 3 is set)
// 1 << 7  = 128  =  10000000   (bit 7 is set)
//
// Why this matters: you use (1 << k) to set, clear, toggle,
// or check a specific bit inside any number.`} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>Pattern 2: <code>0</code></strong> — Zero means every bit is 0. In the context of bitmasks (where each bit represents whether an item is included), zero represents the empty set — nothing is selected.</P>

          <P><strong style={{ color: "var(--cm-cyan)" }}>Pattern 3: <code>(1 {"<<"} N) - 1</code></strong> — This creates a number where the lowest N bits are all set to 1. Here is why it works: <code>1 {"<<"} N</code> gives you a 1 followed by N zeros (for example, <code>1 {"<<"} 4 = 10000</code>). Subtracting 1 from it flips that leading 1 to 0 and turns all the zeros below it into ones (for example, <code>10000 - 1 = 01111</code>). The result is a number with exactly N bits all set to 1.</P>
          <CodeBlock code={`// (1 << N) - 1 gives you a number with N bits all set to 1:
//
// Step by step for N = 4:
//   1 << 4  = 16  = 10000   (a 1 followed by four 0s)
//   16 - 1  = 15  = 01111   (subtract 1: the leading 1 drops, four 0s become 1s)
//
// More examples:
//   (1 << 1) - 1 =  1  = 1           (one bit set)
//   (1 << 2) - 1 =  3  = 11          (two bits set)
//   (1 << 3) - 1 =  7  = 111         (three bits set)
//   (1 << 4) - 1 = 15  = 1111        (four bits set)
//   (1 << 8) - 1 = 255 = 11111111    (eight bits set)
//
// In bitmask problems, this represents the "full set"
// where all N items are selected.`} />
          <Callout icon="*" color="var(--cm-cyan)">These three forms are the building blocks of every technique in this course. <code>1 {"<<"} k</code> targets a single bit. <code>0</code> means nothing is set. <code>(1{"<<"}N)-1</code> means everything is set. You will see them in every lesson that follows.</Callout>
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
          <P>XOR has four properties that make it uniquely powerful. These are not just theory — they are the reason entire categories of competitive programming problems can be solved in O(N) time with O(1) space.</P>
          <TrickTable rows={[
            ["a ^ a = 0",         "Self-cancellation: any value XORed with itself gives 0",   "5 ^ 5 = 0"],
            ["a ^ 0 = a",         "Identity: XOR with 0 leaves the value unchanged",          "5 ^ 0 = 5"],
            ["a ^ b = b ^ a",     "Commutative: order does not matter",                       "3^5 = 5^3 = 6"],
            ["(a^b)^c = a^(b^c)", "Associative: grouping does not matter",                    "Pairs cancel in any order"],
          ]} />
          <P>The self-cancellation property (<code>a ^ a = 0</code>) is the most important one. Combined with commutativity and associativity, it means that if you XOR a collection of numbers together, any value that appears an even number of times will completely vanish from the result.</P>
        </Section>

        <Section title="Classic Application: Find the Single Non-Duplicate">
          <P>Given an array where every number appears exactly twice except one, find the unique number. The brute-force approach uses a hash map (O(N) space). XOR solves it in O(1) space.</P>
          <CodeBlock code={`// Array: [4, 1, 2, 1, 2]
//
// XOR every element together, step by step:
//   Start:       result = 0
//   XOR with 4:  result = 0 ^ 4 = 4
//   XOR with 1:  result = 4 ^ 1 = 5
//   XOR with 2:  result = 5 ^ 2 = 7
//   XOR with 1:  result = 7 ^ 1 = 6     (the first 1 and second 1 are cancelling)
//   XOR with 2:  result = 6 ^ 2 = 4     (the first 2 and second 2 are cancelling)
//
// Final result = 4. That is the unique number.
//
// Why? Because XOR is commutative and associative, we can regroup:
//   4 ^ 1 ^ 2 ^ 1 ^ 2
// = 4 ^ (1 ^ 1) ^ (2 ^ 2)
// = 4 ^ 0 ^ 0
// = 4`} />
          <P>The key insight: it does not matter where duplicates appear in the array. XOR will always find and cancel them, leaving only the unique value behind.</P>
        </Section>

        <XorChainExplorer />

        <Section title="XOR Prefix Arrays">
          <P>A <strong>prefix XOR array</strong> is a technique that lets you compute the XOR of any contiguous subarray in O(1) time, after O(N) preprocessing. It works exactly like a prefix sum array, but with XOR instead of addition.</P>

          <P><strong style={{ color: "var(--cm-cyan)" }}>The idea</strong>: Build an array <code>xp</code> where <code>xp[i]</code> stores the XOR of all elements from index 0 up to (but not including) index i. Then the XOR of any range [L..R] can be computed by XORing just two values from this array.</P>

          <P><strong style={{ color: "var(--cm-cyan)" }}>Step 1: Build the prefix XOR array</strong></P>
          <CodeBlock code={`// Given array a[] of size n:
vector<int> xp(n + 1, 0);   // xp has n+1 entries, all starting at 0

// xp[0] = 0                 (XOR of zero elements)
// xp[1] = a[0]              (XOR of first 1 element)
// xp[2] = a[0] ^ a[1]       (XOR of first 2 elements)
// xp[3] = a[0] ^ a[1] ^ a[2]
// ...
// xp[i] = a[0] ^ a[1] ^ ... ^ a[i-1]

for (int i = 0; i < n; i++)
    xp[i + 1] = xp[i] ^ a[i];`} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>Step 2: Query any range [L..R] in O(1)</strong></P>
          <CodeBlock code={`int range_xor = xp[R + 1] ^ xp[L];`} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>Why does this work?</strong> Let us trace through the math carefully.</P>
          <CodeBlock code={`// xp[R+1] contains: a[0] ^ a[1] ^ ... ^ a[L-1] ^ a[L] ^ ... ^ a[R]
// xp[L]   contains: a[0] ^ a[1] ^ ... ^ a[L-1]
//
// When we compute xp[R+1] ^ xp[L]:
//   = (a[0] ^ a[1] ^ ... ^ a[L-1] ^ a[L] ^ ... ^ a[R])
//     ^
//     (a[0] ^ a[1] ^ ... ^ a[L-1])
//
// The elements a[0] through a[L-1] appear in BOTH sides.
// Since x ^ x = 0 (self-cancellation), they all cancel out:
//
//   = a[L] ^ a[L+1] ^ ... ^ a[R]
//
// That is exactly the XOR of the range [L..R].`} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>Concrete example</strong>: Array <code>a = [3, 1, 5, 2, 4]</code></P>
          <CodeBlock code={`// Build prefix XOR array:
//   xp[0] = 0
//   xp[1] = 0 ^ 3         = 3
//   xp[2] = 3 ^ 1         = 2
//   xp[3] = 2 ^ 5         = 7
//   xp[4] = 7 ^ 2         = 5
//   xp[5] = 5 ^ 4         = 1
//
// Index:    0   1   2   3   4   5
// xp:     [ 0,  3,  2,  7,  5,  1 ]
//
// Query: XOR of a[1..3] = a[1] ^ a[2] ^ a[3] = 1 ^ 5 ^ 2 = 6
// Using prefix array:  xp[4] ^ xp[1] = 5 ^ 3 = 6   (same answer)
//
// Query: XOR of a[0..4] = 3 ^ 1 ^ 5 ^ 2 ^ 4 = 1
// Using prefix array:  xp[5] ^ xp[0] = 1 ^ 0 = 1   (same answer)
//
// Query: XOR of a[2..2] = a[2] = 5
// Using prefix array:  xp[3] ^ xp[2] = 7 ^ 2 = 5   (same answer)`} />

          <Callout icon="*" color="var(--cm-cyan)">If you already know prefix sum arrays, the XOR prefix array works identically -- just replace addition with XOR and subtraction with XOR (since XOR is its own inverse: a ^ b ^ b = a, just like a + b - b = a).</Callout>
        </Section>

        <NavBtn label="Next: Code Challenge →" onClick={() => go("lesson6", "challenge4")} />
      </>);

      // ═══ LESSON 7: Subset Enumeration ════════════════════════════════════════
      case "lesson7": return (<>
        <LessonHeading num="Lesson 7" title="Subset Enumeration" />

        <Section title="The Problem Subset Enumeration Solves">
          <P>Many competitive programming problems ask you to consider <strong>every possible selection</strong> from a set of items. For example: given N items with weights and values, which combination maximizes value while staying under a weight limit? Or: given N cities, what is the shortest route that visits all of them?</P>
          <P>When N is small (typically N &le; 20), you can afford to try every possible subset. The key insight is that <strong>an integer can represent a subset</strong>: if bit i is 1, item i is included; if bit i is 0, item i is excluded.</P>
        </Section>

        <Section title="Why an Integer Represents a Subset">
          <P>Consider N = 3 items: A (index 0), B (index 1), C (index 2). An integer with 3 bits can encode any subset:</P>
          <CodeBlock code={`// N = 3 items: A, B, C
//
// mask = 0  (binary 000)  -->  subset = {}           (nothing selected)
// mask = 1  (binary 001)  -->  subset = {A}          (only bit 0 is set)
// mask = 2  (binary 010)  -->  subset = {B}          (only bit 1 is set)
// mask = 3  (binary 011)  -->  subset = {A, B}       (bits 0 and 1 are set)
// mask = 4  (binary 100)  -->  subset = {C}          (only bit 2 is set)
// mask = 5  (binary 101)  -->  subset = {A, C}       (bits 0 and 2 are set)
// mask = 6  (binary 110)  -->  subset = {B, C}       (bits 1 and 2 are set)
// mask = 7  (binary 111)  -->  subset = {A, B, C}    (all bits set)
//
// That is 2^3 = 8 subsets total, represented by integers 0 through 7.
// In general, N items produce 2^N subsets, represented by 0 through (2^N - 1).`} />
          <P>This is why <code>(1 {"<<"} N)</code> equals the number of subsets: it gives 2^N, and the integers 0 through 2^N - 1 cover every possible combination of N bits.</P>
        </Section>

        <Section title="The Enumeration Loop">
          <P>To try every subset, loop from 0 to <code>(1 {"<<"} N) - 1</code>. For each mask, check which bits are set to determine which items are in that subset:</P>
          <CodeBlock code={`// Iterate all 2^N subsets:
for (int mask = 0; mask < (1 << N); mask++) {

    // For this mask, find which items are included:
    for (int i = 0; i < N; i++) {
        if (mask & (1 << i)) {
            // Item i is in this subset.
            // Do something with item i.
        }
    }
}`} />
          <P>Let us trace this for N = 3 with items having weights [2, 3, 5]:</P>
          <CodeBlock code={`// Suppose we want to find which subsets have total weight <= 6.
//
// mask = 0 (000): no items selected.       Weight = 0.        <= 6? Yes.
// mask = 1 (001): item 0 selected.         Weight = 2.        <= 6? Yes.
// mask = 2 (010): item 1 selected.         Weight = 3.        <= 6? Yes.
// mask = 3 (011): items 0,1 selected.      Weight = 2+3 = 5.  <= 6? Yes.
// mask = 4 (100): item 2 selected.         Weight = 5.        <= 6? Yes.
// mask = 5 (101): items 0,2 selected.      Weight = 2+5 = 7.  <= 6? No.
// mask = 6 (110): items 1,2 selected.      Weight = 3+5 = 8.  <= 6? No.
// mask = 7 (111): items 0,1,2 selected.    Weight = 2+3+5=10. <= 6? No.
//
// Answer: 5 subsets have total weight <= 6.`} />
        </Section>

        <Section title="When Can You Use This?">
          <P>The total number of subsets is 2^N. This grows very fast:</P>
          <TrickTable rows={[
            ["N = 10",  "2^10 = 1,024",        "Always fast"],
            ["N = 15",  "2^15 = 32,768",       "Fast"],
            ["N = 20",  "2^20 = 1,048,576",    "Feasible (around 10^6)"],
            ["N = 25",  "2^25 = 33,554,432",   "Tight, but sometimes works"],
            ["N = 30",  "2^30 = 1,073,741,824","Too slow for most problems"],
          ]} />
          <Callout icon="*" color="var(--cm-cyan)">The rule of thumb: if a problem has N &le; 20 and asks about selecting, choosing, or visiting items, subset enumeration with bitmasks is almost certainly the intended approach.</Callout>
        </Section>

        <Section title="Practical Example: Subset Sum with DP">
          <P>Here is a complete, realistic example. Given N items with values, compute the maximum value subset where the total weight does not exceed W. This is the classic 0/1 Knapsack problem solved by trying all subsets:</P>
          <CodeBlock code={`int N;
int weight[N], value[N];
int W;  // max allowed weight

int best = 0;

for (int mask = 0; mask < (1 << N); mask++) {
    int totalWeight = 0, totalValue = 0;

    for (int i = 0; i < N; i++) {
        if (mask & (1 << i)) {         // is item i in this subset?
            totalWeight += weight[i];
            totalValue  += value[i];
        }
    }

    if (totalWeight <= W) {
        best = max(best, totalValue);  // update best if valid
    }
}

cout << best << endl;
// Time: O(2^N * N). Feasible when N <= 20.`} />
        </Section>

        <Section title="Iterating All Submasks of a Given Mask">
          <P>Sometimes you do not want all 2^N subsets. Instead, you have a specific mask and want to enumerate only its <strong>submasks</strong> -- subsets that use only the bits that are set in the original mask.</P>
          <P>For example, if mask = 0b10110, its submasks are all combinations of bits 1, 2, and 4 (the three set bits). The submasks are: 10110, 10100, 10010, 10000, 00110, 00100, 00010, 00000. That is 2^3 = 8 submasks for a mask with 3 set bits.</P>

          <P><strong style={{ color: "var(--cm-cyan)" }}>The loop:</strong></P>
          <CodeBlock code={`// Enumerate all non-empty submasks of 'mask':
for (int s = mask; s > 0; s = (s - 1) & mask) {
    // process submask s
}
// Note: this loop does NOT include s = 0 (the empty submask).
// If you need the empty submask, handle it separately after the loop.`} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>How does <code>(s - 1) & mask</code> work?</strong> Let us trace it step by step with mask = 0b1010 (decimal 10):</P>
          <CodeBlock code={`// mask = 1010 (bits 1 and 3 are set)
// Submasks of 1010 are: 1010, 1000, 0010, 0000
//
// Step 1:  s = 1010                (start with the full mask)
//          process s = 1010
//
// Step 2:  s-1   = 1001            (subtract 1: lowest set bit flips, bits below set)
//          & mask = 1001 & 1010
//                 = 1000           (keep only bits that exist in mask)
//          process s = 1000
//
// Step 3:  s-1   = 0111            (subtract 1 from 1000)
//          & mask = 0111 & 1010
//                 = 0010           (only bit 1 survives)
//          process s = 0010
//
// Step 4:  s-1   = 0001            (subtract 1 from 0010)
//          & mask = 0001 & 1010
//                 = 0000           (no bits survive)
//          s = 0, loop condition s > 0 fails, we stop.
//
// Processed submasks: 1010, 1000, 0010. (Empty submask 0000 was excluded.)`} />

          <P><strong style={{ color: "var(--cm-cyan)" }}>Why is the total work O(3^N)?</strong> When you iterate submasks for every possible mask (which is common in subset DP), each of the N bit positions has exactly 3 possible states:</P>
          <CodeBlock code={`// For each bit position, across all (mask, submask) pairs:
//
//   State 1: bit is 0 in mask  -->  bit is always 0 in submask (no choice)
//   State 2: bit is 1 in mask, AND bit is 0 in submask
//   State 3: bit is 1 in mask, AND bit is 1 in submask
//
// 3 states per bit, N bits total = 3^N total iterations across ALL masks.
// This is much better than the naive O(4^N) bound.
//
// For N = 20:  3^20 = ~3.5 billion  (too slow)
// For N = 15:  3^15 = ~14 million   (feasible)
// For N = 13:  3^13 = ~1.6 million  (comfortable)`} />
          <Callout icon="*" color="var(--cm-yellow)">Submask enumeration over all masks is feasible for N &le; 15 approximately. For pure subset enumeration (no submask-of-submask), the limit is N &le; 20.</Callout>
        </Section>

        <Section title="Subset DP: The Travelling Salesman Problem">
          <P>The most famous application of subset enumeration is the bitmask DP solution to the Travelling Salesman Problem (TSP). The state is <code>dp[mask][last]</code> = minimum cost to visit exactly the cities in mask, ending at city last.</P>
          <CodeBlock code={`// TSP with bitmask DP:
// dp[mask][i] = min cost to visit all cities in 'mask', ending at city i
//
// N cities, dist[i][j] = distance from city i to city j
int dp[1 << N][N];
memset(dp, 0x3f, sizeof dp);   // fill with infinity
dp[1][0] = 0;                  // start at city 0, only city 0 visited

for (int mask = 1; mask < (1 << N); mask++) {
    for (int last = 0; last < N; last++) {
        if (dp[mask][last] >= INF) continue;    // unreachable state
        if (!(mask & (1 << last))) continue;    // last must be in mask

        // Try going to each unvisited city 'next':
        for (int next = 0; next < N; next++) {
            if (mask & (1 << next)) continue;   // already visited

            int newMask = mask | (1 << next);   // mark 'next' as visited
            dp[newMask][next] = min(
                dp[newMask][next],
                dp[mask][last] + dist[last][next]
            );
        }
    }
}

// Answer: min over all ending cities of dp[(1<<N)-1][i] + dist[i][0]
// Time: O(2^N * N^2).   Feasible for N <= 20.`} />
          <P>Notice how the visited set is compressed into a single integer (mask). Without bitmasks, you would need a boolean array for each state, making DP impractical.</P>
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
      case "badge": {
        const completedCount = nonBadgeLessonIds.filter(id => isLessonComplete(BIT_MANIP_COURSE.moduleId, id)).length;
        const progressPct = Math.round((completedCount / nonBadgeLessonIds.length) * 100);

        return !allLessonsComplete ? (
          // ── Locked state ─────────────────────────────────────────────────────
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>
              Badge Locked
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: 420, margin: "0 auto 2rem", lineHeight: 1.8, fontSize: "0.95rem" }}>
              Complete all lessons and challenges to claim your badge.
            </p>

            {/* Progress bar */}
            <div style={{ maxWidth: 340, margin: "0 auto 2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <span>Progress</span>
                <span style={{ fontWeight: 700 }}>{completedCount} / {nonBadgeLessonIds.length}</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${progressPct}%`,
                  background: "linear-gradient(90deg, var(--cm-cyan), #00b3cc)",
                  borderRadius: 8, transition: "width 0.4s ease",
                  boxShadow: "0 0 8px rgba(0,240,255,0.4)",
                }} />
              </div>
            </div>

            {/* Locked badge preview */}
            {badgeDef && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
                <BadgeCard badge={badgeDef} earned={false} size="lg" />
              </div>
            )}
          </div>
        ) : (
          // ── Unlocked state ────────────────────────────────────────────────
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            {/* Celebration header */}
            <div style={{ marginBottom: "0.5rem", fontSize: 13, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "var(--cm-green)", opacity: 0.9 }}>
              ✦ COURSE COMPLETE ✦
            </div>
            <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem", letterSpacing: "-0.5px" }}>
              Bit Manipulation — Easy
            </h1>
            <p style={{ color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 2.5rem", lineHeight: 1.85, fontSize: "0.93rem" }}>
              You&apos;ve mastered binary representation, all six bitwise operators, shifts, masking idioms, XOR tricks,
              Kernighan&apos;s popcount, subset enumeration, pattern recognition, masks-as-sets, common CP bugs, builtins,
              and solved 6 coding challenges.
            </p>

            {/* Animated badge */}
            {badgeDef && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
                <BadgeCard badge={badgeDef} earned earnedAt={badgeEarnedAt} size="lg" animate />
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: "2.5rem", flexWrap: "wrap" }}>
              {[
                ["11", "Lessons"],
                ["6", "Challenges"],
                ["2", "Checkpoints"],
              ].map(([val, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--cm-cyan)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}

            <Link
              href={profileHref}
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 12 }}
            >
              🏅 View on Profile
            </Link>
            <Link href="/learn" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              ← Back to Learn
            </Link>
          </div>
        );
      }

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
