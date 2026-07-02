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
const REFERENCE_CPP = `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
int depth[MAXN], par[MAXN], sz[MAXN], heavy[MAXN];

// Returns sz[u].
int dfs(int u, int p, int d) {
    depth[u] = d;
    par[u]   = p;
    sz[u]    = 1;
    heavy[u] = -1;
    int maxChild = 0;
    for (int v : adj[u]) {
        if (v == p) continue;
        sz[u] += dfs(v, u, d + 1);
        if (sz[v] > maxChild) {
            maxChild = sz[v];
            heavy[u] = v;
        }
    }
    return sz[u];
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    for (int i = 0; i < n - 1; i++) {
        int u, v; cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    dfs(1, 0, 0);

    // Print: for each node 1..n: depth, parent, sz, heavy_child (-1 if leaf)
    for (int u = 1; u <= n; u++) {
        cout << u << ": depth=" << depth[u]
             << " parent=" << par[u]
             << " sz=" << sz[u]
             << " heavy=" << heavy[u] << "\\n";
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
              title: "Hint 1 — DFS Structure",
              body: "Write a DFS starting from root=1 with parent=0 and depth=0. For each unvisited neighbor v, recurse: dfs(v, u, depth+1). sz[u] starts at 1 and accumulates sz[v] for each child v.",
            },
            {
              title: "Hint 2 — Finding the Heavy Child",
              body: "After computing all children's sizes, heavy[u] is the child v that maximizes sz[v]. Initialize heavy[u] = -1 and maxSz = 0 before iterating children. Update if sz[v] > maxSz. For a tie, since you check sz[v] > maxSz (strict greater), the first maximum found wins.",
            },
            {
              title: "Hint 3 — Avoiding Stack Overflow",
              body: "Recursive DFS may stack-overflow for N = 10^5 on a line graph. Use an iterative approach: push nodes onto a stack, record the DFS order, then process in reverse to compute sz and heavy bottom-up.",
            },
          ],
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
              title: "Hint 1 — DFS signature",
              body: "The second DFS takes (u, parent, chainHead, currentPos). Start with dfs2(1, 0, 1, 0). Set pos[u] = currentPos and head[u] = chainHead, then increment currentPos.",
            },
            {
              title: "Hint 2 — Visit heavy child first",
              body: "After processing node u, recurse into heavy[u] first (if it exists) passing the SAME chainHead — it continues the current chain. Then recurse into every other (light) child passing v itself as the new chainHead.",
            },
            {
              title: "Hint 3 — Tracking positions",
              body: "Use a shared counter (global int or reference) for the current position. Every node increments it exactly once. The heavy child gets the very next position (currentPos + 1), which is why chain nodes are contiguous.",
            },
          ],
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
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
        },
      },
    },
  ],
};
