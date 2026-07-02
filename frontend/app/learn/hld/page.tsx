"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
import HLDPath from "@/components/HLDPath";
import PrerequisitesScreen from "@/components/learn/PrerequisitesScreen";

export default function LearnHLDPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPrereqs, setShowPrereqs] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("hld_prereqs_cleared") === "true") {
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
    localStorage.setItem("hld_prereqs_cleared", "true");
    setShowPrereqs(false);
  };

  const prereqItems = [
    {
      title: "Basic Graph Theory",
      description: 'You need to know what a "tree" is. And no, not the green things outside—we haven\'t seen those in months. Know your DFS from your BFS, and remember that a tree has exactly N-1 edges and zero cycles.'
    },
    {
      title: "Segment Trees",
      description: "You must be able to write one without crying. We are going to take a perfectly good SegTree and forcefully graft it onto a tree graph."
    },
    {
      title: "Lowest Common Ancestor (LCA)",
      description: "You should understand the concept of an LCA. It's basically determining exactly where two paths intersect so you know whose fault it is when the path query fails."
    },
    {
      title: "Mental Fortitude",
      description: "The ability to lose your sanity and manually trace the routing algorithm in your brain a hundred times. (Just kidding, it's a thousand times). Your napkin drawings will eventually look like the scribbles of a madman solving a conspiracy theory."
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
            title="Prerequisites: Before You Enter the Matrix"
            subtitle="To survive this masterclass, check your inventory:"
            items={prereqItems}
            onContinue={handlePrereqsContinue}
          />
        ) : (
          <HLDPath />
        )}
      </main>
    </>
  );
}
