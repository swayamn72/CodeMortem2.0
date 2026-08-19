"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
import SOSDPPath from "@/components/SOSDPPath";
import PrerequisitesScreen from "@/components/learn/PrerequisitesScreen";

export default function LearnSOSDPPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPrereqs, setShowPrereqs] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("sosdp_prereqs_cleared") === "true") {
      setShowPrereqs(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.push("/login");
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "var(--bg-primary)",
        }}
      >
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  const handlePrereqsContinue = () => {
    localStorage.setItem("sosdp_prereqs_cleared", "true");
    setShowPrereqs(false);
  };

  const prereqItems = [
    {
      title: "Bitmasking (&, |, ^, <<)",
      description: "You need to read binary like Neo. When you see 11, you shouldn't think \"eleven\" — you should think \"elements 0, 1, and 3.\""
    },
    {
      title: "Prefix Sums",
      description: <>SOS DP is essentially an <em>N</em>-dimensional prefix sum. Think of it as a standard 1D array that drank way too much caffeine and expanded across dimensions.</>
    },
    {
      title: "Big O Survival Instincts",
      description: <>You should instinctively know that doing 3<sup>22</sup> operations is a one-way ticket to a Time Limit Exceeded (TLE) verdict. If you don't fear large exponents yet, you will soon.</>
    }
  ];

  return (
    <>
      <Navbar activeTab="learn" />
      <main
        style={{
          height: "100vh",
          paddingTop: "64px",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
          overflow: "hidden",
        }}
      >
        {showPrereqs ? (
          <PrerequisitesScreen
            title="Prerequisites: Sum Over Subsets DP"
            subtitle="To survive SOS DP, make sure you pack these essentials:"
            items={prereqItems}
            onContinue={handlePrereqsContinue}
          />
        ) : (
          <SOSDPPath />
        )}
      </main>
    </>
  );
}
