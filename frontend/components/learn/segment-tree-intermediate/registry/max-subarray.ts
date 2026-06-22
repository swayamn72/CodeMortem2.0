import type { ProblemGroup } from "./types";

// ── Starter code: clean I/O boilerplate ──────────────────────────────────────
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

// ── Reference boilerplate: (total, pref, suf, best) segment tree ─────────────
const REFERENCE_CPP = `#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// Each node stores four values needed to merge adjacent ranges correctly.
// Without pref and suf, the crossing case (left.suf + right.pref) is uncomputable.
struct Node {
    ll total; // sum of all elements in this range
    ll pref;  // best subarray sum starting at the left edge
    ll suf;   // best subarray sum ending at the right edge
    ll best;  // best subarray sum anywhere in this range (answer)
};

// Empty subarray is allowed (answer ≥ 0), so leaf values clamp at 0.
Node makeLeaf(ll v) {
    ll m = max(0LL, v);
    return {v, m, m, m};
}

// Merge two adjacent nodes. The key insight: best can be left.best, right.best,
// or the crossing case left.suf + right.pref.
Node merge(Node L, Node R) {
    Node res;
    res.total = L.total + R.total;
    res.pref  = max(L.pref, L.total + R.pref);
    res.suf   = max(R.suf,  R.total + L.suf);
    res.best  = max({L.best, R.best, L.suf + R.pref});
    return res;
}

struct SegTree {
    int n;
    vector<Node> t;

    SegTree(int n) : n(n), t(4 * n) {}

    void build(vector<ll>& a, int v, int s, int e) {
        if (s == e) { t[v] = makeLeaf(a[s]); return; }
        int m = (s + e) / 2;
        build(a, 2*v, s, m);
        build(a, 2*v+1, m+1, e);
        t[v] = merge(t[2*v], t[2*v+1]);
    }

    void update(int v, int s, int e, int i, ll x) {
        if (s == e) { t[v] = makeLeaf(x); return; }
        int m = (s + e) / 2;
        if (i <= m) update(2*v, s, m, i, x);
        else        update(2*v+1, m+1, e, i, x);
        t[v] = merge(t[2*v], t[2*v+1]);
    }

    // Note: for this problem we only need the global best (root query).
    // A range query version is identical but returns merge of sub-results.
};

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n, m; cin >> n >> m;
    vector<ll> a(n); for (auto& x : a) cin >> x;
    SegTree st(n);
    st.build(a, 1, 0, n-1);
    cout << st.t[1].best << "\\n";
    while (m--) {
        int i; ll v; cin >> i >> v;
        st.update(1, 0, n-1, i, v);
        cout << st.t[1].best << "\\n";
    }
}`;

const REFERENCE_PYTHON = `import sys
input = sys.stdin.readline

def make_leaf(v):
    m = max(0, v)
    return (v, m, m, m)  # (total, pref, suf, best)

def merge(L, R):
    total = L[0] + R[0]
    pref  = max(L[1], L[0] + R[1])
    suf   = max(R[2], R[0] + L[2])
    best  = max(L[3], R[3], L[2] + R[1])
    return (total, pref, suf, best)

class SegTree:
    def __init__(self, n):
        self.n = n
        self.t = [(0, 0, 0, 0)] * (4 * n)

    def build(self, a, v, s, e):
        if s == e:
            self.t[v] = make_leaf(a[s])
            return
        m = (s + e) // 2
        self.build(a, 2*v, s, m)
        self.build(a, 2*v+1, m+1, e)
        self.t[v] = merge(self.t[2*v], self.t[2*v+1])

    def update(self, v, s, e, i, x):
        if s == e:
            self.t[v] = make_leaf(x)
            return
        m = (s + e) // 2
        if i <= m: self.update(2*v, s, m, i, x)
        else:      self.update(2*v+1, m+1, e, i, x)
        self.t[v] = merge(self.t[2*v], self.t[2*v+1])

def main():
    data = sys.stdin.read().split()
    ptr = 0
    n, m = int(data[ptr]), int(data[ptr+1]); ptr += 2
    a = [int(data[ptr+i]) for i in range(n)]; ptr += n
    st = SegTree(n)
    st.build(a, 1, 0, n-1)
    out = [str(st.t[1][3])]
    for _ in range(m):
        i, v = int(data[ptr]), int(data[ptr+1]); ptr += 2
        st.update(1, 0, n-1, i, v)
        out.append(str(st.t[1][3]))
    print("\\n".join(out))

if __name__ == "__main__":
    main()`;

