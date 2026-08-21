"use client";

// ─────────────────────────────────────────────────────────
//  LiquidGlassButton — Glassmorphic button with SVG noise
//  distortion filter and pointer-following glow trails.
//  Pure CSS + inline styles — no Tailwind required.
// ─────────────────────────────────────────────────────────

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── Types ── */
interface Circle {
  id: number;
  x: number;
  y: number;
  color: string;
  fadeState: "in" | "out" | null;
}

type ButtonSize = "sm" | "md" | "lg" | "xl" | "full";

interface LiquidGlassButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** Size preset */
  size?: ButtonSize;
  /** Custom gradient start color for pointer glow */
  glowStart?: string;
  /** Custom gradient end color for pointer glow */
  glowEnd?: string;
  /** Entrance animation delay (CSS animation-delay) */
  animationDelay?: string;
}

/* ── Size presets ── */
const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "7px 18px", fontSize: 13, borderRadius: 10 },
  md: { padding: "10px 24px", fontSize: 14, borderRadius: 12 },
  lg: { padding: "14px 36px", fontSize: 15, borderRadius: 999 },
  xl: { padding: "16px 44px", fontSize: 16, borderRadius: 999 },
  full: { padding: "10px 24px", fontSize: 18, borderRadius: 8, width: "100%" },
};

/* ── SVG Glass Filter (rendered once, hidden) ── */
function GlassFilter() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <defs>
        <filter
          id="liquid-glass-filter"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur
            in="turbulence"
            stdDeviation="2"
            result="blurredNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur
            in="displaced"
            stdDeviation="4"
            result="finalBlur"
          />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

/* ── Main Component ── */
export function LiquidGlassButton({
  children,
  href,
  onClick,
  className = "",
  disabled = false,
  style,
  size = "lg",
  glowStart = "#a0d9f8",
  glowEnd = "#3a5bbf",
  animationDelay,
}: LiquidGlassButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isListening, setIsListening] = useState(false);
  const lastAddedRef = useRef(0);

  /* ── Pointer tracking ── */
  const createCircle = useCallback(
    (x: number, y: number) => {
      const w = containerRef.current?.offsetWidth || 1;
      const xPos = x / w;
      const color = `linear-gradient(to right, ${glowStart} ${xPos * 100}%, ${glowEnd} ${xPos * 100}%)`;
      setCircles((prev) => [
        ...prev,
        { id: Date.now(), x, y, color, fadeState: null },
      ]);
    },
    [glowStart, glowEnd]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isListening) return;
      const now = Date.now();
      if (now - lastAddedRef.current > 100) {
        lastAddedRef.current = now;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        createCircle(e.clientX - rect.left, e.clientY - rect.top);
      }
    },
    [isListening, createCircle]
  );

  /* ── Circle lifecycle ── */
  useEffect(() => {
    circles.forEach((c) => {
      if (!c.fadeState) {
        setTimeout(() => {
          setCircles((prev) =>
            prev.map((p) => (p.id === c.id ? { ...p, fadeState: "in" } : p))
          );
        }, 0);
        setTimeout(() => {
          setCircles((prev) =>
            prev.map((p) => (p.id === c.id ? { ...p, fadeState: "out" } : p))
          );
        }, 1000);
        setTimeout(() => {
          setCircles((prev) => prev.filter((p) => p.id !== c.id));
        }, 2200);
      }
    });
  }, [circles]);

  /* ── Shared inner markup ── */
  const inner = (
    <>
      {/* Glass distortion backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          borderRadius: "inherit",
          overflow: "hidden",
          backdropFilter: 'url("#liquid-glass-filter")',
          WebkitBackdropFilter: 'url("#liquid-glass-filter")',
        }}
      />

      {/* Inner shadow / edge highlights */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          borderRadius: "inherit",
          pointerEvents: "none",
          boxShadow: [
            "0 0 6px rgba(0,0,0,0.03)",
            "0 2px 6px rgba(0,0,0,0.08)",
            "inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.09)",
            "inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.85)",
            "inset 1px 1px 1px -0.5px rgba(255,255,255,0.6)",
            "inset -1px -1px 1px -0.5px rgba(255,255,255,0.6)",
            "inset 0 0 6px 6px rgba(255,255,255,0.12)",
            "inset 0 0 2px 2px rgba(255,255,255,0.06)",
            "0 0 12px rgba(0,0,0,0.15)",
          ].join(", "),
        }}
      />

      {/* Pointer-following glow circles */}
      {circles.map(({ id, x, y, color, fadeState }) => (
        <div
          key={id}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            left: x,
            top: y,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: color,
            filter: "blur(16px)",
            pointerEvents: "none",
            zIndex: 2,
            opacity:
              fadeState === "in" ? 0.75 : fadeState === "out" ? 0 : 0,
            transition:
              fadeState === "out"
                ? "opacity 1.2s ease"
                : "opacity 0.3s ease",
          }}
        />
      ))}

      {/* Content */}
      <span style={{ position: "relative", zIndex: 3, display: "inline-flex", alignItems: "center", gap: 6 }}>{children}</span>

      <GlassFilter />
    </>
  );

  /* ── Shared styles ── */
  const sizePreset = SIZE_STYLES[size];
  const baseStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    color: "#fff",
    fontFamily: "'Inter', 'Syne', sans-serif",
    fontWeight: 600,
    letterSpacing: "0.3px",
    lineHeight: 1.4,
    background: "rgba(43, 55, 80, 0.10)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    overflow: "hidden",
    textDecoration: "none",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
    ...sizePreset,
    ...(animationDelay ? {
      opacity: 0,
      transform: "translateY(-1rem)",
      animation: "fadeIn 0.6s ease forwards",
      animationDelay,
    } : {}),
    ...style,
  };

  const pointerHandlers = {
    onPointerMove: handlePointerMove,
    onPointerEnter: () => setIsListening(true),
    onPointerLeave: () => setIsListening(false),
  };

  /* ── Render as <Link> or <button> ── */
  if (href && !disabled) {
    return (
      <div ref={containerRef} style={{ display: "inline-flex", width: size === "full" ? "100%" : undefined }} {...pointerHandlers}>
        <Link href={href} className={className} style={baseStyle}>
          {inner}
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: "inline-flex", width: size === "full" ? "100%" : undefined }} {...pointerHandlers}>
      <button
        className={className}
        style={baseStyle}
        onClick={onClick}
        disabled={disabled}
      >
        {inner}
      </button>
    </div>
  );
}
