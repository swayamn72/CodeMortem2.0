"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import SegmentTreePath from "@/components/SegmentTreePath";

export default function LearnSegmentTreePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  function getRankColor(rating: number): string {
    if (rating < 1200) return "#808080";
    if (rating < 1400) return "#00c853";
    if (rating < 1600) return "#03a89e";
    if (rating < 1900) return "#2979ff";
    if (rating < 2100) return "#aa00e6";
    if (rating < 2400) return "#ff8c00";
    return "#ff1744";
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <span className="logo-icon">☠</span>
          Code<span className="brand-accent">Mortem</span>
        </Link>
        <ul className="navbar-nav">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/learn" className="active">Learn</Link></li>
          <li><Link href="/leaderboard">Leaderboard</Link></li>
          <li><Link href={`/profile/${user.username}`}>Profile</Link></li>
        </ul>
        <div className="navbar-actions">
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", marginRight: "8px" }}>
            <span style={{ color: getRankColor(user.rating), fontWeight: 600 }}>{user.username}</span>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ height: "100vh", paddingTop: "64px", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>
        <SegmentTreePath />
      </main>
    </>
  );
}
