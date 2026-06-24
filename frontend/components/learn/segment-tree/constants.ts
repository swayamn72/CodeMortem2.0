import type { NodeData, MCQQuestion, WalkthroughLine } from "./types";

// ── Sample Test Cases (shown when user clicks Run) ──
// These are visible to the user. Submit uses hidden stress tests.
export interface SampleCase { label: string; input: string; expected: string; }
export const SAMPLE_TEST_CASES: Record<string, SampleCase[]> = {
  challenge1: [
    {
      label: "Basic Sum + Update",
      input: "5 5\n1 2 3 4 5\n2 0 2\n1 1 10\n2 0 2\n2 1 4\n2 0 4",
      expected: "6\n14\n22\n23",
    },
    {
      label: "Small Array",
      input: "3 2\n10 20 30\n2 0 2\n2 1 2",
      expected: "60\n50",
    },
    {
      label: "Update then Query",
      input: "4 3\n1 2 3 4\n1 0 10\n2 0 3\n2 2 3",
      expected: "19\n7",
    },
  ],
  challenge2: [
    {
      label: "Basic Min + Update",
      input: "5 5\n1 2 3 4 5\n2 0 2\n1 1 10\n2 0 2\n2 1 4\n2 0 4",
      expected: "1\n1\n3\n1",
    },
    {
      label: "Negatives",
      input: "4 3\n-5 -2 -8 -1\n2 0 3\n1 2 0\n2 1 3",
      expected: "-8\n-2",
    },
    {
      label: "Small Ranges",
      input: "3 2\n10 20 30\n2 0 1\n2 1 2",
      expected: "10\n20",
    },
  ],
  challenge3: [
    {
      label: "Basic Max + Update",
      input: "5 5\n1 2 3 4 5\n2 0 2\n1 1 10\n2 0 2\n2 1 4\n2 0 4",
      expected: "3\n10\n10\n10",
    },
    {
      label: "Negatives + Update",
      input: "4 4\n-5 -2 -8 -1\n2 0 3\n1 2 0\n2 1 3\n2 0 1",
      expected: "-1\n0\n-2",
    },
    {
      label: "Small Ranges",
      input: "3 2\n1 5 3\n2 0 2\n2 0 1",
      expected: "5\n5",
    },
  ],
  challenge4: [
    {
      label: "Basic Escape",
      input: "5 3\n100 300 200 500 400\n2 1 5\n2 2 4\n2 1 2",
      expected: "500\n500\n700",
    },
    {
      label: "Min Trap (don\u2019t use range-min!)",
      input: "4 3\n50 900 10 600\n2 1 4\n2 1 2\n2 3 4",
      expected: "100\n100\n400",
    },
    {
      label: "Zero Discount Edge Case",
      input: "3 2\n0 0 999\n2 1 3\n2 1 2",
      expected: "1\n1000",
    },
  ],
  // ── Challenge 5: Queue Anomalies ──
  challenge5: [
    {
      label: "Problem Statement Example",
      input: "5\n4 1 3 5 2",
      expected: "0 1 1 0 3",
    },
    {
      label: "Already Sorted (all zeros)",
      input: "4\n1 2 3 4",
      expected: "0 0 0 0",
    },
    {
      label: "Reverse Sorted (max inversions)",
      input: "4\n4 3 2 1",
      expected: "0 1 2 3",
    },
    {
      label: "Single Element",
      input: "1\n1",
      expected: "0",
    },
  ],
  // ── Challenge 6: Queue Anomalies (The Reconstruction) ──
  challenge6: [
    {
      label: "Problem Statement Example",
      input: "5\n0 1 1 0 3",
      expected: "4 1 3 5 2",
    },
    {
      label: "All Zeros → Sorted Ascending",
      input: "4\n0 0 0 0",
      expected: "1 2 3 4",
    },
    {
      label: "0 1 2 3 → Reverse Sorted",
      input: "4\n0 1 2 3",
      expected: "4 3 2 1",
    },
    {
      label: "Single Element",
      input: "1\n0",
      expected: "1",
    },
  ],
};


// ── Narration Data ──
export const NAIVE_NARRATIONS = [
    "Welcome! We want to perform range sum queries on our array. Let's select a query to begin.",
    "Query 1: Sum range [1, 5]. We start scanning the elements naively from index 1.",
    "Query 1: Index 1 is value 1. Running sum is 0 + 1 = 1. Scanned 1 element.",
    "Query 1: Index 2 is value 2. Running sum is 1 + 2 = 3. Scanned 2 elements.",
    "Query 1: Index 3 is value 5. Running sum is 3 + 5 = 8. Scanned 3 elements.",
    "Query 1: Index 4 is value 8. Running sum is 8 + 8 = 16. Scanned 4 elements.",
    "Query 1: Index 5 is value 7. Running sum is 16 + 7 = 23. Scanned 5 elements. Range scan complete!",
    "Query 2: Sum range [0, 2]. We scan from index 0 to 2.",
    "Query 2: Index 0 is value 3. Running sum is 0 + 3 = 3. Scanned 1 element.",
    "Query 2: Index 1 is value 1. Running sum is 3 + 1 = 4. Scanned 2 elements.",
    "Query 2: Index 2 is value 2. Running sum is 4 + 2 = 6. Scanned 3 elements. Range scan complete!",
    "Query 3: Sum range [4, 7]. We scan from index 4 to 7.",
    "Query 3: Index 4 is value 8. Running sum is 0 + 8 = 8. Scanned 1 element.",
    "Query 3: Index 5 is value 7. Running sum is 8 + 7 = 15. Scanned 2 elements.",
    "Query 3: Index 6 is value 6. Running sum is 15 + 6 = 21. Scanned 3 elements.",
    "Query 3: Index 7 is value 4. Running sum is 21 + 4 = 25. Scanned 4 elements. Range scan complete!",
    "All naive queries complete. As you can see, each query scans elements one by one, scaling to O(N) per query, which is extremely expensive for many queries!",
];

export const TREE_BUILD_NARRATIONS = [
    "Let's build a Segment Tree for our array of size 8. Initially, only the leaf nodes (the array elements) exist.",
    "We start from the leaves and pair them up to form their parents. index [0] and [1] merge to form range [0,1] with sum 4. index [2] and [3] merge to form [2,3] with sum 7. Same for right half.",
    "Next level: We merge node [0,1] (value 4) and node [2,3] (value 7) to get range [0,3] with sum 11. Similarly, we merge node [4,5] (15) and node [6,7] (10) to get range [4,7] with sum 25.",
    "Finally, we merge range [0,3] (value 11) and range [4,7] (value 25) to compute the root node [0,7] with sum 36. The tree is built bottom-up, precomputing all range values once!",
];

export const TREE_QUERY_NARRATIONS = [
    "Let's query range [1, 5] on our segment tree. We start traversing from the root node [0,7].",
    "Node [0,7] partially overlaps [1,5]. We must recurse into both left child [0,3] and right child [4,7]. Visited nodes: 1.",
    "Left child [0,3] partially overlaps [1,5]. We recurse into [0,1] and [2,3]. Visited nodes: 2.",
    "Node [0,1] partially overlaps [1,5]. We recurse to leaves [0,0] and [1,1]. Visited nodes: 3.",
    "Leaf [0,0] is completely outside [1,5]. We stop and return 0. Visited nodes: 4.",
    "Leaf [1,1] is completely inside [1,5]. We stop and return its value 1. Visited nodes: 5.",
    "Node [2,3] is completely inside [1,5]. We stop and return its value 7 immediately, avoiding scanning leaves [2,2] and [3,3]! Visited nodes: 6.",
    "Right child [4,7] partially overlaps [1,5]. We recurse into [4,5] and [6,7]. Visited nodes: 7.",
    "Node [4,5] is completely inside [1,5]. We stop and return its value 15 immediately, avoiding scanning leaves [4,4] and [5,5]! Visited nodes: 8.",
    "Node [6,7] is partially overlapping? Wait, index 6 and 7 are outside range [1,5]. It is completely outside! We return 0. Visited: 9 nodes.",
    "Query complete! We merge the values returned by the inside nodes: 1 (from [1,1]) + 7 (from [2,3]) + 15 (from [4,5]) = 23. We visited only 9 nodes in total, and only 3 nodes actually contributed. Compare this to scanning elements naively!",
];

export const TREE_UPDATE_NARRATIONS = [
    "Let's update index 3 from value 5 to 10. In a Segment Tree, we only update the leaf node and its direct ancestors.",
    "Step 1: Locate leaf node [3,3]. We update its value from 5 to 10.",
    "Step 2: Go to parent node [2,3]. Its left child is [2,2] (2), and its right child is updated [3,3] (10). New sum = 2 + 10 = 12.",
    "Step 3: Go to grandparent node [0,3]. Its left child is [0,1] (4), and its right child is updated [2,3] (12). New sum = 4 + 12 = 16.",
    "Step 4: Go to the root node [0,7]. Its left child is updated [0,3] (16), and its right child is [4,7] (25). New sum = 16 + 25 = 41. Point update complete! Only 4 nodes (O(log N)) were updated.",
];

