"use client";

import { useState, useEffect, useRef } from "react";
import CodeEditor from "./editor/CodeEditor";
import { api } from "@/lib/api";
import styles from "@/app/learn/segment-tree/page.module.css";

// ── Types ──
interface Lesson {
  id: string;
  title: string;
  part: number;
  unlocked: boolean;
}

interface NodeData {
  id: number;
  label: string;
  range: [number, number];
  val: number;
  x: number;
  y: number;
  level: number;
  children?: [number, number];
}

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

// ── Narration Data ──
const NAIVE_NARRATIONS = [
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
  "All naive queries complete. As you can see, each query scans elements one by one, scaling to O(N) per query, which is extremely expensive for many queries!"
];

const TREE_BUILD_NARRATIONS = [
  "Let's build a Segment Tree for our array of size 8. Initially, only the leaf nodes (the array elements) exist.",
  "We start from the leaves and pair them up to form their parents. index [0] and [1] merge to form range [0,1] with sum 4. index [2] and [3] merge to form [2,3] with sum 7. Same for right half.",
  "Next level: We merge node [0,1] (value 4) and node [2,3] (value 7) to get range [0,3] with sum 11. Similarly, we merge node [4,5] (15) and node [6,7] (10) to get range [4,7] with sum 25.",
  "Finally, we merge range [0,3] (value 11) and range [4,7] (value 25) to compute the root node [0,7] with sum 36. The tree is built bottom-up, precomputing all range values once!"
];

const TREE_QUERY_NARRATIONS = [
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
  "Query complete! We merge the values returned by the inside nodes: 1 (from [1,1]) + 7 (from [2,3]) + 15 (from [4,5]) = 23. We visited only 9 nodes in total, and only 3 nodes actually contributed. Compare this to scanning elements naively!"
];

const TREE_UPDATE_NARRATIONS = [
  "Let's update index 3 from value 5 to 10. In a Segment Tree, we only update the leaf node and its direct ancestors.",
  "Step 1: Locate leaf node [3,3]. We update its value from 5 to 10.",
  "Step 2: Go to parent node [2,3]. Its left child is [2,2] (2), and its right child is updated [3,3] (10). New sum = 2 + 10 = 12.",
  "Step 3: Go to grandparent node [0,3]. Its left child is [0,1] (4), and its right child is updated [2,3] (12). New sum = 4 + 12 = 16.",
  "Step 4: Go to the root node [0,7]. Its left child is updated [0,3] (16), and its right child is [4,7] (25). New sum = 16 + 25 = 41. Point update complete! Only 4 nodes (O(log N)) were updated."
];

// ── MCQ Questions ──
const MCQ_PART_1: MCQQuestion[] = [
  {
    id: 1,
    question: "What is the time complexity of answering Q range-sum queries naively on an array of size N?",
    options: ["O(N)", "O(Q)", "O(N · Q)", "O(N log N)"],
    answer: 2,
    explanation: "Correct! The naive approach takes O(N) operations per query in the worst case. Performing Q such queries yields a total time complexity of O(N · Q)."
  },
  {
    id: 2,
    question: "Which of these scenarios would make the naive approach time out (standard 1.0s limit, ~10^8 operations)?",
    options: [
      "N = 100, Q = 100",
      "N = 10,000, Q = 50",
      "N = 100,000, Q = 100,000",
      "N = 500, Q = 1,000"
    ],
    answer: 2,
    explanation: "Correct! When N = 10^5 and Q = 10^5, O(N · Q) results in 10^10 operations, which is way above the standard CPU threshold of ~10^8 operations per second, leading to a Time Limit Exceeded (TLE)."
  }
];

const MCQ_PART_2: MCQQuestion[] = [
  {
    id: 1,
    question: "How many nodes does a segment tree for an array of size N = 8 have?",
    options: ["15", "8", "16", "7"],
    answer: 0,
    explanation: "Correct! For N = 8 (a power of 2), a full binary segment tree contains 8 leaves and 7 internal nodes, giving a total of 15 nodes (2N - 1). In the general case for any N, the size is bounded by 4N."
  },
  {
    id: 2,
    question: "What does a node representing range [2, 5] store in a sum segment tree?",
    options: [
      "The value at index 2 plus the value at index 5",
      "The maximum value in the range [2, 5]",
      "The sum of all elements from index 2 to 5 inclusive",
      "The average of elements in range [2, 5]"
    ],
    answer: 2,
    explanation: "Correct! Each node in a sum segment tree stores the sum of all elements in its corresponding range, which for [2, 5] is a[2] + a[3] + a[4] + a[5]."
  },
  {
    id: 3,
    question: "How many nodes are visited during a range query in the worst case?",
    options: ["O(N)", "O(N log N)", "O(log N)", "O(1)"],
    answer: 2,
    explanation: "Correct! Because we only recurse when there is a partial overlap and can skip fully outside ranges or immediately return fully inside ranges, the maximum number of visited nodes per level is constant, resulting in O(log N) worst-case time complexity."
  }
];

// ── Static Tree Node Definitions ──
const TREE_NODES: NodeData[] = [
  // Level 0
  { id: 1, label: "[0,7]", range: [0, 7], val: 36, x: 300, y: 35, level: 0, children: [2, 3] },
  // Level 1
  { id: 2, label: "[0,3]", range: [0, 3], val: 11, x: 150, y: 95, level: 1, children: [4, 5] },
  { id: 3, label: "[4,7]", range: [4, 7], val: 25, x: 450, y: 95, level: 1, children: [6, 7] },
  // Level 2
  { id: 4, label: "[0,1]", range: [0, 1], val: 4, x: 80, y: 155, level: 2, children: [8, 9] },
  { id: 5, label: "[2,3]", range: [2, 3], val: 7, x: 220, y: 155, level: 2, children: [10, 11] },
  { id: 6, label: "[4,5]", range: [4, 5], val: 15, x: 380, y: 155, level: 2, children: [12, 13] },
  { id: 7, label: "[6,7]", range: [6, 7], val: 10, x: 520, y: 155, level: 2, children: [14, 15] },
  // Level 3 (leaves)
  { id: 8, label: "[0,0]", range: [0, 0], val: 3, x: 45, y: 215, level: 3 },
  { id: 9, label: "[1,1]", range: [1, 1], val: 1, x: 115, y: 215, level: 3 },
  { id: 10, label: "[2,2]", range: [2, 2], val: 2, x: 185, y: 215, level: 3 },
  { id: 11, label: "[3,3]", range: [3, 3], val: 5, x: 255, y: 215, level: 3 },
  { id: 12, label: "[4,4]", range: [4, 4], val: 8, x: 345, y: 215, level: 3 },
  { id: 13, label: "[5,5]", range: [5, 5], val: 7, x: 415, y: 215, level: 3 },
  { id: 14, label: "[6,6]", range: [6, 6], val: 6, x: 485, y: 215, level: 3 },
  { id: 15, label: "[7,7]", range: [7, 7], val: 4, x: 555, y: 215, level: 3 }
];

// ── CodeWalkthrough Lines (C++) ──
interface WalkthroughLine {
  lineNum: number;
  code: string;
  explanation: string;
  type: string;
}

const TEMPLATE_LINES: WalkthroughLine[] = [
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
  { lineNum: 50, code: "};", explanation: "End of SegmentTree struct.", type: "header" }
];

// ── Templates for Monaco Editor ──
const CODE_TEMPLATES = {
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
    if (!(cin >> n >> q)) return 0;
    
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
    main()`
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
    if (!(cin >> n >> q)) return 0;
    
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
    main()`
  }
};

