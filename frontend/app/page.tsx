"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

// ─── Review data ──────────────────────────────────────────────────────────────

const REVIEWS = [
  { name: "Aditya Raj",  handle: "@aditya_raj",   rating: 1847, color: "#818cf8", text: "Went from 1300 to 1700 in 3 weeks. The 1v1 pressure is unlike any other practice method." },
  { name: "Saumya K.",   handle: "@saumya_k",     rating: 1623, color: "#22d3ee", text: "HLD finally clicked after 2 sessions. The interactive visualizers are genuinely helpful." },
  { name: "Priya D.",    handle: "@priyanka_d",   rating: 1941, color: "#a78bfa", text: "My CF rating jumped from Expert to CM after 1 month on CodeMortem. The 1v1 format works." },
  { name: "Harsh V.",    handle: "@harsh_v",      rating: 1582, color: "#34d399", text: "1v1s made my actual Codeforces rounds feel manageable. Q3 solves improved massively." },
  { name: "Rohan M.",    handle: "@rohan_m",      rating: 2103, color: "#fb923c", text: "Judge0 execution is blazing fast. No more TLE surprises from a slow online judge." },
  { name: "Ishaan P.",   handle: "@ishaan_p",     rating: 1389, color: "#f472b6", text: "Perfect for a student training for ICPC. The structured learning modules are gold." },
  { name: "Nisha R.",    handle: "@nisha_r",      rating: 1765, color: "#22d3ee", text: "Competing against real people at my level is so much better than isolated LeetCode grind." },
  { name: "Dev S.",      handle: "@dev_s",        rating: 1503, color: "#818cf8", text: "The rating system actually maps to Codeforces. First platform that feels honest." },
  { name: "Arjun B.",    handle: "@arjun_b",      rating: 2248, color: "#fb923c", text: "Segment tree module is the best resource I've seen anywhere. Finished it in 2 days." },
  { name: "Sneha T.",    handle: "@sneha_t",      rating: 1677, color: "#a78bfa", text: "Post-match editorials are what set CodeMortem apart. I learn more from losses." },
  { name: "Karan G.",    handle: "@karan_g",      rating: 1432, color: "#34d399", text: "Finally a platform that treats competitive programming like a sport, not homework." },
  { name: "Meera J.",    handle: "@meera_j",      rating: 1910, color: "#f472b6", text: "Codeforces integration is seamless. My ratings on both platforms now correlate." },
];

function ReviewCard({ name, handle, rating, color, text }: typeof REVIEWS[0]) {
  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className={styles.reviewAvatar} style={{ background: color }}>{name[0]}</div>
        <div>
          <div className={styles.reviewName}>{name}</div>
          <div className={styles.reviewHandle}>{handle}</div>
        </div>
        <div className={styles.reviewRating} style={{ color }}>{rating} ★</div>
      </div>
      <p className={styles.reviewText}>{text}</p>
    </div>
  );
}

const ROW_CFG = [
  { dur: 20, rev: true },
  { dur: 30, rev: false },
  { dur: 20, rev: true },
  { dur: 30, rev: false },
  { dur: 30, rev: false },
];

function getRow(i: number) {
  const all = [...REVIEWS, ...REVIEWS, ...REVIEWS];
  return all.slice(i * 2, i * 2 + 8);
}

// ─── Border Beam ──────────────────────────────────────────────────────────────

function BorderBeam() {
  return (
    <div className={styles.beamTrack}>
      <div className={styles.beamTraveler} />
    </div>
  );
}

// ─── Arena hero mockup (replaces hero-dark.png) ───────────────────────────────

