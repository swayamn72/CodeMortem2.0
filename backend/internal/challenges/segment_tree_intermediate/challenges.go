// Package segment_tree_intermediate registers learning-path challenges for the
// Segment Tree Intermediate course.
//
// Test breakdown for each challenge (20 tests):
//
//	Tests 0-4:   Small   (N ≤ 10,    Q ≤ 10)    — basic correctness
//	Tests 5-14:  Medium  (N ≤ 1000,  Q ≤ 1000)  — logic & edge cases
//	Tests 15-19: Large   (N = 100k,  Q = 100k)   — performance / TLE detection
//
// Time limit is 1500ms. An O(N log N) segment tree on N=Q=100k runs in ~80ms.
// An O(N²) brute force on the large tier (~15s) will reliably receive TLE.
package segment_tree_intermediate

import "codemortem/internal/challenges"

func init() {
	registerMinCountSegTree()
	registerMaxSubarraySegTree()
	registerLazyRangeAddSumSegTree()
	registerLazyRangeAssignSumSegTree()
	registerLazyRangeAddMinSegTree()
	registerLazyRangeAssignMaxSubSegTree()
}

// Standard whitespace-insensitive token checker.
const tokenCheckerPy = `
import sys

sections = sys.stdin.read().split("---SECTION---\n")
# sections[0] = input, sections[1] = expected, sections[2] = actual
expected_tokens = sections[1].split()
actual_tokens   = sections[2].split()

if expected_tokens != actual_tokens:
    exp_str = " ".join(expected_tokens[:10])
    act_str = " ".join(actual_tokens[:10])
    print(f"Wrong Answer\nExpected: {exp_str}\nGot:      {act_str}")
    sys.exit(1)

print("Accepted")
sys.exit(0)
`

// ── Min + Count Segment Tree ──────────────────────────────────────────────────
//
// Problem: Given N integers, support:
//   - Type 1 i v : point update — set arr[i] = v  (0-indexed)
//   - Type 2 l r : range query  — print minimum and count of elements equal
//     to the minimum over arr[l..r] (0-indexed, inclusive)
//
// Output for every type-2 query: "min count\n"
// Brute force: O(N) per query → TLE on large tier.
// Expected: segment tree storing (min, count) pairs → O(log N) per operation.

func registerMinCountSegTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "min_count_segtree",
		Name:       "Min + Count Range Query",
		CourseSlug: "segment-tree-intermediate",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(2, 10)
    q = rng.randint(1, 10)
    lo, hi = -5, 5
elif seed < 15:
    n = rng.randint(100, 1000)
    q = rng.randint(100, 1000)
    lo, hi = -50, 50
else:
    # Large tier — brute force O(N*Q) will TLE (~10^10 ops)
    n = 100000
    q = 100000
    lo, hi = -100, 100

a = [rng.randint(lo, hi) for _ in range(n)]
print(n, q)
print(*a)
for _ in range(q):
    # For large tests, heavily favor range queries and make them massive
    if seed >= 15:
        t = 2 if rng.random() < 0.95 else 1
    else:
        t = rng.randint(1, 2)
        
    if t == 1:
        idx = rng.randint(0, n - 1)
        val = rng.randint(lo, hi)
        print(1, idx, val)
    else:
        if seed >= 15:
            # Force massive ranges (length ~99,000+) to reliably TLE brute forces
            l = rng.randint(0, 100)
            r = rng.randint(n - 100, n - 1)
        else:
            l = rng.randint(0, n - 1)
            r = rng.randint(l, n - 1)
        print(2, l, r)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct Node { ll mn; ll cnt; };

Node merge(Node a, Node b) {
    if (a.mn < b.mn) return a;
    if (b.mn < a.mn) return b;
    return {a.mn, a.cnt + b.cnt};
}

const int MAXN = 4e5 + 5;
Node seg[MAXN];
int n, q;

void build(vector<ll>& a, int v, int s, int e) {
    if (s == e) { seg[v] = {a[s], 1}; return; }
    int m = (s + e) / 2;
    build(a, 2*v, s, m);
    build(a, 2*v+1, m+1, e);
    seg[v] = merge(seg[2*v], seg[2*v+1]);
}

