"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

// Particle component for background effect — rendered only on client to avoid hydration mismatch
function Particles() {
  const [mounted, setMounted] = useState(false);
  const particles = useMemo(() => {
    // Use deterministic seed-like values to avoid SSR mismatch
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${((i * 37 + 13) % 100)}%`,
      duration: `${8 + (i * 3) % 12}s`,
      delay: `${(i * 7) % 10}s`,
      size: `${1 + (i % 3)}px`,
    }));
  }, []);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="particles" />;

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// Animated counter
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Typewriter effect
function Typewriter({ texts }: { texts: string[] }) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    const timeout = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex, texts]);

  return (
    <span className={styles.typewriterText}>
      {texts[textIndex].substring(0, charIndex)}
      <span className={styles.cursor}>|</span>
    </span>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <Particles />
        <div className="hero-content">
          <p className="hero-subtitle">⚔️ 1v1 Combat & Interactive Learning Paths</p>
          <h1 className="hero-title">
            <span className="highlight">Code</span> or be{" "}
            <span className="highlight">Coded.</span>
          </h1>
          <p className="hero-description">
            Climb the leaderboard in fast-paced 1v1 algorithmic matches, or master advanced computer science topics through interactive learning modules, custom sandbox playgrounds, and Practice Banks.
          </p>

          <div className={styles.terminalPreview}>
            <div className={styles.terminalHeader}>
              <span className={styles.dot} style={{ background: "#ff5f57" }} />
              <span className={styles.dot} style={{ background: "#ffbd2e" }} />
              <span className={styles.dot} style={{ background: "#28c840" }} />
              <span className={styles.terminalTitle}>codemortem.gg</span>
            </div>
            <div className={styles.terminalBody}>
              <span style={{ color: "#888" }}>$</span>{" "}
              <Typewriter
                texts={[
                  'codemortem --find-match',
                  'Matched: tourist vs rng_58',
                  'Solving Q3... Accepted! +300pts',
                  'Victory! Rating: 1800 → 1847 (+47)',
                ]}
              />
            </div>
          </div>

          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-lg btn-pulse">
              ⚡ Find a Match
            </Link>
            <Link href="/learn" className="btn btn-secondary btn-lg">
              📖 Start Learning →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <h2 className="section-title">Master Competitive Programming</h2>
        <p className="section-subtitle">
          Perfect your skills with real-time duels and hands-on conceptual learning paths
        </p>

        <div className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Rating-Based Matchmaking</h3>
            <p>
              Matchmaking system matches you with equally skilled opponents.
              Link your Codeforces account for instant calibration.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">📖</div>
            <h3>Curated Learning Modules</h3>
            <p>
              Master key computer science and algorithmic topics. Learn from scratch
              with interactive visualizers, sandbox tools, and unlockable Practice Banks.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">🏟️</div>
            <h3>Real-Time Arena</h3>
            <p>
              Split-screen editor. See when your opponent solves a question.
              Every second counts.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>30-Minute Matches</h3>
            <p>
              7 problems, 30 minutes, points from 100 to 700. First to solve
              gets the points. Speed + skill = victory.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">📊</div>
            <h3>Rating & Rankings</h3>
            <p>
              Track your progress with detailed rating history, match analytics,
              and global leaderboards. Rise from Newbie to Legendary Grandmaster.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Codeforces Integration</h3>
            <p>
              Link your CF handle for instant rating calibration. Your existing
              competitive programming experience carries over.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" id="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">From queue to victory in 4 steps</p>

        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Join the Queue</h3>
              <p>
                Click "Find Match" and our matchmaking engine searches for an
                opponent within your rating range.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Face Your Opponent</h3>
              <p>
                7 problems appear simultaneously for both players. Sorted by
                difficulty (100→700 pts). The clock starts — you have 30 minutes.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Code & Submit</h3>
              <p>
                Write your solution in the code editor. Hit Run to test with custom
                input. Hit Submit to judge against hidden test cases. First accepted
                solution wins the points.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Collect Your Rating</h3>
              <p>
                After 30 minutes (or when all problems are solved), rating deltas
                are calculated. Win, and watch your rating soar. Review your
                opponent&apos;s solutions to learn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Breakdown */}
      <section className="section">
        <h2 className="section-title">Scoring System</h2>
        <p className="section-subtitle">
          Every question rewards speed and skill
        </p>

        <div className={styles.scoringTable}>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Points</th>
                <th>Difficulty</th>
                <th>Style</th>
              </tr>
            </thead>
            <tbody>
              {[
                { q: "Q1", pts: 100, diff: "Warm-up", style: "Implementation" },
                { q: "Q2", pts: 200, diff: "Easy", style: "Greedy / Math" },
                { q: "Q3", pts: 300, diff: "Easy-Med", style: "Sorting / Two Pointers" },
                { q: "Q4", pts: 400, diff: "Medium", style: "Binary Search / BFS" },
                { q: "Q5", pts: 500, diff: "Med-Hard", style: "DP / Graphs" },
                { q: "Q6", pts: 600, diff: "Hard", style: "Advanced DP / Segment Trees" },
                { q: "Q7", pts: 700, diff: "Expert", style: "Combinatorics / Flows" },
              ].map((row) => (
                <tr key={row.q}>
                  <td>
                    <span className={styles.qLabel}>{row.q}</span>
                  </td>
                  <td>
                    <span className={styles.ptsValue}>+{row.pts}</span>
                  </td>
                  <td>{row.diff}</td>
                  <td style={{ color: "var(--text-muted)" }}>{row.style}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.totalLine}>
            Total: <strong>2,800</strong> possible points per match
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Ready to prove yourself?</h2>
          <p>
            Join thousands of competitive programmers in the most intense 1v1
            coding arena ever built.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg btn-pulse">
            ⚡ Create Account & Play
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} CodeMortem. Built with 💀 for competitive programmers.
        </p>
      </footer>
    </>
  );
}
