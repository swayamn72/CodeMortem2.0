/**
 * Central badge registry for CodeMortem.
 * Each badge maps 1-to-1 with a module completion.
 */

export interface BadgeDef {
  id: string;          // matches moduleId
  name: string;
  subtitle: string;
  description: string;
  icon: string;        // emoji
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
    icon: "⚡",
    accentColor: "#00f0ff",
    secondaryColor: "#00b8d4",
    moduleId: "bit-manipulation-easy",
  },
  {
    id: "segment-tree-easy",
    name: "Tree Sage",
    subtitle: "Level I",
    description: "Mastered Segment Tree fundamentals: range sum queries, point updates, and building trees in O(N log N).",
    icon: "🌳",
    accentColor: "#00ff88",
    secondaryColor: "#00c853",
    moduleId: "segment-tree-easy",
  },
];

/** Look up a badge definition by its id (= moduleId) */
export function getBadgeDef(moduleId: string): BadgeDef | undefined {
  return BADGE_REGISTRY.find((b) => b.moduleId === moduleId);
}
