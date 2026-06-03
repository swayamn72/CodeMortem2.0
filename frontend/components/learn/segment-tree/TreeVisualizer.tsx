"use client";

import type { NodeData } from "./types";
import styles from "@/app/learn/segment-tree/page.module.css";

interface TreeVisualizerProps {
  nodes: NodeData[];
  /** Return a CSS class for the circle of a node (for overlap/update coloring) */
  getNodeClass?: (nodeId: number) => string;
  /** For build animation: how many depth levels from leaves are visible (0 = leaves only) */
  buildStep?: number;
  /** Provide updated values to display (nodeId → displayVal) */
  updatedValues?: Record<number, number>;
  /** Click handler on a node (for Array Representation lesson) */
  onNodeClick?: (arrIdx: number) => void;
  /** Array-index badge visibility (for Array Representation lesson) */
  showArrayIndex?: boolean;
  /** Highlighted array index (for Array Representation lesson) */
  highlightedNode?: number | null;
}

/**
 * Reusable SVG Segment Tree visualization.
 * Used by Lessons 3 (build), 4 (query), 5 (update).
 */
export default function TreeVisualizer({
  nodes,
  getNodeClass,
  buildStep,
  updatedValues,
  onNodeClick,
  showArrayIndex = false,
  highlightedNode = null,
}: TreeVisualizerProps) {
  const parentOf = (id: number) => Math.floor(id / 2);
  const leftOf   = (id: number) => id * 2;
  const rightOf  = (id: number) => id * 2 + 1;

  const isVisible = (node: NodeData): boolean => {
    if (buildStep === undefined) return true;
    // Level 3 = depth 0 (leaves); Level 0 = depth 3 (root)
    const depthFromLeaf = 3 - node.level;
    return depthFromLeaf <= buildStep;
  };

  return (
    <div className={styles.treeSvgContainer} style={onNodeClick ? { cursor: "pointer" } : {}}>
      <svg width="600" height="260" viewBox="0 0 600 260">
        {/* ── Connector Lines ── */}
        {nodes.map((node) => {
          if (!node.children) return null;
          const leftChild  = nodes.find((n) => n.id === node.children![0]);
          const rightChild = nodes.find((n) => n.id === node.children![1]);

          const parentVisible = isVisible(node);

          return (
            <g key={`lines-${node.id}`}>
              {leftChild && parentVisible && isVisible(leftChild) && (
                <line
                  x1={node.x} y1={node.y}
                  x2={leftChild.x} y2={leftChild.y}
                  className={styles.svgLine}
                />
              )}
              {rightChild && parentVisible && isVisible(rightChild) && (
                <line
                  x1={node.x} y1={node.y}
                  x2={rightChild.x} y2={rightChild.y}
                  className={styles.svgLine}
                />
              )}
            </g>
          );
        })}

        {/* ── Node Circles ── */}
        {nodes.map((node) => {
          if (!isVisible(node)) return null;

          const displayVal = updatedValues?.[node.id] ?? node.val;

          // Build-mode: glow nodes that were just added at this step
          let circleClass = `${styles.svgNodeCircle}`;
          if (buildStep !== undefined) {
            const depthFromLeaf = 3 - node.level;
            if (depthFromLeaf === buildStep) {
              circleClass += ` ${styles.nodeUpdateCircle}`;
            }
          }
          if (getNodeClass) {
            circleClass += ` ${getNodeClass(node.id)}`;
          }

          // Array-index mode: custom fill/stroke per relationship
          if (showArrayIndex && highlightedNode !== null) {
            const isHighlighted = highlightedNode === node.id;
            const isParent      = highlightedNode > 1 && parentOf(highlightedNode) === node.id;
            const isLeft        = leftOf(highlightedNode) === node.id;
            const isRight       = rightOf(highlightedNode) === node.id;

            let fill   = "var(--bg-tertiary)";
            let stroke = "rgba(255,255,255,0.12)";
            let sw     = 1.5;
            if (isHighlighted) { fill = "rgba(0,240,255,0.25)";   stroke = "var(--cm-cyan)";   sw = 2.5; }
            else if (isParent) { fill = "rgba(255,140,0,0.2)";    stroke = "var(--cm-orange)"; sw = 2;   }
            else if (isLeft)   { fill = "rgba(0,240,255,0.12)";   stroke = "var(--cm-cyan)";   sw = 2;   }
            else if (isRight)  { fill = "rgba(168,85,247,0.15)";  stroke = "var(--cm-purple)"; sw = 2;   }

            return (
              <g
                key={node.id}
                style={{ cursor: "pointer" }}
                onClick={() => onNodeClick?.(node.id)}
              >
                <circle
                  cx={node.x} cy={node.y} r="20"
                  fill={fill} stroke={stroke} strokeWidth={sw}
                  style={{ transition: "all 0.2s ease" }}
                />
                {/* Array-index badge */}
                <rect
                  x={node.x + 12} y={node.y - 28}
                  width={16} height={14} rx={3}
                  fill="rgba(10,10,15,0.9)"
                  stroke={stroke} strokeWidth={1}
                />
                <text
                  x={node.x + 20} y={node.y - 18}
                  textAnchor="middle" fontSize="8"
                  fontFamily="var(--font-mono)"
                  fill={isHighlighted ? "var(--cm-cyan)" : "var(--text-muted)"}
                >
                  {node.id}
                </text>
                <text
                  x={node.x} y={node.y + 4}
                  textAnchor="middle" fontSize="11"
                  fontFamily="var(--font-sans)" fontWeight="600"
                  fill="var(--text-primary)"
                >
                  {displayVal}
                </text>
                <text
                  x={node.x} y={node.y + 14}
                  textAnchor="middle" fontSize="7"
                  fontFamily="var(--font-mono)"
                  fill="var(--text-muted)"
                >
                  {node.label}
                </text>
              </g>
            );
          }

          return (
            <g key={node.id} className={styles.svgNode}>
              <circle cx={node.x} cy={node.y} r="20" className={circleClass} />
              <text x={node.x} y={node.y - 2} className={styles.nodeLabelText}>{displayVal}</text>
              <text x={node.x} y={node.y + 11} className={styles.nodeRangeText}>{node.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