void upd(int v, int s, int e, int i, ll x) {
    if (s == e) { seg[v] = {x, 1}; return; }
    int m = (s + e) / 2;
    if (i <= m) upd(2*v, s, m, i, x);
    else        upd(2*v+1, m+1, e, i, x);
    seg[v] = merge(seg[2*v], seg[2*v+1]);
}

Node qry(int v, int s, int e, int l, int r) {
    if (r < s || e < l) return {LLONG_MAX, 0};
    if (l <= s && e <= r) return seg[v];
    int m = (s + e) / 2;
    return merge(qry(2*v, s, m, l, r), qry(2*v+1, m+1, e, l, r));
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    cin >> n >> q;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    build(a, 1, 0, n-1);
    while (q--) {
        int t; cin >> t;
        if (t == 1) {
            int i; ll v; cin >> i >> v;
            upd(1, 0, n-1, i, v);
        } else {
            int l, r; cin >> l >> r;
            auto [mn, cnt] = qry(1, 0, n-1, l, r);
            cout << mn << " " << cnt << "\n";
        }
    }
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1500,
		MemLimitKB:  262144,
	})
}

// ── Max Subarray Sum Segment Tree ─────────────────────────────────────────────
//
// Problem: Given N integers. After each point update (and before any), print
// the maximum subarray sum. Empty subarray is allowed, so the answer is ≥ 0.
//
//   - First line of output: initial max subarray sum (before any updates).
//   - Then one line per update: max subarray sum after each update.
//
// Input format:
//
//	N M
//	A[0] ... A[N-1]
//	M lines: "i v"   (set A[i] = v, 0-indexed)
//
// Brute force: O(N) scan after each update → TLE on large tier.
// Expected: segment tree storing (total, pref, suf, best) → O(log N) per update.

func registerMaxSubarraySegTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "max_subarray_segtree",
		Name:       "Max Subarray Sum with Updates",
		CourseSlug: "segment-tree-intermediate",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(2, 10)
    m = rng.randint(1, 10)
    lo, hi = -50, 50
elif seed < 15:
    n = rng.randint(100, 1000)
    m = rng.randint(100, 1000)
    lo, hi = -10**6, 10**6
else:
    # Large tier — brute force O(N*M) will TLE
    n = 100000
    m = 100000
    lo, hi = -10**9, 10**9

a = [rng.randint(lo, hi) for _ in range(n)]
print(n, m)
print(*a)
for _ in range(m):
    idx = rng.randint(0, n - 1)
    val = rng.randint(lo, hi)
    print(idx, val)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct Node { ll total, pref, suf, best; };

Node makeLeaf(ll v) {
    ll m = max(0LL, v);
    return {v, m, m, m};
}

Node merge(Node L, Node R) {
    Node res;
    res.total = L.total + R.total;
    res.pref  = max(L.pref, L.total + R.pref);
    res.suf   = max(R.suf,  R.total + L.suf);
    res.best  = max({L.best, R.best, L.suf + R.pref});
    return res;
}

const int MAXN = 4e5 + 5;
Node seg[MAXN];
int n, m;

void build(vector<ll>& a, int v, int s, int e) {
    if (s == e) { seg[v] = makeLeaf(a[s]); return; }
    int mid = (s + e) / 2;
    build(a, 2*v, s, mid);
    build(a, 2*v+1, mid+1, e);
    seg[v] = merge(seg[2*v], seg[2*v+1]);
}

void upd(int v, int s, int e, int i, ll x) {
    if (s == e) { seg[v] = makeLeaf(x); return; }
    int mid = (s + e) / 2;
    if (i <= mid) upd(2*v, s, mid, i, x);
    else          upd(2*v+1, mid+1, e, i, x);
    seg[v] = merge(seg[2*v], seg[2*v+1]);
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    cin >> n >> m;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    build(a, 1, 0, n-1);
    cout << seg[1].best << "\n";
    while (m--) {
        int i; ll v; cin >> i >> v;
        upd(1, 0, n-1, i, v);
        cout << seg[1].best << "\n";
    }
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1500,
		MemLimitKB:  262144,
	})
}

