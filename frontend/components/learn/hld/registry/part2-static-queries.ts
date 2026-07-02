import type { ProblemGroup } from "./types";

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

// ── Reference: Full HLD with max Segment Tree, path-max query ────────────────
const REFERENCE_CPP = `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
const int NEG_INF = INT_MIN;

// ── Segment Tree (max) ────────────────────────────────────────────────────────
struct SegTree {
    int n;
    vector<int> t;
    SegTree(int n) : n(n), t(2 * n, NEG_INF) {}
    void update(int i, int val) {
        for (t[i += n] = val; i > 1; i >>= 1)
            t[i >> 1] = max(t[i], t[i ^ 1]);
    }
    int query(int l, int r) { // [l, r] inclusive
        int res = NEG_INF;
        for (l += n, r += n + 1; l < r; l >>= 1, r >>= 1) {
            if (l & 1) res = max(res, t[l++]);
            if (r & 1) res = max(res, t[--r]);
        }
        return res;
    }
};

// ── HLD arrays ────────────────────────────────────────────────────────────────
vector<int> adj[MAXN];
int depth[MAXN], par[MAXN], sz[MAXN], heavy[MAXN];
int pos[MAXN], head[MAXN];
int timer_val = 0;

int dfs1(int u, int p, int d) {
    depth[u] = d; par[u] = p; sz[u] = 1; heavy[u] = -1;
    int mx = 0;
    for (int v : adj[u]) {
        if (v == p) continue;
        sz[u] += dfs1(v, u, d + 1);
        if (sz[v] > mx) { mx = sz[v]; heavy[u] = v; }
    }
    return sz[u];
}

void dfs2(int u, int p, int h) {
    head[u] = h;
    pos[u] = timer_val++;
    if (heavy[u] != -1) dfs2(heavy[u], u, h); // continue chain
    for (int v : adj[u]) {
        if (v == p || v == heavy[u]) continue;
        dfs2(v, u, v); // new chain
    }
}

// ── Path query: maximum node value on path u→v ────────────────────────────────
int pathMax(int u, int v, SegTree& st) {
    int res = NEG_INF;
    while (head[u] != head[v]) {
        if (depth[head[u]] < depth[head[v]]) swap(u, v);
        // u is deeper — query its whole chain segment up to its head
        res = max(res, st.query(pos[head[u]], pos[u]));
        u = par[head[u]]; // jump to node above the chain
    }
    // Same chain — one final query
    if (depth[u] > depth[v]) swap(u, v);
    res = max(res, st.query(pos[u], pos[v]));
    return res;
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    vector<int> val(n + 1);
    for (int i = 1; i <= n; i++) cin >> val[i];
    for (int i = 0; i < n - 1; i++) {
        int u, v; cin >> u >> v;
        adj[u].push_back(v); adj[v].push_back(u);
    }
    dfs1(1, 0, 0);
    dfs2(1, 0, 1);
    SegTree st(n);
    for (int u = 1; u <= n; u++) st.update(pos[u], val[u]);
    int q; cin >> q;
    while (q--) {
        int u, v; cin >> u >> v;
        cout << pathMax(u, v, st) << "\\n";
    }
    return 0;
}`;

const REFERENCE_PYTHON = `import sys
input = sys.stdin.readline

def main():
    import sys
    from sys import stdin
    data = stdin.read().split()
    ptr = 0
    def rd(): nonlocal ptr; v = data[ptr]; ptr += 1; return int(v)

    n = rd()
    val = [0] + [rd() for _ in range(n)]
    adj = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        u, v = rd(), rd()
        adj[u].append(v); adj[v].append(u)

    depth = [0]*(n+1); par = [0]*(n+1); sz = [1]*(n+1); heavy = [-1]*(n+1)
    pos = [0]*(n+1); head_arr = [0]*(n+1); nodeAt = [0]*(n+1)

    # Iterative DFS1
    order = []; stk = [(1, 0, 0)]
    seen = [False]*(n+1)
    while stk:
        u, p, d = stk.pop()
        if seen[u]: continue
        seen[u] = True; depth[u]=d; par[u]=p; order.append(u)
        for v in adj[u]:
            if not seen[v]: stk.append((v, u, d+1))
    for u in reversed(order):
        best = 0
        for v in adj[u]:
            if v == par[u]: continue
            sz[u] += sz[v]
            if sz[v] > best: best = sz[v]; heavy[u] = v

    # Iterative DFS2
    timer = 0
    stk = [(1, 0, 1)]
    while stk:
        u, p, h = stk.pop()
        head_arr[u] = h; pos[u] = timer; nodeAt[timer] = u; timer += 1
        light = []
        for v in adj[u]:
            if v == p or v == heavy[u]: continue
            light.append(v)
        for v in reversed(light): stk.append((v, u, v))
        if heavy[u] != -1: stk.append((heavy[u], u, h))

    # Segment tree (max, iterative)
    seg = [-10**9]*(2*n)
    def seg_update(i, x):
        i += n; seg[i] = x
        while i > 1: i >>= 1; seg[i] = max(seg[2*i], seg[2*i+1])
    def seg_query(l, r):  # [l,r]
        res = -10**9; l += n; r += n+1
        while l < r:
            if l&1: res = max(res, seg[l]); l += 1
            if r&1: r -= 1; res = max(res, seg[r])
            l >>= 1; r >>= 1
        return res

    for u in range(1, n+1): seg_update(pos[u], val[u])

    def path_max(u, v):
        res = -10**9
        while head_arr[u] != head_arr[v]:
            if depth[head_arr[u]] < depth[head_arr[v]]: u, v = v, u
            res = max(res, seg_query(pos[head_arr[u]], pos[u]))
            u = par[head_arr[u]]
        if depth[u] > depth[v]: u, v = v, u
        return max(res, seg_query(pos[u], pos[v]))

    q = rd()
    out = []
    for _ in range(q):
        u, v = rd(), rd()
        out.append(str(path_max(u, v)))
    print("\\n".join(out))

if __name__ == "__main__":
    main()`;