// ── MCQ Questions ──
export const MCQ_PART_1: MCQQuestion[] = [
    {
        id: 1,
        question: "What is the time complexity of answering Q range-sum queries naively on an array of size N?",
        options: ["O(N)", "O(Q)", "O(N · Q)", "O(N log N)"],
        answer: 2,
        explanation:
            "Correct! The naive approach takes O(N) operations per query in the worst case. Performing Q such queries yields a total time complexity of O(N · Q).",
    },
    {
        id: 2,
        question: "Which of these scenarios would make the naive approach time out (standard 1.0s limit, ~10^8 operations)?",
        options: ["N = 100, Q = 100", "N = 10,000, Q = 50", "N = 100,000, Q = 100,000", "N = 500, Q = 1,000"],
        answer: 2,
        explanation:
            "Correct! When N = 10^5 and Q = 10^5, O(N · Q) results in 10^10 operations, which is way above the standard CPU threshold of ~10^8 operations per second, leading to a Time Limit Exceeded (TLE).",
    },
];

export const MCQ_PART_2: MCQQuestion[] = [
    {
        id: 1,
        question: "How many nodes does a segment tree for an array of size N = 8 have?",
        options: ["15", "8", "16", "7"],
        answer: 0,
        explanation:
            "Correct! For N = 8 (a power of 2), a full binary segment tree contains 8 leaves and 7 internal nodes, giving a total of 15 nodes (2N - 1). In the general case for any N, the size is bounded by 4N.",
    },
    {
        id: 2,
        question: "What does a node representing range [2, 5] store in a sum segment tree?",
        options: [
            "The value at index 2 plus the value at index 5",
            "The maximum value in the range [2, 5]",
            "The sum of all elements from index 2 to 5 inclusive",
            "The average of elements in range [2, 5]",
        ],
        answer: 2,
        explanation:
            "Correct! Each node in a sum segment tree stores the sum of all elements in its corresponding range, which for [2, 5] is a[2] + a[3] + a[4] + a[5].",
    },
    {
        id: 3,
        question: "How many nodes are visited during a range query in the worst case?",
        options: ["O(N)", "O(N log N)", "O(log N)", "O(1)"],
        answer: 2,
        explanation:
            "Correct! Because we only recurse when there is a partial overlap and can skip fully outside ranges or immediately return fully inside ranges, the maximum number of visited nodes per level is constant, resulting in O(log N) worst-case time complexity.",
    },
];

// ── Static Tree Node Definitions ──
export const TREE_NODES: NodeData[] = [
    { id: 1, label: "[0,7]", range: [0, 7], val: 36, x: 300, y: 35, level: 0, children: [2, 3] },
    { id: 2, label: "[0,3]", range: [0, 3], val: 11, x: 150, y: 95, level: 1, children: [4, 5] },
    { id: 3, label: "[4,7]", range: [4, 7], val: 25, x: 450, y: 95, level: 1, children: [6, 7] },
    { id: 4, label: "[0,1]", range: [0, 1], val: 4, x: 80, y: 155, level: 2, children: [8, 9] },
    { id: 5, label: "[2,3]", range: [2, 3], val: 7, x: 220, y: 155, level: 2, children: [10, 11] },
    { id: 6, label: "[4,5]", range: [4, 5], val: 15, x: 380, y: 155, level: 2, children: [12, 13] },
    { id: 7, label: "[6,7]", range: [6, 7], val: 10, x: 520, y: 155, level: 2, children: [14, 15] },
    { id: 8, label: "[0,0]", range: [0, 0], val: 3, x: 45, y: 215, level: 3 },
    { id: 9, label: "[1,1]", range: [1, 1], val: 1, x: 115, y: 215, level: 3 },
    { id: 10, label: "[2,2]", range: [2, 2], val: 2, x: 185, y: 215, level: 3 },
    { id: 11, label: "[3,3]", range: [3, 3], val: 5, x: 255, y: 215, level: 3 },
    { id: 12, label: "[4,4]", range: [4, 4], val: 8, x: 345, y: 215, level: 3 },
    { id: 13, label: "[5,5]", range: [5, 5], val: 7, x: 415, y: 215, level: 3 },
    { id: 14, label: "[6,6]", range: [6, 6], val: 6, x: 485, y: 215, level: 3 },
    { id: 15, label: "[7,7]", range: [7, 7], val: 4, x: 555, y: 215, level: 3 },
];

// ── Code Walkthrough Lines (C++) ──
export const TEMPLATE_LINES: WalkthroughLine[] = [
    { lineNum: 1, code: "#include <iostream>", explanation: "Standard headers for stream input and output in C++.", type: "normal" },
    { lineNum: 2, code: "using namespace std;", explanation: "Allows us to use names from the standard library without prefixing std::.", type: "normal" },
    { lineNum: 3, code: "", explanation: "", type: "normal" },
    { lineNum: 4, code: "struct SegmentTree {", explanation: "We group the Segment Tree variables and functions inside a struct.", type: "header" },
    { lineNum: 5, code: "    int n;", explanation: "n represents the size of the original array.", type: "setup" },
    { lineNum: 6, code: "    vector<long long> tree;", explanation: "We store the segment tree in a flat 1D array. A tree on N elements requires up to 4N nodes.", type: "setup" },
    { lineNum: 7, code: "", explanation: "", type: "normal" },
    { lineNum: 8, code: "    SegmentTree(int n) : n(n), tree(4 * n, 0) {}", explanation: "Constructor that initializes the tree array size to 4N filled with 0s.", type: "setup" },
    { lineNum: 9, code: "", explanation: "", type: "normal" },
    { lineNum: 10, code: "    // Build the segment tree", explanation: "This recursive function constructs the tree bottom-up.", type: "comment" },
    { lineNum: 11, code: "    void build(const vector<int>& a, int node, int start, int end) {", explanation: "node: index in tree array. start/end: range in original array represented by this node.", type: "build" },
    { lineNum: 12, code: "        if (start == end) {", explanation: "Base case: if range length is 1, it's a leaf node. We store the array element directly.", type: "build" },
    { lineNum: 13, code: "            tree[node] = a[start];", explanation: "Assign array value at start index to tree leaf node.", type: "build" },
    { lineNum: 14, code: "            return;", explanation: "Stop recursion.", type: "build" },
    { lineNum: 15, code: "        }", explanation: "End of base case.", type: "build" },
    { lineNum: 16, code: "        int mid = (start + end) / 2;", explanation: "Find midpoint to divide range into two halves.", type: "build" },
    { lineNum: 17, code: "        build(a, 2 * node, start, mid);", explanation: "Recursively build left child (stored at 2 * node) representing [start, mid].", type: "build" },
    { lineNum: 18, code: "        build(a, 2 * node + 1, mid + 1, end);", explanation: "Recursively build right child (stored at 2 * node + 1) representing [mid + 1, end].", type: "build" },
    { lineNum: 19, code: "        tree[node] = tree[2 * node] + tree[2 * node + 1];", explanation: "Merge Step: Parent node sum is the sum of its left and right children.", type: "build" },
    { lineNum: 20, code: "    }", explanation: "End of build function.", type: "build" },
    { lineNum: 21, code: "", explanation: "", type: "normal" },
    { lineNum: 22, code: "    // Update query: set a[idx] = val", explanation: "Handles updating an element at a specific index.", type: "comment" },
    { lineNum: 23, code: "    void update(int node, int start, int end, int idx, int val) {", explanation: "node: current tree index. start/end: range of current node. idx: target array index. val: new value.", type: "update" },
    { lineNum: 24, code: "        if (start == end) {", explanation: "Base case: reached leaf node corresponding to the target index.", type: "update" },
    { lineNum: 25, code: "            tree[node] = val;", explanation: "Set new value in the leaf node.", type: "update" },
    { lineNum: 26, code: "            return;", explanation: "Return to update ancestors.", type: "update" },
    { lineNum: 27, code: "        }", explanation: "End of base case.", type: "update" },
    { lineNum: 28, code: "        int mid = (start + end) / 2;", explanation: "Calculate midpoint of current range.", type: "update" },
    { lineNum: 29, code: "        if (idx <= mid) {", explanation: "If target index falls in left half, recurse into left child.", type: "update" },
    { lineNum: 30, code: "            update(2 * node, start, mid, idx, val);", explanation: "Recurse left child.", type: "update" },
    { lineNum: 31, code: "        } else {", explanation: "Otherwise, target index is in right half.", type: "update" },
    { lineNum: 32, code: "            update(2 * node + 1, mid + 1, end, idx, val);", explanation: "Recurse right child.", type: "update" },
    { lineNum: 33, code: "        }", explanation: "End of child update.", type: "update" },
    { lineNum: 34, code: "        tree[node] = tree[2 * node] + tree[2 * node + 1];", explanation: "Recalculate parent sum bottom-up. Ancestor is updated to reflect the new leaf value.", type: "update" },
    { lineNum: 35, code: "    }", explanation: "End of update function.", type: "update" },
    { lineNum: 36, code: "", explanation: "", type: "normal" },
    { lineNum: 37, code: "    // Range sum query from l to r", explanation: "Queries the sum in range [l, r] in O(log N) time.", type: "comment" },
    { lineNum: 38, code: "    long long query(int node, int start, int end, int l, int r) {", explanation: "l/r: target query range. start/end: current node range bounds.", type: "query" },
    { lineNum: 39, code: "        if (r < start || end < l) {", explanation: "Case 1: No overlap (node range is fully outside target).", type: "query" },
    { lineNum: 40, code: "            return 0;", explanation: "Return identity value (0 for sum query, -infinity for max query).", type: "query" },
    { lineNum: 41, code: "        }", explanation: "End of Case 1.", type: "query" },
    { lineNum: 42, code: "        if (l <= start && end <= r) {", explanation: "Case 2: Complete overlap (node range is fully inside target).", type: "query" },
    { lineNum: 43, code: "            return tree[node];", explanation: "Return precomputed range sum directly without looking at children!", type: "query" },
    { lineNum: 44, code: "        }", explanation: "End of Case 2.", type: "query" },
    { lineNum: 45, code: "        int mid = (start + end) / 2;", explanation: "Case 3: Partial overlap. Calculate mid to split and recurse.", type: "query" },
    { lineNum: 46, code: "        long long p1 = query(2 * node, start, mid, l, r);", explanation: "Get sum of left child query overlap.", type: "query" },
    { lineNum: 47, code: "        long long p2 = query(2 * node + 1, mid + 1, end, l, r);", explanation: "Get sum of right child query overlap.", type: "query" },
    { lineNum: 48, code: "        return p1 + p2;", explanation: "Merge and return results of left and right child queries.", type: "query" },
    { lineNum: 49, code: "    }", explanation: "End of query function.", type: "query" },
    { lineNum: 50, code: "};", explanation: "End of SegmentTree struct.", type: "header" },
];