function ArenaMockup() {
  const code = [
    { n: 1,  t: "#include <bits/stdc++.h>",          c: "#22d3ee" },
    { n: 2,  t: "using namespace std;",               c: "#818cf8" },
    { n: 3,  t: "",                                    c: "" },
    { n: 4,  t: "int main() {",                       c: "#f8fafc" },
    { n: 5,  t: "  ios::sync_with_stdio(0);",         c: "#94a3b8" },
    { n: 6,  t: "  cin.tie(0);",                      c: "#94a3b8" },
    { n: 7,  t: "",                                    c: "" },
    { n: 8,  t: "  int n, k;",                        c: "#f8fafc" },
    { n: 9,  t: "  cin >> n >> k;",                   c: "#f8fafc" },
    { n: 10, t: "  vector<int> a(n);",                c: "#f8fafc" },
    { n: 11, t: "  for (auto& x : a) cin >> x;",      c: "#e879f9" },
    { n: 12, t: "",                                    c: "" },
    { n: 13, t: "  sort(a.begin(), a.end());",         c: "#f8fafc" },
    { n: 14, t: "  long long ans = 0;",               c: "#f8fafc" },
    { n: 15, t: "  for (int i = 0; i < k; i++)",      c: "#e879f9" },
    { n: 16, t: "    ans += a[i];",                   c: "#f8fafc" },
    { n: 17, t: "  cout << ans << '\\n';",            c: "#22d3ee" },
    { n: 18, t: "  return 0;",                        c: "#94a3b8" },
    { n: 19, t: "}",                                  c: "#f8fafc" },
  ];

  return (
    <div className={styles.arena}>
      {/* Score bar */}
      <div className={styles.arenaBar}>
        <div className={styles.arenaPlayer}>
          <span className={styles.dot} style={{ background: "#22d3ee" }} />
          <span style={{ color: "#22d3ee", fontWeight: 700, fontSize: 13 }}>swayam_v</span>
          <span style={{ color: "#fff", fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>320</span>
        </div>
        <div className={styles.arenaTimer}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>18:42</span>
        </div>
        <div className={styles.arenaPlayer} style={{ flexDirection: "row-reverse" }}>
          <span className={styles.dot} style={{ background: "#fb923c" }} />
          <span style={{ color: "#fb923c", fontWeight: 700, fontSize: 13 }}>tourist</span>
          <span style={{ color: "#fff", fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>180</span>
        </div>
      </div>

      {/* Layout: sidebar | editor | right */}
      <div className={styles.arenaLayout}>
        {/* Sidebar */}
        <div className={styles.arenaSide}>
          <div className={styles.sideTitle}>Problems</div>
          {[{n:1,p:100,s:true},{n:2,p:200,a:true},{n:3,p:300},{n:4,p:400},{n:5,p:500},{n:6,p:600},{n:7,p:700}].map(q => (
            <div key={q.n} className={`${styles.qItem} ${q.a ? styles.qActive : ""}`}>
              <span style={{ fontSize: 11, fontWeight: 700, color: q.s ? "#22d3ee" : q.a ? "#fff" : "#52525b" }}>Q{q.n}</span>
              <span style={{ fontSize: 10, color: q.a ? "#22d3ee" : "#3f3f46", marginLeft: "auto" }}>+{q.p}</span>
              {q.s && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className={styles.editorPane}>
          <div className={styles.editorBar}>
            <div className={styles.editorTab}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              solution.cpp
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={styles.runBtn}>▶ Run</button>
              <button className={styles.submitBtn}>Submit</button>
            </div>
          </div>
          <div className={styles.editorCode}>
            {code.map(l => (
              <div key={l.n} className={styles.codeLine}>
                <span className={styles.lineNum}>{l.n}</span>
                <span style={{ color: l.c || "transparent", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre" }}>{l.t || "\u00A0"}</span>
              </div>
            ))}
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>20</span>
              <span className={styles.cursor} />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className={styles.arenaRight}>
          <div>
            <div className={styles.matchLabel}>OPPONENT</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fb923c" }}>tourist</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#ff5f57", letterSpacing: -1 }}>2847</div>
            <div style={{ fontSize: 10, color: "#52525b", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>Q1 solved
            </div>
          </div>
          <div className={styles.matchDiv} />
          <div>
            <div className={styles.matchLabel}>YOU</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#22d3ee" }}>swayam_v</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#22d3ee", letterSpacing: -1 }}>1847</div>
            <div style={{ fontSize: 10, color: "#52525b", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>Q1 solved
            </div>
          </div>
          <div className={styles.matchDiv} />
          <div>
            <div className={styles.matchLabel}>VERDICT</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee" }}>✓ Accepted</div>
            <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>0ms · 4KB</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Arrow SVG ────────────────────────────────────────────────────────────────

function ArrowRight({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className={styles.checkIcon}>
      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="hero" className={styles.hero}>
      {/* Shimmer badge — exact Magic UI */}
      <div className={styles.badge} style={{ "--delay": "0ms" } as React.CSSProperties}>
        <p className={styles.shimmer} style={{ "--shimmer-width": "100px" } as React.CSSProperties}>
          <span>✨ Introducing Live 1v1 Coding Battles</span>
          <span className={styles.badgeArrowWrap}><ArrowRight size={12} /></span>
        </p>
      </div>

      {/* H1 — font-medium, tracking-tighter, leading-none, gradient */}
      <h1 className={styles.heroH1} style={{ "--delay": "200ms" } as React.CSSProperties}>
        CodeMortem is the new way<br className={styles.mdShow} />
        {" "}to compete and learn.
      </h1>

      {/* Subtitle — text-gray-400, tracking-tight */}
      <p className={styles.heroP} style={{ "--delay": "400ms" } as React.CSSProperties}>
        Real-time 1v1 algorithmic battles and interactive learning paths built with<br className={styles.mdShow} />
        {" "}speed, precision, and developer-first design.
      </p>

      {/* CTA — bg-primary with shine effect */}
      <Link href="/register" className={`${styles.heroBtn} ${styles.btnGroup}`} style={{ "--delay": "600ms" } as React.CSSProperties}>
        <span className={styles.btnShine} />
        <span>Start Competing </span>
        <ArrowRight size={16} />
      </Link>

      {/* Hero product image — [perspective:2000px] wrapper */}
      <div className={styles.heroImgWrap} style={{ "--delay": "400ms" } as React.CSSProperties}>
        <div className={styles.heroImgInner}>
          <BorderBeam />
          <ArenaMockup />
        </div>
      </div>
    </section>
  );
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { name: "Codeforces", c: "#ef4444" },
  { name: "LeetCode",   c: "#f97316" },
  { name: "AtCoder",    c: "#94a3b8" },
  { name: "USACO",      c: "#22d3ee" },
  { name: "ICPC",       c: "#a78bfa" },
];

function Clients() {
  return (
    <section id="clients" className={styles.clients}>
      <div style={{ padding: "56px 0" }}>
        <div className={styles.clientsInner}>
          <h2 className={styles.clientsH2}>TRUSTED BY COMPETITIVE PROGRAMMERS TRAINING FOR</h2>
          <div style={{ marginTop: 24 }}>
            <ul className={styles.platformList}>
              {PLATFORMS.map(p => (
                <li key={p.name}>
                  <span className={styles.platformLogo} style={{ color: p.c }}>{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Radial divider ───────────────────────────────────────────────────────────

function RadialDivider() {
  return <div className={styles.radial} aria-hidden="true" />;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const FREE_FEATURES  = ["All module lessons","Module coding challenges","Completion badges","Ranked 1v1 matches","Solo practice mode","Global leaderboard access"];
const PREM_FEATURES  = ["Everything in Free","Practice Bank (8+ bonus problems/module)","Full editorials + C++ & Python solutions","Post-module timed practice contests","Premium badge on leaderboard","Priority judge execution"];

function Pricing() {
  const [quarterly, setQuarterly] = useState(true);

  return (
    <section id="pricing">
      <div className={styles.pricingWrap}>
        <div className={styles.pricingHead}>
          <h4 className={styles.pH4}>Pricing</h4>
          <h2 className={styles.pH2}>Simple pricing for everyone.</h2>
          <p className={styles.pP}>Choose an <strong>affordable plan</strong> that&apos;s packed with the best features for mastering DSA, competing in real-time, and tracking your progression.</p>
        </div>

        {/* Toggle switch — exact Magic UI */}
        <div className={styles.toggleRow}>
          <button
            role="switch"
            aria-checked={quarterly}
            onClick={() => setQuarterly(!quarterly)}
            className={`${styles.toggle} ${quarterly ? styles.toggleOn : ""}`}
          >
            <span className={`${styles.thumb} ${quarterly ? styles.thumbOn : ""}`} />
          </button>
          <span>Quarterly</span>
          <span className={styles.savePill}>2 MONTHS FREE ✨</span>
        </div>

        {/* Cards */}
        <div className={styles.planGrid}>
          {/* Free */}
          <div className={styles.planCard}>
            <div className={styles.planHead}><div style={{ marginLeft: 16 }}>
              <h2 className={styles.planName}>Free</h2>
              <p className={styles.planDesc}>Everything you need to get started competing</p>
            </div></div>
            <div className={styles.priceRow}>
              <span className={styles.price}>₹0</span>
              <span className={styles.pricePer}> / forever</span>
            </div>
            <Link href="/register" className={`${styles.planBtn} ${styles.btnGroup}`}>
              <span className={styles.btnShine} />
              <p>Get Started</p>
            </Link>
            <hr className={styles.planHr} />
            <ul className={styles.featureList}>
              {FREE_FEATURES.map(f => <li key={f} className={styles.featureItem}><CheckIcon /><span>{f}</span></li>)}
            </ul>
          </div>

          {/* Premium — featured with color-one border */}
          <div className={`${styles.planCard} ${styles.planFeatured}`}>
            <div className={styles.planHead}><div style={{ marginLeft: 16 }}>
              <h2 className={styles.planName}>Premium</h2>
              <p className={styles.planDesc}>For serious competitive programmers who want more</p>
            </div></div>
            <div className={styles.priceRow}>
              <span className={styles.price}>{quarterly ? "₹1,200" : "₹500"}</span>
              <span className={styles.pricePer}>{quarterly ? " / 3 months" : " / month"}</span>
            </div>
            <Link href="/premium" className={`${styles.planBtn} ${styles.btnGroup}`}>
              <span className={styles.btnShine} />
              <p>Subscribe</p>
            </Link>
            <hr className={styles.planHr} />
            <ul className={styles.featureList}>
              {PREM_FEATURES.map(f => <li key={f} className={styles.featureItem}><CheckIcon /><span>{f}</span></li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA (review marquee) ─────────────────────────────────────────────────────

function CTA() {
  return (
    <section id="cta">
      <div style={{ padding: "56px 0" }}>
        <div className={styles.ctaOuter}>
          <div className={styles.ctaMarquee}>
            {ROW_CFG.map((cfg, i) => (
              <div key={i} className={styles.marqueeRow}>
                <div
                  className={styles.marqueeTrack}
                  style={{
                    animationDuration: `${cfg.dur}s`,
                    animationDirection: cfg.rev ? "reverse" : "normal",
                  }}
                >
                  {[...getRow(i), ...getRow(i)].map((r, j) => (
                    <ReviewCard key={`${i}-${j}`} {...r} />
                  ))}
                </div>
              </div>
            ))}

            {/* Center overlay */}
            <div className={styles.ctaCenter}>
              <div className={styles.ctaIconBox}>
                <Image src="/assets/logo.png" alt="CodeMortem" width={64} height={64} className={styles.ctaLogo} />
              </div>
              <div className={styles.ctaText}>
                <h1 className={styles.ctaH1}>Stop solving problems alone.</h1>
                <p className={styles.ctaSubP}>Find your first match in under 60 seconds. No credit card required.</p>
                <Link href="/register" className={styles.ctaBtn}>
                  Get Started
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>
              <div className={styles.ctaBgBlur} />
            </div>

            {/* Bottom fade-to-bg */}
            <div className={styles.ctaFade} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER = {
  Product:   [{ l: "Features", h: "/#features" }, { l: "Pricing", h: "/#pricing" }, { l: "Leaderboard", h: "/leaderboard" }],
  Community: [{ l: "Discord", h: "#" }, { l: "Twitter", h: "#" }, { l: "GitHub", h: "#" }],
  Legal:     [{ l: "Terms", h: "/terms" }, { l: "Privacy", h: "/privacy" }],
};

function Footer() {
  return (
    <footer>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <Image src="/assets/logo.png" alt="CodeMortem" width={48} height={32} className={styles.footerLogoImg} />
              <span className={styles.footerLogoText}>CodeMortem</span>
            </Link>
            <p className={styles.footerTagline}>Elite competitive programming. Built for developers.</p>
          </div>
          <div className={styles.footerGrid}>
            {Object.entries(FOOTER).map(([col, links]) => (
              <div key={col}>
                <h2 className={styles.footerColHead}>{col}</h2>
                <ul className={styles.footerColLinks}>
                  {links.map(lk => (
                    <li key={lk.l}><Link href={lk.h} className={styles.footerLink}>{lk.l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>© {new Date().getFullYear()} CodeMortem. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <HeroSection />
        <Clients />
        <RadialDivider />
        <Pricing />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
