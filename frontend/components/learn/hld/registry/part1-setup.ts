import type { ProblemGroup } from "./types";

// ── Starter code ─────────────────────────────────────────────────────────────
const STARTER_CPP = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your solution here

    return 0;
}`;

const STARTER_PYTHON = `import sys
input = sys.stdin.readline

def main():
    # your solution here
    pass

if __name__ == "__main__":
    main()`;

// ── Reference boilerplate: first DFS (tree metrics) ──────────────────────────
const REFERENCE_CPP = `#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];

// Output arrays
int depth[MAXN];
int par[MAXN];
int sz[MAXN];
int heavy[MAXN];

void dfs(int u, int p, int d) {
    par[u] = p;
    depth[u] = d;
    sz[u] = 1;
    heavy[u] = -1;
    
    int max_child_sz = -1;

    for (int v : adj[u]) {
        if (v == p) continue; // Don't go back up to parent
        
        // Go down the tree
        dfs(v, u, d + 1);
        
        // Come back up: add the child's subtree size to ours
        sz[u] += sz[v];
        
        // Determine if this child is the heavy child
        if (sz[v] > max_child_sz) {
            max_child_sz = sz[v];
            heavy[u] = v;
        } else if (sz[v] == max_child_sz) {
            // Apply strict tie-breaker rule
            if (heavy[u] == -1 || v < heavy[u]) {
                heavy[u] = v;
            }
        }
    }
}

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    cin >> n;
    
    for (int i = 0; i < n - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    
    // The problem specifies the tree is rooted at 1, 
    // root has parent 0, and root has depth 0.
    dfs(1, 0, 0);
    
    // Output the metrics in order from node 1 to N
    for (int i = 1; i <= n; ++i) {
        cout << depth[i] << " " << par[i] << " " << sz[i] << " " << heavy[i] << "\\n";
    }
    
    return 0;
}`;

const REFERENCE_CPP_CHAIN = `#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];

// Phase 1 arrays
int depth[MAXN], par[MAXN], sz[MAXN], heavy[MAXN];
// Phase 2 arrays
int pos[MAXN], head[MAXN];

int timer = 0;

void dfs1(int u, int p, int d) {
    par[u] = p;
    depth[u] = d;
    sz[u] = 1;
    heavy[u] = -1;
    
    int max_sz = -1;

    for (int v : adj[u]) {
        if (v == p) continue;
        
        dfs1(v, u, d + 1);
        sz[u] += sz[v];
        
        // Update heavy child with strict tie-breaker rules
        if (sz[v] > max_sz) {
            max_sz = sz[v];
            heavy[u] = v;
        } else if (sz[v] == max_sz) {
            if (heavy[u] == -1 || v < heavy[u]) {
                heavy[u] = v;
            }
        }
    }
}

void dfs2(int u, int p, int h) {
    head[u] = h;
    pos[u] = timer++;
    
    // 1. Visit heavy child FIRST to maintain contiguous positions
    if (heavy[u] != -1) {
        dfs2(heavy[u], u, h);
    }
    
    // 2. Visit light children
    for (int v : adj[u]) {
        if (v == p || v == heavy[u]) continue;
        
        // Light children start a new chain, so their head is themselves
        dfs2(v, u, v);
    }
}

int main() {
    // Optimize standard I/O operations for competitive programming
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    cin >> n;
    
    for (int i = 0; i < n - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    
    // Execute Phase 1: Compute metrics
    dfs1(1, 0, 0);
    
    // Execute Phase 2: Form chains and assign positions
    // Node 1 is the root, and the head of its own chain
    dfs2(1, 0, 1);
    
    // Output Phase 2 results
    for (int i = 1; i <= n; ++i) {
        cout << pos[i] << " " << head[i] << "\\n";
    }
    
    return 0;
}`;

const REFERENCE_PYTHON = `import sys
input = sys.stdin.readline

def main():
    n = int(input())
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)

    depth  = [0] * (n + 1)
    par    = [0] * (n + 1)
    sz     = [1] * (n + 1)
    heavy  = [-1] * (n + 1)

    # Iterative post-order DFS
    order = []
    stk = [(1, 0, 0)]
    seen = [False] * (n + 1)
    while stk:
        u, p, d = stk.pop()
        if seen[u]: continue
        seen[u] = True
        depth[u] = d
        par[u] = p
        order.append(u)
        for v in adj[u]:
            if not seen[v]:
                stk.append((v, u, d + 1))

    for u in reversed(order):
        best = 0
        for v in adj[u]:
            if v == par[u]: continue
            sz[u] += sz[v]
            if sz[v] > best:
                best = sz[v]
                heavy[u] = v

    for u in range(1, n + 1):
        print(f"{u}: depth={depth[u]} parent={par[u]} sz={sz[u]} heavy={heavy[u]}")