// ── Code Templates for Monaco Editor ──
export const CODE_TEMPLATES: Record<string, Record<"cpp" | "python", string>> = {
    sum: {
        cpp: `#include <iostream>
#include <vector>

using namespace std;

// Segment Tree for Range Sum Queries and Point Updates
struct SegmentTree {
    int n;
    vector<long long> tree;

    SegmentTree(int n) : n(n), tree(4 * n, 0) {}

    // Build the segment tree
    void build(const vector<int>& a, int node, int start, int end) {
        if (start == end) {
            tree[node] = a[start];
            return;
        }
        int mid = (start + end) / 2;
        build(a, 2 * node, start, mid);
        build(a, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1]; // merge
    }

    // Update query: set a[idx] = val
    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid) {
            update(2 * node, start, mid, idx, val);
        } else {
            update(2 * node + 1, mid + 1, end, idx, val);
        }
        tree[node] = tree[2 * node] + tree[2 * node + 1]; // merge
    }

    // Range sum query from l to r
    long long query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) {
            return 0; // out of range
        }
        if (l <= start && end <= r) {
            return tree[node]; // fully inside range
        }
        int mid = (start + end) / 2;
        long long p1 = query(2 * node, start, mid, l, r);
        long long p2 = query(2 * node + 1, mid + 1, end, l, r);
        return p1 + p2; // merge
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n, q;
    cin >> n >> q;
    
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    SegmentTree st(n);
    st.build(a, 1, 0, n - 1);
    
    for (int i = 0; i < q; i++) {
        int type;
        cin >> type;
        if (type == 1) {
            int idx, val;
            cin >> idx >> val;
            st.update(1, 0, n - 1, idx, val);
        } else if (type == 2) {
            int l, r;
            cin >> l >> r;
            cout << st.query(1, 0, n - 1, l, r) << "\\n";
        }
    }
    
    return 0;
}`,
        python: `import sys

# Increase recursion depth for deep trees
sys.setrecursionlimit(300000)

class SegmentTree:
    def __init__(self, n):
        self.n = n
        self.tree = [0] * (4 * n)

    def build(self, a, node, start, end):
        if start == end:
            self.tree[node] = a[start]
            return
        mid = (start + end) // 2
        self.build(a, 2 * node, start, mid)
        self.build(a, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, node, start, end, l, r):
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        p1 = self.query(2 * node, start, mid, l, r)
        p2 = self.query(2 * node + 1, mid + 1, end, l, r)
        return p1 + p2

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    
    n = int(data[0])
    q = int(data[1])
    
    a = []
    for i in range(n):
        a.append(int(data[2 + i]))
        
    st = SegmentTree(n)
    st.build(a, 1, 0, n - 1)
    
    idx = 2 + n
    out = []
    for _ in range(q):
        if idx >= len(data):
            break
        type_ = int(data[idx])
        if type_ == 1:
            i_val = int(data[idx + 1])
            val = int(data[idx + 2])
            st.update(1, 0, n - 1, i_val, val)
            idx += 3
        elif type_ == 2:
            l = int(data[idx + 1])
            r = int(data[idx + 2])
            out.append(str(st.query(1, 0, n - 1, l, r)))
            idx += 3
            
    print("\\n".join(out))

if __name__ == '__main__':
    main()`,
    },
    max: {
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// Segment Tree for Range Maximum Queries and Point Updates
struct SegmentTree {
    int n;
    vector<int> tree;

    SegmentTree(int n) : n(n), tree(4 * n, 0) {}

    // Build the segment tree
    void build(const vector<int>& a, int node, int start, int end) {
        if (start == end) {
            tree[node] = a[start];
            return;
        }
        int mid = (start + end) / 2;
        build(a, 2 * node, start, mid);
        build(a, 2 * node + 1, mid + 1, end);
        
        // TODO: Merge children values for Maximum Segment Tree (1 line)
        // tree[node] = ...
    }

    // Update query: set a[idx] = val
    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid) {
            update(2 * node, start, mid, idx, val);
        } else {
            update(2 * node + 1, mid + 1, end, idx, val);
        }
        
        // TODO: Merge children values for Maximum Segment Tree (1 line)
        // tree[node] = ...
    }

    // Range maximum query from l to r
    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) {
            // TODO: Return correct identity value for range maximum query (1 line)
            // return ...
        }
        if (l <= start && end <= r) {
            return tree[node];
        }
        int mid = (start + end) / 2;
        int p1 = query(2 * node, start, mid, l, r);
        int p2 = query(2 * node + 1, mid + 1, end, l, r);
        
        // TODO: Merge results of left and right child queries (1 line)
        // return ...
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n, q;
    cin >> n >> q;
    
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    SegmentTree st(n);
    st.build(a, 1, 0, n - 1);
    
    for (int i = 0; i < q; i++) {
        int type;
        cin >> type;
        if (type == 1) {
            int idx, val;
            cin >> idx >> val;
            st.update(1, 0, n - 1, idx, val);
        } else if (type == 2) {
            int l, r;
            cin >> l >> r;
            cout << st.query(1, 0, n - 1, l, r) << "\\n";
        }
    }
    
    return 0;
}`,
        python: `import sys

# Increase recursion depth for deep trees
sys.setrecursionlimit(300000)

class SegmentTree:
    def __init__(self, n):
        self.n = n
        self.tree = [0] * (4 * n)

    def build(self, a, node, start, end):
        if start == end:
            self.tree[node] = a[start]
            return
        mid = (start + end) // 2
        self.build(a, 2 * node, start, mid)
        self.build(a, 2 * node + 1, mid + 1, end)
        
        # TODO: Merge children values for Maximum Segment Tree (1 line)
        # self.tree[node] = ...

    def update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val)
        
        # TODO: Merge children values for Maximum Segment Tree (1 line)
        # self.tree[node] = ...

    def query(self, node, start, end, l, r):
        if r < start or end < l:
            # TODO: Return correct identity value for range maximum query (1 line)
            # return ...
            pass
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        p1 = self.query(2 * node, start, mid, l, r)
        p2 = self.query(2 * node + 1, mid + 1, end, l, r)
        
        # TODO: Merge results of left and right child queries (1 line)
        # return ...

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    
    n = int(data[0])
    q = int(data[1])
    
    a = []
    for i in range(n):
        a.append(int(data[2 + i]))
        
    st = SegmentTree(n)
    st.build(a, 1, 0, n - 1)
    
    idx = 2 + n
    out = []
    for _ in range(q):
        if idx >= len(data):
            break
        type_ = int(data[idx])
        if type_ == 1:
            i_val = int(data[idx + 1])
            val = int(data[idx + 2])
            st.update(1, 0, n - 1, i_val, val)
            idx += 3
        elif type_ == 2:
            l = int(data[idx + 1])
            r = int(data[idx + 2])
            out.append(str(st.query(1, 0, n - 1, l, r)))
            idx += 3
            
    print("\\n".join(out))

if __name__ == '__main__':
    main()`,
    },
};

export const MIN_CPP_TEMPLATE = `#include <iostream>
#include <vector>
#include <climits>

using namespace std;

struct SegmentTree {
    int n;
    vector<int> tree;

    SegmentTree(int n) : n(n), tree(4 * n, INT_MAX) {}

    void build(const vector<int>& a, int node, int start, int end) {
        if (start == end) {
            tree[node] = a[start];
            return;
        }
        int mid = (start + end) / 2;
        build(a, 2 * node, start, mid);
        build(a, 2 * node + 1, mid + 1, end);
        // TODO: merge — store the minimum of left and right children
        tree[node] = /* ??? */;
    }

    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid)
            update(2 * node, start, mid, idx, val);
        else
            update(2 * node + 1, mid + 1, end, idx, val);
        // TODO: merge — store the minimum of left and right children
        tree[node] = /* ??? */;
    }

    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l)
            // TODO: return the identity value for minimum (hint: very large number)
            return /* ??? */;
        if (l <= start && end <= r)
            return tree[node];
        int mid = (start + end) / 2;
        int p1 = query(2 * node, start, mid, l, r);
        int p2 = query(2 * node + 1, mid + 1, end, l, r);
        // TODO: merge results — return the minimum of p1 and p2
        return /* ??? */;
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    SegmentTree st(n);
    st.build(a, 1, 0, n - 1);
    for (int i = 0; i < q; i++) {
        int type;
        cin >> type;
        if (type == 1) {
            int idx, val;
            cin >> idx >> val;
            st.update(1, 0, n - 1, idx, val);
        } else if (type == 2) {
            int l, r;
            cin >> l >> r;
            cout << st.query(1, 0, n - 1, l, r) << "\\n";
        }
    }
    return 0;
}`;

export const MIN_PYTHON_TEMPLATE = `import sys
sys.setrecursionlimit(300000)

