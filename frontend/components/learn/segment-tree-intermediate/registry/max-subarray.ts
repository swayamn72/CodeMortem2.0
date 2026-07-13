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
    // ── Lesson 1: Motivation ─────────────────────────────────────────────────────
    {
      id: "p2-motivation",
      title: "4. Why a Scalar Per Node Fails",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "A single `best` per node is **not enough** because the optimal subarray can cross the boundary between children. You need `pref` and `suf` per node so the parent can evaluate the **crossing case**: `left.suf + right.pref`.",
          blocks: [
            {
              kind: "text",
              text: "The classic **Kadane's algorithm** finds the maximum subarray sum in O(N). But what if the array also has point updates? Kadane's is O(N) per update — O(N×M) total. For N = M = 10^5 that's 10^10 operations — instant TLE.",
            },
            {
              kind: "text",
              text: "A segment tree sounds like the right tool. Let's try the naive approach first: store the **best subarray sum** in each node's range. Can we merge two children correctly?",
            },
            {
              kind: "code",
              language: "C++",
              code:
                `// Naive attempt: storing only the best sum
struct Node {
    long long best;
};

Node merge(Node left, Node right) {
    // We can take the best from the left, or the best from the right...
    long long ans = max(left.best, right.best);
    
    // BUT what if the true best subarray starts in 'left' and ends in 'right'?
    // e.g., the suffix of left + the prefix of right.
    // We don't have enough information to calculate this!
    
    return {ans}; // ❌ Fails on crossing subarrays
}`,
            },
            {
              kind: "callout",
              variant: "gotcha",
              title: "Why 'best' alone is insufficient",
              body: "To compute the crossing case `left.suf + right.pref`, you need the best **suffix** of the left child and the best **prefix** of the right child. These are not derivable from the children's `best` values alone. You must store them explicitly.",
            },
            {
              kind: "text",
              text: "The fix: each node stores **four values** instead of one. With `(total, pref, suf, best)`, the parent can always compute the crossing case exactly. Kadane's answer with updates becomes O(log N) per update.",
            },
            {
              kind: "diagram",
              diagram:
                `**A node covering range [s..e] stores:**

  \`total\`  —  sum of all elements in \`[s..e]\`
  \`pref\`   —  max sum of any subarray starting at \`s\`   _(arr[s..k] for any k ≤ e)_
  \`suf\`    —  max sum of any subarray ending   at \`e\`   _(arr[k..e] for any k ≥ s)_
  \`best\`   —  max sum of any subarray anywhere in \`[s..e]\`

_With these four values, merge can compute the parent's four values_
_for any two adjacent children in O(1)._`,
              caption: "The minimal information needed to merge two adjacent ranges correctly",
            },
          ],
        },
      },
    },

    // ── Lesson 2: Core Insight ─────────────────────────────────────────────────
    {
      id: "p2-insight",
      title: "5. Four Values Per Node",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "The four-field node `(total, pref, suf, best)` is the **minimal** information needed to merge two adjacent ranges. The crossing case `L.suf + R.pref` is what makes it possible. Remove `pref`/`suf` and you can no longer compute the parent's `best`.",
          blocks: [
            {
              kind: "text",
              text: "Each node stores four values: **`total`** (sum of all elements), **`pref`** (best subarray starting at the left edge), **`suf`** (best subarray ending at the right edge), **`best`** (best subarray anywhere in the range).",
            },
            {
              kind: "text",
              text: "For a **leaf** with value `v`: `total = v`. `pref = suf = best = max(0, v)`. The `max(0, v)` handles the empty subarray rule — if `v` is negative, we prefer the empty subarray (sum 0) over including it.",
            },
            {
              kind: "diagram",
              diagram:
                `**Merge formulas — derived from first principles:**

  \`res.total = L.total + R.total\`
  └─ _trivial: sum of both halves_

  \`res.pref = max( L.pref,  L.total + R.pref )\`
  └─ _best prefix either stays inside left, OR takes ALL of left + best prefix of right_

  \`res.suf  = max( R.suf,   R.total + L.suf  )\`
  └─ _mirror of pref, but from the right edge_

  \`res.best = max( L.best,  R.best,  L.suf + R.pref )\`
  └─ _three options: entirely in left, entirely in right, or crossing the midpoint_`,
              caption: "Each formula has a clear geometric meaning — derive them once, remember the pattern forever",
            },
            {
              kind: "code",
              language: "C++",
              code:
                `struct Node { long long total, pref, suf, best; };

Node makeLeaf(long long v) {
    long long m = max(0LL, v);
    return {v, m, m, m};   // total=v, pref=suf=best=max(0,v)
}

Node merge(Node L, Node R) {
    Node res;
    res.total = L.total + R.total;
    res.pref  = max(L.pref, L.total + R.pref);
    res.suf   = max(R.suf,  R.total + L.suf);
    res.best  = max({L.best, R.best, L.suf + R.pref});
    return res;
}`,
            },
            {
              kind: "text",
              text: "For **updates**: call `makeLeaf(new_value)` at the target leaf, then re-merge every ancestor. The global answer is always `tree_root.best` — no range query needed, just read the root.",
            },
            {
              kind: "callout",
              variant: "insight",
              title: "The crossing case is the key insight",
              body: "`L.suf + R.pref` is the only case that requires storing all four fields. Without `pref` and `suf`, you cannot compute the parent's `best` when the optimal subarray crosses the midpoint. This pattern — storing boundary information to enable crossing — generalises to many tree problems.",
            },
          ],
        },
      },
    },

    // ── Lesson 3: Challenge ───────────────────────────────────────────────────
    {
      id: "p2-challenge",
      title: "6. Implement Max Subarray Tree",
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
              expected: "4\n7\n12\n15",
            },
            {
              label: "All negative — empty subarray",
              input: "3 1\n-5 -3 -8\n1 -1",
              expected: "0\n0",
            },
            {
              label: "Update improves answer",
              input: "4 2\n1 2 3 4\n0 10\n3 -1",
              expected: "10\n19\n15",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
          editorial: `The standard segment tree storing only the maximum subarray sum fails because the optimal subarray might cross the boundary between the left and right halves. To resolve this and enable proper merging, we expand the node's state to maintain four properties for its segment: the total segment sum (sum), the maximum prefix sum (pref), the maximum suffix sum (suff), and the overall maximum subarray sum (ans).

**Base Case (Leaves)**
For a leaf node representing a single element at index \`i\` with value \`v\`, the total sum is simply \`v\`. Because the problem explicitly states that empty subarrays are allowed (meaning the answer must be \`>= 0\`), the prefix, suffix, and overall maximum answers are bounded to at least 0. Thus, the leaf state is initialized as:
\`{v, max(0, v), max(0, v), max(0, v)}\`

**The Merge Logic (Transitions)**
When merging a left child and a right child to compute the parent's state, we must update all four properties:

1. **sum**: The total sum is the sum of both halves (\`left.sum + right.sum\`).
2. **pref**: The maximum prefix sum can either come entirely from the left child, or it can span across the left child completely and include the maximum prefix of the right child (\`max(left.pref, left.sum + right.pref)\`).
3. **suff**: Similarly, the maximum suffix sum is either the right child's suffix, or the entire right child plus the left child's suffix (\`max(right.suff, right.sum + left.suff)\`).
4. **ans**: The maximum subarray sum for the parent can be entirely in the left child, entirely in the right child, or it can cross the boundary between them. If it crosses the boundary, it must be the combination of the left child's maximum suffix and the right child's maximum prefix (\`max(left.ans, right.ans, left.suff + right.pref)\`).

By maintaining these four properties, every node contains enough information to correctly compute the optimal subarray sum for its segment in \`O(1)\` time during the merge step, leading to \`O(N)\` build time and \`O(log N)\` updates.

\`\`\`cpp
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

struct Node {
    long long sum;
    long long pref;
    long long suff;
    long long ans;
};

const int MAXN = 100005;
Node tree[4 * MAXN];
long long arr[MAXN];

Node make_node(long long val) {
    Node res;
    res.sum = val;
    res.pref = max(0LL, val);
    res.suff = max(0LL, val);
    res.ans = max(0LL, val);
    return res;
}

Node mergeNodes(Node left, Node right) {
    Node res;
    res.sum = left.sum + right.sum;
    res.pref = max(left.pref, left.sum + right.pref);
    res.suff = max(right.suff, right.sum + left.suff);
    res.ans = max({left.ans, right.ans, left.suff + right.pref});
    return res;
}

void build(int node, int start, int end) {
    if (start == end) {
        tree[node] = make_node(arr[start]);
        return;
    }
    int mid = start + (end - start) / 2;
    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);
    tree[node] = mergeNodes(tree[2 * node], tree[2 * node + 1]);
}

void update(int node, int start, int end, int idx, long long val) {
    if (start == end) {
        arr[idx] = val;
        tree[node] = make_node(val);
        return;
    }
    int mid = start + (end - start) / 2;
    if (idx <= mid) {
        update(2 * node, start, mid, idx, val);
    } else {
        update(2 * node + 1, mid + 1, end, idx, val);
    }
    tree[node] = mergeNodes(tree[2 * node], tree[2 * node + 1]);
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;

    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }

    build(1, 0, n - 1);
    
    cout << tree[1].ans << "\\n";

    while (m--) {
        int i;
        long long v;
        cin >> i >> v;
        update(1, 0, n - 1, i, v);
        cout << tree[1].ans << "\\n";
    }

    return 0;
}
\`\`\``,
        },
      },
    },
  ],
};
