"use client";

import { useState } from "react";
import type { BadgeDef } from "@/lib/badges";

interface BadgeCardProps {
  badge: BadgeDef;
  earned: boolean;
  earnedAt?: string; // ISO timestamp
  size?: "sm" | "md" | "lg";
  /** If true, shows an animated entrance (used on the course completion screen) */
  animate?: boolean;
}

/**
 * Hexagonal badge card.
 * Renders a clip-path hexagon with a glowing border, icon, name, and date.
 * Greyed-out when not yet earned.
 */
export default function BadgeCard({
  badge,
  earned,
  earnedAt,
  size = "md",
  animate = false,
}: BadgeCardProps) {
  const [hovered, setHovered] = useState(false);

  const dims = {
    sm: { hex: 72,  font: 28, nameSize: 11, subSize: 10 },
    md: { hex: 96,  font: 38, nameSize: 13, subSize: 11 },
    lg: { hex: 130, font: 52, nameSize: 16, subSize: 13 },
  }[size];

  const color = earned ? badge.accentColor : "rgba(255,255,255,0.15)";
  const textColor = earned ? badge.accentColor : "rgba(255,255,255,0.3)";

  // Hexagon shape via clip-path
  const hexStyle: React.CSSProperties = {
    width: dims.hex,
    height: dims.hex,
    clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
    background: earned
      ? `linear-gradient(135deg, ${badge.accentColor}22, ${badge.secondaryColor}15)`
      : "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: dims.font,
    position: "relative",
    transition: "transform 0.25s ease, filter 0.25s ease",
    transform: hovered && earned ? "scale(1.08)" : "scale(1)",
    filter: earned ? (hovered ? `drop-shadow(0 0 12px ${badge.accentColor}88)` : `drop-shadow(0 0 5px ${badge.accentColor}44)`) : "grayscale(1)",
  };

  // Outer ring (slightly larger hex used as a border)
  const ringStyle: React.CSSProperties = {
    width: dims.hex + 8,
    height: dims.hex + 8,
    clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
    background: earned
      ? `linear-gradient(135deg, ${badge.accentColor}, ${badge.secondaryColor})`
      : "rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
    transition: "filter 0.25s ease",
    filter: earned && hovered ? `drop-shadow(0 0 16px ${badge.accentColor}77)` : "none",
    animation: animate && earned ? "badgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both" : undefined,
  };

  const formattedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <>
      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(3deg); opacity: 1; }
          80%  { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes badgeGlow {
          0%, 100% { filter: drop-shadow(0 0 6px var(--glow)); }
          50%       { filter: drop-shadow(0 0 18px var(--glow)); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          cursor: earned ? "default" : "not-allowed",
          opacity: earned ? 1 : 0.55,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hex ring + inner hex */}
        <div style={ringStyle}>
          <div style={hexStyle}>
            <span style={{ lineHeight: 1, userSelect: "none" }}>{badge.icon}</span>
          </div>
        </div>

        {/* Badge name */}
        <div style={{ textAlign: "center", lineHeight: 1.3 }}>
          <div style={{
            fontSize: dims.nameSize,
            fontWeight: 800,
            color: textColor,
            letterSpacing: "0.3px",
          }}>
            {badge.name}
          </div>
          <div style={{
            fontSize: dims.subSize,
            fontWeight: 600,
            color: earned ? badge.accentColor + "bb" : "rgba(255,255,255,0.2)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginTop: 2,
          }}>
            {badge.subtitle}
          </div>
          {earned && formattedDate && (
            <div style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginTop: 3,
              fontVariantNumeric: "tabular-nums",
            }}>
              {formattedDate}
            </div>
          )}
          {!earned && (
            <div style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              marginTop: 3,
            }}>
              🔒 Locked
            </div>
          )}
        </div>
      </div>
    </>
  );
}
