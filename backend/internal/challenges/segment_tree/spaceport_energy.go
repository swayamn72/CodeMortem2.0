package segment_tree

import "codemortem/internal/challenges"

func init() {
	registerSpaceportNested()
	registerSpaceportOverlaps()
	registerEnergyGrid()
}

// Shared generator for Problems C & D — produces a random ship log of 2N events.
// Each ship 1..N appears exactly twice. Edge cases in small tier.
const spaceportGeneratorPy = `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed == 0:
    # N=1 trivial
    print(1)
    print(1, 1)
elif seed == 1:
    # All ships strictly nested (1 contains 2 contains 3)
    print(3)
    print(1, 2, 3, 3, 2, 1)
elif seed == 2:
    # All ships disjoint (no nesting, no overlap)
    print(3)
    print(1, 1, 2, 2, 3, 3)
elif seed == 3:
    # Fixed problem example: N=5, log=[5,1,2,2,3,1,3,4,5,4]
    print(5)
    print(5, 1, 2, 2, 3, 1, 3, 4, 5, 4)
elif seed < 5:
    n = rng.randint(3, 10)
    events = list(range(1, n + 1)) * 2
    rng.shuffle(events)
    print(n)
    print(*events)
elif seed < 15:
    n = rng.randint(100, 2000)
    events = list(range(1, n + 1)) * 2
    rng.shuffle(events)
    print(n)
    print(*events)
else:
    n = 100000
    events = list(range(1, n + 1)) * 2
    rng.shuffle(events)
    print(n)
    print(*events)
`

// Shared reference solution for Nested Stays (Problem C)
const spaceportNestedRef = `
#include <bits/stdc++.h>
using namespace std;

struct SegmentTree {
    int n;
    vector<int> t;
    SegmentTree(int n) : n(n), t(4 * n + 1, 0) {}

    void update(int node, int s, int e, int idx, int val) {
        if (s == e) { t[node] += val; return; }
        int mid = s + (e - s) / 2;
        if (idx <= mid) update(2*node, s, mid, idx, val);
        else            update(2*node+1, mid+1, e, idx, val);
        t[node] = t[2*node] + t[2*node+1];
    }

    int query(int node, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return t[node];
        int mid = s + (e - s) / 2;
        return query(2*node, s, mid, l, r) + query(2*node+1, mid+1, e, l, r);
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n; cin >> n;
    int total = 2 * n;
    vector<int> log(total);
    for (auto& x : log) cin >> x;

    vector<int> dock(n + 1, -1), ans(n + 1, 0);
    SegmentTree seg(total);

    for (int i = 0; i < total; ++i) {
        int id = log[i], pos = i + 1;
        if (dock[id] == -1) {
            dock[id] = pos;
        } else {
            ans[id] = seg.query(1, 1, total, dock[id] + 1, pos - 1);
            seg.update(1, 1, total, dock[id], 1);
        }
    }
    for (int i = 1; i <= n; ++i) cout << ans[i] << (i == n ? "\n" : " ");
}
`

// Shared reference solution for Partial Overlaps (Problem D)
const spaceportOverlapsRef = `
#include <bits/stdc++.h>
using namespace std;

struct SegmentTree {
    int n;
    vector<int> t;
    SegmentTree(int n) : n(n), t(4 * n + 1, 0) {}

    void update(int node, int s, int e, int idx, int val) {
        if (s == e) { t[node] += val; return; }
        int mid = s + (e - s) / 2;
        if (idx <= mid) update(2*node, s, mid, idx, val);
        else            update(2*node+1, mid+1, e, idx, val);
        t[node] = t[2*node] + t[2*node+1];
    }

    int query(int node, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return t[node];
        int mid = s + (e - s) / 2;
        return query(2*node, s, mid, l, r) + query(2*node+1, mid+1, e, l, r);
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n; cin >> n;
    int total = 2 * n;
    vector<int> log(total);
    for (auto& x : log) cin >> x;

    vector<int> dock(n + 1, -1), ans(n + 1, 0);
    SegmentTree seg(total);

    for (int i = 0; i < total; ++i) {
        int id = log[i], pos = i + 1;
        if (dock[id] == -1) {
            dock[id] = pos;
        } else {
            int nested = seg.query(1, 1, total, dock[id] + 1, pos - 1);
            int events_inside = pos - dock[id] - 1;
            ans[id] = events_inside - 2 * nested;
            seg.update(1, 1, total, dock[id], 1);
        }
    }
    for (int i = 1; i <= n; ++i) cout << ans[i] << (i == n ? "\n" : " ");
}
`

// Checker for space-separated integer output
const spaceportCheckerPy = tokenCheckerPy

// registerSpaceportNested registers Problem C: Spaceport Logistics (Nested Stays).
//
// For each ship, count how many other ships' stays are strictly nested inside it.
// O(N log N) using a frequency Segment Tree on event positions.
func registerSpaceportNested() {
	challenges.Register(&challenges.Challenge{
		ID:         "spaceport_nested",
		Name:       "Spaceport Logistics (Nested Stays)",
		CourseSlug: "segment-tree",

		GeneratorPy: spaceportGeneratorPy,
		ReferenceCpp: spaceportNestedRef,
		CheckerPy:   spaceportCheckerPy,

		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  1048576,
	})
}

