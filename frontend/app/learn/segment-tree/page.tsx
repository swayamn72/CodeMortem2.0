"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
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
      <Navbar activeTab="learn" />

      {/* Main Container */}
      <main style={{ height: "100vh", paddingTop: "64px", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>
        <SegmentTreePath />
      </main>
    </>
  );
}
