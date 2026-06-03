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

export const ESCAPE_PYTHON_TEMPLATE = `import sys
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
            l = int(data[idx + 1]) - 1        # 1-indexed → 0-indexed
            r = int(data[idx + 2]) - 1
            max_discount = st.query(1, 0, n - 1, ???, ???)
            # TODO: compute and append the minimum COST (not the discount itself)
            out.append(str(???))
            idx += 3
    print("\\n".join(out))

if __name__ == '__main__':
    main()`;