if __name__ == "__main__":
    main()`;

// ═════════════════════════════════════════════════════════════════════════════
export const PART1_SETUP: ProblemGroup = {
  partLabel: "Part 1: The Setup",

  lessons: [
    // ── Lesson 1-1: Tree Metrics (Conceptual) ────────────────────────────────
    {
      id: "hld-l1-metrics-concept",
      title: "4. Computing Tree Metrics",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "Before we can decompose anything, we need to know the tree's structure. The first DFS collects four critical pieces of information per node: depth, parent, subtree size, and heavy child.",
            "'depth[u]' is the number of edges from the root to u. The root has depth 0. We track this for the LCA-finding step later.",
            "'par[u]' is u's parent. This is essential: when we're jumping up chains in a query, we need to know which node is above the chain's head.",
            "'sz[u]' is the size of the subtree rooted at u (including u itself). A leaf has sz = 1. The root has sz = N. We compute this bottom-up as we return from DFS.",
            "'heavy[u]' is u's heavy child — the child v with the largest sz[v]. If u is a leaf, heavy[u] = -1. If there's a tie, pick either (the guarantee still holds).",
            "The DFS is straightforward: recurse into all children, compute their sizes, then pick the one with the largest subtree as the heavy child. Time complexity: O(N). This single pass is the foundation that everything else is built on.",
          ],
          takeaway:
            "The first DFS computes four arrays: depth[], par[], sz[], heavy[]. The heavy child is the child with the largest subtree. This O(N) pass is the first of two DFS passes in HLD.",
        },
      },
    },

    // ── Lesson 1-2: Tree Metrics (Challenge) ─────────────────────────────────
    {
      id: "hld-c1-tree-metrics",
      title: "Code: Tree Metrics",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given a tree of N nodes (rooted at node 1, 1-indexed), compute the following for every node u:\n\n- **depth[u]**: number of edges from root to u (root has depth 0)\n- **par[u]**: parent of u (root's parent is 0)\n- **sz[u]**: subtree size of u (number of nodes in the subtree rooted at u, including u itself)\n- **heavy[u]**: the heavy child of u — the child with the **largest subtree size**. If u is a leaf, heavy[u] = -1. If multiple children tie, pick the one with the smallest index.\n\nOutput these four values for each node in order from 1 to N.",
          inputFormat:
            "First line: N (number of nodes).\nNext N-1 lines: each contains two integers u and v — an undirected edge between u and v.",
          outputFormat:
            "N lines. Line i contains four space-separated integers: depth[i] par[i] sz[i] heavy[i] (0-indexed depth, parent of root is 0, heavy child or -1).",
          sampleInput: "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7",
          sampleOutput:
            "0 0 7 2\n1 1 3 4\n1 1 3 6\n2 2 1 -1\n2 2 1 -1\n2 3 1 -1\n2 3 1 -1",
          constraints: [
            "1 ≤ N ≤ 10^5",
            "The graph is guaranteed to be a valid tree (connected, N-1 edges, no cycles)",
            "Nodes are 1-indexed",
          ],
          hints: [
            {
              title: "Hint 1 — Structural DFS",
              body: "Write a DFS starting from root = 1 with parent = 0 and depth = 0. As you go down, set the parent and depth. As you backtrack (return from the recursion), accumulate the sz of the current node by adding the sz of all its children.",
            },
            {
              title: "Hint 2 — The Heavy Child & Tie-Breaker",
              body: "After computing a child's size, check if it's the largest seen so far. If sz[v] > maxSz, update your heavy child. If sz[v] == maxSz, you must apply the tie-breaker: update the heavy child only if v is smaller than the current heavy child.",
            },
            {
              title: "Hint 3 — Handling Stack Limits",
              body: "For constraints up to 10^5, a recursive DFS might stack-overflow on a line graph if the environment's stack limit is small. If you hit a Runtime Error, rewrite the logic to use a standard BFS to get a topological order from root to leaves, then reverse that order to process nodes bottom-up.",
            },
          ],
          editorial: `**The Goal:**
