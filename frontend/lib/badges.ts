/**
 * Central badge registry for CodeMortem.
 * Each badge maps 1-to-1 with a module completion.
 */

import { Zap, TreePine, Sigma, Crown, type LucideIcon } from "lucide-react";

export interface BadgeDef {
  id: string;          // matches moduleId
  name: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  accentColor: string; // hex color for hexagon glow/border
  secondaryColor: string;
  moduleId: string;    // the progressStore moduleId key
}

export const BADGE_REGISTRY: BadgeDef[] = [
  {
    id: "bit-manipulation-easy",
    name: "Bit Wizard",
    subtitle: "Level I",
    description: "Mastered all bitwise operators, masking idioms, XOR tricks, subset enumeration, and solved 6 coding challenges.",
    icon: Zap,
    accentColor: "#00f0ff",
    secondaryColor: "#00b8d4",
    moduleId: "bit-manipulation-easy",
  },
  {
    id: "segment-tree-easy",
    name: "Tree Sage",
    subtitle: "Level I",
    description: "Mastered Segment Tree fundamentals: range sum queries, point updates, and building trees in O(N log N).",
    icon: TreePine,
    accentColor: "#00ff88",
    secondaryColor: "#00c853",
    moduleId: "segment-tree-easy",
  },
  {
    id: "combinatorics-beginner",
    name: "Formula Master",
    subtitle: "Level I",
    description: "Built a complete O(1) combinatorics library: modular arithmetic, binary exponentiation, Fermat's inverse, and solved 13 coding challenges.",
    icon: Sigma,
    accentColor: "#aa00e6",
    secondaryColor: "#7b00b4",
    moduleId: "combinatorics-beginner",
  },
  {
    id: "segment-tree-medium",
    name: "Augmented Architect",
    subtitle: "Level II",
    description: "Mastered augmented Segment Trees: (min, count) pairs and max-subarray under point updates — the two core intermediate patterns.",
    icon: TreePine,
    accentColor: "#ffd700",
    secondaryColor: "#ff8c00",
    moduleId: "segment-tree-medium",
  },
  {
    id: "hld-hard",
    name: "HLD Grandmaster",
    subtitle: "Level III",
    description: "Mastered Heavy-Light Decomposition: tree metrics, chain formation, path max/sum queries, edge weights, subtree operations, and lazy path range updates.",
    icon: Crown,
    accentColor: "#ff2d55",
    secondaryColor: "#c9003a",
    moduleId: "hld-hard",
  },
];

/** Look up a badge definition by its id (= moduleId) */
export function getBadgeDef(moduleId: string): BadgeDef | undefined {
  return BADGE_REGISTRY.find((b) => b.moduleId === moduleId);
}