// ── Lazy Propagation: Range Add / Range Sum ──────────────────────────────────
//
// Problem: Given N integers and Q queries:
//   - Type 1 l r v: range add — add v to arr[l..r]
//   - Type 2 l r: range sum — print sum of arr[l..r]
//
// Brute force: O(N*Q) -> TLE
// Expected: segment tree with lazy propagation (addition tags) -> O(log N) per op

func registerLazyRangeAddSumSegTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "lazy_range_add_sum",
		Name:       "Range Add / Range Sum",
		CourseSlug: "segment-tree-intermediate",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(2, 10)
    q = rng.randint(1, 10)
    lo, hi = -5, 5
elif seed < 15:
    n = rng.randint(100, 1000)
    q = rng.randint(100, 1000)
    lo, hi = -50, 50
else:
    # Large tier — brute force O(N*Q) will TLE
    n = 100000
    q = 100000
    lo, hi = -100, 100

a = [rng.randint(lo, hi) for _ in range(n)]
print(n, q)
print(*a)
for _ in range(q):
    if seed >= 15:
        # Favor large range operations for massive tests
        t = 2 if rng.random() < 0.5 else 1
        # Force massive ranges (length ~99,000+) to reliably TLE brute forces
        l = rng.randint(0, 100)
        r = rng.randint(n - 100, n - 1)
    else:
        t = rng.randint(1, 2)
        l = rng.randint(0, n - 1)
        r = rng.randint(l, n - 1)
    
    if t == 1:
        val = rng.randint(lo, hi)
        print(1, l, r, val)
    else:
        print(2, l, r)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int MAXN = 1e5 + 5;
ll tree_arr[4 * MAXN], lazy[4 * MAXN];

void push(int v, int s, int e) {
    if (lazy[v] == 0) return;
    int m = (s + e) / 2;
    tree_arr[2*v] += lazy[v] * (m - s + 1);
    lazy[2*v] += lazy[v];
    tree_arr[2*v+1] += lazy[v] * (e - m);
    lazy[2*v+1] += lazy[v];
    lazy[v] = 0;
}

void build(const vector<ll>& a, int v, int s, int e) {
    if (s == e) { tree_arr[v] = a[s]; return; }
    int m = (s + e) / 2;
    build(a, 2*v, s, m);
    build(a, 2*v+1, m+1, e);
    tree_arr[v] = tree_arr[2*v] + tree_arr[2*v+1];
}

void upd(int v, int s, int e, int l, int r, ll val) {
    if (r < s || e < l) return;
    if (l <= s && e <= r) {
        tree_arr[v] += val * (e - s + 1);
        lazy[v] += val;
        return;
    }
    push(v, s, e);
    int m = (s + e) / 2;
    upd(2*v, s, m, l, r, val);
    upd(2*v+1, m+1, e, l, r, val);
    tree_arr[v] = tree_arr[2*v] + tree_arr[2*v+1];
}

ll qry(int v, int s, int e, int l, int r) {
    if (r < s || e < l) return 0;
    if (l <= s && e <= r) return tree_arr[v];
    push(v, s, e);
    int m = (s + e) / 2;
    return qry(2*v, s, m, l, r) + qry(2*v+1, m+1, e, l, r);
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n, q;
    if (!(cin >> n >> q)) return 0;
    vector<ll> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    build(a, 1, 0, n - 1);
    
    while (q--) {
        int type, l, r;
        cin >> type >> l >> r;
        if (type == 1) {
            ll v; cin >> v;
            upd(1, 0, n - 1, l, r, v);
        } else {
            cout << qry(1, 0, n - 1, l, r) << "\n";
        }
    }
    return 0;
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1500,
		MemLimitKB:  262144,
	})
}

// ── Lazy Propagation: Range Assign / Range Sum ───────────────────────────────
//
// Problem: Given N integers and Q queries:
//   - Type 1 l r v: range assign — set arr[l..r] to v
//   - Type 2 l r: range sum — print sum of arr[l..r]
//
// Expected: segment tree with lazy propagation (assignment tags). Uses LLONG_MIN as sentinel.

func registerLazyRangeAssignSumSegTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "lazy_range_assign_sum",
		Name:       "Range Assign / Range Sum",
		CourseSlug: "segment-tree-intermediate",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(2, 10)
    q = rng.randint(1, 10)
    lo, hi = -5, 5
elif seed < 15:
    n = rng.randint(100, 1000)
    q = rng.randint(100, 1000)
    lo, hi = -50, 50
else:
    # Large tier — brute force O(N*Q) will TLE
    n = 100000
    q = 100000
    lo, hi = -100, 100

a = [rng.randint(lo, hi) for _ in range(n)]
print(n, q)
print(*a)
for _ in range(q):
    if seed >= 15:
        # Favor large range operations for massive tests
        t = 2 if rng.random() < 0.5 else 1
        # Force massive ranges (length ~99,000+) to reliably TLE brute forces
        l = rng.randint(0, 100)
        r = rng.randint(n - 100, n - 1)
    else:
        t = rng.randint(1, 2)
        l = rng.randint(0, n - 1)
        r = rng.randint(l, n - 1)
    
    if t == 1:
        val = rng.randint(lo, hi)
        print(1, l, r, val)
    else:
        print(2, l, r)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int MAXN = 1e5 + 5;
const ll NO_OP = LLONG_MIN;
ll tree_arr[4 * MAXN], lazy[4 * MAXN];

void push(int v, int s, int e) {
    if (lazy[v] == NO_OP) return;
    int m = (s + e) / 2;
    tree_arr[2*v] = lazy[v] * (m - s + 1);
    lazy[2*v] = lazy[v];
    tree_arr[2*v+1] = lazy[v] * (e - m);
    lazy[2*v+1] = lazy[v];
    lazy[v] = NO_OP;
}

void build(const vector<ll>& a, int v, int s, int e) {
    lazy[v] = NO_OP;
    if (s == e) { tree_arr[v] = a[s]; return; }
    int m = (s + e) / 2;
    build(a, 2*v, s, m);
    build(a, 2*v+1, m+1, e);
    tree_arr[v] = tree_arr[2*v] + tree_arr[2*v+1];
}

void upd(int v, int s, int e, int l, int r, ll val) {
    if (r < s || e < l) return;
    if (l <= s && e <= r) {
        tree_arr[v] = val * (e - s + 1);
        lazy[v] = val;
        return;
    }
    push(v, s, e);
    int m = (s + e) / 2;
    upd(2*v, s, m, l, r, val);
    upd(2*v+1, m+1, e, l, r, val);
    tree_arr[v] = tree_arr[2*v] + tree_arr[2*v+1];
}

ll qry(int v, int s, int e, int l, int r) {
    if (r < s || e < l) return 0;
    if (l <= s && e <= r) return tree_arr[v];
    push(v, s, e);
    int m = (s + e) / 2;
    return qry(2*v, s, m, l, r) + qry(2*v+1, m+1, e, l, r);
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n, q;
    if (!(cin >> n >> q)) return 0;
    vector<ll> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    build(a, 1, 0, n - 1);
    
    while (q--) {
        int type, l, r;
        cin >> type >> l >> r;
        if (type == 1) {
            ll v; cin >> v;
            upd(1, 0, n - 1, l, r, v);
        } else {
            cout << qry(1, 0, n - 1, l, r) << "\n";
        }
    }
    return 0;
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1500,
		MemLimitKB:  262144,
	})
}

// ── Lazy Propagation: Range Add / Range Minimum ──────────────────────────────
//
// Problem: Given N integers and Q queries:
//   - Type 1 l r v: range add — add v to arr[l..r]
//   - Type 2 l r: range min — print minimum of arr[l..r]
//
// Expected: segment tree with lazy propagation (addition tags, min merge).

func registerLazyRangeAddMinSegTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "lazy_range_add_min",
		Name:       "Range Add / Range Minimum",
		CourseSlug: "segment-tree-intermediate",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(2, 10)
    q = rng.randint(1, 10)
    lo, hi = -5, 5
