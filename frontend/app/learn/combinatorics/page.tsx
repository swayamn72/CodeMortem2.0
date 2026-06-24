"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
import CombinatoricsPath from "@/components/CombinatoricsPath";

export default function LearnCombinatoricsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !isAuthenticated) router.push("/login");
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-primary)" }}>
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  return (
    <>
      <Navbar activeTab="learn" />
      <main style={{ height: "100vh", paddingTop: "64px", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>
        <CombinatoricsPath />
      </main>
    </>
  );
}