// ═════════════════════════════════════════════════════════════════════════════
export const PART2_STATIC_QUERIES: ProblemGroup = {
  partLabel: "Part 2: Static Path Queries",

  lessons: [
    // ── Lesson 2-1: The Routing Logic (Conceptual) ───────────────────────────
    {
      id: "hld-l2-routing",
      title: "6. The Chain Jumper",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "With our two DFS arrays set up, we can now answer path queries. A query asks for the maximum node value on the path from u to v. The key insight: we don't walk node-by-node. We jump chain-by-chain.",
            "The routing loop: while head[u] ≠ head[v] (i.e., they're on different chains), we process the node that is on the deeper chain. We always bring the deepest node up.",
            "To 'process a chain segment': query the Segment Tree over the range [pos[head[u]], pos[u]]. This is the entire portion of u's chain from its head down to u — a contiguous segment in the 1D array, so a single O(log N) Segment Tree query handles it.",
            "After querying, we jump: set u = par[head[u]]. This moves u to the node immediately above its current chain's head — which is on a different (higher) chain. We've consumed one chain switch.",
            "The O(log N) guarantee kicks in here: each jump crosses a light edge, which means the remaining subtree at least doubles in size. So we make at most O(log N) jumps before landing on the same chain as v.",
            "Once head[u] == head[v], both nodes are on the same chain. We do one final Segment Tree query: [pos[min_depth], pos[max_depth]], where min_depth is the shallower of u and v (the LCA). Done.",
          ],
          takeaway:
            "The routing loop: always process the deeper chain first. Query the Segment Tree over the full chain segment, then jump to par[head[u]]. Repeat until both nodes are on the same chain, then do one final query. Total: O(log^2 N).",
        },
      },
    },

    // ── Challenge 2-2: The Chain Jumper ──────────────────────────────────────
    {
      id: "hld-c2-chain-jumper",
      title: "Code: The Chain Jumper",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given a tree of N nodes, each with a value val[u], and Q queries of the form `u v`, find the **maximum node value** on the simple path between u and v.\n\nImplement the full HLD pipeline:\n1. First DFS: compute depth, par, sz, heavy\n2. Second DFS: compute pos, head (visit heavy child first)\n3. Build a max Segment Tree over the flattened array\n4. For each query, use the HLD routing loop to answer in O(log^2 N)",
          inputFormat:
            "First line: N.\nSecond line: N integers — val[1], val[2], ..., val[N].\nNext N-1 lines: edges (u v).\nNext line: Q.\nNext Q lines: each contains two integers u v.",
          outputFormat: "Q lines, one integer per query: the max node value on the path.",
          sampleInput:
            "7\n1 5 3 8 2 7 4\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 6\n1 5\n7 4",
          sampleOutput: "8\n5\n8",
          constraints: [
            "1 ≤ N, Q ≤ 10^5",
            "1 ≤ val[u] ≤ 10^9",
            "Valid tree, 1-indexed, rooted at 1",
          ],
          hints: [
            {
              title: "Hint 1 — The routing loop",
              body: "while (head[u] != head[v]) { if (depth[head[u]] < depth[head[v]]) swap(u, v); result = max(result, st.query(pos[head[u]], pos[u])); u = par[head[u]]; }",
            },
            {
              title: "Hint 2 — The final query",
              body: "After the loop, u and v are on the same chain. The shallower node is the LCA. Query [pos[shallower], pos[deeper]] to get the max on the remaining segment.",
            },
            {
              title: "Hint 3 — MAXN for the Segment Tree",
              body: "The Segment Tree is built on a 1D array of size N (one slot per node). Use pos[] as the index. The Segment Tree should support point updates and range max queries.",
            },
          ],
          backendChallengeId: "hld_chain_jumper",
          sampleTestCases: [
            {
              label: "7-node tree (sample)",
              input:
                "7\n1 5 3 8 2 7 4\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 6\n1 5\n7 4",
              expected: "8\n5\n8",
            },
            {
              label: "Line graph",
              input: "5\n10 20 30 40 50\n1 2\n2 3\n3 4\n4 5\n2\n1 5\n2 4",
              expected: "50\n40",
            },
            {
              label: "Single edge",
              input: "2\n3 7\n1 2\n1\n1 2",
              expected: "7",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
        },
      },
    },
  ],
};