export const MAX_SUBARRAY_PROBLEM: ProblemGroup = {
  partLabel: "Problem 2: Max Subarray Sum",

  lessons: [
    // ── Lesson 1: Motivation ──────────────────────────────────────────────────
    {
      id: "p2-motivation",
      title: "4. Why a Scalar Per Node Fails",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "The classic Kadane's algorithm finds the maximum subarray sum in O(N). But what if you also need to handle point updates — after each update, print the new maximum subarray sum? Kadane's is O(N) per update, giving O(N·M) total — TLE for large inputs.",
            "A segment tree feels like the right tool. Let's try the naive approach: each node stores the best subarray sum within its range. Can we merge two children correctly?",
            "Consider children covering [0,3] (best = 4) and [4,7] (best = 6). The parent's best is not simply max(4, 6) = 6. The optimal subarray might cross the midpoint — e.g. the best suffix of the left child combined with the best prefix of the right child.",
            "Concretely: array [-2, 1, -3, 4, -1, 2, 1, -5]. Left half best = 4 (just [4]). Right half best = 2 (just [2]). But the global best is 6: [4, -1, 2, 1] — crossing the boundary. A scalar per node cannot capture this.",
            "The fix: each node must store enough information to compute the crossing case. Specifically, it needs the best suffix of its range (subarray ending at the right edge) and the best prefix (subarray starting at the left edge). With those, the parent can compute max(left.best, right.best, left.suf + right.pref).",
          ],
          takeaway:
            "A single 'best' per node is insufficient because the optimal subarray can cross the boundary between children. You need prefix and suffix information per node to enable correct merging.",
        },
      },
    },

    // ── Lesson 2: Core Insight ────────────────────────────────────────────────
    {
      id: "p2-insight",
      title: "5. Four Values Per Node",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "Each node stores four values: (total, pref, suf, best). total = sum of all elements. pref = best subarray starting at the left edge. suf = best subarray ending at the right edge. best = best subarray anywhere.",
            "For a leaf with value v: total = v. pref = suf = best = max(0, v). The max(0, v) clamps handle the empty subarray: the problem says the subarray may be empty, so the minimum answer is 0. A negative leaf contributes 0, not a negative number.",
            "The merge formulas derive from first principles:\ntotal = L.total + R.total  (straightforward sum)\npref  = max(L.pref,  L.total + R.pref)  ← either stay inside left, or take all of left plus the best prefix of right\nsuf   = max(R.suf,   R.total + L.suf)   ← mirror of pref\nbest  = max(L.best, R.best, L.suf + R.pref)  ← three cases",
            "For updates: update the leaf using makeLeaf(new_value), then re-merge all ancestors exactly as in any other segment tree. The query is always the global best, which is just tree_root.best — no range query needed.",
            "The crossing case L.suf + R.pref is the only case that requires storing all four fields. Remove pref and suf from the node and you can no longer compute the parent's best — which is exactly why a scalar-per-node fails.",
          ],
          takeaway:
            "The four-field node (total, pref, suf, best) is the minimal information needed to merge two adjacent ranges. The crossing case L.suf + R.pref is what makes the merge possible. This pattern generalises to many problems that ask for 'best contiguous substructure'.",
        },
      },
    },

    // ── Lesson 3: Challenge ───────────────────────────────────────────────────
    {
      id: "p2-challenge",
      title: "6. Code It",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given an array A of N integers, support M point updates. After each update (and before any), print the maximum subarray sum.\n\n**Empty subarray is allowed**, so the answer is always ≥ 0.\n\nWrite a complete solution from scratch.",
          inputFormat:
            "First line: N M\nSecond line: N space-separated integers (the initial array)\nNext M lines: each is `i v` — set A[i] = v (0-indexed)",
          outputFormat:
            "M+1 lines: the maximum subarray sum before any updates, then after each update.",
          sampleInput: "5 3\n-2 1 -3 4 -1\n2 2\n0 5\n4 3",
          sampleOutput: "4\n4\n8\n8",
          constraints: [
            "1 ≤ N, M ≤ 10⁵",
            "-10⁹ ≤ A[i], v ≤ 10⁹",
            "0 ≤ i ≤ N-1 for all updates",
          ],
          hints: [
            {
              title: "Hint 1 — Why one number per node is not enough",
              body: "The best subarray can cross the midpoint between two children. To compute this crossing case, the parent needs the best suffix of the left child and the best prefix of the right child. Store four values per node: total, pref, suf, best.",
            },
            {
              title: "Hint 2 — The merge formulas",
              body: "total = L.total + R.total. pref = max(L.pref, L.total + R.pref). suf = max(R.suf, R.total + L.suf). best = max(L.best, R.best, L.suf + R.pref). Derive each one by asking: what are the options for a prefix/suffix/best that involves both halves?",
            },
            {
              title: "Hint 3 — Leaf values and the empty subarray",
              body: "For a leaf with value v: total = v, pref = suf = best = max(0, v). The max(0, v) bakes in the empty subarray rule. You never need a special 'is all negative?' check — the leaf handles it. The global answer is always tree_root.best.",
            },
          ],
          backendChallengeId: "max_subarray_segtree",
          sampleTestCases: [
            {
              label: "Basic — crossing boundary",
              input: "5 3\n-2 1 -3 4 -1\n2 2\n0 5\n4 3",
              expected: "4\n4\n8\n8",
            },
            {
              label: "All negative — empty subarray",
              input: "3 1\n-5 -3 -8\n1 -1",
              expected: "0\n0",
            },
            {
              label: "Update improves answer",
              input: "4 2\n1 2 3 4\n0 10\n3 -1",
              expected: "10\n19\n18",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
        },
      },
    },
  ],
};