// registerSpaceportOverlaps registers Problem D: Spaceport Logistics (Partial Overlaps).
//
// For each ship, count how many other ships' stays partially intersect (exactly one
// endpoint falls inside the ship's stay). Uses the same Segment Tree pass as C plus
// a O(1) arithmetic formula: intersecting = (R-L-1) - 2*nested.
func registerSpaceportOverlaps() {
	challenges.Register(&challenges.Challenge{
		ID:         "spaceport_overlaps",
		Name:       "Spaceport Logistics (Partial Overlaps)",
		CourseSlug: "segment-tree",

		GeneratorPy: spaceportGeneratorPy,
		ReferenceCpp: spaceportOverlapsRef,
		CheckerPy:   spaceportCheckerPy,

		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  1048576,
	})
}

// registerEnergyGrid registers Problem E: Energy Grid Polarities.
//
// Alternating-sum range queries with point updates, handled by storing
// B[i] = C[i] if i is odd, B[i] = -C[i] if i is even in the Segment Tree.
// Query [l,r]: answer = sum(B[l..r]) if l is odd, else -sum(B[l..r]).
func registerEnergyGrid() {
	challenges.Register(&challenges.Challenge{
		ID:         "energy_grid",
		Name:       "Energy Grid Polarities",
		CourseSlug: "segment-tree",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed == 0:
    # Trivial: N=1, single query
    print(1)
    print(5)
    print(1)
    print("1 1 1")
elif seed == 1:
    # All same values, alternating sum of full range
    n = 4
    print(n)
    print(*(3 for _ in range(n)))
    print(1)
    print("1 1", n)
elif seed == 2:
    # Fixed problem example
    print(3)
    print(1, 2, 3)
    print(5)
    print("1 1 2")
    print("1 1 3")
    print("1 2 3")
    print("0 2 1")
    print("1 1 3")
elif seed < 5:
    n = rng.randint(3, 15)
    print(n)
    print(*(rng.randint(1, 10000) for _ in range(n)))
    m = rng.randint(3, 10)
    print(m)
    for _ in range(m):
        if rng.random() < 0.4:
            i = rng.randint(1, n)
            j = rng.randint(1, 10000)
            print(0, i, j)
        else:
            l = rng.randint(1, n)
            r = rng.randint(l, n)
            print(1, l, r)
elif seed < 15:
    n = rng.randint(1000, 5000)
    print(n)
    print(*(rng.randint(1, 10000) for _ in range(n)))
    m = rng.randint(500, 2000)
    print(m)
    for _ in range(m):
        if rng.random() < 0.4:
            i = rng.randint(1, n)
            j = rng.randint(1, 10000)
            print(0, i, j)
        else:
            l = rng.randint(1, n)
            r = rng.randint(l, n)
            print(1, l, r)
else:
    n = 100000
    print(n)
    print(*(rng.randint(1, 10000) for _ in range(n)))
    m = 100000
    print(m)
    for _ in range(m):
        if rng.random() < 0.4:
            i = rng.randint(1, n)
            j = rng.randint(1, 10000)
            print(0, i, j)
        else:
            l = rng.randint(1, n)
            r = rng.randint(l, n)
            print(1, l, r)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;

struct SegmentTree {
    int n;
    vector<long long> t;
    SegmentTree(int n) : n(n), t(4 * n + 1, 0) {}

    void build(const vector<long long>& b, int node, int s, int e) {
        if (s == e) { t[node] = b[s]; return; }
        int mid = s + (e - s) / 2;
        build(b, 2*node, s, mid);
        build(b, 2*node+1, mid+1, e);
        t[node] = t[2*node] + t[2*node+1];
    }

    void update(int node, int s, int e, int idx, long long val) {
        if (s == e) { t[node] = val; return; }
        int mid = s + (e - s) / 2;
        if (idx <= mid) update(2*node, s, mid, idx, val);
        else            update(2*node+1, mid+1, e, idx, val);
        t[node] = t[2*node] + t[2*node+1];
    }

    long long query(int node, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return t[node];
        int mid = s + (e - s) / 2;
        return query(2*node, s, mid, l, r) + query(2*node+1, mid+1, e, l, r);
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n; cin >> n;
    vector<long long> b(n + 1);
    for (int i = 1; i <= n; ++i) {
        long long c; cin >> c;
        b[i] = (i % 2 != 0) ? c : -c;
    }
    SegmentTree seg(n);
    seg.build(b, 1, 1, n);
    int m; cin >> m;
    while (m--) {
        int type; cin >> type;
        if (type == 0) {
            int i; long long j; cin >> i >> j;
            seg.update(1, 1, n, i, (i % 2 != 0) ? j : -j);
        } else {
            int l, r; cin >> l >> r;
            long long s = seg.query(1, 1, n, l, r);
            cout << (l % 2 != 0 ? s : -s) << "\n";
        }
    }
}
`,

		// Line-by-line checker: compare each query output line
		CheckerPy: `
import sys

def check(input_str, expected_str, actual_str):
    exp_lines = expected_str.strip().split("\n")
    act_lines = actual_str.strip().split("\n")
    if len(exp_lines) != len(act_lines):
        return False, f"Expected {len(exp_lines)} lines, got {len(act_lines)}"
    for i, (e, a) in enumerate(zip(exp_lines, act_lines)):
        if e.strip() != a.strip():
            return False, f"Line {i+1}: expected {e.strip()!r}, got {a.strip()!r}"
    return True, ""

if __name__ == "__main__":
    inp  = open(sys.argv[1]).read()
    exp  = open(sys.argv[2]).read()
    act  = open(sys.argv[3]).read()
    ok, msg = check(inp, exp, act)
    if ok:
        print("AC")
    else:
        print("WA:", msg)
`,

		NumTests:    20,
		TimeLimitMs: 2000, // 2s as per problem statement
		MemLimitKB:  1048576,
	})
}
