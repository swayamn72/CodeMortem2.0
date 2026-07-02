"use client";

/**
 * HLD ChallengeRenderer
 *
 * The ChallengeRenderer is entirely generic — it reads ChallengeContent and
 * renders the IDE, run/submit buttons, and test results. Since the ST-intermediate
 * ChallengeRenderer is already fully parameterised on ChallengeContent (from its
 * own types.ts, which is structurally identical to ours), we re-export it here
 * after adapting the import path so that HLD registry types are used.
 *
 * This avoids duplicating 900 lines of IDE logic.
 */

// Re-export directly from the ST-intermediate renderer.
// Both ChallengeContent shapes are structurally identical (TypeScript structural
// typing means they're interchangeable at the component boundary).
export { default } from "@/components/learn/segment-tree-intermediate/renderer/ChallengeRenderer";