elif seed < 15:
    n = rng.randint(100, 1000)
    q = rng.randint(100, 1000)
    lo, hi = -50, 50
else:
    # Large tier — brute force O(N*Q) will TLE
    n = 100000
    q = 100000
    lo, hi = -100, 100

a = [rng.randint(lo, hi) for _ in range(n)]
print(n, q)
print(*a)
for _ in range(q):
    if seed >= 15:
        # Favor large range operations for massive tests
        t = 2 if rng.random() < 0.5 else 1
        # Force massive ranges (length ~99,000+) to reliably TLE brute forces
        l = rng.randint(0, 100)
        r = rng.randint(n - 100, n - 1)
    else:
        t = rng.randint(1, 2)
        l = rng.randint(0, n - 1)
        r = rng.randint(l, n - 1)
    
    if t == 1:
        val = rng.randint(lo, hi)
        print(1, l, r, val)
    else:
        print(2, l, r)
`,

		ReferenceCpp: `
#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>

using namespace std;

const int MAXN = 100005;
long long tree[4 * MAXN];
long long lazy[4 * MAXN];
long long A[MAXN];

void build(int node, int start, int end) {
    lazy[node] = 0;
    if (start == end) {
        tree[node] = A[start];
        return;
    }
    int mid = start + (end - start) / 2;
    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);
    tree[node] = min(tree[2 * node], tree[2 * node + 1]);
}

void push_down(int node, int start, int end) {
    if (lazy[node] != 0) {
        // Correct implementation: Just add the lazy offset directly to minimums
        tree[2 * node] += lazy[node];
        lazy[2 * node] += lazy[node];
        
        tree[2 * node + 1] += lazy[node];
        lazy[2 * node + 1] += lazy[node];
        
        lazy[node] = 0;
    }
}

void update_range(int node, int start, int end, int l, int r, long long val) {
    if (start > end || start > r || end < l) return;
    
    if (start >= l && end <= r) {
        tree[node] += val;
        lazy[node] += val;
        return;
    }
    
    push_down(node, start, end);
    int mid = start + (end - start) / 2;
    update_range(2 * node, start, mid, l, r, val);
    update_range(2 * node + 1, mid + 1, end, l, r, val);
    
    tree[node] = min(tree[2 * node], tree[2 * node + 1]);
}

long long query_range(int node, int start, int end, int l, int r) {
    if (start > end || start > r || end < l) {
        return LLONG_MAX; // Out of bounds returns infinity
    }
    if (start >= l && end <= r) {
        return tree[node];
    }
    
    push_down(node, start, end);
    int mid = start + (end - start) / 2;
    long long p1 = query_range(2 * node, start, mid, l, r);
    long long p2 = query_range(2 * node + 1, mid + 1, end, l, r);
    
    return min(p1, p2);
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, q;
    if (!(cin >> n >> q)) return 0;
    
    for (int i = 0; i < n; i++) {
        cin >> A[i];
    }

    build(1, 0, n - 1);

    while (q--) {
        int type, l, r;
        cin >> type >> l >> r;
        if (type == 1) {
            long long v;
            cin >> v;
            update_range(1, 0, n - 1, l, r, v);
        } else {
            cout << query_range(1, 0, n - 1, l, r) << "\n";
        }
    }
    push(v, s, e);
    int m = (s + e) / 2;
    upd(2*v, s, m, l, r, val);
    upd(2*v+1, m+1, e, l, r, val);
    tree_arr[v] = tree_arr[2*v] + tree_arr[2*v+1];
}

ll qry(int v, int s, int e, int l, int r) {
    if (r < s || e < l) return 0;
    if (l <= s && e <= r) return tree_arr[v];
    push(v, s, e);
    int m = (s + e) / 2;
    return qry(2*v, s, m, l, r) + qry(2*v+1, m+1, e, l, r);
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n, q;
    if (!(cin >> n >> q)) return 0;
    vector<ll> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    build(a, 1, 0, n - 1);
    
    while (q--) {
        int type, l, r;
        cin >> type >> l >> r;
        if (type == 1) {
            ll v; cin >> v;
            upd(1, 0, n - 1, l, r, v);
        } else {
            cout << qry(1, 0, n - 1, l, r) << "\n";
        }
    }
    return 0;
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1500,
		MemLimitKB:  262144,
	})
}


