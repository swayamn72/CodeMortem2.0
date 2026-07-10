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
          narrations: [],
          takeaway:
            "A standard min tree **cannot** answer count queries. The fix: extend each node from a scalar to a `(min, count)` pair. Everything else — build, update, query structure — stays identical. This is your first **augmented** segment tree.",
          blocks: [
            {
              kind: "text",
              text: "You already know how to build a **range-minimum segment tree**. Each node stores one number — the minimum of its range. That works perfectly for queries like _'what is the min of arr[l..r]?'_",
            },
            {
              kind: "text",
              text: "But now the problem changes slightly: you also need to count **how many elements** in [l, r] are equal to that minimum. Can you still answer this with the single-scalar tree you already know?",
            },
            {
              kind: "diagram",
              diagram:
                `Array:  [ 3,  1,  4,  1,  5,  9,  2,  6 ]
 Index:    0   1   2   3   4   5   6   7

Standard Min Tree (each node = one scalar):

             [0..7] = 1
           /           \\
      [0..3] = 1      [4..7] = 2
      /      \\         /       \\
  [0..1]=1 [2..3]=1 [4..5]=5 [6..7]=2
  /    \\   /    \\   ...
 [0]=3 [1]=1 [2]=4 [3]=1

Node [0..3] only knows its min is 1.
It has no idea both [0..1] and [2..3] contributed a 1.`,
              caption: "The standard min tree answers the minimum correctly, but stores nothing about how many times it appears",
            },
            {
              kind: "callout",
              variant: "gotcha",
              title: "The hidden cost of a naive count",
              body: "To count the 1s in [0..3] you'd have to scan all four elements — O(N) per query. With Q = 10^5 queries that's 10^10 operations. The whole point of a segment tree is to avoid exactly this.",
            },
            {
              kind: "text",
              text: "The fix is elegant: instead of storing **one** number per node, store a **pair** — `(minimum value, count of that minimum)`. The tree structure, build logic, and query traversal are completely unchanged.",
            },
            {
              kind: "diagram",
              diagram:
                `Augmented Min Tree — each node stores (min, count):

              [0..7] = (1, 2)         ← global min is 1, appears 2 times
           /                 \\
      [0..3] = (1, 2)      [4..7] = (2, 1)
      /           \\          /           \\
  [0..1]=(1,1) [2..3]=(1,1)  ...
  /        \\     /       \\
(3,1)    (1,1) (4,1)   (1,1)

Node [0..3] now perfectly merges its children.
It knows min is 1, and count is 1 + 1 = 2.`,
              caption: "Storing (min, count) pairs gives us both answers in one O(log N) query",
            },
            {
              kind: "callout",
              variant: "insight",
              title: "This is what 'augmented' means",
              body: "An augmented segment tree is any tree where nodes store a **richer struct** than a plain scalar, with a custom merge function to combine children. The (min, count) pair here is your first example — and the pattern generalises to dozens of problems.",
            },
          ],
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
          narrations: [],
          takeaway:
            "`merge(left, right)` has exactly **three cases** based on which side holds the smaller min. The identity element `(LLONG_MAX, 0)` is returned for out-of-range nodes — it wins no comparison and adds no count, so it's invisible to any real result.",
          blocks: [
            {
              kind: "text",
              text: "Each node stores `(mn, cnt)`: the minimum of its range and how many array elements in that range equal that minimum. A **leaf** at index `i` always stores `(arr[i], 1)` — one element, appearing once.",
            },
            {
              kind: "text",
              text: "The entire problem reduces to **one function**: `merge(left, right)`. Given the `(mn, cnt)` pairs of two children, produce the correct pair for their parent. There are exactly three cases — no more, no less.",
            },
            {
              kind: "diagram",
              diagram:
                `The Three Merge Cases:

  Case 1 — left.mn < right.mn:
    Parent = left  (right's elements are all > left.mn, can't affect the min)
    Example: merge( (1, 2), (3, 1) )  →  (1, 2)

  Case 2 — right.mn < left.mn:
    Parent = right  (mirror of Case 1)
    Example: merge( (4, 1), (1, 3) )  →  (1, 3)

  Case 3 — left.mn == right.mn:
    Both sides share the minimum — sum the counts
    Parent = (left.mn, left.cnt + right.cnt)
    Example: merge( (1, 2), (1, 1) )  →  (1, 3)`,
              caption: "Three cases, derived purely from which child holds the smaller minimum",
            },
            {
              kind: "code",
              language: "C++",
              code:
                `struct Node { long long mn, cnt; };

Node merge(Node a, Node b) {
    if (a.mn < b.mn) return a;          // Case 1: left wins
    if (b.mn < a.mn) return b;          // Case 2: right wins
    return {a.mn, a.cnt + b.cnt};       // Case 3: tie — sum counts
}`,
            },
            {
              kind: "callout",
              variant: "rule",
              title: "The Identity Element",
              body: "Out-of-range query nodes must return a value that is invisible to merge. For min-count: `(LLONG_MAX, 0)`. LLONG_MAX loses every comparison (never becomes the minimum), and count 0 adds nothing when counts are summed.",
            },
            {
              kind: "text",
              text: "**Updates** work identically to a standard min tree: descend to the target leaf, set `(new_value, 1)`, then re-merge every ancestor on the way back up. The count resets to 1 at the leaf — a single element trivially appears once.",
            },
            {
              kind: "callout",
              variant: "insight",
              title: "One merge function rules them all",
              body: "The same `merge` function is called identically in `build`, `update`, and `query`. You only write it once. This uniformity — one struct, one merge — is the hallmark of augmented segment trees and scales to far more complex node types.",
            },
          ],
        },
      },
    },

    // ── Lesson 3: Challenge ───────────────────────────────────────────────────
    {
      id: "p1-challenge",
      title: "3. Implement Min-Count Tree",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given an array A of N integers and Q queries. For each query:\n\n**Type 1 — Point update:** `1 i v` — set A[i] = v (0-indexed)\n**Type 2 — Range query:** `2 l r` — print the minimum value in A[l..r] and the count of elements equal to that minimum (0-indexed, inclusive)\n\nWrite a complete solution from scratch.",
          inputFormat:
            "First line: N Q\nSecond line: N space-separated integers (the array)\nNext Q lines: each is either `1 i v` or `2 l r`",
          outputFormat:
            "For each type-2 query, print two integers on one line: the minimum and its count.",
          sampleInput: "6 5\n3 1 4 1 5 9\n2 0 3\n1 1 7\n1 3 8\n2 0 3\n2 2 5",
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
              input: "6 5\n3 1 4 1 5 9\n2 0 3\n1 1 7\n1 3 8\n2 0 3\n2 2 5",
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
          editorial: `The Concept
A standard segment tree designed for range minimum queries stores a single scalar value per node (the minimum). To also track the frequency of that minimum, we simply expand the node's state to store a pair: \`{minimum_value, count}\`.

Base Case (Leaves)
For a leaf node representing a single element \`v\` at index \`i\`, the state is \`{v, 1}\`. The minimum is the element itself, and it appears exactly once.

The Merge Logic (Transitions)
When merging a left child and a right child to compute the parent's state, there are exactly three scenarios:

Left is strictly smaller: The parent inherits the minimum and the count entirely from the left child.

Right is strictly smaller: The parent inherits the minimum and the count entirely from the right child.

Both minimums are equal: The parent's minimum remains the same, but its count becomes the sum of both children's counts (\`left.count + right.count\`).

The Identity Element
During a range query, if the current node's range falls completely outside the query range, we must return a value that will not affect the final answer. Returning \`{LLONG_MAX, 0}\` ensures that this dummy node loses any minimum comparison and adds 0 to the frequency count.

C++ Solution
\`\`\`cpp
#include <iostream>
#include <vector>
#include <climits>

using namespace std;

// The expanded state
struct Node {
    long long min_val;
    int count;
};

vector<Node> tree;
vector<long long> arr;

// The core logic handling all 3 transition cases uniformly
Node mergeNodes(Node left, Node right) {
    if (left.min_val < right.min_val) return left;
    if (right.min_val < left.min_val) return right;
    return {left.min_val, left.count + right.count};
}

void build(int node, int start, int end) {
    if (start == end) {
        tree[node] = {arr[start], 1}; // Base case: leaf
        return;
    }
    int mid = start + (end - start) / 2;
    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);
    tree[node] = mergeNodes(tree[2 * node], tree[2 * node + 1]);
}

void update(int node, int start, int end, int idx, long long val) {
    if (start == end) {
        tree[node] = {val, 1}; // Point update
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

Node query(int node, int start, int end, int l, int r) {
    if (r < start || end < l) {
        return {LLONG_MAX, 0}; // Complete miss: identity element
    }
    if (l <= start && end <= r) {
        return tree[node]; // Complete cover
    }
    
    // Partial cover
    int mid = start + (end - start) / 2;
    Node left_res = query(2 * node, start, mid, l, r);
    Node right_res = query(2 * node + 1, mid + 1, end, l, r);
    
    return mergeNodes(left_res, right_res);
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, q;
    cin >> n >> q;

    arr.resize(n);
    tree.resize(4 * n);

    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }

    build(1, 0, n - 1);

    while (q--) {
        int type;
        cin >> type;
        if (type == 1) {
            int i;
            long long v;
            cin >> i >> v;
            update(1, 0, n - 1, i, v);
        } else {
            int l, r;
            cin >> l >> r;
            Node res = query(1, 0, n - 1, l, r);
            cout << res.min_val << " " << res.count << "\\n";
        }
    }
    return 0;
}
\`\`\`
`,
        },
      },
    },
  ],
};
