package segment_tree

import "codemortem/internal/challenges"

// registerQueueAnomalies registers the "Queue Anomalies" challenge.
//
// Problem: Given a permutation R of 1..N, for each position i output the
// number of j < i such that R[j] > R[i]  (i.e. the number of inversions
// ending at each index).
//
// Intended solution: Segment Tree (frequency array, point-update + range-sum query).
//   - For each R[i], query the tree for sum of [R[i]+1, N] → that is the
//     count of already-inserted elements greater than R[i].
//   - Then insert R[i] (add 1 at position R[i]).
//   - Time: O(N log N).
//
// Test tiers (20 tests):
//   Tests 0-4:   Small (N ≤ 10)   — basic correctness + edge cases
//   Tests 5-14:  Medium (N ≤ 2000) — logic
//   Tests 15-19: Large (N = 100000) — TLE kills O(N²)
func init() {
	registerQueueAnomalies()
	registerQueueAnomaliesReconstruction()
}

func registerQueueAnomalies() {
	challenges.Register(&challenges.Challenge{
		ID:         "queue_anomalies",
		Name:       "Queue Anomalies",
		CourseSlug: "segment-tree",

		// Generator: produces a random permutation of 1..N
		// Edge cases included in small tier:
		//   seed=0  → N=1 (trivial)
		//   seed=1  → N=2 sorted ascending  (all zeros)
		//   seed=2  → N=2 sorted descending (all ones)
		//   seed=3  → N=5 fixed example from the problem statement: [4,1,3,5,2]
		//   seed=4  → random small N
		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed == 0:
    # Trivial: single element
    print(1)
    print(1)
elif seed == 1:
    # Sorted ascending -> all anomaly scores are 0
    print(2)
    print(1, 2)
elif seed == 2:
    # Sorted descending -> anomaly scores: 0 1
    print(2)
    print(2, 1)
elif seed == 3:
    # Fixed example from problem statement: [4,1,3,5,2]
    print(5)
    print(4, 1, 3, 5, 2)
elif seed < 5:
    n = rng.randint(3, 10)
    perm = list(range(1, n + 1))
    rng.shuffle(perm)
    print(n)
    print(*perm)
elif seed < 15:
    n = rng.randint(100, 2000)
    perm = list(range(1, n + 1))
    rng.shuffle(perm)
    print(n)
    print(*perm)
else:
    # Large: N = 100000 — O(N^2) brute force will TLE at 1s limit
    n = 100000
    perm = list(range(1, n + 1))
    rng.shuffle(perm)
    print(n)
    print(*perm)
`,

		// Reference solution: O(N log N) Segment Tree (frequency array approach)
		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;

struct SegmentTree {
    int n;
    vector<int> t;
    SegmentTree(int n) : n(n), t(4 * n + 1, 0) {}

    void add(int node, int start, int end, int idx, int val) {
        if (start == end) { t[node] += val; return; }
        int mid = start + (end - start) / 2;
        if (idx <= mid) add(2*node, start, mid, idx, val);
        else            add(2*node+1, mid+1, end, idx, val);
        t[node] = t[2*node] + t[2*node+1];
    }

    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return t[node];
        int mid = start + (end - start) / 2;
        return query(2*node, start, mid, l, r)
             + query(2*node+1, mid+1, end, l, r);
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n; cin >> n;
    vector<int> r(n);
    for (auto& x : r) cin >> x;
    SegmentTree seg(n);
    bool first = true;
    for (int i = 0; i < n; i++) {
        // Count elements already inserted that are strictly greater than r[i]
        int ans = seg.query(1, 1, n, r[i] + 1, n);
        if (!first) cout << ' ';
        cout << ans;
        first = false;
        seg.add(1, 1, n, r[i], 1);
    }
    cout << '\n';
}
`,

		// Checker: compare space-separated tokens on a single line
		CheckerPy: tokenCheckerPy,

		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  1048576, // 1 GB as per problem statement
	})
}

