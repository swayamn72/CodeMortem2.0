"use client";

import { useState, useEffect } from "react";
import { useProgressStore } from "@/stores/progressStore";
import { useAuthStore } from "@/stores/authStore";
import BadgeCard from "@/components/BadgeCard";
import { getBadgeDef } from "@/lib/badges";

import CourseLayout from "@/components/course/CourseLayout";
import ChallengeIde from "@/components/course/ChallengeIde";
import Mcq from "@/components/course/Mcq";

import {
  ModArithSandbox, BinExpStepper, ModInverseExplorer,
  NcrCalculator, GridPathVisualizer, StarsBarsDiagram,
  InclusionExclusionVenn,
} from "./learn/combinatorics/CombInteractiveTools";
import { COMB_COURSE, COMB_CHALLENGE_CONFIGS, COMB_MCQ_1, COMB_MCQ_2 } from "./learn/combinatorics/config";

import CodeEditor from "@/components/editor/CodeEditor";

// ─── Shared layout helpers ────────────────────────────────────────────────────

function LessonHeading({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--cm-purple)", marginBottom: "0.4rem", opacity: 0.8 }}>
        {num}
      </div>
      <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: "0.5rem" }}>
        {title}
      </h1>
      <div style={{ height: 3, width: 48, background: "linear-gradient(90deg, var(--cm-purple), transparent)", borderRadius: 4 }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--cm-purple)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 4, height: 18, background: "var(--cm-purple)", borderRadius: 2, display: "inline-block", opacity: 0.7 }} />
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
  const lineCount = code.trim().split("\n").length;
  return (
    <div style={{ height: Math.min(lineCount * 21 + 24, 400), background: "#0b0b10", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid var(--cm-purple)", borderRadius: "0 8px 8px 0", margin: "0.75rem 0 1.25rem", overflow: "hidden" }}>
      <CodeEditor value={code.trim()} language="cpp" onChange={() => {}} readOnly={true} />
    </div>
  );
}

function Callout({ icon, color = "var(--cm-purple)", children }: { icon: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", padding: "0.85rem 1rem", background: `${color}0d`, borderRadius: 8, borderLeft: `3px solid ${color}`, marginBottom: "1rem", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
      <span style={{ flexShrink: 0, fontSize: "1rem" }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function MathBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "0.85rem 1.25rem", background: "rgba(170,0,230,0.06)", border: "1px solid rgba(170,0,230,0.2)", borderRadius: 10, fontFamily: "monospace", fontSize: "1rem", color: "var(--cm-purple)", fontWeight: 700, margin: "0.75rem 0 1.25rem", textAlign: "center" as const }}>
      {children}
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

export default function CombinatoricsPath() {
  const [activeLesson, setActiveLesson] = useState("lesson1");
  const isChallenge = activeLesson.startsWith("challenge");
  const isMcq = activeLesson.startsWith("mcq");

  const { markLessonComplete, isLessonComplete, earnedBadges } = useProgressStore();
  const { user } = useAuthStore();
  const isPremiumActive = user?.isPremium && (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());

  const nonBadgeLessonIds = COMB_COURSE.allLessonIds.filter(id => id !== "badge");
  const allLessonsComplete = nonBadgeLessonIds.every(id => isLessonComplete(COMB_COURSE.moduleId, id));

  const badgeDef = getBadgeDef(COMB_COURSE.moduleId);
  const badgeEarnedAt = earnedBadges[COMB_COURSE.moduleId];
  const profileHref = user?.username ? `/profile/${user.username}` : "/profile";

  useEffect(() => {
    if (activeLesson === "badge" && allLessonsComplete) {
      markLessonComplete(COMB_COURSE.moduleId, "badge");
    }
  }, [activeLesson, allLessonsComplete, markLessonComplete]);

  const go = (from: string, to: string) => {
    markLessonComplete(COMB_COURSE.moduleId, from);
    if (to === "badge" && !allLessonsComplete) return;
    setActiveLesson(to);
  };

  // ── Challenge view ────────────────────────────────────────────────────────
  if (isChallenge) {
    const challenge = COMB_CHALLENGE_CONFIGS[activeLesson];
    return (
      <CourseLayout config={COMB_COURSE} activeLesson={activeLesson} setActiveLesson={setActiveLesson} isChallenge isPremiumActive={isPremiumActive ?? false}>
        <ChallengeIde
          challenge={challenge}
          onComplete={() => markLessonComplete(COMB_COURSE.moduleId, activeLesson)}
          navigate={setActiveLesson}
        />
      </CourseLayout>
    );
  }

  // ── MCQ view ──────────────────────────────────────────────────────────────
  if (isMcq) {
    const questions = activeLesson === "mcq1" ? COMB_MCQ_1 : COMB_MCQ_2;
    const nextLesson = activeLesson === "mcq1" ? "lesson6" : "lesson12";
    return (
      <CourseLayout config={COMB_COURSE} activeLesson={activeLesson} setActiveLesson={setActiveLesson} isChallenge={false} isPremiumActive={isPremiumActive ?? false}>
        <Mcq
          questions={questions}
          onNext={() => go(activeLesson, nextLesson)}
          nextLabel={activeLesson === "mcq1" ? "Part 3: Precomputation →" : "Part 5: Advanced Counting →"}
        />
      </CourseLayout>
    );
  }

  // ── Lesson content ────────────────────────────────────────────────────────
  const lessonContent = (() => {
    switch (activeLesson) {

      // ═══ LESSON 1: Modulo Properties ══════════════════════════════════════
      case "lesson1": return (<>
        <LessonHeading num="Lesson 1" title="Modular Arithmetic — Why % is Your Best Friend in CP" />

        <Section title="Why Modulo?">
          <P>Almost every combinatorics problem in competitive programming ends with "output the answer modulo 10<sup>9</sup>+7". Why? Because answers like C(10<sup>6</sup>, 500000) are astronomically large — hundreds of thousands of digits. No computer can store them directly.</P>
          <P>The modulo operation wraps the answer into a predictable range. <strong>10<sup>9</sup>+7</strong> (1,000,000,007) is chosen because it is:</P>
          <Callout icon="✓" color="var(--cm-green)">
            <strong>Prime</strong> — required for Fermat's Little Theorem (don't worry you'll learn about this!).<br />
            <strong>Fits in int32</strong> — less than 2<sup>31</sup> = ~2.1×10<sup>9</sup>.<br />
            <strong>Square fits in int64</strong> — (10<sup>9</sup>+7)<sup>2</sup> ≈ 10<sup>18</sup> &lt; 2<sup>63</sup>, so two values multiplied together won't overflow a long long.
          </Callout>
        </Section>

        <Section title="The Three Safe Operations">
          <P>Addition, subtraction, and multiplication all work cleanly under modulo:</P>
          <CodeBlock code={`// All three are safe with long long:
(a + b) % MOD
(a - b + MOD) % MOD   // +MOD prevents negative results
(a * b) % MOD         // ONLY SAFE if a,b < MOD (they fit in 32 bits)

// WRONG — overflow danger when a and b are both near MOD:
int a = 1e9, b = 1e9;
cout << (a * b) % MOD;  // a*b overflows int! Always use long long:
cout << (1LL * a * b) % MOD;  // ← correct`} />

          <Callout icon="⚠" color="var(--cm-red)">
            <strong>The most common CP bug:</strong> forgetting to cast to <code>long long</code> before multiplying.
            Always write <code>(long long)a * b % MOD</code>, never <code>a * b % MOD</code> with int variables.
          </Callout>
        </Section>

        <Section title="Division? Not So Simple.">
          <P>You <strong>cannot</strong> do A / B mod M directly. Division is not closed under modular arithmetic. For example, (10 / 2) mod 7 = 5, but (10 mod 7) / (2 mod 7) = 3 / 2, which isn't a valid integer mod 7.</P>
          <P>The solution involves the <strong>modular inverse</strong>, which you will learn in Lesson 3. For now, internalize that division under modulo requires special treatment.</P>
        </Section>


        <NavBtn label="Code: Safe Product →" onClick={() => go("lesson1", "challenge1")} />
      </>);

      // ═══ LESSON 2: Binary Exponentiation ══════════════════════════════════
      case "lesson2": return (<>
        <LessonHeading num="Lesson 2" title="Binary Exponentiation — O(log B) Power Computation" />

        <Section title="The Problem with Naive Loops">
          <P>If you want to calculate X<sup>Y</sup>, you typically multiply X by itself Y times. But what if Y is 10<sup>18</sup>? A standard loop running 10<sup>18</sup> times would take <strong>over 30 years</strong> to finish on a modern CPU. In competitive programming, you only have 1 second.</P>
          <Callout icon="💡">
            <strong>The Intuition:</strong> Instead of multiplying one by one, what if we repeatedly double our progress? 
            X<sup>Y</sup> = (X<sup>2</sup>)<sup>Y/2</sup> when Y is even. We can halve the exponent at every step. 
            For Y = 10<sup>18</sup>, halving it repeatedly takes only log₂(10<sup>18</sup>) ≈ 60 steps! We turn 30 years of computation into 60 microscopic operations.
          </Callout>
        </Section>

        <Section title="The Algorithm">
          <P>The algorithm uses binary (base-2) representation of the exponent. If Y = 13 = 1101₂, then X<sup>13</sup> = X<sup>8</sup> × X<sup>4</sup> × X<sup>1</sup>. We compute these powers of X by repeated squaring:</P>
          <CodeBlock code={`long long power(long long base, long long exp, long long mod) {
    long long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1)           // if current bit of exp is 1
            result = result * base % mod;
        base = base * base % mod;  // square the base
        exp >>= 1;             // move to the next bit
    }
    return result;
}`} />
          <P>Each iteration: check the lowest bit of exp. If set, multiply that power into result. Then square base and shift exp right. Total iterations = number of bits in exp = O(log exp).</P>
        </Section>


        <NavBtn label="Code: Fast Power →" onClick={() => go("lesson2", "challenge2")} />
      </>);

      // ═══ LESSON 3: Fermat's Little Theorem ════════════════════════════════
      case "lesson3": return (<>
        <LessonHeading num="Lesson 3" title="Fermat's Little Theorem — Division Under Modulo" />

        <Section title="The Theorem">
          <P>Addition, subtraction, and multiplication work perfectly normally under a modulo. <strong>Division does not.</strong> You cannot simply do `(A / B) % MOD`.</P>
          <P>To divide by B, you must multiply by the <strong>Modular Inverse</strong> of B. This is where Fermat's Little Theorem comes to save the day. It states that for any prime P and integer A not divisible by P:</P>
          <MathBox>A<sup>P-1</sup> ≡ 1 (mod P)</MathBox>
        </Section>

        <Section title="Deriving the Modular Inverse">
          <P>If we take Fermat's equation A<sup>P-1</sup> ≡ 1 (mod P) and divide both sides by A, we get a magical result:</P>
          <MathBox>A<sup>P-2</sup> ≡ A<sup>-1</sup> (mod P)</MathBox>
          <P>This means the <strong>modular inverse</strong> of A is simply A raised to the power of (P-2). And since we just learned Binary Exponentiation, we can calculate this massive power in O(log P) time instantly!</P>
          <CodeBlock code={`const long long MOD = 1e9 + 7;

long long modinv(long long a) {
    return power(a, MOD - 2, MOD);  // Fermat's Little Theorem
}

// Now you can divide modulo:
// A / B mod P = A * modinv(B) % P
long long divide(long long a, long long b) {
    return a % MOD * modinv(b) % MOD;
}`} />
        </Section>

        <Callout icon="⚠" color="var(--cm-red)">
          This only works when P is <strong>prime</strong> and B is <strong>not divisible by P</strong>.
          10<sup>9</sup>+7 and 998244353 are both prime, which is why they're used as standard CP moduli.
        </Callout>


        <NavBtn label="Code: Modulo Division →" onClick={() => go("lesson3", "challenge3")} />
      </>);

      // ═══ LESSON 4: Permutations ════════════════════════════════════════════
      case "lesson4": return (<>
        <LessonHeading num="Lesson 4" title="Rule of Sum, Product & Permutations" />

        <Section title="Fundamental Counting Principles">
          <P><strong style={{ color: "var(--cm-purple)" }}>Rule of Sum:</strong> If you can do task A in m ways OR task B in n ways (mutually exclusive), total = m + n.</P>
          <P><strong style={{ color: "var(--cm-purple)" }}>Rule of Product:</strong> If you must do task A in m ways AND then task B in n ways (independent), total = m × n.</P>
          <Callout icon="📌">
            The word "OR" usually signals addition. The word "AND" usually signals multiplication.
            Recognizing this transforms most counting problems.
          </Callout>
        </Section>

        <Section title="Permutations — Ordered Arrangements">
          <P>How many ways can you arrange N distinct items in a row? Think of it as placing people in chairs. For the first chair, you have N choices. For the second chair, someone is already seated, so you have N-1 choices. For the third, N-2 choices, and so on.</P>
          <P>By the Rule of Product, we multiply these choices together:</P>
          <MathBox>P(N) = N! = N × (N-1) × (N-2) × ... × 2 × 1</MathBox>
          <CodeBlock code={`// N! mod 10^9+7
long long factorial(long long n) {
    long long result = 1;
    for (long long i = 2; i <= n; i++)
        result = result * i % MOD;
    return result;
}
// factorial(0) = 1 (by convention)`} />
          <P>Factorials grow incredibly fast: 20! ≈ 2.4×10<sup>18</sup>, which doesn't even fit in a 64-bit integer. This is why combinatorics problems almost always ask you to output the answer modulo 10<sup>9</sup>+7.</P>
        </Section>

        <NavBtn label="Code: Task Lineup →" onClick={() => go("lesson4", "challenge4")} />
      </>);

      // ═══ LESSON 5: Combinations ════════════════════════════════════════════
      case "lesson5": return (<>
        <LessonHeading num="Lesson 5" title="Combinations — When Order Doesn't Matter" />

        <Section title="C(N, K) — The Binomial Coefficient">
          <P>Combinations answer the question: "How many ways can I <strong>choose</strong> a team of K items from N total items, if I don't care what order I pick them in?"</P>
          <P>For example, choosing {"{Alice, Bob, Carol}"} is the exact same team as choosing {"{Carol, Alice, Bob}"}.</P>
          <P>To calculate this, we first calculate the Permutations (N!), which gives us every possible arrangement. But this counts {"{Alice, Bob, Carol}"} and {"{Carol, Alice, Bob}"} as different! So, we must divide by K! (the number of ways to arrange the chosen team) and (N-K)! (the number of ways to arrange the people left behind) to cancel out all the duplicates.</P>
          <MathBox>C(N, K) = N! / (K! × (N-K)!)</MathBox>
        </Section>

        <Section title="Properties">
          <P>• C(N, 0) = C(N, N) = 1 (always)</P>
          <P>• C(N, K) = C(N, N-K) (choosing K to include = choosing N-K to exclude)</P>
          <P>• C(N, 1) = N (any single item)</P>
          <CodeBlock code={`// Direct computation — safe for N <= 20
// (values fit in 64-bit long long)
long long nCr_small(long long n, long long k) {
    if (k > n) return 0;
    long long num = 1, den = 1;
    for (long long i = 0; i < k; i++) {
        num *= (n - i);
        den *= (i + 1);
    }
    return num / den;  // exact integer division
}`} />
        </Section>


        <NavBtn label="Code: Team Formations →" onClick={() => go("lesson5", "challenge5")} />
      </>);

      // ═══ LESSON 6: The Query Bottleneck ═══════════════════════════════════
      case "lesson6": return (<>
        <LessonHeading num="Lesson 6" title="The Query Bottleneck — Why Precomputation is Essential" />

        <Section title="The Scaling Problem">
          <P>Imagine a problem gives you Q = 10<sup>5</sup> queries. Each query asks for C(N, K) with N up to 10<sup>6</sup>.</P>
          <P>If you calculate the factorials from scratch for every single query, you'd do up to 1,000,000 multiplications per query. Multiplied by 100,000 queries, that's 100 Billion operations — a guaranteed Time Limit Exceeded (TLE) crash.</P>
          <Callout icon="💡">
            <strong>The Solution:</strong> Do the heavy lifting exactly once at the very beginning of the program. 
            Precalculate all factorials from 0 to MAXN in a single O(N) pass, and store them in an array. 
            Then, whenever a query asks for C(N, K), you don't use loops. You just look up the answers in your array in O(1) instant time!
          </Callout>
        </Section>

        <Section title="The Precomputation Pattern">
          <CodeBlock code={`const int MAXN = 1000001;
long long fact[MAXN];

void precompute() {
    fact[0] = 1;
    for (int i = 1; i < MAXN; i++)
        fact[i] = fact[i - 1] * i % MOD;
}

// Query is now O(1):
long long query(int x) { return fact[x]; }`} />
          <P>This pattern — precompute once, answer many queries — is one of the most important techniques in competitive programming. You'll use it in virtually every combinatorics problem.</P>
        </Section>

        <NavBtn label="Code: Prefix Factorials →" onClick={() => go("lesson6", "challenge6")} />
      </>);

      // ═══ LESSON 7: Precomputing Inverses ══════════════════════════════════
      case "lesson7": return (<>
        <LessonHeading num="Lesson 7" title="Precomputing Inverse Factorials — The Second Array" />

        <Section title="The Problem with Per-Query Inverses">
          <P>To calculate C(N, K) instantly, we need to quickly find the modular inverse of K! and (N-K)!. We could just use our Binary Exponentiation function to find the inverse for every query, which takes O(log P) time. With 10<sup>5</sup> queries, that's entirely fast enough to pass.</P>
          <P>But the truly beautiful and standard competitive programming approach is to completely precalculate ALL inverse factorials ahead of time in O(N) time, making our nCr queries completely loopless and purely O(1).</P>
        </Section>

        <Section title="The Key Identity">
          <P>If we individually calculated the modular inverse of every factorial up to 10<sup>6</sup>, it would take O(N log P) time. But we can use a mathematical chain-reaction to do it in pure O(N) time!</P>
          <P>We know that `i! = (i+1)! / (i+1)`. If we take the modular inverse of both sides, the division turns into multiplication:</P>
          <MathBox>(i!)<sup>-1</sup> = ((i+1)!)<sup>-1</sup> × (i+1)  (mod P)</MathBox>
          <P>This is mindblowing: it means if we know the inverse factorial for <code>i+1</code>, we can instantly find the inverse factorial for <code>i</code> just by multiplying it by <code>i+1</code>!</P>
          <P>So, our algorithm is to calculate the inverse for the VERY LAST factorial (using binary exponentiation once), and then loop backward, cascading the answers down to zero.</P>
          <CodeBlock code={`long long fact[MAXN], inv_fact[MAXN];

void precompute() {
    // Step 1: build factorials forward
    fact[0] = 1;
    for (int i = 1; i < MAXN; i++)
        fact[i] = fact[i - 1] * i % MOD;

    // Step 2: compute inv_fact[MAXN-1] using one modular exponentiation
    inv_fact[MAXN - 1] = power(fact[MAXN - 1], MOD - 2, MOD);

    // Step 3: fill backwards using the recurrence — O(N)
    for (int i = MAXN - 2; i >= 0; i--)
        inv_fact[i] = inv_fact[i + 1] * (i + 1) % MOD;
}`} />
        </Section>

        <NavBtn label="Code: Inverse Array →" onClick={() => go("lesson7", "challenge7")} />
      </>);

      // ═══ LESSON 8: O(1) nCr Function ══════════════════════════════════════
      case "lesson8": return (<>
        <LessonHeading num="Lesson 8" title="The O(1) nCr Function — The Complete Combinatorics Template" />

        <Section title="Putting it All Together">
          <P>With fact[] and invFact[] precomputed, C(N, K) is just three array lookups and two multiplications:</P>
          <MathBox>C(N, K) = fact[N] × invFact[K] × invFact[N-K]  (mod P)</MathBox>
          <CodeBlock code={`// ── THE STANDARD COMBINATORICS TEMPLATE ──────────────────────
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;
const int MAXN = 1000001;

ll fact[MAXN], inv_fact[MAXN];

ll power(ll b, ll e, ll m) {
    ll r = 1; b %= m;
    while (e > 0) {
        if (e & 1) r = r * b % m;
        b = b * b % m;
        e >>= 1;
    }
    return r;
}

void precompute() {
    fact[0] = 1;
    for (int i = 1; i < MAXN; i++) fact[i] = fact[i-1] * i % MOD;
    inv_fact[MAXN-1] = power(fact[MAXN-1], MOD-2, MOD);
    for (int i = MAXN-2; i >= 0; i--) inv_fact[i] = inv_fact[i+1] * (i+1) % MOD;
}

ll nCr(int n, int k) {
    if (k < 0 || k > n) return 0;
    return fact[n] * inv_fact[k] % MOD * inv_fact[n-k] % MOD;
}

// Usage:
// precompute();  ← call once at the start of main
// nCr(10, 3)    ← O(1) query`} />
          <Callout icon="🏆" color="var(--cm-green)">
            This 25-line template handles the majority of combinatorics problems in competitive programming.
            Memorize or internalize it. You will use it constantly.
          </Callout>
        </Section>


        <NavBtn label="Code: Massive Queries →" onClick={() => go("lesson8", "challenge8")} />
      </>);

      // ═══ LESSON 9: Grid Paths ══════════════════════════════════════════════
      case "lesson9": return (<>
        <LessonHeading num="Lesson 9" title="Grid Paths — The Classic nCr Application" />

        <Section title="The Setup">
          <P>A robot starts at (0,0) and must reach (X, Y) by moving only <strong>right</strong> (+1 column) or <strong>down</strong> (+1 row). No backtracking is allowed. How many unique paths are there?</P>
        </Section>

        <Section title="The Core Logic (Why it works)">
          <P>Instead of looking at the grid, look at the moves. To get from (0,0) to (X, Y), you must take exactly <strong>X steps to the right (R)</strong> and exactly <strong>Y steps down (D)</strong>.</P>
          <P>Every single valid path is just a unique string of length X + Y made of exactly X 'R's and Y 'D's.</P>
          <CodeBlock code={`Example Path 1: R R D D R\nExample Path 2: D R R R D`} />
        </Section>

        <Section title="The Formula">
          <P>Since the total sequence has X + Y blank slots, and you must place exactly X 'R's into those slots (the rest automatically become 'D's), the problem is simply: "Out of X+Y positions, choose X."</P>
          <MathBox>Paths(X, Y) = C(X + Y, X) = (X+Y)! / (X! × Y!)  (mod 10^9+7)</MathBox>
          <P><small>(Note: You could also choose to place the 'D's first using C(X+Y, Y). Because of the symmetry of combinations, the answer is exactly the same!)</small></P>
        </Section>

        <Section title="CP Strategy: Math vs. Dynamic Programming">
          <P>If you have studied DP, you know this problem can be solved by building a matrix where <code style={{color:"var(--cm-cyan)", fontFamily:"monospace"}}>dp[i][j] = dp[i-1][j] + dp[i][j-1]</code>. So why use Combinatorics?</P>
          <P>• <strong>When to use DP:</strong> When X, Y ≤ 1000 and there are random obstacles on the grid.</P>
          <P>• <strong>When to use Math:</strong> When X, Y ≤ 10<sup>5</sup>. A DP matrix of 10<sup>5</sup> × 10<sup>5</sup> requires 10<sup>10</sup> operations and will instantly cause a Time Limit Exceeded (TLE).</P>
        </Section>

        <Section title="The MAXN Trap">
          <Callout icon="⚠" color="var(--cm-red)">
            For large X and Y (up to 10<sup>5</sup> each), the total number of moves X+Y can reach 2×10<sup>5</sup>. Make sure the MAXN for your precomputed factorial array is large enough to cover the <strong>sum</strong>, not just the grid dimensions!
          </Callout>
        </Section>

        <NavBtn label="Code: Robot Grid →" onClick={() => go("lesson9", "challenge9")} />
      </>);

      // ═══ LESSON 10: Stars and Bars ════════════════════════════════════════
      case "lesson10": return (<>
        <LessonHeading num="Lesson 10" title="Stars and Bars — Distributing Identical Items" />

        <Section title="The Setup">
          <P>A classic combinatorial question is: <em>"How many ways can you distribute N identical candies among K children?"</em></P>
          <P>Because the candies are completely identical, the only thing that matters is <strong>how many</strong> candies each child gets, not which specific candies they get.</P>
        </Section>

        <Section title="The Intuition (Zero Allowed)">
          <P>Imagine the N candies as stars (★★★★★) in a row. To split them into K groups (one for each child), we need to insert <strong>K-1 dividers</strong> (|) between the stars.</P>
          <P>If a child is allowed to receive 0 candies, then dividers can be placed anywhere—even right next to each other!</P>
          <CodeBlock code={`// Example: N=5 candies, K=3 children\n// Total items in our sequence: 5 stars + 2 dividers = 7 positions\n\n★★|★★|★   → [2, 2, 1]\n★★★||★★   → [3, 0, 2] (Child 2 gets nothing)\n|★★★★|★   → [0, 4, 1] (Child 1 gets nothing)`} />
        </Section>

        <Section title="The Formula">
          <P>Since we have a total sequence length of <strong>N + (K - 1)</strong>, and we just need to choose exactly <strong>K - 1</strong> positions to place the dividers (or alternatively, choose N positions for the stars), the formula is:</P>
          <MathBox>Ways(N, K) = C(N + K - 1, K - 1)</MathBox>
        </Section>

        <Section title="Variation: At Least One Item">
          <P>What if the rules say <em>"every child must receive at least 1 candy"</em>?</P>
          <P>Simple trick: Hand out 1 candy to each of the K children immediately. Now you have exactly <strong>N - K</strong> candies left to distribute however you want (including giving 0 to some)!</P>
          <MathBox>Ways(N, K, ≥1) = C((N-K) + K - 1, K - 1) = C(N - 1, K - 1)</MathBox>
        </Section>
        <NavBtn label="Code: Candy Distribution →" onClick={() => go("lesson10", "challenge11")} />
      </>);

      // ═══ LESSON 11: Permutations with Repetition ══════════════════════════
      case "lesson11": return (<>
        <LessonHeading num="Lesson 11" title="Permutations with Repetitions — Anagrams and Multisets" />

        <Section title="The Problem">
          <P>Suppose you want to find all possible anagrams (rearrangements) of the word <strong>MISSISSIPPI</strong>. It has 11 letters, so your first instinct might be that there are <strong>11!</strong> ways to arrange them.</P>
        </Section>

        <Section title="The Overcounting Intuition">
          <P>There's a catch: MISSISSIPPI has 4 'I's, 4 'S's, and 2 'P's. If you swap the first 'S' with the second 'S', the word still spells MISSISSIPPI.</P>
          <P>In a standard permutation (N!), we treat every single item as unique (e.g., S₁, S₂, S₃, S₄). Those 4 unique 'S's can be arranged among themselves in exactly <strong>4! = 24</strong> different ways.</P>
          <P>To get the number of <em>distinct</em> strings, we must take our total permutations and <strong>divide out</strong> the internal permutations of every duplicate group.</P>
        </Section>

        <Section title="The Formula">
          <MathBox>Distinct arrangements = N! / (f₁! × f₂! × f₃! × ...)</MathBox>
          <P>Where N is the total number of items, and f₁, f₂, etc., are the frequencies of each identical item.</P>
          <P>For <strong>AACCG</strong>: N=5, f(A)=2, f(C)=2, f(G)=1.<br/>Answer = 5! / (2! × 2! × 1!) = 120 / (2 × 2 × 1) = <strong>30</strong>.</P>
        </Section>

        <Section title="Under Modular Arithmetic">
          <P>In competitive programming, you'll be asked to output this modulo 10<sup>9</sup>+7. Since we are dividing by factorials, we must multiply by their <strong>modular inverses</strong> using our precomputed <code>inv_fact</code> array:</P>
          <CodeBlock code={`string s; cin >> s;\nint n = s.size();\nmap<char, int> freq;\nfor (char c : s) freq[c]++;\n\nlong long ans = fact[n];  // Start with N!\nfor (auto& [c, f] : freq) {\n    // Instead of dividing by f!, multiply by inverse(f!)\n    ans = (ans * inv_fact[f]) % MOD;\n}\ncout << ans << "\\n";`} />
        </Section>


        <NavBtn label="Code: DNA Sequences →" onClick={() => go("lesson11", "challenge12")} />
      </>);

      // ═══ LESSON 12: Inclusion-Exclusion ═══════════════════════════════════
      case "lesson13": return (<>
        <LessonHeading num="Lesson 12" title="Inclusion-Exclusion Principle — Counting Overlapping Sets" />

        <Section title="The Overcounting Problem">
          <P>Imagine a class of 30 students. 15 study Math, and 20 study Physics. If you want to know how many study <em>at least one</em> of the subjects, you can't just do 15 + 20 = 35 (there are only 30 students!).</P>
          <P>Because some students study <strong>both</strong>, they were counted twice. To get the true number, we must subtract the overlap: <br/><code>Total = |Math| + |Physics| - |Math ∩ Physics|</code>.</P>
        </Section>

        <Section title="The General Principle (PIE)">
          <P>This concept scales to any number of overlapping sets. It's called the <strong>Principle of Inclusion-Exclusion (PIE)</strong>. For three sets A, B, and C, the formula becomes:</P>
          <MathBox>|A ∪ B ∪ C| = |A| + |B| + |C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|</MathBox>
          <P><strong>The Alternating Pattern:</strong> Add the singles (+), subtract the pairwise intersections (-), add back the triple intersections (+), subtract quadruple intersections (-), and so on.</P>
        </Section>

        <Section title="Application: Divisibility Queries">
          <P>A classic competitive programming question asks: <em>"How many integers between 1 and X are divisible by 2, 3, or 5?"</em></P>
          <P>The number of multiples of D in the range [1, X] is simply <code>floor(X / D)</code>. We can use PIE to combine them. Note that the intersection of "multiples of 2" and "multiples of 3" is "multiples of LCM(2, 3) = 6".</P>
          <CodeBlock code={`long long x;\ncin >> x;\n\n// Singles: 2, 3, 5\nlong long singles = x/2 + x/3 + x/5;\n\n// Pairs: lcm(2,3)=6, lcm(2,5)=10, lcm(3,5)=15\nlong long pairs = x/6 + x/10 + x/15;\n\n// Triples: lcm(2,3,5)=30\nlong long triples = x/30;\n\n// Combine using PIE (+ singles, - pairs, + triples)\ncout << singles - pairs + triples << "\\n";\n// This works flawlessly even for X up to 10^18!`} />
        </Section>

        <InclusionExclusionVenn />
        <NavBtn label="Code: Co-prime Count →" onClick={() => go("lesson13", "challenge14")} />
      </>);

      // ═══ BADGE ════════════════════════════════════════════════════════════
      case "badge": return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "2rem" }}>
          {!allLessonsComplete ? (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
              <h2 style={{ color: "var(--text-secondary)" }}>Complete all lessons to unlock your badge</h2>
            </>
          ) : badgeDef ? (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <BadgeCard badge={badgeDef} earned={!!badgeEarnedAt} earnedAt={badgeEarnedAt} size="lg" />
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--cm-purple)", marginBottom: "0.5rem" }}>
                🎉 Formula Master Unlocked!
              </h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: 500, marginBottom: "1.5rem" }}>
                You've built a full O(1) combinatorics library from scratch — modular arithmetic,
                binary exponentiation, Fermat's inverse, precomputed factorials, and classical counting models.
              </p>
              <a href={profileHref} className="btn btn-primary">View on Profile →</a>
            </>
          ) : null}
        </div>
      );

      default: return null;
    }
  })();

  return (
    <CourseLayout
      config={COMB_COURSE}
      activeLesson={activeLesson}
      setActiveLesson={setActiveLesson}
      isChallenge={false}
      isPremiumActive={isPremiumActive ?? false}
    >
      <div style={{ maxWidth: 820, width: "100%" }}>
        {lessonContent}
      </div>
    </CourseLayout>
  );
}