// ── Lazy Propagation: Range Assign / Max Subarray ────────────────────────────
//
// Problem: Given N integers and Q queries:
//   - Type 1 l r v: range assign — set arr[l..r] = v
//
// After building the tree and after every query, print the maximum contiguous 
// subarray sum of the entire array.
// Expected: segment tree with lazy propagation tracking (sum, pref, suf, best).

func registerLazyRangeAssignMaxSubSegTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "lazy_range_assign_max_sub",
		Name:       "Range Assign + Max Subarray",
		CourseSlug: "segment-tree-intermediate",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(2, 10)
    q = rng.randint(1, 10)
    lo, hi = -5, 5
elif seed < 15:
    n = rng.randint(100, 1000)
    q = rng.randint(100, 1000)
    lo, hi = -50, 50
else:
    # Large tier
    n = 100000
    q = 100000
    lo, hi = -100, 100

a = [rng.randint(lo, hi) for _ in range(n)]
print(n, q)
print(*a)
for _ in range(q):
    if seed >= 15:
        # Favor large range operations for massive tests
        l = rng.randint(0, 100)
        r = rng.randint(n - 100, n - 1)
    else:
        l = rng.randint(0, n - 1)
        r = rng.randint(l, n - 1)
    
    val = rng.randint(lo, hi)
    print(l, r, val)
`,

		ReferenceCpp: `
#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>

using namespace std;

const long long NO_OP = LLONG_MIN;

struct Node {
    long long sum, pref, suf, best;
};

const int MAXN = 100005;
Node tree[4 * MAXN];
long long lazy[4 * MAXN];
long long A[MAXN];

Node combine(Node l, Node r) {
    return {
        l.sum + r.sum,
        max(l.pref, l.sum + r.pref),
        max(r.suf, r.sum + l.suf),
        max({l.best, r.best, l.suf + r.pref})
    };
}

void applyAssign(int node, long long val, int len) {
    tree[node].sum = val * len;
    long long max_val = max(0LL, val * len);
    tree[node].pref = max_val;
    tree[node].suf = max_val;
    tree[node].best = max_val;
    lazy[node] = val;
}

void build(int node, int s, int e) {
    lazy[node] = NO_OP;
    if (s == e) {
        long long v = A[s];
        tree[node] = {v, max(0LL, v), max(0LL, v), max(0LL, v)};
        return;
    }
    int m = s + (e - s) / 2;
    build(2 * node, s, m);
    build(2 * node + 1, m + 1, e);
    tree[node] = combine(tree[2 * node], tree[2 * node + 1]);
}

void push_down(int node, int s, int e) {
    if (lazy[node] != NO_OP) {
        int m = s + (e - s) / 2;
        applyAssign(2 * node, lazy[node], m - s + 1);
        applyAssign(2 * node + 1, lazy[node], e - m);
        lazy[node] = NO_OP;
    }
}

void update(int node, int s, int e, int l, int r, long long v) {
    if (r < s || e < l) return;
    if (l <= s && e <= r) {
        applyAssign(node, v, e - s + 1);
        return;
    }
    push_down(node, s, e);
    int m = s + (e - s) / 2;
    update(2 * node, s, m, l, r, v);
    update(2 * node + 1, m + 1, e, l, r, v);
    tree[node] = combine(tree[2 * node], tree[2 * node + 1]);
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, q;
    if (!(cin >> n >> q)) return 0;
    
    for (int i = 0; i < n; i++) cin >> A[i];
    
    build(1, 0, n - 1);
    cout << tree[1].best << "\n";
    
    while (q--) {
        int l, r;
        long long v;
        cin >> l >> r >> v;
        update(1, 0, n - 1, l, r, v);
        cout << tree[1].best << "\n";
    }
    
    return 0;
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1500,
		MemLimitKB:  262144,
	})
}