class SegmentTree:
    def __init__(self, n):
        self.n = n
        self.tree = [float('inf')] * (4 * n)

    def build(self, a, node, start, end):
        if start == end:
            self.tree[node] = a[start]
            return
        mid = (start + end) // 2
        self.build(a, 2 * node, start, mid)
        self.build(a, 2 * node + 1, mid + 1, end)
        # TODO: merge — store the minimum of left and right children
        self.tree[node] = ???

    def update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val)
        # TODO: merge — store the minimum of left and right children
        self.tree[node] = ???

    def query(self, node, start, end, l, r):
        if r < start or end < l:
            # TODO: return identity value for minimum
            return ???
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        p1 = self.query(2 * node, start, mid, l, r)
        p2 = self.query(2 * node + 1, mid + 1, end, l, r)
        # TODO: return minimum of p1 and p2
        return ???

def main():
    data = sys.stdin.read().split()
    n, q = int(data[0]), int(data[1])
    a = [int(data[2 + i]) for i in range(n)]
    st = SegmentTree(n)
    st.build(a, 1, 0, n - 1)
    idx = 2 + n
    out = []
    for _ in range(q):
        t = int(data[idx])
        if t == 1:
            i_val, val = int(data[idx+1]), int(data[idx+2])
            st.update(1, 0, n - 1, i_val, val)
            idx += 3
        elif t == 2:
            l, r = int(data[idx+1]), int(data[idx+2])
            out.append(str(st.query(1, 0, n - 1, l, r)))
            idx += 3
    print("\\n".join(out))

if __name__ == '__main__':
    main()`;

// Blank starter — student codes the entire solution from scratch.
export const ESCAPE_CPP_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your code goes here

    return 0;
}`;

// Generic segment tree scaffold — shown when the student clicks "Refer Template".
export const ESCAPE_CPP_REFERENCE = `#include <bits/stdc++.h>
using namespace std;

struct SegmentTree {
    int n;
    vector<int> tree;

    SegmentTree(int n) : n(n), tree(4 * n, 0) {}

    void build(const vector<int>& a, int node, int start, int end) {
        if (start == end) {
            tree[node] = a[start];
            return;
        }
        int mid = (start + end) / 2;
        build(a, 2 * node, start, mid);
        build(a, 2 * node + 1, mid + 1, end);
        tree[node] = // TODO: merge left and right children
    }

    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid)
            update(2 * node, start, mid, idx, val);
        else
            update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = // TODO: merge left and right children
    }

    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l)
            return // TODO: identity value (neutral element)
        if (l <= start && end <= r)
            return tree[node];
        int mid = (start + end) / 2;
        int p1 = query(2 * node, start, mid, l, r);
        int p2 = query(2 * node + 1, mid + 1, end, l, r);
        return // TODO: combine p1 and p2
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your code goes here

    return 0;
}`;

export const ESCAPE_PYTHON_REFERENCE = `import sys
sys.setrecursionlimit(300000)

# Cheapest Escape Route
# cost[i] = 1000 - discount[i]
# Minimising cost == Maximising discount
# Build a RANGE MAX tree on the discounts array.

class SegmentTree:
    def __init__(self, n):
        self.n = n
        self.tree = [0] * (4 * n)

    def build(self, d, node, start, end):
        if start == end:
            self.tree[node] = d[start]
            return
        mid = (start + end) // 2
        self.build(d, 2 * node, start, mid)
        self.build(d, 2 * node + 1, mid + 1, end)
        # TODO: merge — store the MAXIMUM discount of left and right children
        self.tree[node] = ???

    def update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val)
        # TODO: merge — store the MAXIMUM discount of left and right children
        self.tree[node] = ???

    def query(self, node, start, end, l, r):
        if r < start or end < l:
            # TODO: identity value for maximum (hint: very small number)
            return ???
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        p1 = self.query(2 * node, start, mid, l, r)
        p2 = self.query(2 * node + 1, mid + 1, end, l, r)
        # TODO: return MAXIMUM of p1 and p2
        return ???

def main():
    data = sys.stdin.read().split()
    n, q = int(data[0]), int(data[1])
    # Input is 1-indexed — convert to 0-indexed internally
    d = [int(data[2 + i]) for i in range(n)]
    st = SegmentTree(n)
    st.build(d, 1, 0, n - 1)
    idx = 2 + n
    out = []
    for _ in range(q):
        t = int(data[idx])
        if t == 1:
            i_val = int(data[idx + 1]) - 1   # 1-indexed → 0-indexed
            val   = int(data[idx + 2])
            # TODO: call update with 0-indexed position
            st.update(1, 0, n - 1, ???, val)
            idx += 3
        else:
class SegmentTree:
    def __init__(self, n):
        self.n = n
        self.tree = [float('inf')] * (4 * n)

    def build(self, a, node, start, end):
        if start == end:
            self.tree[node] = a[start]
            return
        mid = (start + end) // 2
        self.build(a, 2 * node, start, mid)
        self.build(a, 2 * node + 1, mid + 1, end)
        # TODO: merge — store the minimum of left and right children
        self.tree[node] = min(self.tree[2 * node], self.tree[2 * node + 1])

    def update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val)
        # TODO: merge — store the minimum of left and right children
        self.tree[node] = min(self.tree[2 * node], self.tree[2 * node + 1])

    def query(self, node, start, end, l, r):
        if r < start or end < l:
            # TODO: return identity value for minimum
            return float('inf')
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        p1 = self.query(2 * node, start, mid, l, r)
        p2 = self.query(2 * node + 1, mid + 1, end, l, r)
        # TODO: return minimum of p1 and p2
        return min(p1, p2)

def main():
    data = sys.stdin.read().split()
    n, q = int(data[0]), int(data[1])
    a = [int(data[2 + i]) for i in range(n)]
    st = SegmentTree(n)
    st.build(a, 1, 0, n - 1)
    idx = 2 + n
    out = []
    for _ in range(q):
        t = int(data[idx])
        if t == 1:
            i_val, val = int(data[idx+1]), int(data[idx+2])
            st.update(1, 0, n - 1, i_val, val)
            idx += 3
        elif t == 2:
            l, r = int(data[idx+1]), int(data[idx+2])
            out.append(str(st.query(1, 0, n - 1, l, r)))
            idx += 3
    print("\n".join(out))

if __name__ == '__main__':
    main()`;

export const ESCAPE_PYTHON_TEMPLATE = `import sys

def solve():
    # your code goes here
    pass

if __name__ == '__main__':
    solve()`;

// ── Queue Anomalies (Challenge 5) — FROM SCRATCH
export const ANOMALY_CPP_TEMPLATE = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your code goes here

    return 0;
}`;

export const ANOMALY_PYTHON_TEMPLATE = `import sys

def solve():
    # your code goes here
    pass

if __name__ == '__main__':
    solve()`;

// ── Queue Anomalies Reconstruction (Challenge 6) — FROM SCRATCH
export const RECONSTRUCTION_CPP_TEMPLATE = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your code goes here

    return 0;
}`;

export const RECONSTRUCTION_PYTHON_TEMPLATE = `import sys

def solve():
    # your code goes here
    pass

if __name__ == '__main__':
    solve()`;


// ── Challenge 7 / 8 / 9: Sample Test Cases injected into shared map ──
(SAMPLE_TEST_CASES as any)["challenge7"] = [
  { label: "Problem Statement Example", input: "5\n5 1 2 2 3 1 3 4 5 4", expected: "1 0 0 0 3" },
  { label: "All Disjoint",              input: "3\n1 1 2 2 3 3",          expected: "0 0 0"   },
  { label: "Fully Nested (3 in 2 in 1)",input: "3\n1 2 3 3 2 1",          expected: "2 1 0"   },
  { label: "Single Ship",               input: "1\n1 1",                   expected: "0"       },
];
(SAMPLE_TEST_CASES as any)["challenge8"] = [
  { label: "Problem Statement Example",   input: "5\n5 1 2 2 3 1 3 4 5 4", expected: "1 0 1 1 1" },
  { label: "All Disjoint",                input: "3\n1 1 2 2 3 3",          expected: "0 0 0"     },
  { label: "Fully Nested (no intersect)", input: "3\n1 2 3 3 2 1",          expected: "0 0 0"     },
  { label: "Two Ships Intersecting",      input: "2\n1 2 1 2",              expected: "1 1"       },
];
(SAMPLE_TEST_CASES as any)["challenge9"] = [
  { label: "Problem Statement Example",   input: "3\n1 2 3\n5\n1 1 2\n1 1 3\n1 2 3\n0 2 1\n1 1 3", expected: "-1\n2\n-1\n3" },
  { label: "Single Cell",                 input: "1\n5\n1\n1 1 1",  expected: "5" },
  { label: "Update then Full Query",      input: "4\n1 2 3 4\n2\n0 3 10\n1 1 4", expected: "8" },
];


