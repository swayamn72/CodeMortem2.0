import type { ProblemGroup } from "./types";

// ── Starter code: clean I/O boilerplate, no segment tree logic ───────────────
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

// ── Reference boilerplate: generic (min, count) segment tree scaffold ─────────
const REFERENCE_CPP = `#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// Node stores (minimum value in range, count of elements equal to that minimum).
struct Node {
    ll mn;
    ll cnt;
};

// Identity element: merging with this leaves any valid result unchanged.
// LLONG_MAX loses every min comparison; count 0 contributes nothing.
Node IDENTITY = {LLONG_MAX, 0};

// Merge two nodes. Three cases:
//   left.mn < right.mn  →  left  (right cannot affect the minimum)
//   right.mn < left.mn  →  right
//   equal               →  (left.mn, left.cnt + right.cnt)
Node merge(Node a, Node b) {
    if (a.mn < b.mn) return a;
    if (b.mn < a.mn) return b;
    return {a.mn, a.cnt + b.cnt};
}

struct SegTree {
    int n;
    vector<Node> t;

    SegTree(int n) : n(n), t(4 * n, IDENTITY) {}

    void build(vector<ll>& a, int v, int s, int e) {
        if (s == e) { t[v] = {a[s], 1}; return; }
        int m = (s + e) / 2;
        build(a, 2*v, s, m);
        build(a, 2*v+1, m+1, e);
        t[v] = merge(t[2*v], t[2*v+1]);
    }

    void update(int v, int s, int e, int i, ll x) {
        if (s == e) { t[v] = {x, 1}; return; }
        int m = (s + e) / 2;
        if (i <= m) update(2*v, s, m, i, x);
        else        update(2*v+1, m+1, e, i, x);
        t[v] = merge(t[2*v], t[2*v+1]);
    }

    Node query(int v, int s, int e, int l, int r) {
        if (r < s || e < l) return IDENTITY;
        if (l <= s && e <= r) return t[v];
        int m = (s + e) / 2;
        return merge(query(2*v, s, m, l, r), query(2*v+1, m+1, e, l, r));
    }
};

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n, q; cin >> n >> q;
    vector<ll> a(n); for (auto& x : a) cin >> x;
    SegTree st(n);
    st.build(a, 1, 0, n-1);
    while (q--) {
        int t; cin >> t;
        if (t == 1) {
            int i; ll v; cin >> i >> v;
            st.update(1, 0, n-1, i, v);
        } else {
            int l, r; cin >> l >> r;
            auto [mn, cnt] = st.query(1, 0, n-1, l, r);
            cout << mn << " " << cnt << "\\n";
        }
    }
}`;

const REFERENCE_PYTHON = `import sys
input = sys.stdin.readline
sys.setrecursionlimit(300000)

INF = float('inf')

# Node: (min_value, count_of_min)
# Identity: (INF, 0)

def merge(a, b):
    if a[0] < b[0]: return a
    if b[0] < a[0]: return b
    return (a[0], a[1] + b[1])

class SegTree:
    def __init__(self, n):
        self.n = n
        self.t = [(INF, 0)] * (4 * n)

    def build(self, a, v, s, e):
        if s == e:
            self.t[v] = (a[s], 1)
            return
        m = (s + e) // 2
        self.build(a, 2*v, s, m)
        self.build(a, 2*v+1, m+1, e)
        self.t[v] = merge(self.t[2*v], self.t[2*v+1])

    def update(self, v, s, e, i, x):
        if s == e:
            self.t[v] = (x, 1)
            return
        m = (s + e) // 2
        if i <= m: self.update(2*v, s, m, i, x)
        else:      self.update(2*v+1, m+1, e, i, x)
        self.t[v] = merge(self.t[2*v], self.t[2*v+1])

    def query(self, v, s, e, l, r):
        if r < s or e < l: return (INF, 0)
        if l <= s and e <= r: return self.t[v]
        m = (s + e) // 2
        return merge(self.query(2*v, s, m, l, r), self.query(2*v+1, m+1, e, l, r))

def main():
    data = sys.stdin.read().split()
    ptr = 0
    n, q = int(data[ptr]), int(data[ptr+1]); ptr += 2
    a = [int(data[ptr+i]) for i in range(n)]; ptr += n
    st = SegTree(n)
    st.build(a, 1, 0, n-1)
    out = []
    for _ in range(q):
        t = int(data[ptr]); ptr += 1
        if t == 1:
            i, v = int(data[ptr]), int(data[ptr+1]); ptr += 2
            st.update(1, 0, n-1, i, v)
        else:
            l, r = int(data[ptr]), int(data[ptr+1]); ptr += 2
            mn, cnt = st.query(1, 0, n-1, l, r)
            out.append(f"{mn} {cnt}")
    print("\\n".join(out))

if __name__ == "__main__":
    main()`;