// registerQueueAnomaliesReconstruction registers the inverse problem:
// given anomaly scores, reconstruct the original permutation.
//
// Intended solution: Segment Tree (k-th element query + removal).
//   - Process from right to left.
//   - For position i with anomaly score A[i]: there are (i+1) unassigned ratings.
//     The rating is the (i+1-A[i])-th smallest available rating.
//   - Use a Segment Tree initialized with all 1s; findAndRemove returns the k-th 1.
//   - Time: O(N log N).
//
// Test tiers (20 tests):
//   Tests 0-4:   Small (N ≤ 10)   — basic correctness + edge cases
//   Tests 5-14:  Medium (N ≤ 2000) — logic
//   Tests 15-19: Large (N = 100000) — TLE kills O(N²)
func registerQueueAnomaliesReconstruction() {
	challenges.Register(&challenges.Challenge{
		ID:         "queue_anomalies_reconstruction",
		Name:       "Queue Anomalies (The Reconstruction)",
		CourseSlug: "segment-tree",

		// Generator: produce anomaly scores from a random permutation
		// The generator first builds a valid permutation, then computes its
		// anomaly scores (naively — O(N²) is fine for the generator since it
		// only runs once offline).
		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

def anomaly_scores(perm):
    n = len(perm)
    scores = []
    bit = [0] * (n + 1)
    
    def add(idx, val):
        while idx <= n:
            bit[idx] += val
            idx += idx & -idx
            
    def query(idx):
        s = 0
        while idx > 0:
            s += bit[idx]
            idx -= idx & -idx
        return s

    for i in range(n):
        # perm[i] is 1-indexed. We want count of elements already seen that are > perm[i].
        # That is: (elements seen so far) - (elements <= perm[i])
        cnt = i - query(perm[i])
        scores.append(cnt)
        add(perm[i], 1)
        
    return scores

if seed == 0:
    # N=1 trivial
    print(1)
    print(0)
elif seed == 1:
    # Sorted ascending -> all zeros
    n = 3
    perm = list(range(1, n + 1))
    print(n)
    print(*anomaly_scores(perm))
elif seed == 2:
    # Sorted descending -> 0,1,2,...,N-1
    n = 4
    perm = list(range(n, 0, -1))
    print(n)
    print(*anomaly_scores(perm))
elif seed == 3:
    # Fixed problem statement example: perm=[4,1,3,5,2] -> scores=[0,1,1,0,3]
    print(5)
    print(0, 1, 1, 0, 3)
elif seed < 5:
    n = rng.randint(3, 10)
    perm = list(range(1, n + 1))
    rng.shuffle(perm)
    print(n)
    print(*anomaly_scores(perm))
elif seed < 15:
    n = rng.randint(100, 2000)
    perm = list(range(1, n + 1))
    rng.shuffle(perm)
    print(n)
    print(*anomaly_scores(perm))
else:
    # Large: N = 100000
    n = 100000
    perm = list(range(1, n + 1))
    rng.shuffle(perm)
    print(n)
    print(*anomaly_scores(perm))
`,

		// Reference solution: O(N log N) Segment Tree k-th element
		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;

struct SegmentTree {
    int n;
    vector<int> t;
    SegmentTree(int n) : n(n), t(4 * n + 1, 0) {}

    void build(int node, int start, int end) {
        if (start == end) { t[node] = 1; return; }
        int mid = start + (end - start) / 2;
        build(2*node, start, mid);
        build(2*node+1, mid+1, end);
        t[node] = t[2*node] + t[2*node+1];
    }

    // Find the k-th available (1-valued) leaf, mark it 0, return its index
    int findAndRemove(int node, int start, int end, int k) {
        if (start == end) { t[node] = 0; return start; }
        int mid = start + (end - start) / 2;
        int leftSum = t[2*node];
        int result;
        if (k <= leftSum) result = findAndRemove(2*node, start, mid, k);
        else              result = findAndRemove(2*node+1, mid+1, end, k - leftSum);
        t[node] = t[2*node] + t[2*node+1];
        return result;
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;

    SegmentTree seg(n);
    seg.build(1, 1, n);

    vector<int> ans(n);
    for (int i = n - 1; i >= 0; i--) {
        int k = (i + 1) - a[i];
        ans[i] = seg.findAndRemove(1, 1, n, k);
    }

    for (int i = 0; i < n; i++)
        cout << ans[i] << (i == n-1 ? '\n' : ' ');
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  1048576,
	})
}
