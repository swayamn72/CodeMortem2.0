"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface NavbarProps {
  activeTab?: 'dashboard' | 'learn' | 'leaderboard' | 'premium' | 'settings';
  showFindMatch?: boolean;
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

export default function Navbar({ activeTab, showFindMatch = false }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLandingPage = pathname === "/";

  // Scroll detection for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isPremiumActive = user?.isPremium && (
    !user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
  );

  // Navbar style: floating glass on landing page, normal on inner pages
  const navStyle: React.CSSProperties = isLandingPage
    ? {
        position: "fixed",
        top: scrolled ? 12 : 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: scrolled ? "calc(100% - 48px)" : "calc(100% - 64px)",
        maxWidth: scrolled ? 1100 : 1000,
        background: scrolled
          ? "rgba(9, 9, 11, 0.85)"
          : "rgba(9, 9, 11, 0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: scrolled ? 14 : 16,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 100,
        transition: "all 0.3s cubic-bezier(0.21, 0.47, 0.32, 0.98)",
        boxShadow: scrolled
          ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04)"
          : "none",
      }
    : {};

  const navClassName = isLandingPage ? "" : "navbar";

  return (
    <nav className={navClassName} style={isLandingPage ? navStyle : {}}>
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 15,
          color: "#FFFFFF",
          letterSpacing: "-0.3px",
        }}
      >
        <span style={{ fontSize: 18 }}>☠</span>
        Code<span style={{ color: "#22D3EE" }}>Mortem</span>
      </Link>

      {/* Nav Links */}
      <ul
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {isAuthenticated ? (
          <>
            <NavLink href="/dashboard" active={activeTab === "dashboard"}>Dashboard</NavLink>
            <NavLink href="/learn" active={activeTab === "learn"}>Learn</NavLink>
            <NavLink href="/leaderboard" active={activeTab === "leaderboard"}>Leaderboard</NavLink>
          </>
        ) : (
          <>
            <NavLink href="/#features">Features</NavLink>
            <NavLink href="/#how-it-works">How It Works</NavLink>
            <NavLink href="/premium" active={activeTab === "premium"}>Premium</NavLink>
          </>
        )}
      </ul>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isAuthenticated && user ? (
          <>
            {showFindMatch && (
              <Link
                href="/match/queue"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #22D3EE, #0E9DBB)",
                  color: "#09090B",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                ⚡ Find Match
              </Link>
            )}

            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.18s",
                }}
                className="navbar-user-btn"
              >
                {isPremiumActive && <span style={{ color: "#ffd700" }}>👑</span>}
                <span style={{ color: getRankColor(user.rating) }}>
                  {user.username}
                </span>
                <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>▼</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 176,
                  background: "#111114",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  padding: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  zIndex: 1000,
                }}>
                  <DropdownItem href={`/profile/${user.username}`} onClick={() => setDropdownOpen(false)}>
                    👤 Profile
                  </DropdownItem>
                  <DropdownItem href="/settings" onClick={() => setDropdownOpen(false)}>
                    ⚙️ Settings
                  </DropdownItem>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    style={{
                      textAlign: "left",
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 8,
                      color: "#FF5F57",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "background 0.15s",
                    }}
                    className="dropdown-item"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              style={{
                padding: "7px 16px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#A1A1AA",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                transition: "all 0.18s",
              }}
              className="nav-signin-btn"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              style={{
                padding: "7px 16px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #22D3EE, #0E9DBB)",
                color: "#09090B",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(34,211,238,0.25)",
                transition: "all 0.18s",
              }}
              className="nav-join-btn"
            >
              Join Now
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ href, children, active }: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        style={{
          display: "block",
          padding: "6px 14px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          color: active ? "#FFFFFF" : "#71717A",
          textDecoration: "none",
          background: active ? "rgba(255,255,255,0.07)" : "transparent",
          transition: "all 0.15s",
        }}
        className="nav-link-item"
      >
        {children}
      </Link>
    </li>
  );
}

function DropdownItem({ href, children, onClick }: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "8px 12px",
        borderRadius: 8,
        color: "#A1A1AA",
        fontSize: 13,
        textDecoration: "none",
        transition: "background 0.15s",
      }}
      className="dropdown-item"
    >
      {children}
    </Link>
  );
}