This problem requires us to compute four fundamental properties for every node in a tree: depth, parent, subtree size, and the "heavy child". Identifying the heavy child is the critical first step in Heavy-Light Decomposition (HLD).

**The Strategy:**
A single Depth-First Search (DFS) can compute all four metrics simultaneously.

*Top-Down (depth and par)*: When we first visit a node u from its parent p, we immediately know par[u] = p and depth[u] = depth[p] + 1.

*Bottom-Up (sz and heavy)*: A node's subtree size relies on the sizes of its children. We initialize sz[u] = 1 (accounting for the node itself). After recursively calling the DFS on a child v, its entire subtree size sz[v] is completely computed. We then add sz[v] to sz[u].

*Heavy Child Tie-Breaker*: While iterating through the children of u, we track the maximum child size seen so far. If a child v strictly exceeds this maximum, it becomes the new heavy[u]. If it exactly ties the maximum, we check if v < heavy[u]. If so, it overwrites the heavy child.

**Complexity:**
Every node and edge is visited exactly once.
Time Complexity: O(N)
Space Complexity: O(N) to store the adjacency list and the metric arrays.

\`\`\`cpp
${REFERENCE_CPP}
\`\`\``,
          backendChallengeId: "hld_tree_metrics",
          sampleTestCases: [
            {
              label: "7-node tree (sample)",
              input: "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7",
              expected: "0 0 7 2\n1 1 3 4\n1 1 3 6\n2 2 1 -1\n2 2 1 -1\n2 3 1 -1\n2 3 1 -1",
            },
            {
              label: "Single node",
              input: "1",
              expected: "0 0 1 -1",
            },
            {
              label: "Line graph (bamboo)",
              input: "4\n1 2\n2 3\n3 4",
              expected: "0 0 4 2\n1 1 3 3\n2 2 2 4\n3 3 1 -1",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
        },
      },
    },

    // ── Lesson 1-3: Chain Formation (Conceptual) ─────────────────────────────
    {
      id: "hld-l1-chains-concept",
      title: "5. Chain Formation",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "Now for the second DFS: the decomposition itself. We assign each node a flat 1D position (pos[u]) and record which chain it belongs to via head[u] — the topmost node in u's chain.",
            "The rule is simple: always visit the heavy child first. When you start a new chain (because you're visiting a light child), that child becomes the head of a brand new chain.",
            "Here's the critical property: because we always visit the heavy child first, all nodes in the same heavy chain receive consecutive positions in the 1D array. The chain's head gets the first position, its heavy child gets the next, and so on down.",
            "This contiguity is absolutely essential. It's what allows us to answer a query 'give me the max on this chain from node A to node B' with a single Segment Tree range query [pos[A], pos[B]].",
            "We also create a 'node at position' array (nodeAt[]) — the reverse mapping. This lets us build the Segment Tree from the original node values: nodeAt[pos[u]] = val[u].",
            "After this DFS, we have: pos[u] (1D position of node u), head[u] (head of u's chain), and nodeAt[i] (node at position i). The Segment Tree is then built over the nodeAt array.",
          ],
          takeaway:
            "The second DFS assigns contiguous 1D positions to every heavy chain by visiting heavy children first. head[u] tracks the top of u's chain. This contiguity is what makes Segment Tree range queries work on chains.",
        },
      },
    },

    // ── Lesson 1-4: Chain Formation (Challenge) ──────────────────────────────
    {
      id: "hld-c1-chain-formation",
      title: "Code: Chain Formation",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given the tree from the previous challenge (after computing depth, par, sz, heavy), perform the **second DFS** to form chains and assign positions.\n\nCompute for every node u:\n- **pos[u]**: the 0-indexed position of node u in the flattened 1D array\n- **head[u]**: the topmost node of u's heavy chain\n\nAlways visit the **heavy child first** so chain nodes receive contiguous positions. Light children each start a new chain (their head is themselves).\n\nThe root (node 1) always starts a new chain with head[1] = 1.\n\nOutput pos[u] and head[u] for each u from 1 to N.",
          inputFormat:
            "First line: N.\nNext N-1 lines: edges (u v).\n(Your code must recompute the first DFS internally.)",
          outputFormat:
            "N lines. Line i contains: pos[i] head[i].",
          sampleInput: "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7",
          sampleOutput: "0 1\n1 1\n4 3\n2 1\n3 5\n5 3\n6 7",
          constraints: [
            "1 ≤ N ≤ 10^5",
            "Valid tree rooted at 1",
            "Nodes are 1-indexed",
          ],
          hints: [
            {
              title: "Hint 1 — Structural DFS",
              body: "Start with a basic DFS from root = 1 (parent = 0, depth = 0). For each unvisited neighbor v, recurse down. A node's subtree size (sz[u]) starts at 1 and accumulates the sizes of all its children as the recursion unwinds.",
            },
            {
              title: "Hint 2 — The Heavy Child & Tie-Breaker",
              body: "After computing a child's size, check if it's the largest seen so far to update heavy[u]. Watch out for ties! If sz[v] equals your current maximum, you must explicitly check if v has a smaller node index than your current heavy child, updating it if so.",
            },
            {
              title: "Hint 3 — Chain Formation DFS",
              body: "Write a second DFS to assign pos and head. The trick to keeping heavy chains contiguous in your 1D array is to always visit the heavy child first. Pass the current chain's head down to the heavy child, but pass the light child's own index as the new head when branching into light edges.",
            },
            {
              title: "Hint 4 — Handling Stack Limits",
              body: "A recursive DFS can cause a stack overflow for N = 10^5 if the tree is essentially a single straight line. If your environment doesn't allow expanding the stack limit, consider writing the first phase bottom-up using a BFS order reversed, and the second phase using an explicit stack or iterative loop.",
            },
          ],
          editorial: `**The Goal:**
We want to flatten a tree into a 1D array such that any path down a "heavy chain" occupies contiguous indices. This is the foundation that allows us to use standard segment trees to query tree paths in O(log² N) time.

**The Strategy:**
After running the first DFS to calculate depth, par, sz, and heavy, we run a second DFS (dfs2). We maintain a global timer (starting at 0) to assign positions. The most critical step is the traversal order inside dfs2.

**For any given node u:**
- *Assign current metrics*: Record its pos (from the timer) and its head (passed down from its parent).
- *Visit the heavy child*: If heavy[u] exists, we recursively call dfs2(heavy[u], u, head). Because we do this immediately, the heavy child gets the very next pos index, ensuring the chain remains completely contiguous in memory.
- *Visit the light children*: Iterate through the rest of the children. If a child v is neither the parent nor the heavy child, it must be a light child. Light edges always start a brand new chain. Therefore, we call dfs2(v, u, v), passing v itself as the new chain head.

**Complexity:**
Both dfs1 and dfs2 visit each node and edge exactly once. Therefore, the time complexity is strictly O(N). The space complexity is also O(N) to store the tree graph and the required arrays.

\`\`\`cpp
${REFERENCE_CPP_CHAIN}
\`\`\``,
          backendChallengeId: "hld_chain_formation",
          sampleTestCases: [
            {
              label: "7-node tree (sample)",
              input: "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7",
              expected: "0 1\n1 1\n4 3\n2 1\n3 5\n5 3\n6 7",
            },
            {
              label: "Line graph (one chain)",
              input: "4\n1 2\n2 3\n3 4",
              expected: "0 1\n1 1\n2 1\n3 1",
            },
            {
              label: "Star graph (root + leaves)",
              input: "5\n1 2\n1 3\n1 4\n1 5",
              expected: "0 1\n1 1\n2 3\n3 4\n4 5",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP_CHAIN, python: REFERENCE_PYTHON },
        },
      },
    },
  ],
};
