import type { ProblemGroup } from "./types";

export const PART0_PHILOSOPHY: ProblemGroup = {
  partLabel: "Part 0: The SOS Philosophy",
  lessons: [
    {
      id: "sos-l0-bottleneck",
      title: "1. The Subset Bottleneck",
      content: {
        type: "conceptual",
        data: {
          blocks: [
            {
              kind: "text",
              text: "Imagine you have an array `A` of size 2^N. Your goal is to create a new array `F`, where `F[x]` is the sum of `A[i]` for every submask `i` that fits inside `x`.",
            },
            {
              kind: "text",
              text: "Let's look at a concrete example:\nIf your mask is `x = 3` (binary `011`), its submasks are:\n- `011` (3)\n- `010` (2)\n- `001` (1)\n- `000` (0)\n\nSo, you need `F[3] = A[3] + A[2] + A[1] + A[0]`.",
            },
            {
              kind: "callout",
              variant: "gotcha",
              title: "The Brute Force Trap",
              body: "The standard way to do this is a nested loop using the classic submask enumeration trick:",
            },
            {
              kind: "code",
              language: "C++",
              code: "for(int mask = 0; mask < (1 << N); ++mask) {\n    for(int i = mask; i > 0; i = (i - 1) & mask) {\n        F[mask] += A[i];\n    }\n    F[mask] += A[0]; // Don't forget the empty set!\n}",
            },
            {
              kind: "text",
              text: "Why does this take **O(3^N)** time? Think about it bit by bit. For any given bit position across all pairs of (mask, submask), there are only three valid combinations:\n- Mask has 0 → Submask must have 0.\n- Mask has 1 → Submask can have 0.\n- Mask has 1 → Submask can have 1.",
            },
            {
              kind: "callout",
              variant: "warning",
              title: "Time Limit Exceeded",
              body: "Since each of the _N_ bits has 3 possibilities, total iterations = 3^N. For `N = 22`, 3^22 is roughly 3.1 × 10^10 operations. Your C++ code will comfortably hit a Time Limit Exceeded (TLE) verdict. We need to do this in **O(N · 2^N)**.",
            },
          ],
          takeaway: "Iterating through all submasks of all masks takes O(3^N) time, which is too slow. We must optimize this to O(N · 2^N).",
        },
      },
    },
    {
      id: "sos-l0-hypercube",
      title: "2. The N-Dimensional Prefix Sum",
      content: {
        type: "conceptual",
        data: {
          blocks: [
            {
              kind: "text",
              text: "To fix the bottleneck, stop looking at bitmasks as flat binary strings. Look at them as **coordinates on a grid**.",
            },
            {
              kind: "text",
              text: "Let’s pretend `N = 2`. Your bitmasks are 00, 01, 10, 11.\nImagine a 2D matrix where the x-axis is Bit 0 and the y-axis is Bit 1:\n- `A[00]` is at (0,0)\n- `A[01]` is at (0,1)\n- `A[10]` is at (1,0)\n- `A[11]` is at (1,1)",
            },
            {
              kind: "diagram",
              diagram: "Bit 1\n  1 │   A[10] ──── A[11]\n    │     │          │\n    │     │          │\n  0 │   A[00] ──── A[01]\n    └────────────────── Bit 0\n          0          1",
            },
            {
              kind: "text",
              text: "If you want the sum of all submasks for 11, you want `A[00] + A[01] + A[10] + A[11]`. \nLook closely at that: it is exactly a **2D Prefix Sum**! You want the sum of the \"rectangle\" from (0,0) to (1,1).",
            },
            {
              kind: "callout",
              variant: "insight",
              title: "The Sweeping Technique",
              body: "How do you calculate a 2D prefix sum efficiently? You don't add up the whole rectangle every time. You sweep horizontally (summing rows), and then you sweep vertically (summing columns).",
            },
            {
              kind: "text",
              text: "SOS DP is doing the exact same thing, but instead of 2 dimensions, you have _N_ dimensions. You process the sums by **sweeping exactly one bit (dimension) at a time**.",
            },
          ],
          takeaway: "SOS DP is essentially an N-dimensional prefix sum. We compute it efficiently by sweeping one dimension (one bit) at a time.",
        },
      },
    },
    {
      id: "sos-l0-transition",
      title: "3. The State Transition",
      content: {
        type: "conceptual",
        data: {
          blocks: [
            {
              kind: "text",
              text: "Imagine every mask starts as a bucket holding only its own original array value.\n- Bucket `101` holds `A[101]`\n- Bucket `100` holds `A[100]`\n- Bucket `001` holds `A[001]`\n- Bucket `000` holds `A[000]`",
            },
            {
              kind: "text",
              text: "We are going to walk through the bits one by one. If a bucket has a 1 at the current bit, it is allowed to reach out and grab the contents of the bucket where that bit is 0.",
            },
            {
              kind: "diagram",
              diagram: "**Initial Buckets**\n[101]   [100]   [001]   [000]\n\n**Step 1: Process Bit 0 (rightmost)**\n[101] <── grabs ── [100]\n[001] <── grabs ── [000]\n\n**Step 2: Process Bit 1 (middle)**\n[101] (Bit 1 is 0, do nothing)\n[001] (Bit 1 is 0, do nothing)\n\n**Step 3: Process Bit 2 (leftmost)**\n[101] <─────── grabs ─────── [001]\n\n**Final Contents of 101:** {101, 100, 001, 000}",
              caption: "Visualizing the bucket merging process for mask 101.",
            },
            {
              kind: "text",
              text: "**Step 1: Processing Bit 0 (The rightmost bit)**\nWe look at all masks, but let's focus on 101 and 001.\n- **101** has a 1 at Bit 0. So, it reaches out to 100 and absorbs its contents. Bucket 101 now contains: `{101, 100}`.\n- **001** also has a 1 at Bit 0. It reaches out to 000 and absorbs its contents. Bucket 001 now contains: `{001, 000}`.",
            },
            {
              kind: "text",
              text: "**Step 2: Processing Bit 1 (The middle bit)**\n- **101** has a 0 at Bit 1. Because it's a 0, it does nothing. It simply carries its current contents forward. Bucket 101 still contains: `{101, 100}`.\n- **001** also has a 0 at Bit 1. It does nothing. Bucket 001 still contains: `{001, 000}`.",
            },
            {
              kind: "text",
              text: "**Step 3: Processing Bit 2 (The leftmost bit)**\n- **101** has a 1 at Bit 2. So, it reaches out to the bucket where Bit 2 is flipped to a 0. That bucket is 001.\n- It absorbs everything currently inside bucket 001. Bucket 101 takes its own contents `{101, 100}` and adds bucket 001's contents `{001, 000}`.\n- Bucket 101 now contains: `{101, 100, 001, 000}`.",
            },
            {
              kind: "text",
              text: "**Boom.** In exactly 3 steps, 101 successfully gathered all its submasks without ever running a slow nested loop.",
            },
            {
              kind: "text",
              text: "**The Transition Rule Translated to Code**\nNow, look at the transition logic again. When we are processing the `i`-th bit, every mask follows a simple rule:",
            },
            {
              kind: "text",
              text: "**Case 1: The `i`-th bit is 0**\nYou do nothing. You just keep the bucket's current contents (which were built up during step `i-1`).\n`dp[mask][i] = dp[mask][i-1]`",
            },
            {
              kind: "text",
              text: "**Case 2: The `i`-th bit is 1**\nYou keep your current contents, PLUS you absorb the contents of the bucket where the `i`-th bit is 0. To find that target bucket, you just use `mask ^ (1 << i)` to flip the bit.\n`dp[mask][i] = dp[mask][i-1] + dp[mask ^ (1 << i)][i-1]`",
            },
            {
              kind: "callout",
              variant: "insight",
              title: "The Magic of DP",
              body: "Because every bucket is being updated simultaneously at each step, you recycle the work perfectly. When 101 reached out to 001 at Bit 2, 001 had already done the work of gathering 000 during Bit 0.",
            },
          ],
          takeaway: "By breaking the exponential subset sum into linear steps across dimensions, every bit processed correctly absorbs all prior accumulated submasks.",
        },
      },
    },
  ],
};