export const MIN_COUNT_PROBLEM: ProblemGroup = {
  partLabel: "Problem 1: Min + Count",

  lessons: [
    // ── Lesson 1: Motivation ──────────────────────────────────────────────────
    {
      id: "p1-motivation",
      title: "1. Why Standard Min Fails",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "You already know how to build a range-minimum segment tree. Each node stores one number — the minimum of its range. That works perfectly for queries like 'what is the min of arr[l..r]?'",
            "But now the problem changes slightly: you also need to count how many elements in [l, r] are equal to that minimum. Can you still answer this with the single-scalar tree you already know?",
            "Try it mentally. Build a min tree over [3, 1, 4, 1, 5, 9, 2, 6]. The root stores 1 (the global min). Query range [0, 3] — the answer is min=1, and there are 2 ones in that range.",
            "The min tree correctly returns 1 as the minimum. But it stores no count at all. You'd have to scan the range naively to count the 1s — that's O(N) per query and defeats the purpose.",
            "The fix is simple once you see it: instead of storing one number per node, store a pair — (minimum value, count of that minimum). Everything else about the segment tree stays the same.",
          ],
          takeaway:
            "A standard min tree cannot answer count queries. The solution is to extend each node from a scalar to a (min, count) pair. This is your first taste of 'augmented' segment trees — the core intermediate technique.",
        },
      },
    },

    // ── Lesson 2: Core Insight ────────────────────────────────────────────────
    {
      id: "p1-insight",
      title: "2. Node Design + Merge",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "Each node stores (mn, cnt): the minimum of its range and how many array elements in that range equal that minimum. A leaf node at index i stores (arr[i], 1).",
            "The entire problem reduces to one function: merge(left, right). Given the (mn, cnt) pairs for two children, produce the pair for the parent. There are exactly three cases.",
            "Case 1 — left.mn < right.mn: The overall minimum is left.mn. The right child's elements cannot possibly equal the minimum (they're all ≥ right.mn > left.mn). Return left unchanged.",
            "Case 2 — right.mn < left.mn: Mirror of Case 1. Return right unchanged.",
            "Case 3 — left.mn == right.mn: Both children share the same minimum. The count in the parent is the sum of both counts. Return (left.mn, left.cnt + right.cnt).",
            "Out-of-range queries must return a 'neutral' value that merges invisibly with any real result. For min, the neutral minimum is LLONG_MAX (it always loses a comparison). The neutral count is 0 (it adds nothing). So the identity is (LLONG_MAX, 0).",
            "Updates work identically to a standard min tree: update the leaf, then re-merge every ancestor. The count always resets to 1 at the leaf, since a single element trivially appears once.",
          ],
          takeaway:
            "merge(left, right) has three cases based on which side has the smaller min. The identity element (LLONG_MAX, 0) is what the query function returns when a node falls completely outside the queried range.",
        },
      },
    },

    // ── Lesson 3: Challenge ───────────────────────────────────────────────────
    {
      id: "p1-challenge",
      title: "3. Code It",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given an array A of N integers and Q queries. For each query:\n\n**Type 1 — Point update:** `1 i v` — set A[i] = v (0-indexed)\n**Type 2 — Range query:** `2 l r` — print the minimum value in A[l..r] and the count of elements equal to that minimum (0-indexed, inclusive)\n\nWrite a complete solution from scratch.",
          inputFormat:
            "First line: N Q\nSecond line: N space-separated integers (the array)\nNext Q lines: each is either `1 i v` or `2 l r`",
          outputFormat:
            "For each type-2 query, print two integers on one line: the minimum and its count.",
          sampleInput: "6 4\n3 1 4 1 5 9\n2 0 3\n1 1 7\n2 0 3\n2 2 5",
          sampleOutput: "1 2\n3 1\n4 1",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "-10⁹ ≤ A[i], v ≤ 10⁹",
            "0 ≤ i, l, r ≤ N-1 for all queries",
            "l ≤ r for type-2 queries",
          ],
          hints: [
            {
              title: "Hint 1 — What does each node store?",
              body: "A standard min tree stores one scalar per node. This problem needs the minimum AND how many times it appears in the range. A leaf for index i stores (arr[i], 1).",
            },
            {
              title: "Hint 2 — The merge function",
              body: "merge(left, right) has exactly three cases: if left.min < right.min return left; if right.min < left.min return right; if equal return (left.min, left.count + right.count). This single function handles build, update, and query uniformly.",
            },
            {
              title: "Hint 3 — Identity element for out-of-range",
              body: "When a query range doesn't overlap a node at all, return (LLONG_MAX, 0). LLONG_MAX loses every min comparison, so it can never corrupt a real result. Count 0 adds nothing when counts are summed.",
            },
          ],
          backendChallengeId: "min_count_segtree",
          sampleTestCases: [
            {
              label: "Basic — min with duplicates",
              input: "6 4\n3 1 4 1 5 9\n2 0 3\n1 1 7\n2 0 3\n2 2 5",
              expected: "1 2\n3 1\n4 1",
            },
            {
              label: "All equal elements",
              input: "4 2\n5 5 5 5\n2 0 3\n2 1 2",
              expected: "5 4\n5 2",
            },
            {
              label: "Update changes the min",
              input: "3 3\n10 20 30\n2 0 2\n1 0 5\n2 0 2",
              expected: "10 1\n5 1",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
        },
      },
    },
  ],
};
