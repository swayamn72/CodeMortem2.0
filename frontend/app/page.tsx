"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import {
  Zap, BookOpen, Swords, Timer, BarChart3, Link2,
  ChevronRight, Check, Users, Trophy, Code2, ArrowRight,
  Sparkles, Star, Crown
} from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};



const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

// ─── Background ───────────────────────────────────────────────────────────────

function Background() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${((i * 37 + 13) % 100)}%`,
    top: `${((i * 59 + 7) % 100)}%`,
    delay: `${(i * 0.37) % 6}s`,
    duration: `${3 + (i % 4)}s`,
    size: i % 5 === 0 ? 2 : 1,
    opacity: i % 3 === 0 ? 0.6 : 0.3,
  }));

  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.bgGrid} />
      <div className={styles.bgRadial} />
      <div className={styles.bgOrange} />
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// ─── Product Preview Mockup ───────────────────────────────────────────────────

function ProductPreview() {
  const [activeQ, setActiveQ] = useState(2);

  const problems = [
    { num: 1, pts: 100, solved: true, color: "#22D3EE" },
    { num: 2, pts: 200, solved: false, color: "#A78BFA" },
    { num: 3, pts: 300, solved: false, color: "#A1A1AA" },
    { num: 4, pts: 400, solved: false, color: "#A1A1AA" },
    { num: 5, pts: 500, solved: false, color: "#A1A1AA" },
    { num: 6, pts: 600, solved: false, color: "#A1A1AA" },
    { num: 7, pts: 700, solved: false, color: "#A1A1AA" },
  ];

  const codeLines = [
    { n: 1,  text: "#include <bits/stdc++.h>", color: "#22D3EE" },
    { n: 2,  text: "using namespace std;",      color: "#818CF8" },
    { n: 3,  text: "",                           color: "" },
    { n: 4,  text: "int main() {",               color: "#F8FAFC" },
    { n: 5,  text: "  ios_base::sync_with_stdio(false);", color: "#94A3B8" },
    { n: 6,  text: "  cin.tie(NULL);",            color: "#94A3B8" },
    { n: 7,  text: "",                            color: "" },
    { n: 8,  text: "  int n;",                   color: "#F8FAFC" },
    { n: 9,  text: "  cin >> n;",                color: "#F8FAFC" },
    { n: 10, text: "  vector<int> a(n);",         color: "#F8FAFC" },
    { n: 11, text: "  for (int i = 0; i < n; i++)", color: "#E879F9" },
    { n: 12, text: "    cin >> a[i];",            color: "#F8FAFC" },
    { n: 13, text: "",                            color: "" },
    { n: 14, text: "  sort(a.begin(), a.end());", color: "#F8FAFC" },
    { n: 15, text: "  cout << a[n/2] << '\\n';",  color: "#22D3EE" },
    { n: 16, text: "  return 0;",                 color: "#94A3B8" },
    { n: 17, text: "}",                           color: "#F8FAFC" },
  ];

  return (
    <div className={styles.preview}>
      {/* Chrome bar */}
      <div className={styles.previewChrome}>
        <div className={styles.chromeDots}>
          <span style={{ background: "#FF5F57" }} />
          <span style={{ background: "#FFBD2E" }} />
          <span style={{ background: "#28C840" }} />
        </div>
        <div className={styles.chromeUrl}>codemortem.gg/match/arena</div>
        <div className={styles.chromeTimer}>
          <Timer size={10} />
          18:42
        </div>
      </div>

      {/* Score bar */}
      <div className={styles.previewScorebar}>
        <div className={styles.scorePlayer}>
          <span className={styles.scoreHandle} style={{ color: "#22D3EE" }}>You</span>
          <span className={styles.scorePoints}>320 pts</span>
        </div>
        <div className={styles.scoreVs}>VS</div>
        <div className={`${styles.scorePlayer} ${styles.scorePlayerRight}`}>
          <span className={styles.scoreHandle} style={{ color: "#FB923C" }}>tourist</span>
          <span className={styles.scorePoints}>180 pts</span>
        </div>
      </div>

      {/* Main layout */}
      <div className={styles.previewBody}>
        {/* Sidebar */}
        <div className={styles.previewSidebar}>
          <div className={styles.sidebarHeader}>Problems</div>
          {problems.map(p => (
            <button
              key={p.num}
              className={`${styles.qItem} ${p.num === activeQ ? styles.qItemActive : ""} ${p.solved ? styles.qItemSolved : ""}`}
              onClick={() => setActiveQ(p.num)}
            >
              <span className={styles.qLabel}>Q{p.num}</span>
              <span className={styles.qPts} style={{ color: p.num === activeQ ? "#22D3EE" : "#A1A1AA" }}>+{p.pts}</span>
              {p.solved && <Check size={10} style={{ color: "#22D3EE", flexShrink: 0 }} />}
            </button>
          ))}
        </div>

        {/* Code editor */}
        <div className={styles.previewEditor}>
          <div className={styles.editorTab}>
            <Code2 size={11} />
            solution.cpp
          </div>
          <div className={styles.editorBody}>
            {codeLines.map(line => (
              <div key={line.n} className={styles.codeLine}>
                <span className={styles.lineNum}>{line.n}</span>
                <span style={{ color: line.color || "transparent", fontFamily: "monospace", fontSize: 11, whiteSpace: "pre" }}>
                  {line.text}
                </span>
              </div>
            ))}
            <div className={styles.cursor} />
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.previewRight}>
          <div className={styles.opponentCard}>
            <div className={styles.opponentBadge} style={{ color: "#FB923C" }}>OPPONENT</div>
            <div className={styles.opponentName}>tourist</div>
            <div className={styles.opponentRating} style={{ color: "#FF5F57" }}>2847</div>
            <div className={styles.opponentSolved}>
              <Check size={9} style={{ color: "#22D3EE" }} /> Q1 solved
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.opponentCard}>
            <div className={styles.opponentBadge} style={{ color: "#22D3EE" }}>YOU</div>
            <div className={styles.opponentName}>Swayam</div>
            <div className={styles.opponentRating} style={{ color: "#22D3EE" }}>1847</div>
            <div className={styles.opponentSolved}>
              <Check size={9} style={{ color: "#22D3EE" }} /> Q1 solved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className={styles.heroBadge}
        >
          <Sparkles size={12} />
          <span>Introducing Live 1v1 Coding Battles</span>
          <ChevronRight size={12} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className={styles.heroHeading}
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.span variants={fadeUp} className={styles.heroLine}>
            Code or be
          </motion.span>{" "}
          <motion.span variants={fadeUp} className={styles.heroLineAccent}>
            Coded.
          </motion.span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className={styles.heroDesc}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
        >
          Climb the leaderboard in fast-paced 1v1 algorithmic matches, or master advanced
          computer science topics through interactive learning modules, custom sandbox
          playgrounds, and Practice Banks.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className={styles.heroCtas}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.35 }}
        >
          <Link href="/register" className={styles.btnPrimary}>
            <Zap size={16} />
            Find a Match
          </Link>
          <Link href="/learn" className={styles.btnSecondary}>
            Start Learning
            <ArrowRight size={15} />
          </Link>
        </motion.div>

        {/* Product preview */}
        <motion.div
          className={styles.previewWrapper}
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <div className={styles.previewGlow} />
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const STATS = [
  { value: "7", label: "Problems per match" },
  { value: "30m", label: "Match duration" },
  { value: "2,800", label: "Total points possible" },
  { value: "5", label: "Algorithm modules" },
];

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={styles.statsBar}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {STATS.map((s, i) => (
        <motion.div key={i} variants={fadeUp} className={styles.statItem}>
          <span className={styles.statValue}>{s.value}</span>
          <span className={styles.statLabel}>{s.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: "Rating-Based Matchmaking",
    description: "Matchmaking system matches you with equally skilled opponents. Link your Codeforces account for instant calibration.",
  },
  {
    icon: BookOpen,
    title: "Curated Learning Modules",
    description: "Master key CS and algorithmic topics. Learn from scratch with interactive visualizers, sandbox tools, and unlockable Practice Banks.",
  },
  {
    icon: Swords,
    title: "Real-Time Arena",
    description: "Split-screen editor. See when your opponent solves a question. Every second counts.",
  },
  {
    icon: Timer,
    title: "30-Minute Matches",
    description: "7 problems, 30 minutes, points from 100 to 700. First to solve gets the points. Speed + skill = victory.",
  },
  {
    icon: BarChart3,
    title: "Rating & Rankings",
    description: "Track your progress with detailed rating history, match analytics, and global leaderboards. Rise from Newbie to Legendary Grandmaster.",
  },
  {
    icon: Link2,
    title: "Codeforces Integration",
    description: "Link your CF handle for instant rating calibration. Your existing competitive programming experience carries over.",
  },
];

function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="features" className={styles.section}>
      <div className={styles.sectionInner}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.p variants={fadeUp} className={styles.eyebrow}>Features</motion.p>
          <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
            Master Competitive<br />Programming
          </motion.h2>
          <motion.p variants={fadeUp} className={styles.sectionDesc}>
            Perfect your skills with real-time duels and hands-on conceptual learning paths.
          </motion.p>

          <motion.div
            variants={stagger}
            className={styles.featuresGrid}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className={styles.featureCard}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.featureIconWrap}>
                  <f.icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    icon: Users,
    title: "Join the Queue",
    desc: 'Click "Find Match" and our matchmaking engine searches for an opponent within your rating range.',
  },
  {
    num: "02",
    icon: Swords,
    title: "Face Your Opponent",
    desc: "7 problems appear simultaneously for both players. Sorted by difficulty (100→700 pts). The clock starts — you have 30 minutes.",
  },
  {
    num: "03",
    icon: Code2,
    title: "Code & Submit",
    desc: "Write your solution in the code editor. Hit Run to test with custom input. Hit Submit to judge against hidden test cases. First accepted wins the points.",
  },
  {
    num: "04",
    icon: Trophy,
    title: "Collect Your Rating",
    desc: "After 30 minutes, rating deltas are calculated. Win, and watch your rating soar. Review your opponent's solutions to learn.",
  },
];

function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="how-it-works" className={styles.section}>
      <div className={styles.sectionInner}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.p variants={fadeUp} className={styles.eyebrow}>How It Works</motion.p>
          <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
            From queue to victory<br />in 4 steps
          </motion.h2>

          <div className={styles.timeline}>
            {STEPS.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className={styles.timelineStep}>
                {/* Connector */}
                {i < STEPS.length - 1 && <div className={styles.timelineConnector} />}

                {/* Number circle */}
                <div className={styles.timelineNumWrap}>
                  <div className={styles.timelineNum}>{step.num}</div>
                </div>

                {/* Content */}
                <div className={styles.timelineContent}>
                  <div className={styles.timelineIcon}>
                    <step.icon size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className={styles.timelineTitle}>{step.title}</h3>
                  <p className={styles.timelineDesc}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Scoring Section ──────────────────────────────────────────────────────────

const SCORING = [
  { q: "Q1", pts: 100, diff: "Warm-up", type: "Implementation" },
  { q: "Q2", pts: 200, diff: "Easy", type: "Greedy / Math" },
  { q: "Q3", pts: 300, diff: "Easy-Med", type: "Sorting / Two Pointers" },
  { q: "Q4", pts: 400, diff: "Medium", type: "Binary Search / BFS" },
  { q: "Q5", pts: 500, diff: "Med-Hard", type: "DP / Graphs" },
  { q: "Q6", pts: 600, diff: "Hard", type: "Advanced DP / Segment Trees" },
  { q: "Q7", pts: 700, diff: "Expert", type: "Combinatorics / Flows" },
];

function getDiffColor(diff: string) {
  if (diff === "Warm-up" || diff === "Easy") return "#22D3EE";
  if (diff === "Easy-Med" || diff === "Medium") return "#A78BFA";
  if (diff === "Med-Hard" || diff === "Hard") return "#FB923C";
  return "#FF5F57";
}

function ScoringSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.sectionInner}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.p variants={fadeUp} className={styles.eyebrow}>Scoring</motion.p>
          <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
            Every question rewards<br />speed and skill
          </motion.h2>
          <motion.p variants={fadeUp} className={styles.sectionDesc}>
            7 problems per match, escalating in difficulty and reward.
          </motion.p>

          <motion.div variants={fadeUp} className={styles.scoringCard}>
            <div className={styles.scoringTable}>
              <div className={styles.scoringHeader}>
                <span>Question</span>
                <span>Points</span>
                <span>Difficulty</span>
                <span className={styles.hideOnMobile}>Problem Style</span>
              </div>
              {SCORING.map((row) => (
                <motion.div
                  key={row.q}
                  className={styles.scoringRow}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <span className={styles.scoringQ}>{row.q}</span>
                  <span className={styles.scoringPts}>+{row.pts}</span>
                  <span
                    className={styles.scoringDiff}
                    style={{ color: getDiffColor(row.diff) }}
                  >
                    {row.diff}
                  </span>
                  <span className={`${styles.scoringType} ${styles.hideOnMobile}`}>
                    {row.type}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className={styles.scoringTotal}>
              Total possible per match: <strong>2,800 points</strong>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Premium Section ──────────────────────────────────────────────────────────

const PLAN_FEATURES = [
  { label: "All module lessons", free: true },
  { label: "Module coding challenges", free: true },
  { label: "Completion badges", free: true },
  { label: "Ranked matches & Solo practice", free: true },
  { label: "Practice Bank (8+ bonus problems/module)", free: false },
  { label: "Full editorials + C++ & Python solutions", free: false },
  { label: "Post-module timed practice contests", free: false },
  { label: "Premium badge on leaderboard", free: false },
];

function PremiumSection() {
  const [billing, setBilling] = useState<"monthly" | "quarterly">("quarterly");
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const monthly = { price: "₹500", per: "per month" };
  const quarterly = { price: "₹1,200", per: "for 3 months" };
  const plan = billing === "monthly" ? monthly : quarterly;

  return (
    <section ref={ref} id="premium" className={styles.section}>
      <div className={styles.sectionInner}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.p variants={fadeUp} className={styles.eyebrow}>Premium</motion.p>
          <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
            Unlock your full<br />competitive potential
          </motion.h2>
          <motion.p variants={fadeUp} className={styles.sectionDesc}>
            Practice Bank, bonus problems, full editorials, and timed contests — everything you need to go from good to elite.
          </motion.p>

          {/* Billing toggle */}
          <motion.div variants={fadeUp} className={styles.billingToggle}>
            <button
              className={`${styles.billingBtn} ${billing === "monthly" ? styles.billingBtnActive : ""}`}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>
            <button
              className={`${styles.billingBtn} ${billing === "quarterly" ? styles.billingBtnActive : ""}`}
              onClick={() => setBilling("quarterly")}
            >
              Quarterly
              <span className={styles.saveBadge}>Save ₹300</span>
            </button>
          </motion.div>

          {/* Pricing cards */}
          <motion.div variants={fadeUp} className={styles.pricingGrid}>
            {/* Free */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingCardHead}>
                <h3 className={styles.planName}>Free</h3>
                <p className={styles.planSub}>Everything you need to get started</p>
              </div>
              <div className={styles.planPriceWrap}>
                <span className={styles.planPrice}>₹0</span>
                <span className={styles.planPer}>forever</span>
              </div>
              <Link href="/register" className={styles.planCta}>
                Get Started
              </Link>
              <ul className={styles.planFeatures}>
                {PLAN_FEATURES.filter(f => f.free).map(f => (
                  <li key={f.label} className={styles.planFeatureItem}>
                    <Check size={14} style={{ color: "#22D3EE", flexShrink: 0 }} />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <motion.div
              className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.pricingCardGlow} />
              <div className={styles.featuredBadge}>
                <Crown size={12} />
                Most Popular
              </div>
              <div className={styles.pricingCardHead}>
                <h3 className={styles.planName}>Premium</h3>
                <p className={styles.planSub}>For serious competitive programmers</p>
              </div>
              <div className={styles.planPriceWrap}>
                <span className={styles.planPrice}>{plan.price}</span>
                <span className={styles.planPer}>{plan.per}</span>
              </div>
              {billing === "quarterly" && (
                <div className={styles.planSavings}>Save ₹300 vs monthly</div>
              )}
              <Link href="/premium" className={styles.planCtaFeatured}>
                Get Premium
                <ArrowRight size={15} />
              </Link>
              <ul className={styles.planFeatures}>
                {PLAN_FEATURES.map(f => (
                  <li key={f.label} className={styles.planFeatureItem}>
                    <Check size={14} style={{ color: "#22D3EE", flexShrink: 0 }} />
                    {f.label}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Comparison table */}
          <motion.div variants={fadeUp} className={styles.comparisonWrap}>
            <h3 className={styles.comparisonTitle}>Full comparison</h3>
            <div className={styles.comparisonTable}>
              <div className={styles.comparisonHeader}>
                <span>Feature</span>
                <span style={{ textAlign: "center" }}>Free</span>
                <span style={{ textAlign: "center", color: "#22D3EE" }}>Premium</span>
              </div>
              {PLAN_FEATURES.map(f => (
                <motion.div
                  key={f.label}
                  className={styles.comparisonRow}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                >
                  <span className={styles.comparisonLabel}>{f.label}</span>
                  <span style={{ textAlign: "center" }}>
                    {f.free
                      ? <Check size={15} style={{ color: "#22D3EE" }} />
                      : <span style={{ color: "#3F3F46" }}>—</span>}
                  </span>
                  <span style={{ textAlign: "center" }}>
                    <Check size={15} style={{ color: "#22D3EE" }} />
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className={styles.ctaSection}>
      <div className={styles.ctaGlow} />
      <motion.div
        className={styles.ctaInner}
        variants={stagger}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <motion.div variants={fadeUp} className={styles.ctaBadge}>
          <Star size={12} />
          Ready to compete?
        </motion.div>
        <motion.h2 variants={fadeUp} className={styles.ctaTitle}>
          Ready to prove yourself?
        </motion.h2>
        <motion.p variants={fadeUp} className={styles.ctaDesc}>
          Join thousands of competitive programmers in the most intense 1v1 coding arena ever built.
        </motion.p>
        <motion.div variants={fadeUp} className={styles.ctaCtas}>
          <Link href="/register" className={styles.btnPrimary}>
            <Zap size={16} />
            Create Account &amp; Play
          </Link>
          <Link href="/learn" className={styles.btnSecondary}>
            Explore Learning Paths
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>☠</span>
          <span>Code<span style={{ color: "#22D3EE" }}>Mortem</span></span>
        </div>
        <p className={styles.footerCopy}>
          © {new Date().getFullYear()} CodeMortem. Built for competitive programmers.
        </p>
        <div className={styles.footerLinks}>
          <a href="/#features">Features</a>
          <a href="/#how-it-works">How it Works</a>
          <Link href="/premium">Premium</Link>
          <Link href="/login">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Background />
      <Navbar />
      <main className={styles.main}>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <ScoringSection />
        <PremiumSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