// ── Challenge 7: Nested Stays — C++ Template ──
export const SPACEPORT_NESTED_CPP_TEMPLATE = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your code goes here

    return 0;
}`;

// ── Challenge 7: Nested Stays — Python Template ──
export const SPACEPORT_NESTED_PYTHON_TEMPLATE = `import sys

def solve():
    # your code goes here
    pass

if __name__ == '__main__':
    solve()`;

// ── Challenge 8: Partial Overlaps — C++ Template ──
export const SPACEPORT_OVERLAPS_CPP_TEMPLATE = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your code goes here

    return 0;
}`;

// ── Challenge 8: Partial Overlaps — Python Template ──
export const SPACEPORT_OVERLAPS_PYTHON_TEMPLATE = `import sys

def solve():
    # your code goes here
    pass

if __name__ == '__main__':
    solve()`;

// ── Challenge 9: Energy Grid Polarities — C++ Template ──
export const ENERGY_CPP_TEMPLATE = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // your code goes here

    return 0;
}`;

// ── Challenge 9: Energy Grid Polarities — Python Template ──
export const ENERGY_PYTHON_TEMPLATE = `import sys

def solve():
    # your code goes here
    pass

if __name__ == '__main__':
    solve()`;

import { ChallengeConfig } from "@/components/course/types";

export const ST_CHALLENGES: Record<string, ChallengeConfig> = {
  challenge1: {
    id: "challenge1",
    templates: CODE_TEMPLATES.sum,
    backendId: "sum_segment_tree",
    title: "Range Sum Queries",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement: `The full solution is provided. Study it carefully, then submit.\n\nYou are given an array _A_ of _N_ integers and _Q_ queries. Each query is one of two types:\n- \`1 idx val\`: Point update — set _A[idx] = val_\n- \`2 l r\`: Range query — output the **sum** of _A[l…r]_ (0-indexed, inclusive)`,
    constraints: "N, Q ≤ 10⁵",
    inputFormat: "N Q\nA[0] A[1] ... A[N-1]\n(Q lines of queries)",
    outputFormat: "Output for each query",
    hints: [
      "**Hint 1 — Reading the code**\n\nThis challenge is **read-only**. Your goal is to understand the three parts: the `build`, `update`, and `query` functions. Identify what each does before moving on.",
      "**Hint 2 — The merge step**\n\nThe key is the merge line inside both `build` and `update`: `tree[node] = tree[2*node] + tree[2*node+1]`. Every other segment tree problem only changes this one line and the identity value.",
      "**Hint 3 — Submitting**\n\nWhen you are ready, press **Submit**. The solution is already complete — all tests should pass without any edits."
    ],
    editorial: "",
    sampleCases: SAMPLE_TEST_CASES.challenge1,
    nextLesson: "challenge2",
    nextLabel: "Next: Range Min →"
  },
  challenge2: {
    id: "challenge2",
    templates: { cpp: MIN_CPP_TEMPLATE, python: MIN_PYTHON_TEMPLATE },
    backendId: "min_segment_tree",
    title: "Range Min Queries",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement: `Complete the missing parts of the Segment Tree implementation.\n\nYou are given an array _A_ of _N_ integers and _Q_ queries. Each query is one of two types:\n- \`1 idx val\`: Point update — set _A[idx] = val_\n- \`2 l r\`: Range query — output the **minimum** of _A[l…r]_ (0-indexed, inclusive)\n\n**Your task:** Fill in the \`/* ??? */\` placeholders in the template:\n1. In \`build()\`: merge children using **min**\n2. In \`update()\`: merge children using **min**\n3. In \`query()\`: return identity for out-of-range\n4. In \`query()\`: return **min** of left and right results`,
    constraints: "N, Q ≤ 10⁵",
    inputFormat: "N Q\nA[0] A[1] ... A[N-1]\n(Q lines of queries)",
    outputFormat: "Output for each query",
    hints: [
      "**Hint 1 — Which operation changes?**\n\nThe segment tree skeleton (build, update, query structure) is identical to the Sum Tree. Only one thing changes per function. Think about what you are storing per node.",
      "**Hint 2 — The identity value**\n\nWhen a query range does not overlap a node at all, return a value that does not affect the result. For minimum, returning something too small is wrong. What is the safe identity for `min`? Think about the largest possible integer.",
      "**Hint 3 — Specific identity**\n\nReturn `INT_MAX` (or `LLONG_MAX` if using `long long`) for the out-of-range base case. If your tree stores `int` but you return `LLONG_MAX`, silent integer truncation will produce wrong answers."
    ],
    editorial: "",
    sampleCases: SAMPLE_TEST_CASES.challenge2,
    nextLesson: "challenge3",
    nextLabel: "Next: Range Max →"
  },
  challenge3: {
    id: "challenge3",
    templates: CODE_TEMPLATES.max,
    backendId: "max_segment_tree",
    title: "Range Max Queries",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement: `Complete the missing parts of the Segment Tree implementation.\n\nYou are given an array _A_ of _N_ integers and _Q_ queries. Each query is one of two types:\n- \`1 idx val\`: Point update — set _A[idx] = val_\n- \`2 l r\`: Range query — output the **maximum** of _A[l…r]_ (0-indexed, inclusive)\n\n**Your task:** Fill in the \`// TODO\` placeholders in the template:\n1. In \`build()\`: change merge to **max**\n2. In \`update()\`: change merge to **max**\n3. In \`query()\`: correct identity value\n4. In \`query()\`: return **max** of sub-results`,
    constraints: "N, Q ≤ 10⁵",
    inputFormat: "N Q\nA[0] A[1] ... A[N-1]\n(Q lines of queries)",
    outputFormat: "Output for each query",
    hints: [
      "**Hint 1 — Which operation changes?**\n\nThe structure is the same as the Min and Sum trees. Find the single line in each of `build`, `update`, and `query` that differs from the min tree.",
      "**Hint 2 — The identity value**\n\nThe out-of-range return value must always lose to any real value in the array. What is the identity for `max`? Think about the smallest possible integer.",
      "**Hint 3 — Specific identity**\n\nReturn `INT_MIN` (or `LLONG_MIN`) for the out-of-range case. The array can contain negative numbers, so returning `0` would be silently wrong on those inputs."
    ],
    editorial: "",
    sampleCases: SAMPLE_TEST_CASES.challenge3,
    nextLesson: "challenge4",
    nextLabel: "Next: Escape Route →"
  },
  challenge4: {
    id: "challenge4",
    templates: { cpp: ESCAPE_CPP_TEMPLATE, python: ESCAPE_PYTHON_TEMPLATE },
    referenceTemplates: { cpp: ESCAPE_CPP_REFERENCE, python: ESCAPE_PYTHON_REFERENCE },
    backendId: "escape_route",
    title: "Cheapest Escape Route",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement: `Write the complete solution from scratch. The key insight is hidden in plain sight.\n\nThere are _N_ cities in a line. Every city charges a base toll of **1000** coins, but each city offers a **discount**. City _i_ has discount _d[i]_, so it costs \`1000 - d[i]\` to pass through.\n\nFor each query, pass through exactly **one city** in _[l, r]_ — find the cheapest.\n\n- \`1 i v\`: City _i_ changes its discount to _v_\n- \`2 l r\`: Print the **minimum cost** to pass through any one city in _[l, r]_`,
    constraints: "1 ≤ N, Q ≤ 10⁵\n0 ≤ d[i] ≤ 999 · Base toll = 1000\nAll operations are **1-indexed**",
    inputFormat: "N Q\nd[1] d[2] ... d[N]\n(Q lines of queries)",
    outputFormat: "Output for each query",
    hints: [
      "**Hint 1 — What are you minimising?**\n\nThe cost of city `i` is `1000 - d[i]`. Write out the expression for the minimum cost over range `[l, r]` and see if you can simplify it algebraically before writing any code.",
      "**Hint 2 — The algebraic flip**\n\nMinimising `1000 - d[i]` over a range is equivalent to maximising `d[i]` over that range. You do not need a min tree — you need a **range max tree on the discounts**.",
      "**Hint 3 — Indexing**\n\nInput queries are **1-indexed**. If your segment tree is 0-indexed internally, subtract 1 from `i`, `l`, and `r` when passing them into tree functions. The reference template keeps the tree 1-indexed to avoid this translation entirely."
    ],
    editorial: `**Approach: Maximize the Discount**\n\nThe problem asks us to find the minimum cost to pass through any one city in a range \`[l, r]\`. The cost of city \`i\` is \`1000 - d[i]\`, where \`d[i]\` is the discount. \n\nMathematically, finding the minimum of \`1000 - d[i]\` is exactly the same as finding the maximum of \`d[i]\` and then subtracting it from 1000. \n\nSo, instead of building a Minimum Segment Tree on the costs (which would require recalculating \`1000 - d[i]\` everywhere), we can just build a standard **Maximum Segment Tree** directly on the discounts array \`d\`. When queried for range \`[l, r]\`, we find the maximum discount \`max_d\` and our answer is simply \`1000 - max_d\`.\n\n**Time Complexity**: O((N + Q) log N)`,
    sampleCases: SAMPLE_TEST_CASES.challenge4,
    nextLesson: "badge",
    nextLabel: "Next: Claim Badge →"
  },
  challenge5: {
    id: "challenge5",
    templates: { cpp: ANOMALY_CPP_TEMPLATE, python: ANOMALY_PYTHON_TEMPLATE },
    backendId: "queue_anomalies",
    title: "Queue Anomalies",
    premium: true,
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement: `Players join a matchmaking queue one by one. Each has a unique, hidden **skill rating** (a permutation of 1 to N). A player's **anomaly score** is the number of players **ahead of them in the queue** with a **strictly higher rating**.\n\nGiven the sequence of skill ratings from front to back, print the anomaly score for every player.`,
    constraints: "1 ≤ N ≤ 10⁵\nR is a permutation of integers 1 to N\nTime limit: 1.0 s — O(N²) brute force will **TLE**\nMemory limit: 1024 MB",
    inputFormat: "N\nR[0] R[1] ... R[N-1]",
    outputFormat: "N space-separated integers (the anomaly score for each player)",
    hints: [
      "**Hint 1 — Read the solution structure**\n\nThis challenge is **read-only**. Focus on the two critical lines per player: the `query(1, 1, n, r[i]+1, n)` call (how many inserted elements are greater?) and the `add(1, 1, n, r[i], 1)` call (inserting the current rating).",
      "**Hint 2 — Why query [R+1, N]?**\n\nThe tree tracks how many times each rating has been inserted so far. Querying `[R+1, N]` counts exactly the previously-seen ratings that are **strictly greater** than the current player's rating _R_. This is the inversion count ending at position _i_.",
      "**Hint 3 — Why O(N²) TLEs**\n\nA naive brute-force loops over all prior players for each player, giving O(N²) total work. With N = 10⁵, that is 10¹⁰ operations — 100× over the 10⁸ CPU limit. The Segment Tree reduces each query and insert to O(log N), making the total O(N log N) — well under 1 second."
    ],
    editorial: `**Approach: Inversion Count**\n\nThis is a classic problem of finding the number of inversions ending at each position. We want to count how many elements before the current element are strictly greater than it.\n\nWe can maintain a Segment Tree of size N (since ratings are a permutation of 1 to N) that keeps track of the frequencies of ratings we have seen so far. Initially, the tree is all zeros.\n\nAs we process each player's rating \`R\`, we need to count how many ratings we have already seen that are strictly greater than \`R\`. This is exactly a range sum query on our segment tree from index \`R + 1\` to \`N\`. After querying, we mark that we have now seen rating \`R\` by doing a point update to add 1 at index \`R\` in our segment tree.\n\n**Time Complexity**: O(N log N)`,
    sampleCases: SAMPLE_TEST_CASES.challenge5,
    nextLesson: "challenge6",
    nextLabel: "Next: The Reconstruction →"
  },
  challenge6: {
    id: "challenge6",
    templates: { cpp: RECONSTRUCTION_CPP_TEMPLATE, python: RECONSTRUCTION_PYTHON_TEMPLATE },
    backendId: "queue_anomalies_reconstruction",
    title: "Queue Anomalies (Reconstruction)",
    premium: true,
    difficulty: "Hard",
    diffColor: "var(--cm-red)",
    statement: `A critical database failure has erased the original ratings. The only backup is the array of **anomaly scores**. Given those scores, reconstruct the original **skill rating sequence** — a permutation of 1 to N.`,
    constraints: "1 ≤ N ≤ 10⁵\nInput scores are guaranteed to be from a valid permutation of 1..N\nTime limit: 1.0 s · Memory limit: 1024 MB",
    inputFormat: "N\nA[0] A[1] ... A[N-1]",
    outputFormat: "N space-separated integers — the original rating sequence",
    hints: [
      "**Hint 1 — Work backwards**\n\nThis challenge is **read-only**. Start from the last player. They have no one behind them, so their anomaly score directly tells you how many of all N ratings are larger. Process right to left — at each step you know exactly _i+1_ ratings remain unassigned.",
      "**Hint 2 — The k-th rank formula**\n\nAt position _i_ (0-indexed), there are _i+1_ available ratings. If _A[i]_ of them are larger, then the current rating is the **(i+1 − A[i])-th smallest** available. For example: if 3 available remain and A[i]=1, the rating is the 2nd smallest of those 3.",
      "**Hint 3 — findAndRemove traversal**\n\nInitialise your range-sum structure with all 1s (every rating available). **findAndRemove(k)** starts at root: if left child sum ≥ k, go left; else subtract left sum from k and go right. At a leaf, set it to 0 and return its index. O(log N) per step."
    ],
    editorial: `**Approach: Reversing Inversions with a Segment Tree**\n\nWe are given the inversion sequence. To reconstruct the original permutation, we must process the sequence **backwards** (from right to left). \n\nWhen we are at the last player, they have no players behind them. Their anomaly score tells us exactly how many of the available ratings are strictly greater than theirs. Since there are \`N\` available ratings initially, the rating of the last player must be the \`(N - score)\`-th smallest available rating.\n\nWe maintain a segment tree initialized with 1s at leaves \`1\` to \`N\`, representing available ratings. The internal nodes store the sum of available ratings in their range. To find the \`k\`-th smallest available rating, we can traverse the segment tree from the root:\n1. If the sum of the left child is \`>= k\`, the \`k\`-th available rating is in the left subtree. Move to the left child.\n2. Otherwise, the \`k\`-th available rating is in the right subtree. Move to the right child, and subtract the left child's sum from \`k\` (because we skipped that many available ratings).\n\nWhen we reach a leaf, its index is our target rating. We record it and update its value to 0 to mark it as used.\n\n**Time Complexity**: O(N log N)`,
    sampleCases: SAMPLE_TEST_CASES.challenge6,
    nextLesson: "challenge7",
    nextLabel: "Next: Nested Stays →"
  },
  challenge7: {
    id: "challenge7",
    templates: { cpp: SPACEPORT_NESTED_CPP_TEMPLATE, python: SPACEPORT_NESTED_PYTHON_TEMPLATE },
    backendId: "spaceport_nested",
    title: "Spaceport Logistics (Nested Stays)",
    premium: true,
    difficulty: "Hard",
    diffColor: "var(--cm-red)",
    statement: `The docking bay logs exactly two events per ship: one when it **docks** and one when it **departs**. Ship _Y_'s stay is **strictly nested** inside Ship _X_'s if _Y_ docks after _X_ docks and departs before _X_ departs.\n\nGiven the chronological log of _2N_ events, compute for each ship how many stays are strictly nested inside it.`,
    constraints: "1 ≤ N ≤ 10⁵ · Each ship ID 1..N appears exactly twice\nTime limit: 1.0 s · Memory limit: 1024 MB",
    inputFormat: "N\nlog[0] log[1] ... log[2N-1]",
    outputFormat: "N space-separated integers — nested count for each ship 1..N",
    hints: [
      "**Hint 1 — What counts as nested?**\n\nThis challenge is **read-only**. Ship Y is nested inside Ship X if Y _docks after X docks_ AND _departs before X departs_. In the event log, Y's two positions are both strictly between X's two positions.",
      "**Hint 2 — Process events left to right**\n\nWhen you see ship _id_ for the first time at position _L_, just record _L_. When you see it again at _R_, its stay _[L, R]_ is complete. Any ship that is nested must have _both_ events between _L_ and _R_, meaning it was fully completed earlier — so it's already marked in your structure.",
      "**Hint 3 — Range query + point update**\n\nUse a structure supporting range-sum queries and point updates. When ship X departs at R: **query [L+1, R-1]** for the count of completed ships nested inside. Then **add 1 at position L** to mark X as completed. O(log N) per event → O(N log N) total."
    ],
    editorial: `**Editorial (Problem C)**\n\nTo solve this efficiently, we can use a Segment Tree designed for point updates and range sum queries. We iterate through the event log from left to right. When we see a ship ID for the first time at index **L**, we record **L** as its docking position. We do not add it to our Segment Tree yet.\n\nWhen we see that same ship ID for the second time at index **R**, we know it has departed. Any ship that is nested inside this current ship must have a docking index strictly greater than **L**, and a departure index strictly less than **R**.\n\nBecause we process chronologically and are currently at **R**, any ship that departed before **R** will already be marked in our Segment Tree.\n\nTherefore, we query our Segment Tree for the sum of elements in the range **[L + 1, R - 1]**. This sum is exactly the count of nested stays.\n\nAfter querying, we update the Segment Tree by adding 1 at index **L**. This marks the ship as "completed" so it can act as a nested ship for broader stays that encompass it. This yields an **O(N log N)** solution.\n\n\`\`\`cpp\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\n// Standard Range Sum Segment Tree\nstruct SegmentTree {\n    int n;\n    vector<int> tree;\n\n    SegmentTree(int size) {\n        n = size;\n        tree.assign(4 * n + 1, 0);\n    }\n\n    void update(int node, int start, int end, int idx, int val) {\n        if (start == end) {\n            tree[node] += val;\n            return;\n        }\n        int mid = start + (end - start) / 2;\n        if (idx <= mid) update(2 * node, start, mid, idx, val);\n        else update(2 * node + 1, mid + 1, end, idx, val);\n        \n        tree[node] = tree[2 * node] + tree[2 * node + 1];\n    }\n\n    int query(int node, int start, int end, int l, int r) {\n        if (r < start || end < l) return 0;\n        if (l <= start && end <= r) return tree[node];\n        \n        int mid = start + (end - start) / 2;\n        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);\n    }\n};\n\nvoid solve() {\n    int n;\n    cin >> n;\n    \n    int totalEvents = 2 * n;\n    vector<int> log(totalEvents);\n    for (int i = 0; i < totalEvents; ++i) {\n        cin >> log[i];\n    }\n\n    vector<int> dockPos(n + 1, -1);\n    vector<int> ans(n + 1);\n    SegmentTree segTree(totalEvents);\n\n    for (int i = 0; i < totalEvents; ++i) {\n        int shipId = log[i];\n        int currPos = i + 1; \n\n        if (dockPos[shipId] == -1) {\n            dockPos[shipId] = currPos;\n        } else {\n            int startPos = dockPos[shipId];\n            \n            // Query completed ships that docked after startPos\n            ans[shipId] = segTree.query(1, 1, totalEvents, startPos + 1, currPos - 1);\n            \n            // Mark this ship as completed at its docking position\n            segTree.update(1, 1, totalEvents, startPos, 1);\n        }\n    }\n\n    for (int i = 1; i <= n; ++i) {\n        cout << ans[i] << (i == n ? "" : " ");\n    }\n    cout << "\\n";\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    solve();\n    return 0;\n}\n\`\`\`\n\n\`\`\`python\nimport sys\n\nclass IterativeSegmentTree:\n    def __init__(self, size):\n        self.n = size\n        self.tree = [0] * (2 * self.n)\n\n    def add(self, idx, val):\n        idx += self.n\n        self.tree[idx] += val\n        idx //= 2\n        while idx > 0:\n            self.tree[idx] = self.tree[2 * idx] + self.tree[2 * idx + 1]\n            idx //= 2\n\n    def query(self, left, right):\n        if left > right: return 0\n        left += self.n\n        right += self.n\n        res = 0\n        while left <= right:\n            if left % 2 == 1:\n                res += self.tree[left]\n                left += 1\n            if right % 2 == 0:\n                res += self.tree[right]\n                right -= 1\n            left //= 2\n            right //= 2\n        return res\n\ndef solve():\n    inputData = sys.stdin.read().split()\n    if not inputData: return\n    \n    n = int(inputData[0])\n    totalEvents = 2 * n\n    logs = [int(x) for x in inputData[1 : totalEvents + 1]]\n    \n    segTree = IterativeSegmentTree(totalEvents + 1)\n    dockPos = [-1] * (n + 1)\n    ans = [0] * (n + 1)\n    \n    for i in range(totalEvents):\n        shipId = logs[i]\n        currPos = i + 1\n        \n        if dockPos[shipId] == -1:\n            dockPos[shipId] = currPos\n        else:\n            startPos = dockPos[shipId]\n            # Calculate nested stays\n            nested = segTree.query(startPos + 1, currPos - 1)\n            ans[shipId] = nested\n            \n            # Register stay completion\n            segTree.add(startPos, 1)\n            \n    print(*(ans[1:]))\n\nif __name__ == '__main__':\n    solve()\n\`\`\``,
    sampleCases: SAMPLE_TEST_CASES.challenge7,
    nextLesson: "challenge8",
    nextLabel: "Next: Partial Overlaps →"
  },
  challenge8: {
    id: "challenge8",
    templates: { cpp: SPACEPORT_OVERLAPS_CPP_TEMPLATE, python: SPACEPORT_OVERLAPS_PYTHON_TEMPLATE },
    backendId: "spaceport_overlaps",
    title: "Spaceport Logistics (Partial Overlaps)",
    premium: true,
    difficulty: "Hard",
    diffColor: "var(--cm-red)",
    statement: `Using the same ship log as Problem C, we now count **partial overlaps**. Ship _Y_ _intersects_ Ship _X_'s stay if **exactly one** of _Y_'s events occurs while _X_ is in port.`,
    constraints: "1 ≤ N ≤ 10⁵ · Each ship ID 1..N appears exactly twice\nTime limit: 1.0 s · Memory limit: 1024 MB",
    inputFormat: "Same format as Problem C",
    outputFormat: "N space-separated integers — partial overlaps count for each ship 1..N",
    hints: [
      "**Hint 1 — Categorise by event count**\n\nThis challenge is **read-only**. For Ship X with stay _[L, R]_, count how many events fall strictly inside: that's _R − L − 1_. Each event belongs to exactly one other ship. A ship that **encompasses** X contributes 0 events, a **nested** ship contributes 2, and an **intersecting** ship contributes exactly 1.",
      "**Hint 2 — The arithmetic formula**\n\nWe know: `eventsInside = 2×nested + 1×intersecting`. We already know _eventsInside_ (trivially) and _nested_ (from Problem C). Rearranging: **intersecting = eventsInside − 2×nested**. No extra data structure needed!",
      "**Hint 3 — Combine both results**\n\nThe code for Problem D is identical to Problem C except for one extra line: after computing _nested_ with the range query, calculate _eventsInside = R − L − 1_ and set _ans = eventsInside − 2×nested_. The range-sum structure update stays exactly the same."
    ],
    editorial: `**Editorial (Problem D)**\n\nThis problem builds directly upon the mathematical logic of our Segment Tree solution from Problem C.\n\nFor a specific Ship **X** with a docking event at **L** and a departure event at **R**, exactly **(R - L - 1)** events occurred while it was in port. Any event inside this range belongs to another Ship **Y**. Let's categorize Ship **Y**:\n\n- **Encompassing Ship:** **Y** docked before **X** and departed after **X**. **Y** has 0 events inside **X**'s bounds.\n- **Nested Ship:** **Y** docked after **X** and departed before **X**. **Y** has 2 events inside **X**'s bounds.\n- **Intersecting Ship:** **Y** has exactly 1 event inside **X**'s bounds.\n\nThis leads to the formula:\n\n**Total Events Between L and R = 2 × Nested + 1 × Intersecting**\n\nRearranging this formula gives us:\n\n**Intersecting = (R - L - 1) - 2 × Nested**\n\nWe query our Segment Tree to find the strictly nested count in **O(log N)** time, and then apply this **O(1)** formula to find the intersections.\n\n\`\`\`cpp\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nstruct SegmentTree {\n    int n;\n    vector<int> tree;\n\n    SegmentTree(int size) {\n        n = size;\n        tree.assign(4 * n + 1, 0);\n    }\n\n    void update(int node, int start, int end, int idx, int val) {\n        if (start == end) {\n            tree[node] += val;\n            return;\n        }\n        int mid = start + (end - start) / 2;\n        if (idx <= mid) update(2 * node, start, mid, idx, val);\n        else update(2 * node + 1, mid + 1, end, idx, val);\n        \n        tree[node] = tree[2 * node] + tree[2 * node + 1];\n    }\n\n    int query(int node, int start, int end, int l, int r) {\n        if (r < start || end < l) return 0;\n        if (l <= start && end <= r) return tree[node];\n        \n        int mid = start + (end - start) / 2;\n        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);\n    }\n};\n\nvoid solve() {\n    int n;\n    cin >> n;\n    \n    int totalEvents = 2 * n;\n    vector<int> log(totalEvents);\n    for (int i = 0; i < totalEvents; ++i) cin >> log[i];\n\n    vector<int> dockPos(n + 1, -1);\n    vector<int> ans(n + 1);\n    SegmentTree segTree(totalEvents);\n\n    for (int i = 0; i < totalEvents; ++i) {\n        int shipId = log[i];\n        int currPos = i + 1; \n\n        if (dockPos[shipId] == -1) {\n            dockPos[shipId] = currPos;\n        } else {\n            int startPos = dockPos[shipId];\n            \n            // 1. Find strictly nested ships\n            int nested = segTree.query(1, 1, totalEvents, startPos + 1, currPos - 1);\n            \n            // 2. Count total events inside the current ship's stay\n            int eventsInside = (currPos - startPos - 1);\n            \n            // 3. Apply the mathematical formula to find intersections\n            ans[shipId] = eventsInside - (2 * nested);\n            \n            // 4. Mark ship as departed\n            segTree.update(1, 1, totalEvents, startPos, 1);\n        }\n    }\n\n    for (int i = 1; i <= n; ++i) cout << ans[i] << (i == n ? "" : " ");\n    cout << "\\n";\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    solve();\n    return 0;\n}\n\`\`\`\n\n\`\`\`python\nimport sys\n\nclass IterativeSegmentTree:\n    def __init__(self, size):\n        self.n = size\n        self.tree = [0] * (2 * self.n)\n\n    def add(self, idx, val):\n        idx += self.n\n        self.tree[idx] += val\n        idx //= 2\n        while idx > 0:\n            self.tree[idx] = self.tree[2 * idx] + self.tree[2 * idx + 1]\n            idx //= 2\n\n    def query(self, left, right):\n        if left > right: return 0\n        left += self.n\n        right += self.n\n        res = 0\n        while left <= right:\n            if left % 2 == 1:\n                res += self.tree[left]\n                left += 1\n            if right % 2 == 0:\n                res += self.tree[right]\n                right -= 1\n            left //= 2\n            right //= 2\n        return res\n\ndef solve():\n    inputData = sys.stdin.read().split()\n    if not inputData: return\n    \n    n = int(inputData[0])\n    totalEvents = 2 * n\n    logs = [int(x) for x in inputData[1 : totalEvents + 1]]\n    \n    segTree = IterativeSegmentTree(totalEvents + 1)\n    dockPos = [-1] * (n + 1)\n    ans = [0] * (n + 1)\n    \n    for i in range(totalEvents):\n        shipId = logs[i]\n        currPos = i + 1\n        \n        if dockPos[shipId] == -1:\n            dockPos[shipId] = currPos\n        else:\n            startPos = dockPos[shipId]\n            \n            nested = segTree.query(startPos + 1, currPos - 1)\n            eventsInside = (currPos - startPos - 1)\n            ans[shipId] = eventsInside - (2 * nested)\n            \n            segTree.add(startPos, 1)\n            \n    print(*(ans[1:]))\n\nif __name__ == '__main__':\n    solve()\n\`\`\``,
    sampleCases: SAMPLE_TEST_CASES.challenge8,
    nextLesson: "challenge9",
    nextLabel: "Next: Energy Grid →"
  },
  challenge9: {
    id: "challenge9",
    templates: { cpp: ENERGY_CPP_TEMPLATE, python: ENERGY_PYTHON_TEMPLATE },
    backendId: "energy_grid",
    title: "Energy Grid Polarities",
    premium: true,
    difficulty: "Hard",
    diffColor: "var(--cm-red)",
    statement: `An energy grid of _N_ cells is connected in series. A bypass cable across cells _[L, R]_ produces a **net alternating voltage**:\n\nC_L − C_{L+1} + C_{L+2} − C_{L+3} + … ± C_R\n\nDrones can also update any cell's charge. Handle both operations efficiently.\n\n- \`0 i j\`: Set C[i] = j (point update, 1-indexed)\n- \`1 l r\`: Output alternating voltage for range _[l, r]_`,
    constraints: "1 ≤ N, M ≤ 10⁵ · 1 ≤ j ≤ 10⁴ · 1 ≤ i ≤ N\nTime limit: 2.0 s · Memory limit: 1024 MB",
    inputFormat: "N\nC[1] C[2] ... C[N]\nM\n(M lines of operations)",
    outputFormat: "Output for each query",
    hints: [
      "**Hint 1 — The alternating-sign problem**\n\nThis challenge is **read-only**. A naïve loop for each query is O(N) — too slow. The sign of each element in the alternating sum depends on its distance from the starting index _L_, making direct range queries tricky. Think about pre-baking the signs into the array itself.",
      "**Hint 2 — The sign-transform**\n\nDefine array _B_: `B[i] = +C[i]` if _i_ is odd (1-based), `B[i] = −C[i]` if _i_ is even. Store _B_ in a range-sum structure. Now **sum(B[l..r])** is the alternating sum starting with a _+_ at odd positions. Updates just flip the stored sign.",
      "**Hint 3 — Fix the parity**\n\nIf _l_ is **odd**: the standard sum of _B[l..r]_ matches the alternating formula directly — output it as-is. If _l_ is **even**: _B[l]_ is _−C[l]_, so the sum is the negative of what we want — multiply by **−1**. That's the entire fix!"
    ],
    editorial: `**Editorial**\n\nThis problem showcases the flexibility of the Segment Tree. The alternating signs complicate point updates because the sign of an element appears relative to the query's starting index **L**. We can overcome this by maintaining a global alternating array.\n\nWe maintain an underlying sequence **B** in our Segment Tree, defined by the parity of the 1-based index **i**:\n\n- If **i** is odd: **Bᵢ = Cᵢ**\n- If **i** is even: **Bᵢ = -Cᵢ**\n\nWhen we receive a replacement operation **0 i j**, we update our Segment Tree with **j** (if **i** is odd) or **-j** (if **i** is even).\n\nWhen we receive a voltage query operation **1 l r**, we ask the Segment Tree for the standard sum of elements in **B** from **l** to **r**. Let's call this sum **S**.\n\n- If **l** is an odd index, **S = Cₗ - Cₗ₊₁ + Cₗ₊₂ ...** This matches our target exactly. The answer is **S**.\n- If **l** is an even index, **S = -Cₗ + Cₗ₊₁ - Cₗ₊₂ ...** This is the exact inverse. By factoring out a -1, we get **-(Cₗ - Cₗ₊₁ ...)**. The answer is **-S**.\n\nBy applying this mathematical transformation globally, the Segment Tree only needs to manage simple point updates and standard range sums, achieving the required **O(log N)** time per operation.\n\n\`\`\`cpp\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nstruct SegmentTree {\n    int n;\n    vector<long long> tree;\n\n    SegmentTree(int size) {\n        n = size;\n        tree.assign(4 * n + 1, 0);\n    }\n\n    void build(const vector<long long>& b, int node, int start, int end) {\n        if (start == end) {\n            tree[node] = b[start];\n            return;\n        }\n        int mid = start + (end - start) / 2;\n        build(b, 2 * node, start, mid);\n        build(b, 2 * node + 1, mid + 1, end);\n        tree[node] = tree[2 * node] + tree[2 * node + 1];\n    }\n\n    void update(int node, int start, int end, int idx, long long val) {\n        if (start == end) {\n            tree[node] = val;\n            return;\n        }\n        int mid = start + (end - start) / 2;\n        if (idx <= mid) update(2 * node, start, mid, idx, val);\n        else update(2 * node + 1, mid + 1, end, idx, val);\n        tree[node] = tree[2 * node] + tree[2 * node + 1];\n    }\n\n    long long query(int node, int start, int end, int l, int r) {\n        if (r < start || end < l) return 0;\n        if (l <= start && end <= r) return tree[node];\n        int mid = start + (end - start) / 2;\n        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);\n    }\n};\n\nvoid solve() {\n    int n;\n    cin >> n;\n    \n    vector<long long> b(n + 1);\n    for (int i = 1; i <= n; ++i) {\n        long long cVal;\n        cin >> cVal;\n        // Transform based on 1-based index parity\n        b[i] = (i % 2 != 0) ? cVal : -cVal;\n    }\n\n    SegmentTree segTree(n);\n    segTree.build(b, 1, 1, n);\n\n    int m;\n    cin >> m;\n\n    for (int k = 0; k < m; ++k) {\n        int type;\n        cin >> type;\n        \n        if (type == 0) {\n            int i;\n            long long j;\n            cin >> i >> j;\n            \n            // Update the global alternating value\n            long long bVal = (i % 2 != 0) ? j : -j;\n            segTree.update(1, 1, n, i, bVal);\n            \n        } else if (type == 1) {\n            int l, r;\n            cin >> l >> r;\n            \n            long long rawSum = segTree.query(1, 1, n, l, r);\n            \n            // Adjust sign based on starting index parity\n            if (l % 2 != 0) cout << rawSum << "\\n";\n            else cout << -rawSum << "\\n";\n        }\n    }\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    solve();\n    return 0;\n}\n\`\`\`\n\n\`\`\`python\nimport sys\n\nclass IterativeSegmentTree:\n    def __init__(self, size, data):\n        self.n = size\n        self.tree = [0] * (2 * self.n)\n        \n        for i in range(self.n):\n            self.tree[self.n + i] = data[i]\n            \n        for i in range(self.n - 1, 0, -1):\n            self.tree[i] = self.tree[2 * i] + self.tree[2 * i + 1]\n\n    def update(self, idx, val):\n        idx += self.n\n        self.tree[idx] = val\n        idx //= 2\n        while idx > 0:\n            self.tree[idx] = self.tree[2 * idx] + self.tree[2 * idx + 1]\n            idx //= 2\n\n    def query(self, left, right):\n        left += self.n\n        right += self.n\n        res = 0\n        while left <= right:\n            if left % 2 == 1:\n                res += self.tree[left]\n                left += 1\n            if right % 2 == 0:\n                res += self.tree[right]\n                right -= 1\n            left //= 2\n            right //= 2\n        return res\n\ndef solve():\n    inputData = sys.stdin.read().split()\n    if not inputData: return\n        \n    n = int(inputData[0])\n    \n    b = [0] * n\n    for i in range(n):\n        cVal = int(inputData[1 + i])\n        # 0-based even index is equivalent to a 1-based odd index\n        if i % 2 == 0: b[i] = cVal\n        else: b[i] = -cVal\n            \n    m = int(inputData[1 + n])\n    pointer = 1 + n + 1\n    \n    segTree = IterativeSegmentTree(n, b)\n    output = []\n    \n    for _ in range(m):\n        opType = int(inputData[pointer])\n        \n        if opType == 0:\n            i = int(inputData[pointer + 1]) - 1 \n            j = int(inputData[pointer + 2])\n            \n            bVal = j if i % 2 == 0 else -j\n            segTree.update(i, bVal)\n            \n        elif opType == 1:\n            l = int(inputData[pointer + 1]) - 1 \n            r = int(inputData[pointer + 2]) - 1\n            \n            rawSum = segTree.query(l, r)\n            \n            if l % 2 == 0: output.append(str(rawSum))\n            else: output.append(str(-rawSum))\n                \n        pointer += 3\n        \n    print('\\n'.join(output))\n\nif __name__ == '__main__':\n    solve()\n\`\`\``,
    sampleCases: SAMPLE_TEST_CASES.challenge9,
    nextLesson: "badge",
    nextLabel: "🏆 Claim Your Badge"
  }
};
