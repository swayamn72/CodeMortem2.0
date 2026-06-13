"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <span className="logo-icon">☠</span>
        Code<span className="brand-accent">Mortem</span>
      </Link>

      <ul className="navbar-nav">
        {isAuthenticated ? (
          <>
            <li>
              <Link href="/dashboard" className={activeTab === 'dashboard' ? 'active' : ''}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/learn" className={activeTab === 'learn' ? 'active' : ''}>
                Learn
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className={activeTab === 'leaderboard' ? 'active' : ''}>
                Leaderboard
              </Link>
            </li>
          </>
        ) : (
          <>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#how-it-works">How It Works</a></li>
            <li>
              <Link href="/premium" className={activeTab === 'premium' ? 'active' : ''}>
                Premium
              </Link>
            </li>
          </>
        )}
      </ul>

      <div className="navbar-actions">
        {isAuthenticated && user ? (
          <>
            {showFindMatch && (
              <Link href="/match/queue" className="btn btn-primary btn-sm" style={{ marginRight: 8 }}>
                ⚡ Find Match
              </Link>
            )}

            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--font-size-sm)",
                  transition: "background 0.2s",
                }}
                className="navbar-user-btn"
              >
                {isPremiumActive && <span style={{ color: "#ffd700" }}>👑</span>}
                <span style={{ color: getRankColor(user.rating), fontWeight: 600 }}>
                  {user.username}
                </span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  width: 170,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  zIndex: 1000,
                }}>
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      display: "block",
                      transition: "all 0.2s",
                    }}
                    className="dropdown-item"
                  >
                    👤 Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      display: "block",
                      transition: "all 0.2s",
                    }}
                    className="dropdown-item"
                  >
                    ⚙️ Settings
                  </Link>
                  <div style={{ height: 1, background: "var(--border-primary)", margin: "4px 0" }} />
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    style={{
                      textAlign: "left",
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--cm-red)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "all 0.2s",
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
            <Link href="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Join Now
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
