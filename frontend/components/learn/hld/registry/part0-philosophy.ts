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

// ── Reference boilerplate: first DFS to compute tree metrics ─────────────────
const REFERENCE_CPP = `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;

vector<int> adj[MAXN];
int depth[MAXN], parent[MAXN], sz[MAXN], heavy[MAXN];

// DFS that computes depth, parent, subtree size, and heavy child.
int dfs(int u, int p, int d) {
    depth[u] = d;
    parent[u] = p;
    sz[u] = 1;
    int maxSz = 0;
    heavy[u] = -1;
    for (int v : adj[u]) {
        if (v == p) continue;
        sz[u] += dfs(v, u, d + 1);
        if (sz[v] > maxSz) {
            maxSz = sz[v];
            heavy[u] = v;   // heaviest child
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
    dfs(1, 0, 0);   // root at 1, parent of root is 0 (sentinel)
    // ... output as required
    return 0;
}`;

const REFERENCE_PYTHON = `import sys
from sys import setrecursionlimit
input = sys.stdin.readline
setrecursionlimit(300000)

def main():
    n = int(input())
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)

    depth  = [0] * (n + 1)
    parent = [0] * (n + 1)
    sz     = [1] * (n + 1)
    heavy  = [-1] * (n + 1)

    # Iterative DFS to avoid recursion limit issues
    order = []
    visited = [False] * (n + 1)
    stack = [(1, 0, 0)]   # (node, par, dep)
    while stack:
        u, p, d = stack.pop()
        if visited[u]: continue
        visited[u] = True
        depth[u] = d
        parent[u] = p
        order.append(u)
        for v in adj[u]:
            if not visited[v]:
                stack.append((v, u, d + 1))

    # Process in reverse BFS order to compute sizes bottom-up
    for u in reversed(order):
        max_sz = 0
        for v in adj[u]:
            if v == parent[u]: continue
            sz[u] += sz[v]
            if sz[v] > max_sz:
                max_sz = sz[v]
                heavy[u] = v

if __name__ == "__main__":
    main()`;

// ═════════════════════════════════════════════════════════════════════════════
export const PART0_PHILOSOPHY: ProblemGroup = {
  partLabel: "Part 0: The HLD Philosophy",

  lessons: [
    // ── Lesson 0-1: The Tree Bottleneck ──────────────────────────────────────
    {
      id: "hld-l0-bottleneck",
      title: "1. The Tree Bottleneck",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "You have a tree with 10^5 nodes. Each node has a value. You need to answer 10^5 queries, each asking: 'What is the maximum value on the path between node u and node v?'",
            "The naive approach is BFS or DFS for every query: walk from u up to the LCA, then down to v, tracking the maximum. This is O(N) per query. With 10^5 queries that's 10^10 operations — guaranteed TLE.",
            "If this were a simple 1D array, you'd use a Segment Tree. O(log N) per query, problem solved. But a tree isn't linear. It branches. Paths wind up, zigzag across the LCA, and come back down.",
            "The dream would be: if only we could somehow flatten the tree into a 1D array, we could just run a Segment Tree on it. Heavy-Light Decomposition (HLD) is exactly that dream, made real.",
            "HLD's core philosophy is simple: chop the tree into a set of vertical 'chains' (sequences of nodes going downward). Then cleverly assign contiguous indices in a 1D array to each chain. Any path query on the tree becomes a series of range queries on this 1D array — and a Segment Tree handles those in O(log N) each.",
            "The catch: chopping poorly could mean a single path visits many chains, giving us many Segment Tree queries per path. HLD's genius is a specific chopping rule that mathematically guarantees any path visits at most O(log N) chains.",
          ],
          takeaway:
            "The core problem: trees aren't linear, so standard Segment Trees don't directly apply. HLD's solution: decompose the tree into linear chains and map them contiguously into a 1D array so a Segment Tree can handle any path query.",
        },
      },
    },

    // ── Lesson 0-2: Heavy and Light Chains ────────────────────────────────
    {
      id: "hld-l0-chains",
      title: "2. Heavy and Light Chains",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "We define the 'heavy' child of a node as the child with the largest subtree. Every other child is a 'light' child. A node has at most one heavy child.",
            "A 'heavy chain' is formed by repeatedly following heavy edges: start at a node, go to its heavy child, go to that child's heavy child, and so on until you hit a leaf. Light edges always start a new chain.",
          ],
          takeaway:
            "Heavy child = child with the largest subtree. Chains are formed by following heavy edges downwards.",
        },
      },
    },

    // ── Lesson 0-3: The Heavy-Light Guarantee ────────────────────────────────
    {
      id: "hld-l0-guarantee",
      title: "3. The Heavy-Light Guarantee",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "The key mathematical insight: every time you cross a 'light' edge going upward toward the root, the subtree size at least doubles. If you're at node v and take a light edge up to parent p, then by definition sz[v] ≤ sz[p]/2 (v wasn't the heavy child, so it has a smaller subtree than the heavy child, which is at least sz[p]/2).",
            "Since the subtree size doubles with each light edge crossed, and the total tree has N nodes, you can cross at most log₂(N) light edges before the subtree size exceeds N. Therefore, any path from a node to the root passes through at most O(log N) distinct chains.",
            "This guarantee extends to any path u→v (via the LCA): since both u→LCA and v→LCA each cross O(log N) chains, the total path u→v also crosses O(log N) chains.",
            "So for each query, we jump across at most O(log N) chains, and for each chain jump we do one Segment Tree query in O(log N). Total per query: O(log^2 N). This is fast enough for competitive programming — for N = 10^5, that's about (17)² ≈ 289 operations per query.",
          ],
          takeaway:
            "Every light edge crossing at least doubles the subtree size, so any root-to-node path crosses at most O(log N) light edges (chain switches). This gives O(log^2 N) per query overall.",
        },
      },
    },
  ],
};