export default function SegmentTreePath() {
  // ── Navigation States ──
  const [currentPart, setCurrentPart] = useState(1);
  const [activeLesson, setActiveLesson] = useState("lesson1");

  // Progression locks
  const [part1Complete, setPart1Complete] = useState(false);
  const [part2Complete, setPart2Complete] = useState(false);
  const [part3Complete, setPart3Complete] = useState(false);

  // Lessons configuration
  const lessons: Lesson[] = [
    // Part 1
    { id: "lesson1", title: "1. The Naive Approach", part: 1, unlocked: true },
    { id: "lesson2", title: "2. Why This Hurts", part: 1, unlocked: true },
    { id: "mcq1", title: "Checkpoint: Complexity Check", part: 1, unlocked: true },
    // Part 2
    { id: "lesson3", title: "3. The Core Idea", part: 2, unlocked: part1Complete },
    { id: "lesson4", title: "4. Answering a Query", part: 2, unlocked: part1Complete },
    { id: "lesson5", title: "5. Point Update", part: 2, unlocked: part1Complete },
    { id: "mcq2", title: "Checkpoint: Tree Structure", part: 2, unlocked: part1Complete },
    // Part 3
    { id: "lesson6", title: "6. Code Walkthrough", part: 3, unlocked: part2Complete },
    { id: "challenge1", title: "7. Coding: Sum Tree", part: 3, unlocked: part2Complete },
    { id: "challenge2", title: "8. Coding: Max Tree", part: 3, unlocked: part2Complete && part3Complete }, // unlocks dynamically
    { id: "badge", title: "9. Completion Certificate", part: 3, unlocked: part2Complete && part3Complete }
  ];

  // ── MCQ States ──
  const [mcqAnswers1, setMcqAnswers1] = useState<Record<number, number>>({});
  const [mcqChecked1, setMcqChecked1] = useState<Record<number, boolean>>({});
  const [mcqAnswers2, setMcqAnswers2] = useState<Record<number, number>>({});
  const [mcqChecked2, setMcqChecked2] = useState<Record<number, boolean>>({});

  // ── PART 1: Lesson 1 Naive Simulation State ──
  const naiveArray = [3, 1, 2, 5, 8, 7, 6, 4];
  const [naiveStep, setNaiveStep] = useState(0);
  const [naiveQueryIdx, setNaiveQueryIdx] = useState(0); // 0: [1,5], 1: [0,2], 2: [4,7]
  const [naiveScannedCount, setNaiveScannedCount] = useState(0);
  const [naiveRunningSum, setNaiveRunningSum] = useState(0);
  const [isNaiveAutoplay, setIsNaiveAutoplay] = useState(false);
  const naiveAutoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Naive Queries metadata
  const naiveQueries = [
    { label: "Q1: Sum[1, 5]", l: 1, r: 5, steps: [1, 2, 3, 4, 5, 6], baseStep: 1 },
    { label: "Q2: Sum[0, 2]", l: 0, r: 2, steps: [7, 8, 9, 10], baseStep: 7 },
    { label: "Q3: Sum[4, 7]", l: 4, r: 7, steps: [11, 12, 13, 14, 15], baseStep: 11 }
  ];

  // ── PART 2: Segment Tree Simulator State ──
  // Lesson 3 Build Animation
  const [treeBuildStep, setTreeBuildStep] = useState(0); // 0..3
  // Lesson 4 Query Animation
  const [treeQueryStep, setTreeQueryStep] = useState(0); // 0..10
  // Lesson 5 Update Animation
  const [treeUpdateStep, setTreeUpdateStep] = useState(0); // 0..4

  // Helper for active classes on tree simulator
  const getQueryNodeOverlap = (nodeId: number, step: number): string => {
    // Target Query: Range [1, 5]
    // Steps mapping node overlap highlights
    if (step === 0) return styles.nodeNeutralCircle; // root selected but all normal
    if (step === 1) {
      if (nodeId === 1) return styles.nodeOverlapPartial;
    }
    if (step === 2) {
      if (nodeId === 1) return styles.nodeOverlapPartial;
      if (nodeId === 2) return styles.nodeOverlapPartial;
    }
    if (step === 3) {
      if (nodeId === 1 || nodeId === 2) return styles.nodeOverlapPartial;
      if (nodeId === 4) return styles.nodeOverlapPartial;
    }
    if (step === 4) {
      if (nodeId === 1 || nodeId === 2 || nodeId === 4) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone; // leaf 0: no overlap
    }
    if (step === 5) {
      if (nodeId === 1 || nodeId === 2 || nodeId === 4) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9) return styles.nodeOverlapFull; // leaf 1: full overlap
    }
    if (step === 6) {
      if (nodeId === 1 || nodeId === 2) return styles.nodeOverlapPartial;
      if (nodeId === 4) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9) return styles.nodeOverlapFull;
      if (nodeId === 5) return styles.nodeOverlapFull; // [2,3]: full overlap
    }
    if (step === 7) {
      if (nodeId === 1 || nodeId === 2) return styles.nodeOverlapPartial;
      if (nodeId === 4) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9 || nodeId === 5) return styles.nodeOverlapFull;
      if (nodeId === 3) return styles.nodeOverlapPartial; // [4,7]: partial
    }
    if (step === 8) {
      if (nodeId === 1 || nodeId === 2 || nodeId === 3) return styles.nodeOverlapPartial;
      if (nodeId === 4) return styles.nodeOverlapPartial;
      if (nodeId === 8) return styles.nodeOverlapNone;
      if (nodeId === 9 || nodeId === 5) return styles.nodeOverlapFull;
      if (nodeId === 6) return styles.nodeOverlapFull; // [4,5]: full
    }
    if (step === 9) {
      if (nodeId === 1 || nodeId === 2 || nodeId === 3) return styles.nodeOverlapPartial;
      if (nodeId === 4) return styles.nodeOverlapPartial;
      if (nodeId === 8 || nodeId === 7) return styles.nodeOverlapNone; // [6,7]: none
      if (nodeId === 9 || nodeId === 5 || nodeId === 6) return styles.nodeOverlapFull;
    }
    if (step === 10) {
      // Completed, show final full-overlap paths
      if (nodeId === 9 || nodeId === 5 || nodeId === 6) return styles.nodeOverlapFull;
      if (nodeId === 8 || nodeId === 7) return styles.nodeOverlapNone;
      if (nodeId === 1 || nodeId === 2 || nodeId === 3 || nodeId === 4) return styles.nodeOverlapPartial;
    }
    return styles.nodeNeutralCircle;
  };

  const getUpdateNodeState = (nodeId: number, step: number): string => {
    // Update leaf idx 3 (node 11), from value 5 to 10.
    // Ancestors: node 11 -> node 5 -> node 2 -> node 1
    if (step >= 1 && nodeId === 11) return styles.nodeUpdateCircle;
    if (step >= 2 && nodeId === 5) return styles.nodeUpdateCircle;
    if (step >= 3 && nodeId === 2) return styles.nodeUpdateCircle;
    if (step >= 4 && nodeId === 1) return styles.nodeUpdateCircle;
    return styles.nodeNeutralCircle;
  };

  // ── PART 3: Code Walkthrough State ──
  const [walkthroughLine, setWalkthroughLine] = useState<number>(4);

  // ── PART 3: Coding Challenges State ──
  const [selectedLanguage, setSelectedLanguage] = useState<"cpp" | "python">("cpp");
  const [editorValue, setEditorValue] = useState("");
  const [runInput, setRunInput] = useState("5 5\n1 2 3 4 5\n2 0 2\n1 1 10\n2 0 2\n2 1 4\n2 0 4\n");
  const [consoleTab, setConsoleTab] = useState<"stdout" | "input" | "cases">("cases");

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleStdout, setConsoleStdout] = useState("");
  const [consoleError, setConsoleError] = useState("");

  // Test case response details
  interface LPTestResult {
    testIndex: number;
    verdict: string;
    executionTime?: string;
    memory?: number;
    output?: string;
    expected: string;
    stderr?: string;
    compileOutput?: string;
  }
  const [testResults, setTestResults] = useState<LPTestResult[]>([]);
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);

  // Initial code values on challenge selection
  useEffect(() => {
    if (activeLesson === "challenge1") {
      setEditorValue(CODE_TEMPLATES.sum[selectedLanguage]);
      setConsoleTab("cases");
      setTestResults([]);
    } else if (activeLesson === "challenge2") {
      setEditorValue(CODE_TEMPLATES.max[selectedLanguage]);
      setConsoleTab("cases");
      setTestResults([]);
    }
  }, [activeLesson, selectedLanguage]);

  // ── Animation Handlers ──
  // Naive Autoplay loop
  useEffect(() => {
    if (isNaiveAutoplay) {
      naiveAutoplayRef.current = setInterval(() => {
        handleNaiveNextStep();
      }, 1500);
    } else {
      if (naiveAutoplayRef.current) clearInterval(naiveAutoplayRef.current);
    }
    return () => {
      if (naiveAutoplayRef.current) clearInterval(naiveAutoplayRef.current);
    };
  }, [isNaiveAutoplay, naiveStep, naiveQueryIdx]);

  const handleNaiveNextStep = () => {
    const q = naiveQueries[naiveQueryIdx];
    const totalSteps = 16; // last narration index is 16

    if (naiveStep >= totalSteps) {
      setIsNaiveAutoplay(false);
      return;
    }

    const nextStep = naiveStep + 1;
    setNaiveStep(nextStep);

    // Sync Counters
    // Narration transitions define queries:
    // Narration 0: Introduction
    // Narration 1: Start Q1. Sum range [1,5]
    // Narration 2..6: scan idx 1..5
    if (nextStep >= 1 && nextStep <= 6) {
      setNaiveQueryIdx(0);
      const scanned = nextStep - 1; // 0..5
      setNaiveScannedCount(scanned);
      // Calc running sum
      let sum = 0;
      for (let i = 0; i < scanned; i++) {
        sum += naiveArray[1 + i];
      }
      setNaiveRunningSum(sum);
    }
    // Narration 7: Start Q2. Sum range [0,2]
    // Narration 8..10: scan idx 0..2
    else if (nextStep >= 7 && nextStep <= 10) {
      setNaiveQueryIdx(1);
      const scanned = nextStep - 7;
      setNaiveScannedCount(scanned);
      let sum = 0;
      for (let i = 0; i < scanned; i++) {
        sum += naiveArray[i];
      }
      setNaiveRunningSum(sum);
    }
    // Narration 11: Start Q3. Sum range [4,7]
    // Narration 12..15: scan idx 4..7
    else if (nextStep >= 11 && nextStep <= 15) {
      setNaiveQueryIdx(2);
      const scanned = nextStep - 11;
      setNaiveScannedCount(scanned);
      let sum = 0;
      for (let i = 0; i < scanned; i++) {
        sum += naiveArray[4 + i];
      }
      setNaiveRunningSum(sum);
    }
    // Narration 16: Complete
    else if (nextStep === 16) {
      setNaiveScannedCount(0);
      setNaiveRunningSum(0);
    }
  };

  const selectNaiveQuery = (qIdx: number) => {
    setNaiveQueryIdx(qIdx);
    const q = naiveQueries[qIdx];
    setNaiveStep(q.baseStep);
    setNaiveScannedCount(0);
    setNaiveRunningSum(0);
    setIsNaiveAutoplay(false);
  };

  const handleNaivePrevStep = () => {
    if (naiveStep > 0) {
      const prevStep = naiveStep - 1;
      setNaiveStep(prevStep);
      // Sync backward logic...
      if (prevStep >= 1 && prevStep <= 6) {
        setNaiveQueryIdx(0);
        setNaiveScannedCount(prevStep - 1);
        let sum = 0;
        for (let i = 0; i < prevStep - 1; i++) {
          sum += naiveArray[1 + i];
        }
        setNaiveRunningSum(sum);
      } else if (prevStep >= 7 && prevStep <= 10) {
        setNaiveQueryIdx(1);
        setNaiveScannedCount(prevStep - 7);
        let sum = 0;
        for (let i = 0; i < prevStep - 7; i++) {
          sum += naiveArray[i];
        }
        setNaiveRunningSum(sum);
      } else if (prevStep >= 11 && prevStep <= 15) {
        setNaiveQueryIdx(2);
        setNaiveScannedCount(prevStep - 11);
        let sum = 0;
        for (let i = 0; i < prevStep - 11; i++) {
          sum += naiveArray[4 + i];
        }
        setNaiveRunningSum(sum);
      } else {
        setNaiveScannedCount(0);
        setNaiveRunningSum(0);
      }
    }
  };

  const getScanningIndex = () => {
    // Return which index is currently highlighted as "scanning"
    if (naiveStep >= 2 && naiveStep <= 6) {
      return 1 + (naiveStep - 2); // indices: 1, 2, 3, 4, 5
    }
    if (naiveStep >= 8 && naiveStep <= 10) {
      return naiveStep - 8; // indices: 0, 1, 2
    }
    if (naiveStep >= 12 && naiveStep <= 15) {
      return 4 + (naiveStep - 12); // indices: 4, 5, 6, 7
    }
    return -1;
  };

  const isIndexInActiveQuery = (idx: number) => {
    const q = naiveQueries[naiveQueryIdx];
    return naiveStep > 0 && naiveStep < 16 && idx >= q.l && idx <= q.r;
  };

  // ── MCQ Checkpoint Handlers ──
  const handleMcqSelect1 = (qId: number, optIdx: number) => {
    if (mcqChecked1[qId]) return; // locked after checking
    setMcqAnswers1({ ...mcqAnswers1, [qId]: optIdx });
  };

  const handleMcqCheckAnswer1 = (qId: number) => {
    if (mcqAnswers1[qId] === undefined) return;
    setMcqChecked1({ ...mcqChecked1, [qId]: true });

    // Check if both MCQs in Part 1 are checked and correct
    const q1Correct = qId === 1 ? mcqAnswers1[1] === MCQ_PART_1[0].answer : mcqAnswers1[1] === MCQ_PART_1[0].answer;
    const q2Correct = qId === 2 ? mcqAnswers1[2] === MCQ_PART_1[1].answer : mcqAnswers1[2] === MCQ_PART_1[1].answer;

    // We update this locally
    const answersCorrect = {
      1: qId === 1 ? mcqAnswers1[1] === MCQ_PART_1[0].answer : mcqAnswers1[1] === MCQ_PART_1[0].answer,
      2: qId === 2 ? mcqAnswers1[2] === MCQ_PART_1[1].answer : mcqAnswers1[2] === MCQ_PART_1[1].answer
    };

    const newChecked = { ...mcqChecked1, [qId]: true };
    if (newChecked[1] && newChecked[2] && mcqAnswers1[1] === MCQ_PART_1[0].answer && mcqAnswers1[2] === MCQ_PART_1[1].answer) {
      setPart1Complete(true);
    }
  };

  const handleMcqSelect2 = (qId: number, optIdx: number) => {
    if (mcqChecked2[qId]) return;
    setMcqAnswers2({ ...mcqAnswers2, [qId]: optIdx });
  };

  const handleMcqCheckAnswer2 = (qId: number) => {
    if (mcqAnswers2[qId] === undefined) return;
    setMcqChecked2({ ...mcqChecked2, [qId]: true });

    const newChecked = { ...mcqChecked2, [qId]: true };
    if (
      newChecked[1] && newChecked[2] && newChecked[3] &&
      mcqAnswers2[1] === MCQ_PART_2[0].answer &&
      mcqAnswers2[2] === MCQ_PART_2[1].answer &&
      mcqAnswers2[3] === MCQ_PART_2[2].answer
    ) {
      setPart2Complete(true);
    }
  };

  // ── Code Execution API Handlers ──
  const handleRunCode = async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setConsoleStdout("");
    setConsoleError("");
    setConsoleTab("stdout");

    try {
      const res = await api.post("/learning-path/run", {
        code: editorValue,
        language: selectedLanguage,
        input: runInput
      });

      if (res.compileOutput) {
        setConsoleError(res.compileOutput);
      } else if (res.stderr) {
        setConsoleError(res.stderr);
      } else {
        setConsoleStdout(res.output || "(no output)");
      }
    } catch (err: any) {
      setConsoleError(err.message || "Execution failed. Check Judge0 connection.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setConsoleTab("cases");
    setTestResults([]);

    const challengeId = activeLesson === "challenge1" ? "sum_segment_tree" : "max_segment_tree";

    try {
      const res = await api.post("/learning-path/submit", {
        code: editorValue,
        language: selectedLanguage,
        challengeId
      });

      const formattedResults = res.results.map((r: any) => ({
        testIndex: r.testIndex,
        verdict: r.verdict,
        executionTime: r.executionTime,
        memory: r.memory,
        output: r.output,
        expected: r.expected,
        stderr: r.stderr,
        compileOutput: r.compileOutput
      }));

      setTestResults(formattedResults);
      setActiveTestCaseIdx(0);

      if (res.verdict === "accepted") {
        if (activeLesson === "challenge1") {
          // Unlock challenge 2
          setPart3Complete(true);
        } else {
          // Master completion!
          setPart3Complete(true); // make sure both are marked
        }
      }
    } catch (err: any) {
      setConsoleError(err.message || "Submission failed. Check Judge0 connection.");
      setConsoleTab("stdout");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for rendering syntax-highlighted walkthrough code
  const renderHighlightedCode = (code: string) => {
    if (!code) return <span className={styles.synNormal}>{"\n"}</span>;
    // Basic C++ keywords highlighting for aesthetics
    const parts = code.split(/(\bstruct\b|\bint\b|\bvoid\b|\blong\b|\bconst\b|\bvector\b|\bif\b|\belse\b|\breturn\b|\bclass\b|\bdef\b|\bself\b|\bimport\b|\bprint\b|\bfor\b|\bin\b|\bwhile\b|#.*|\/\/.*)/);
    return parts.map((part, i) => {
      if (part.startsWith("//") || part.startsWith("#")) {
        return <span key={i} className={styles.synComment}>{part}</span>;
      }
      switch (part) {
        case "struct":
        case "class":
        case "def":
        case "if":
        case "else":
        case "return":
        case "for":
        case "in":
        case "while":
        case "import":
          return <span key={i} className={styles.synKeyword}>{part}</span>;
        case "int":
        case "void":
        case "long":
        case "vector":
        case "self":
          return <span key={i} className={styles.synType}>{part}</span>;
        default:
          return <span key={i} className={styles.synNormal}>{part}</span>;
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* ── Sidebar Navigation ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>
            <span>🌳</span> Segment Trees Path
          </h2>
          <p>Interactive Textbook & Sandbox</p>
        </div>

        {/* Part 1 */}
        <div className={styles.partGroup}>
          <div className={styles.partTitle}>
            Part 1: The Problem
            {part1Complete && <span style={{ color: "var(--cm-green)" }}>✓</span>}
          </div>
          {lessons.filter(l => l.part === 1).map(l => (
            <button
              key={l.id}
              className={`${styles.lessonBtn} ${activeLesson === l.id ? styles.lessonActive : ""}`}
              onClick={() => setActiveLesson(l.id)}
            >
              <span className={styles.iconWrap}>{l.id.includes("mcq") ? "❓" : "📖"}</span>
              {l.title}
            </button>
          ))}
        </div>

        {/* Part 2 */}
        <div className={styles.partGroup}>
          <div className={`${styles.partTitle} ${!part1Complete ? styles.partTitleLocked : ""}`}>
            Part 2: Introducing Trees
            {!part1Complete && <span>🔒</span>}
            {part1Complete && !part2Complete && <span>⚡</span>}
            {part2Complete && <span style={{ color: "var(--cm-green)" }}>✓</span>}
          </div>
          {lessons.filter(l => l.part === 2).map(l => (
            <button
              key={l.id}
              className={`${styles.lessonBtn} ${activeLesson === l.id ? styles.lessonActive : ""} ${!l.unlocked ? styles.locked : ""}`}
              disabled={!l.unlocked}
              onClick={() => setActiveLesson(l.id)}
            >
              <span className={styles.iconWrap}>{l.id.includes("mcq") ? "❓" : "📖"}</span>
              {l.title}
              {!l.unlocked && <span className={styles.badgeWrap}>🔒</span>}
            </button>
          ))}
        </div>

        {/* Part 3 */}
        <div className={styles.partGroup}>
          <div className={`${styles.partTitle} ${!part2Complete ? styles.partTitleLocked : ""}`}>
            Part 3: Code It
            {!part2Complete && <span>🔒</span>}
            {part2Complete && <span>⚡</span>}
          </div>
          {lessons.filter(l => l.part === 3).map(l => {
            // Challenge 2 and Badge require special unlocks
            const isCh2Locked = l.id === "challenge2" && !part3Complete;
            const isBadgeLocked = l.id === "badge" && (!part3Complete || !part2Complete);
            const isCurrentlyLocked = !l.unlocked || (l.id === "challenge2" && !part3Complete) || (l.id === "badge" && !part3Complete);

            return (
              <button
                key={l.id}
                className={`${styles.lessonBtn} ${activeLesson === l.id ? styles.lessonActive : ""} ${isCurrentlyLocked ? styles.locked : ""}`}
                disabled={isCurrentlyLocked}
                onClick={() => setActiveLesson(l.id)}
              >
                <span className={styles.iconWrap}>
                  {l.id === "badge" ? "🏆" : l.id.startsWith("challenge") ? "💻" : "📖"}
                </span>
                {l.title}
                {isCurrentlyLocked && <span className={styles.badgeWrap}>🔒</span>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Content Pane ── */}
      <section className={styles.contentPane}>
        <div className={activeLesson.startsWith("challenge") || activeLesson === "lesson6" ? styles.contentContainerWide : styles.contentContainer}>

          {/* ==================== LESSON 1 ==================== */}
          {activeLesson === "lesson1" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 1: The Naive Approach</h1>
                <p>Understanding range-sum queries and their baseline costs.</p>
              </div>

              <div className={styles.narration}>
                {NAIVE_NARRATIONS[naiveStep]}
              </div>

              {/* Naive Simulator Workspace */}
              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Naive Range-Sum Simulator</span>
                  <div className={styles.animControls}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setNaiveStep(0);
                        setNaiveScannedCount(0);
                        setNaiveRunningSum(0);
                        setIsNaiveAutoplay(false);
                      }}
                    >
                      ↺ Reset
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={naiveStep === 0}
                      onClick={handleNaivePrevStep}
                    >
                      ◀ Prev
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsNaiveAutoplay(!isNaiveAutoplay)}
                    >
                      {isNaiveAutoplay ? "⏸ Pause" : "▶ Autoplay"}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={naiveStep >= 16}
                      onClick={handleNaiveNextStep}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>

                {/* Array Visualization */}
                <div className={styles.arrayRow}>
                  {naiveArray.map((val, idx) => {
                    const isScanning = idx === getScanningIndex();
                    const isQueryOverlap = isIndexInActiveQuery(idx);

                    let cellClass = styles.arrayCell;
                    if (isScanning) cellClass += ` ${styles.cellScanning}`;
                    else if (isQueryOverlap) cellClass += ` ${styles.cellActive}`;

                    return (
                      <div key={idx} className={cellClass}>
                        <span className={styles.cellVal}>{val}</span>
                        <span className={styles.cellIdx}>[{idx}]</span>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Panels */}
                <div className={styles.queryPanel}>
                  <div className={styles.queryInfo}>
                    <strong>Select a Range Query to Animate:</strong>
                  </div>
                  <div className={styles.queryList}>
                    {naiveQueries.map((q, idx) => (
                      <button
                        key={idx}
                        className={`${styles.queryItem} ${naiveQueryIdx === idx ? styles.queryItemActive : ""}`}
                        onClick={() => selectNaiveQuery(idx)}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  <div className={styles.counterGrid}>
                    <div className={styles.counterCard}>
                      <div className={styles.counterVal}>{naiveScannedCount}</div>
                      <div className={styles.counterLabel}>Scanned Elements / Operations</div>
                    </div>
                    <div className={styles.counterCard}>
                      <div className={styles.counterVal}>{naiveRunningSum}</div>
                      <div className={styles.counterLabel}>Accumulated Sum</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-glass" style={{ marginTop: "2rem" }}>
                <p>
                  <strong>Takeaway:</strong> In the naive approach, answering a query requires iterating through
                  the range [L, R] element by element. In the worst case (L = 0, R = N - 1), we perform N operations.
                  For Q queries, this becomes an O(N * Q) cost. Let's see how this scales.
                </p>
              </div>
            </div>
          )}

          {/* ==================== LESSON 2 ==================== */}
          {activeLesson === "lesson2" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 2: Why This Hurts</h1>
                <p>Analyzing how O(N · Q) scales under competitive programming limits.</p>
              </div>

              <div className={styles.narration}>
                Competitive programming platforms usually enforce a <strong>1.0-second time limit</strong>.
                A standard CPU can handle about $10^8$ (100 million) basic operations per second.
                When $N=10^5$ and $Q=10^5$, a naive O(N · Q) algorithm performs $10^{10}$ operations.
                This breaks limits, resulting in a <strong>Time Limit Exceeded (TLE)</strong> verdict.
              </div>

              {/* Custom High-Fidelity Scaling Chart */}
              <div className={`${styles.animationCard} ${styles.dangerGlow}`}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Operation Count Scaling Chart</span>
                  <span className="badge badge-live" style={{ color: "var(--cm-red)" }}>TLE Zone</span>
                </div>

                <div className={styles.chartBox}>
                  {/* Grid Bars */}
                  <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "240px", borderBottom: "2px solid var(--border-primary)", paddingBottom: "10px", position: "relative" }}>

                    {/* CPU limit line */}
                    <div style={{ position: "absolute", bottom: "40px", left: 0, right: 0, borderTop: "2px dashed var(--cm-red)", display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "10px", color: "var(--cm-red)", background: "var(--bg-primary)", padding: "0 4px", transform: "translateY(-8px)" }}>
                        CPU Timeout Limit (10^8 operations)
                      </span>
                    </div>

                    {/* Scale Card 1: 10x10 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "4px" }}>10² ops</span>
                      <div style={{ width: "30px", height: "4px", background: "var(--cm-green)", borderRadius: "2px" }} />
                      <span style={{ fontSize: "10px", marginTop: "8px", color: "var(--text-muted)" }}>N,Q=10</span>
                    </div>

                    {/* Scale Card 2: 100x100 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "4px" }}>10⁴ ops</span>
                      <div style={{ width: "30px", height: "12px", background: "var(--cm-green)", borderRadius: "2px" }} />
                      <span style={{ fontSize: "10px", marginTop: "8px", color: "var(--text-muted)" }}>N,Q=100</span>
                    </div>

                    {/* Scale Card 3: 1000x1000 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "4px" }}>10⁶ ops</span>
                      <div style={{ width: "30px", height: "30px", background: "var(--cm-yellow)", borderRadius: "2px" }} />
                      <span style={{ fontSize: "10px", marginTop: "8px", color: "var(--text-muted)" }}>N,Q=1,000</span>
                    </div>

                    {/* Scale Card 4: 10^5 x 10^5 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
                      <span style={{ fontSize: "10px", color: "var(--cm-red)", fontWeight: "bold", marginBottom: "4px" }}>10¹⁰ ops ☠</span>
                      <div style={{
                        width: "35px",
                        height: "200px",
                        background: "linear-gradient(to top, var(--cm-red), #ff7b90)",
                        borderRadius: "4px 4px 0 0",
                        boxShadow: "0 0 15px rgba(255, 45, 85, 0.4)",
                        position: "relative"
                      }}>
                        <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", fontSize: "12px" }}>💥</div>
                      </div>
                      <span style={{ fontSize: "10px", marginTop: "8px", color: "var(--cm-red)", fontWeight: "bold" }}>N,Q=10⁵</span>
                    </div>
                  </div>
                </div>

                <div className={styles.takeawayCard}>
                  <span style={{ fontSize: "24px" }}>⚠️</span>
                  <div>
                    <strong>One-line Takeaway:</strong> When $N=10^5$ and $Q=10^5$, naive does $10^{10}$ operations. We need something smarter.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== MCQ 1 ==================== */}
          {activeLesson === "mcq1" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Checkpoint 1: The Naive Bottleneck</h1>
                <p>Validate your understanding of complexity constraints before proceeding.</p>
              </div>

              <div className={styles.checkpointArea}>
                <h2 className={styles.checkpointTitle}>
                  <span>⚡</span> MCQ Checkpoint (2 questions)
                </h2>

                {MCQ_PART_1.map((q) => {
                  const selectedOpt = mcqAnswers1[q.id];
                  const isChecked = mcqChecked1[q.id];
                  const isCorrect = selectedOpt === q.answer;

                  return (
                    <div key={q.id} className={styles.mcqCard}>
                      <div className={styles.questionText}>
                        Q{q.id}: {q.question}
                      </div>

                      <div className={styles.optionsList}>
                        {q.options.map((opt, oIdx) => {
                          let optClass = styles.optionItem;
                          let radioClass = styles.optionRadio;

                          if (selectedOpt === oIdx) {
                            optClass += ` ${styles.optionSelected}`;
                            radioClass += ` ${styles.optionRadioSelected}`;
                          }

                          if (isChecked) {
                            if (oIdx === q.answer) {
                              optClass += ` ${styles.optionCorrect}`;
                              radioClass += ` ${styles.optionRadioCorrect}`;
                            } else if (selectedOpt === oIdx) {
                              optClass += ` ${styles.optionWrong}`;
                              radioClass += ` ${styles.optionRadioWrong}`;
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              className={optClass}
                              onClick={() => handleMcqSelect1(q.id, oIdx)}
                              disabled={isChecked}
                            >
                              <div className={radioClass}>
                                {!isChecked && selectedOpt === oIdx && <div className={styles.innerDot} />}
                                {isChecked && oIdx === q.answer && <span style={{ color: "black", fontSize: "10px", fontWeight: "bold" }}>✓</span>}
                                {isChecked && selectedOpt === oIdx && oIdx !== q.answer && <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✗</span>}
                              </div>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {selectedOpt !== undefined && !isChecked && (
                        <button
                          className="btn btn-accent btn-sm"
                          style={{ marginTop: "1rem" }}
                          onClick={() => handleMcqCheckAnswer1(q.id)}
                        >
                          Check Answer
                        </button>
                      )}

                      {isChecked && (
                        <div className={`${styles.explanationBox} ${isCorrect ? styles.expCorrect : styles.expWrong}`}>
                          <strong>{isCorrect ? "Correct!" : "Incorrect."}</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {part1Complete && (
                  <div className="card-glass" style={{ border: "1px solid var(--cm-green)", background: "rgba(0, 255, 136, 0.03)", textAlign: "center", padding: "2rem" }}>
                    <h3 style={{ color: "var(--cm-green)", marginBottom: "0.5rem" }}>🔓 Part 2 Unlocked!</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                      You have successfully understood the constraints of the naive approach. You are ready to learn Segment Trees.
                    </p>
                    <button className="btn btn-primary" onClick={() => {
                      setActiveLesson("lesson3");
                      setCurrentPart(2);
                    }}>
                      Go to Part 2: Segment Trees Introduced →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== LESSON 3 ==================== */}
          {activeLesson === "lesson3" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 3: The Core Idea</h1>
                <p>Building a binary tree to aggregate ranges bottom-up.</p>
              </div>

              <div className={styles.narration}>
                {TREE_BUILD_NARRATIONS[treeBuildStep]}
              </div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Segment Tree Construction Simulator</span>
                  <div className={styles.animControls}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setTreeBuildStep(0)}
                      disabled={treeBuildStep === 0}
                    >
                      ↺ Reset
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setTreeBuildStep(Math.min(3, treeBuildStep + 1))}
                      disabled={treeBuildStep === 3}
                    >
                      Next Construction Step ▶
                    </button>
                  </div>
                </div>

                {/* SVG Segment Tree Visualization */}
                <div className={styles.treeSvgContainer}>
                  <svg width="600" height="260" viewBox="0 0 600 260">
                    {/* Render Connector Lines */}
                    {TREE_NODES.map((node) => {
                      if (!node.children) return null;
                      const leftChild = TREE_NODES.find(n => n.id === node.children![0]);
                      const rightChild = TREE_NODES.find(n => n.id === node.children![1]);

                      // Render line only if parent node step is unlocked
                      // Step 0: only level 3
                      // Step 1: level 2 is added
                      // Step 2: level 1 is added
                      // Step 3: level 0 (root) is added
                      const isLeftVisible = (4 - node.level) <= treeBuildStep + 1;
                      const isRightVisible = (4 - node.level) <= treeBuildStep + 1;

                      return (
                        <g key={`lines-${node.id}`}>
                          {leftChild && isLeftVisible && (
                            <line
                              x1={node.x}
                              y1={node.y}
                              x2={leftChild.x}
                              y2={leftChild.y}
                              className={styles.svgLine}
                              style={{ stroke: "rgba(255,255,255,0.15)" }}
                            />
                          )}
                          {rightChild && isRightVisible && (
                            <line
                              x1={node.x}
                              y1={node.y}
                              x2={rightChild.x}
                              y2={rightChild.y}
                              className={styles.svgLine}
                              style={{ stroke: "rgba(255,255,255,0.15)" }}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Render Node Circles */}
                    {TREE_NODES.map((node) => {
                      const nodeLevelDepth = 3 - node.level; // Level 3 is depth 0 (leaves), Level 0 is depth 3 (root)
                      const isNodeVisible = nodeLevelDepth <= treeBuildStep;

                      if (!isNodeVisible) return null;

                      // Glow active nodes on construct
                      let nodeStyle = styles.svgNodeCircle;
                      if (nodeLevelDepth === treeBuildStep) {
                        nodeStyle += ` ${styles.nodeUpdateCircle}`;
                      }

                      return (
                        <g key={node.id} className={styles.svgNode}>
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="20"
                            className={nodeStyle}
                          />
                          <text
                            x={node.x}
                            y={node.y - 2}
                            className={styles.nodeLabelText}
                          >
                            {node.val}
                          </text>
                          <text
                            x={node.x}
                            y={node.y + 11}
                            className={styles.nodeRangeText}
                          >
                            {node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="card-glass">
                  <strong>Takeaway:</strong> Each internal node stores the precomputed range sum of its two children.
                  Since we precompute everything once during building in O(N) time, we can query values later in logarithmic time.
                </div>
              </div>
            </div>
          )}

          {/* ==================== LESSON 4 ==================== */}
          {activeLesson === "lesson4" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 4: Answering a Query</h1>
                <p>Simulating O(log N) range-sum query traversal.</p>
              </div>

              <div className={styles.narration}>
                {TREE_QUERY_NARRATIONS[treeQueryStep]}
              </div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Range-Sum Query [1, 5] Simulator</span>
                  <div className={styles.animControls}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setTreeQueryStep(0)}
                      disabled={treeQueryStep === 0}
                    >
                      ↺ Reset
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setTreeQueryStep(Math.min(10, treeQueryStep + 1))}
                      disabled={treeQueryStep === 10}
                    >
                      Next Query Step ▶
                    </button>
                  </div>
                </div>

                {/* SVG Segment Tree Visualization */}
                <div className={styles.treeSvgContainer}>
                  {/* Legend */}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: "4px", fontSize: "10px", background: "var(--bg-primary)", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255, 215, 0, 0.4)", border: "1.5px solid var(--cm-yellow)" }} /> Partial Overlap</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(0, 255, 136, 0.4)", border: "1.5px solid var(--cm-green)" }} /> Complete Overlap (Merge)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255, 45, 85, 0.3)", border: "1.5px solid var(--cm-red)" }} /> No Overlap (Skip)</div>
                  </div>

                  <svg width="600" height="260" viewBox="0 0 600 260">
                    {/* Render Connections */}
                    {TREE_NODES.map((node) => {
                      if (!node.children) return null;
                      const leftChild = TREE_NODES.find(n => n.id === node.children![0]);
                      const rightChild = TREE_NODES.find(n => n.id === node.children![1]);
                      return (
                        <g key={`lines-${node.id}`}>
                          {leftChild && (
                            <line x1={node.x} y1={node.y} x2={leftChild.x} y2={leftChild.y} className={styles.svgLine} />
                          )}
                          {rightChild && (
                            <line x1={node.x} y1={node.y} x2={rightChild.x} y2={rightChild.y} className={styles.svgLine} />
                          )}
                        </g>
                      );
                    })}

                    {/* Render Node Circles with Query States */}
                    {TREE_NODES.map((node) => {
                      const overlapClass = getQueryNodeOverlap(node.id, treeQueryStep);
                      return (
                        <g key={node.id} className={styles.svgNode}>
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="20"
                            className={`${styles.svgNodeCircle} ${overlapClass}`}
                          />
                          <text x={node.x} y={node.y - 2} className={styles.nodeLabelText}>{node.val}</text>
                          <text x={node.x} y={node.y + 11} className={styles.nodeRangeText}>{node.label}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className={styles.counterGrid}>
                  <div className={styles.counterCard} style={{ borderColor: "var(--cm-purple)" }}>
                    <div className={styles.counterVal} style={{ color: "var(--cm-purple)" }}>
                      {treeQueryStep === 0 ? 0 :
                        treeQueryStep === 1 ? 1 :
                          treeQueryStep === 2 ? 2 :
                            treeQueryStep === 3 ? 3 :
                              treeQueryStep === 4 ? 4 :
                                treeQueryStep === 5 ? 5 :
                                  treeQueryStep === 6 ? 6 :
                                    treeQueryStep === 7 ? 7 :
                                      treeQueryStep === 8 ? 8 : 9}
                    </div>
                    <div className={styles.counterLabel}>Segment Tree Nodes Visited</div>
                  </div>

                  <div className={styles.counterCard}>
                    <div className={styles.counterVal}>5</div>
                    <div className={styles.counterLabel}>Naive Scanned Elements</div>
                  </div>
                </div>

                <div className={styles.takeawayCard} style={{ background: "rgba(0, 240, 255, 0.05)", borderColor: "var(--border-accent)" }}>
                  <span style={{ fontSize: "24px" }}>⚡</span>
                  <div>
                    <strong>O(log N) Query Efficiency:</strong> Instead of scanning all 5 elements naively, the tree aggregates the range sum using just 3 complete overlaps: node <strong>[1,1]</strong> (1), node <strong>[2,3]</strong> (7), and node <strong>[4,5]</strong> (15).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== LESSON 5 ==================== */}
          {activeLesson === "lesson5" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 5: Point Update</h1>
                <p>Updating an element and propagating changes back to the root.</p>
              </div>

              <div className={styles.narration}>
                {TREE_UPDATE_NARRATIONS[treeUpdateStep]}
              </div>

              <div className={styles.animationCard}>
                <div className={styles.animationHeader}>
                  <span className={styles.animationTitle}>Point Update: Set array[3] = 10 Simulator</span>
                  <div className={styles.animControls}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setTreeUpdateStep(0)}
                      disabled={treeUpdateStep === 0}
                    >
                      ↺ Reset
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setTreeUpdateStep(Math.min(4, treeUpdateStep + 1))}
                      disabled={treeUpdateStep === 4}
                    >
                      Next Update Step ▶
                    </button>
                  </div>
                </div>

                {/* SVG Segment Tree Visualization */}
                <div className={styles.treeSvgContainer}>
                  <svg width="600" height="260" viewBox="0 0 600 260">
                    {/* Render Connections */}
                    {TREE_NODES.map((node) => {
                      if (!node.children) return null;
                      const leftChild = TREE_NODES.find(n => n.id === node.children![0]);
                      const rightChild = TREE_NODES.find(n => n.id === node.children![1]);
                      return (
                        <g key={`lines-${node.id}`}>
                          {leftChild && (
                            <line x1={node.x} y1={node.y} x2={leftChild.x} y2={leftChild.y} className={styles.svgLine} />
                          )}
                          {rightChild && (
                            <line x1={node.x} y1={node.y} x2={rightChild.x} y2={rightChild.y} className={styles.svgLine} />
                          )}
                        </g>
                      );
                    })}

                    {/* Render Node Circles with Update States */}
                    {TREE_NODES.map((node) => {
                      const updateClass = getUpdateNodeState(node.id, treeUpdateStep);

                      // Display updated values:
                      // node 11 ([3,3]) -> 10 (was 5)
                      // node 5 ([2,3]) -> 12 (was 7)
                      // node 2 ([0,3]) -> 16 (was 11)
                      // node 1 ([0,7]) -> 41 (was 36)
                      let displayVal = node.val;
                      if (treeUpdateStep >= 1 && node.id === 11) displayVal = 10;
                      if (treeUpdateStep >= 2 && node.id === 5) displayVal = 12;
                      if (treeUpdateStep >= 3 && node.id === 2) displayVal = 16;
                      if (treeUpdateStep >= 4 && node.id === 1) displayVal = 41;

                      return (
                        <g key={node.id} className={styles.svgNode}>
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="20"
                            className={`${styles.svgNodeCircle} ${updateClass}`}
                          />
                          <text x={node.x} y={node.y - 2} className={styles.nodeLabelText}>{displayVal}</text>
                          <text x={node.x} y={node.y + 11} className={styles.nodeRangeText}>{node.label}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="card-glass">
                  <strong>Takeaway:</strong> A point update traverses from the target leaf up to the root,
                  re-evaluating only the nodes that overlap the updated index. This requires updating only
                  one node per tree level, yielding a strict O(log N) complexity.
                </div>
              </div>
            </div>
          )}

          {/* ==================== MCQ 2 ==================== */}
          {activeLesson === "mcq2" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Checkpoint 2: Segment Tree Operations</h1>
                <p>Verify your understanding of Segment Tree structure, queries, and updates.</p>
              </div>

              <div className={styles.checkpointArea}>
                <h2 className={styles.checkpointTitle}>
                  <span>⚡</span> MCQ Checkpoint (3 questions)
                </h2>

                {MCQ_PART_2.map((q) => {
                  const selectedOpt = mcqAnswers2[q.id];
                  const isChecked = mcqChecked2[q.id];
                  const isCorrect = selectedOpt === q.answer;

                  return (
                    <div key={q.id} className={styles.mcqCard}>
                      <div className={styles.questionText}>
                        Q{q.id}: {q.question}
                      </div>

                      <div className={styles.optionsList}>
                        {q.options.map((opt, oIdx) => {
                          let optClass = styles.optionItem;
                          let radioClass = styles.optionRadio;

                          if (selectedOpt === oIdx) {
                            optClass += ` ${styles.optionSelected}`;
                            radioClass += ` ${styles.optionRadioSelected}`;
                          }

                          if (isChecked) {
                            if (oIdx === q.answer) {
                              optClass += ` ${styles.optionCorrect}`;
                              radioClass += ` ${styles.optionRadioCorrect}`;
                            } else if (selectedOpt === oIdx) {
                              optClass += ` ${styles.optionWrong}`;
                              radioClass += ` ${styles.optionRadioWrong}`;
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              className={optClass}
                              onClick={() => handleMcqSelect2(q.id, oIdx)}
                              disabled={isChecked}
                            >
                              <div className={radioClass}>
                                {!isChecked && selectedOpt === oIdx && <div className={styles.innerDot} />}
                                {isChecked && oIdx === q.answer && <span style={{ color: "black", fontSize: "10px", fontWeight: "bold" }}>✓</span>}
                                {isChecked && selectedOpt === oIdx && oIdx !== q.answer && <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✗</span>}
                              </div>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {selectedOpt !== undefined && !isChecked && (
                        <button
                          className="btn btn-accent btn-sm"
                          style={{ marginTop: "1rem" }}
                          onClick={() => handleMcqCheckAnswer2(q.id)}
                        >
                          Check Answer
                        </button>
                      )}

                      {isChecked && (
                        <div className={`${styles.explanationBox} ${isCorrect ? styles.expCorrect : styles.expWrong}`}>
                          <strong>{isCorrect ? "Correct!" : "Incorrect."}</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {part2Complete && (
                  <div className="card-glass" style={{ border: "1px solid var(--cm-green)", background: "rgba(0, 255, 136, 0.03)", textAlign: "center", padding: "2rem" }}>
                    <h3 style={{ color: "var(--cm-green)", marginBottom: "0.5rem" }}>🔓 Part 3 Unlocked!</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                      Awesome! You have mastered the conceptual structure of Segment Trees. You are now ready to dive into the implementation templates and solve coding challenges.
                    </p>
                    <button className="btn btn-primary" onClick={() => {
                      setActiveLesson("lesson6");
                      setCurrentPart(3);
                    }}>
                      Go to Part 3: Code It →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== LESSON 6 ==================== */}
          {activeLesson === "lesson6" && (
            <div>
              <div className={styles.titleArea}>
                <h1>Lesson 6: Template Walkthrough</h1>
                <p>Click on any line of code to see its detailed explanation.</p>
              </div>

              <div className={styles.splitScreen}>
                {/* Left side: Interactive Code */}
                <div className={styles.codePanel}>
                  {TEMPLATE_LINES.map((line) => (
                    <div
                      key={line.lineNum}
                      className={`${styles.codeLine} ${walkthroughLine === line.lineNum ? styles.codeLineActive : ""}`}
                      onClick={() => line.explanation && setWalkthroughLine(line.lineNum)}
                    >
                      <span className={styles.lineNumber}>{line.lineNum}</span>
                      <span className={styles.codeContent}>
                        {renderHighlightedCode(line.code)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right side: Explanation */}
                <div className={styles.explPanel}>
                  <div className={styles.explHeader}>
                    <h3>Line {walkthroughLine} Explanation</h3>
                  </div>
                  <div className={styles.explBody}>
                    <p>
                      {TEMPLATE_LINES.find(l => l.lineNum === walkthroughLine)?.explanation ||
                        "Select a highlighted line to see its conceptual explanation here."}
                    </p>
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setActiveLesson("challenge1")}>
                      Proceed to Coding Challenge 1 💻
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== CHALLENGE 1 & 2 ==================== */}
          {(activeLesson === "challenge1" || activeLesson === "challenge2") && (
            <div>
              <div className={styles.titleArea}>
                <h1>
                  {activeLesson === "challenge1" ? "Challenge 1: Sum Segment Tree" : "Challenge 2: Max Segment Tree"}
                </h1>
                <p>Complete the segment tree implementation and verify against test cases.</p>
              </div>

              <div className={styles.challengeSection}>
                {/* Left pane: Problem Details */}
                <div className={styles.taskDesc}>
                  <h2>Problem Statement</h2>
                  <div className={styles.descContent}>
                    {activeLesson === "challenge1" ? (
                      <div>
                        <p>
                          Given an array of size $N$ and $Q$ queries of two types:
                        </p>
                        <ul>
                          <li><code>1 idx val</code>: Point Update. Set <code>a[idx] = val</code>.</li>
                          <li><code>2 l r</code>: Range Sum Query. Output the sum of elements in <code>a[l...r]</code> (0-indexed, inclusive).</li>
                        </ul>
                        <p>
                          Verify your segment tree build, update, and range sum queries.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p>
                          Modify the Sum Segment Tree to support <strong>Range Maximum Queries (RMQ)</strong>.
                          Given an array of size $N$ and $Q$ queries:
                        </p>
                        <ul>
                          <li><code>1 idx val</code>: Point Update. Set <code>a[idx] = val</code>.</li>
                          <li><code>2 l r</code>: Range Maximum Query. Output the maximum value in <code>a[l...r]</code>.</li>
                        </ul>
                        <p>
                          <strong>Task:</strong> Complete the 3 TODO blocks in the template:
                        </p>
                        <ol>
                          <li>In <code>build()</code>: Merge children for range maximum.</li>
                          <li>In <code>update()</code>: Merge children on update path.</li>
                          <li>In <code>query()</code>: Correct identity return value and merge operation.</li>
                        </ol>
                      </div>
                    )}

                    <h3>Input Format</h3>
                    <p>
                      The first line contains $N$ and $Q$.<br />
                      The second line contains $N$ space-separated integers.<br />
                      The next $Q$ lines contain the queries.
                    </p>

                    <h3>Sample Input</h3>
                    <pre>
                      {`5 5
1 2 3 4 5
2 0 2
1 1 10
2 0 2
2 1 4
2 0 4`}
                    </pre>

                    <h3>Sample Output</h3>
                    <pre>
                      {activeLesson === "challenge1" ? `6\n14\n22\n23` : `3\n10\n10\n10`}
                    </pre>
                  </div>
                </div>

                {/* Right pane: Code Editor */}
                <div className={styles.editorContainer}>
                  <div className={styles.editorHeader}>
                    <select
                      className={styles.langSelector}
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as "cpp" | "python")}
                    >
                      <option value="cpp">C++ (GCC 9.2)</option>
                      <option value="python">Python 3</option>
                    </select>

                    <div className={styles.actionBtns}>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={isRunning || isSubmitting}
                        onClick={handleRunCode}
                      >
                        {isRunning ? "Running..." : "▶ Run Code"}
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={isRunning || isSubmitting}
                        onClick={handleSubmitCode}
                      >
                        {isSubmitting ? "Submitting..." : "⚡ Submit"}
                      </button>
                    </div>
                  </div>

                  <div className={styles.editorBody}>
                    <CodeEditor
                      language={selectedLanguage}
                      value={editorValue}
                      onChange={setEditorValue}
                    />
                  </div>

                  {/* Console Output Panel */}
                  <div className={styles.consolePanel}>
                    <div className={styles.consoleTabs}>
                      <button
                        className={`${styles.consoleTab} ${consoleTab === "cases" ? styles.consoleTabActive : ""}`}
                        onClick={() => setConsoleTab("cases")}
                      >
                        Test Cases ({testResults.length ? `${testResults.filter(r => r.verdict === "accepted").length}/${testResults.length}` : "—"})
                      </button>
                      <button
                        className={`${styles.consoleTab} ${consoleTab === "stdout" ? styles.consoleTabActive : ""}`}
                        onClick={() => setConsoleTab("stdout")}
                      >
                        Console Output
                      </button>
                      <button
                        className={`${styles.consoleTab} ${consoleTab === "input" ? styles.consoleTabActive : ""}`}
                        onClick={() => setConsoleTab("input")}
                      >
                        Custom Input
                      </button>
                    </div>

                    <div className={styles.consoleBody}>
                      {consoleTab === "input" && (
                        <textarea
                          className={styles.customInputArea}
                          value={runInput}
                          onChange={(e) => setRunInput(e.target.value)}
                        />
                      )}

                      {consoleTab === "stdout" && (
                        <div className={styles.consoleOutput}>
                          {consoleError ? (
                            <span className={styles.consoleError}>{consoleError}</span>
                          ) : (
                            consoleStdout || "Run code to see stdout here."
                          )}
                        </div>
                      )}

                      {consoleTab === "cases" && (
                        <div>
                          {testResults.length === 0 ? (
                            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                              No submissions yet. Write your code and click Submit to evaluate.
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", height: "100%" }}>
                              {/* Left side case list */}
                              <div className={styles.testCasesGrid}>
                                {testResults.map((tr) => (
                                  <div
                                    key={tr.testIndex}
                                    className={`${styles.testCaseRow} ${activeTestCaseIdx === tr.testIndex ? styles.testCaseRowActive : ""}`}
                                    onClick={() => setActiveTestCaseIdx(tr.testIndex)}
                                  >
                                    <div className={styles.tcHeader}>
                                      <span className={styles.tcTitle}>Test Case {tr.testIndex + 1}</span>
                                      <span className={`${styles.tcStatus} ${tr.verdict === "accepted" ? styles.tcStatusPassed : styles.tcStatusFailed}`}>
                                        {tr.verdict}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Right side case detail */}
                              {testResults[activeTestCaseIdx] && (
                                <div className={styles.tcDetails}>
                                  {testResults[activeTestCaseIdx].compileOutput && (
                                    <div className={styles.tcDetailBlock}>
                                      <div className={styles.tcDetailLabel}>Compile Error:</div>
                                      <div className={styles.tcDetailVal} style={{ color: "var(--cm-red)" }}>
                                        {testResults[activeTestCaseIdx].compileOutput}
                                      </div>
                                    </div>
                                  )}
                                  {testResults[activeTestCaseIdx].stderr && (
                                    <div className={styles.tcDetailBlock}>
                                      <div className={styles.tcDetailLabel}>Runtime Stderr:</div>
                                      <div className={styles.tcDetailVal} style={{ color: "var(--cm-red)" }}>
                                        {testResults[activeTestCaseIdx].stderr}
                                      </div>
                                    </div>
                                  )}
                                  {!testResults[activeTestCaseIdx].compileOutput && (
                                    <>
                                      <div className={styles.tcDetailBlock}>
                                        <span className={styles.tcDetailLabel}>Verdict: </span>
                                        <span className={testResults[activeTestCaseIdx].verdict === "accepted" ? styles.tcStatusPassed : styles.tcStatusFailed} style={{ fontWeight: "bold" }}>
                                          {testResults[activeTestCaseIdx].verdict.toUpperCase()}
                                        </span>
                                        {testResults[activeTestCaseIdx].executionTime && (
                                          <span style={{ marginLeft: "10px", color: "var(--text-secondary)" }}>
                                            Time: {testResults[activeTestCaseIdx].executionTime}s
                                          </span>
                                        )}
                                      </div>
                                      <div className={styles.tcDetailBlock}>
                                        <div className={styles.tcDetailLabel}>Expected:</div>
                                        <div className={styles.tcDetailVal}>{testResults[activeTestCaseIdx].expected}</div>
                                      </div>
                                      <div className={styles.tcDetailBlock}>
                                        <div className={styles.tcDetailLabel}>Your Output:</div>
                                        <div className={styles.tcDetailVal}>{testResults[activeTestCaseIdx].output || "(empty)"}</div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {activeLesson === "challenge1" && part3Complete && (
                <div className="card-glass" style={{ border: "1px solid var(--cm-green)", background: "rgba(0, 255, 136, 0.03)", textAlign: "center", padding: "1.5rem" }}>
                  <h3 style={{ color: "var(--cm-green)", marginBottom: "0.5rem" }}>🎉 Challenge 1 Solved!</h3>
                  <button className="btn btn-primary" onClick={() => setActiveLesson("challenge2")}>
                    Proceed to Challenge 2: Range Max Segment Tree →
                  </button>
                </div>
              )}

              {activeLesson === "challenge2" && part3Complete && (
                <div className="card-glass" style={{ border: "1px solid var(--cm-green)", background: "rgba(0, 255, 136, 0.03)", textAlign: "center", padding: "1.5rem" }}>
                  <h3 style={{ color: "var(--cm-green)", marginBottom: "0.5rem" }}>🎉 Challenge 2 Solved!</h3>
                  <button className="btn btn-accent" onClick={() => setActiveLesson("badge")}>
                    Claim Completion Certificate →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== BADGE CERTIFICATE ==================== */}
          {activeLesson === "badge" && (
            <div className={styles.badgeContainer}>
              <div className={styles.floatingBadge}>🏆</div>
              <h1 className={styles.congratsTitle}>Segment Tree Master</h1>
              <p className={styles.congratsDesc}>
                Congratulations! You have completed the interactive Segment Trees module. You constructed trees bottom-up, answered range queries in O(log N), performed point updates, and resolved code templates for Range Sum and Range Maximum constraints.
              </p>

              <div className={styles.summaryCard}>
                <h4>Learning Path Summary</h4>
                <div className={styles.summaryGrid}>
                  <div>
                    <div className={styles.summaryItemTitle}>Naive Complexity</div>
                    <div className={styles.summaryItemValue} style={{ color: "var(--cm-red)" }}>O(N) Query / O(1) Update</div>
                  </div>
                  <div>
                    <div className={styles.summaryItemTitle}>Segment Tree Complexity</div>
                    <div className={styles.summaryItemValue} style={{ color: "var(--cm-green)" }}>O(log N) Query / O(log N) Update</div>
                  </div>
                  <div>
                    <div className={styles.summaryItemTitle}>Common Use Cases</div>
                    <div className={styles.summaryItemValue}>Range Min/Max, Range Sum, Lazy Propagation, Dynamic Segment Trees</div>
                  </div>
                  <div>
                    <div className={styles.summaryItemTitle}>Calibrated Calibration</div>
                    <div className={styles.summaryItemValue}>Rank calibrated for expert/master algorithmic levels</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
