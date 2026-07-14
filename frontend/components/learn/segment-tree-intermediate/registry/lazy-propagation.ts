import type { ProblemGroup } from "./types";

// ── Shared starter code ───────────────────────────────────────────────────────
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

// ── Reference boilerplate: Range Add + Range Sum (lazy) ──────────────────────
const REF_CPP_RANGE_ADD_SUM = `#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct SegTree {
    int n;
    vector<ll> tree, lazy;

    SegTree(int n) : n(n), tree(4 * n, 0), lazy(4 * n, 0) {}

    void build(vector<ll>& a, int v, int s, int e) {
        if (s == e) { tree[v] = a[s]; return; }
        int m = (s + e) / 2;
        build(a, 2*v, s, m);
        build(a, 2*v+1, m+1, e);
        tree[v] = tree[2*v] + tree[2*v+1];
    }

    // Push down: propagate the lazy tag to both children
    void push(int v, int s, int e) {
        if (lazy[v] == 0) return;
        int m = (s + e) / 2;
        // Apply to left child
        tree[2*v]  += lazy[v] * (m - s + 1);
        lazy[2*v]  += lazy[v];
        // Apply to right child
        tree[2*v+1] += lazy[v] * (e - m);
        lazy[2*v+1] += lazy[v];
        // Clear own tag
        lazy[v] = 0;
    }

    // Range add: add val to every element in [l, r]
    void update(int v, int s, int e, int l, int r, ll val) {
        if (r < s || e < l) return;
        if (l <= s && e <= r) {
            tree[v] += val * (e - s + 1);
            lazy[v] += val;
            return;
        }
        push(v, s, e);   // <-- push before recursing!
        int m = (s + e) / 2;
        update(2*v, s, m, l, r, val);
        update(2*v+1, m+1, e, l, r, val);
        tree[v] = tree[2*v] + tree[2*v+1];
    }

    // Range sum query
    ll query(int v, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return tree[v];
        push(v, s, e);   // <-- push before recursing!
        int m = (s + e) / 2;
        return query(2*v, s, m, l, r) + query(2*v+1, m+1, e, l, r);
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
            int l, r; ll v; cin >> l >> r >> v;
            st.update(1, 0, n-1, l, r, v);
        } else {
            int l, r; cin >> l >> r;
            cout << st.query(1, 0, n-1, l, r) << "\\n";
        }
    }
}`;

const REF_PYTHON_RANGE_ADD_SUM = `import sys
input = sys.stdin.readline

def main():
    data = sys.stdin.read().split()
    ptr = 0
    n, q = int(data[ptr]), int(data[ptr+1]); ptr += 2
    a = [int(data[ptr+i]) for i in range(n)]; ptr += n

    tree = [0] * (4 * n)
    lazy = [0] * (4 * n)

    def build(v, s, e):
        if s == e: tree[v] = a[s]; return
        m = (s + e) // 2
        build(2*v, s, m); build(2*v+1, m+1, e)
        tree[v] = tree[2*v] + tree[2*v+1]

    def push(v, s, e):
        if lazy[v] == 0: return
        m = (s + e) // 2
        tree[2*v]  += lazy[v] * (m - s + 1); lazy[2*v]  += lazy[v]
        tree[2*v+1] += lazy[v] * (e - m);    lazy[2*v+1] += lazy[v]
        lazy[v] = 0

    def update(v, s, e, l, r, val):
        if r < s or e < l: return
        if l <= s and e <= r:
            tree[v] += val * (e - s + 1); lazy[v] += val; return
        push(v, s, e)
        m = (s + e) // 2
        update(2*v, s, m, l, r, val); update(2*v+1, m+1, e, l, r, val)
        tree[v] = tree[2*v] + tree[2*v+1]

    def query(v, s, e, l, r):
        if r < s or e < l: return 0
        if l <= s and e <= r: return tree[v]
        push(v, s, e)
        m = (s + e) // 2
        return query(2*v, s, m, l, r) + query(2*v+1, m+1, e, l, r)

    build(1, 0, n-1)
    out = []
    for _ in range(q):
        t = int(data[ptr]); ptr += 1
        if t == 1:
            l, r, v = int(data[ptr]), int(data[ptr+1]), int(data[ptr+2]); ptr += 3
            update(1, 0, n-1, l, r, v)
        else:
            l, r = int(data[ptr]), int(data[ptr+1]); ptr += 2
            out.append(str(query(1, 0, n-1, l, r)))
    print("\\n".join(out))

if __name__ == "__main__":
    main()`;

// ── Reference boilerplate: Range Assign + Range Sum ───────────────────────────
const REF_CPP_RANGE_ASSIGN_SUM = `#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll NO_ASSIGN = LLONG_MIN; // sentinel meaning "no pending assignment"

struct SegTree {
    int n;
    vector<ll> tree, lazy;

    SegTree(int n) : n(n), tree(4*n, 0), lazy(4*n, NO_ASSIGN) {}

    void build(vector<ll>& a, int v, int s, int e) {
        if (s == e) { tree[v] = a[s]; return; }
        int m = (s + e) / 2;
        build(a, 2*v, s, m); build(a, 2*v+1, m+1, e);
        tree[v] = tree[2*v] + tree[2*v+1];
    }

    void push(int v, int s, int e) {
        if (lazy[v] == NO_ASSIGN) return;
        int m = (s + e) / 2;
        // Overwrite (not add) — assign tag replaces whatever child had
        tree[2*v]   = lazy[v] * (m - s + 1); lazy[2*v]  = lazy[v];
        tree[2*v+1] = lazy[v] * (e - m);     lazy[2*v+1] = lazy[v];
        lazy[v] = NO_ASSIGN;
    }

    void assign(int v, int s, int e, int l, int r, ll val) {
        if (r < s || e < l) return;
        if (l <= s && e <= r) {
            tree[v] = val * (e - s + 1); lazy[v] = val; return;
        }
        push(v, s, e);
        int m = (s + e) / 2;
        assign(2*v, s, m, l, r, val); assign(2*v+1, m+1, e, l, r, val);
        tree[v] = tree[2*v] + tree[2*v+1];
    }

    ll query(int v, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return tree[v];
        push(v, s, e);
        int m = (s + e) / 2;
        return query(2*v, s, m, l, r) + query(2*v+1, m+1, e, l, r);
    }
};

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n, q; cin >> n >> q;
    vector<ll> a(n); for (auto& x : a) cin >> x;
    SegTree st(n); st.build(a, 1, 0, n-1);
    while (q--) {
        int t; cin >> t;
        if (t == 1) { int l, r; ll v; cin >> l >> r >> v; st.assign(1, 0, n-1, l, r, v); }
        else        { int l, r; cin >> l >> r; cout << st.query(1, 0, n-1, l, r) << "\\n"; }
    }
}`;

const REF_PYTHON_RANGE_ASSIGN_SUM = `import sys

def main():
    data = sys.stdin.read().split()
    ptr = 0
    n, q = int(data[ptr]), int(data[ptr+1]); ptr += 2
    a = [int(data[ptr+i]) for i in range(n)]; ptr += n

    NO_ASSIGN = float('-inf')
    tree = [0] * (4 * n)
    lazy = [NO_ASSIGN] * (4 * n)

    def build(v, s, e):
        if s == e: tree[v] = a[s]; return
        m = (s+e)//2; build(2*v,s,m); build(2*v+1,m+1,e)
        tree[v] = tree[2*v] + tree[2*v+1]

    def push(v, s, e):
        if lazy[v] == NO_ASSIGN: return
        m = (s+e)//2
        tree[2*v] = lazy[v]*(m-s+1); lazy[2*v] = lazy[v]
        tree[2*v+1] = lazy[v]*(e-m); lazy[2*v+1] = lazy[v]
        lazy[v] = NO_ASSIGN

    def assign(v, s, e, l, r, val):
        if r < s or e < l: return
        if l <= s and e <= r: tree[v]=val*(e-s+1); lazy[v]=val; return
        push(v,s,e); m=(s+e)//2
        assign(2*v,s,m,l,r,val); assign(2*v+1,m+1,e,l,r,val)
        tree[v]=tree[2*v]+tree[2*v+1]

    def query(v, s, e, l, r):
        if r < s or e < l: return 0
        if l <= s and e <= r: return tree[v]
        push(v,s,e); m=(s+e)//2
        return query(2*v,s,m,l,r)+query(2*v+1,m+1,e,l,r)

    build(1,0,n-1)
    out=[]
    for _ in range(q):
        t=int(data[ptr]); ptr+=1
        if t==1: l,r,v=int(data[ptr]),int(data[ptr+1]),int(data[ptr+2]); ptr+=3; assign(1,0,n-1,l,r,v)
        else:    l,r=int(data[ptr]),int(data[ptr+1]); ptr+=2; out.append(str(query(1,0,n-1,l,r)))
    print("\\n".join(out))

if __name__ == "__main__":
    main()`;

// ── Reference boilerplate: Range Add + Range Min ──────────────────────────────
const REF_CPP_RANGE_ADD_MIN = `#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct SegTree {
    int n;
    vector<ll> tree, lazy;

    SegTree(int n) : n(n), tree(4*n, 0), lazy(4*n, 0) {}

    void build(vector<ll>& a, int v, int s, int e) {
        if (s == e) { tree[v] = a[s]; return; }
        int m = (s+e)/2;
        build(a,2*v,s,m); build(a,2*v+1,m+1,e);
        tree[v] = min(tree[2*v], tree[2*v+1]);
    }

    void push(int v) {
        if (lazy[v] == 0) return;
        tree[2*v]   += lazy[v]; lazy[2*v]   += lazy[v];
        tree[2*v+1] += lazy[v]; lazy[2*v+1] += lazy[v];
        lazy[v] = 0;
    }

    void update(int v, int s, int e, int l, int r, ll val) {
        if (r < s || e < l) return;
        if (l <= s && e <= r) { tree[v] += val; lazy[v] += val; return; }
        push(v);
        int m = (s+e)/2;
        update(2*v,s,m,l,r,val); update(2*v+1,m+1,e,l,r,val);
        tree[v] = min(tree[2*v], tree[2*v+1]);
    }

    ll query(int v, int s, int e, int l, int r) {
        if (r < s || e < l) return LLONG_MAX;
        if (l <= s && e <= r) return tree[v];
        push(v);
        int m = (s+e)/2;
        return min(query(2*v,s,m,l,r), query(2*v+1,m+1,e,l,r));
    }
};

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n, q; cin >> n >> q;
    vector<ll> a(n); for (auto& x : a) cin >> x;
    SegTree st(n); st.build(a,1,0,n-1);
    while (q--) {
        int t; cin >> t;
        if (t == 1) { int l,r; ll v; cin>>l>>r>>v; st.update(1,0,n-1,l,r,v); }
        else        { int l,r; cin>>l>>r; cout<<st.query(1,0,n-1,l,r)<<"\\n"; }
    }
}`;

const REF_PYTHON_RANGE_ADD_MIN = `import sys

def main():
    data = sys.stdin.read().split(); ptr = 0
    n,q = int(data[ptr]),int(data[ptr+1]); ptr+=2
    a=[int(data[ptr+i]) for i in range(n)]; ptr+=n
    tree=[0]*(4*n); lazy=[0]*(4*n)

    def build(v,s,e):
        if s==e: tree[v]=a[s]; return
        m=(s+e)//2; build(2*v,s,m); build(2*v+1,m+1,e)
        tree[v]=min(tree[2*v],tree[2*v+1])

    def push(v):
        if lazy[v]==0: return
        for c in [2*v,2*v+1]: tree[c]+=lazy[v]; lazy[c]+=lazy[v]
        lazy[v]=0

    def update(v,s,e,l,r,val):
        if r<s or e<l: return
        if l<=s and e<=r: tree[v]+=val; lazy[v]+=val; return
        push(v); m=(s+e)//2
        update(2*v,s,m,l,r,val); update(2*v+1,m+1,e,l,r,val)
        tree[v]=min(tree[2*v],tree[2*v+1])

    def query(v,s,e,l,r):
        if r<s or e<l: return float('inf')
        if l<=s and e<=r: return tree[v]
        push(v); m=(s+e)//2
        return min(query(2*v,s,m,l,r),query(2*v+1,m+1,e,l,r))

    build(1,0,n-1); out=[]
    for _ in range(q):
        t=int(data[ptr]); ptr+=1
        if t==1: l,r,v=int(data[ptr]),int(data[ptr+1]),int(data[ptr+2]); ptr+=3; update(1,0,n-1,l,r,v)
        else:    l,r=int(data[ptr]),int(data[ptr+1]); ptr+=2; out.append(str(query(1,0,n-1,l,r)))
    print("\\n".join(out))

if __name__ == "__main__":
    main()`;

// ── Reference boilerplate: Range Add + Max Subarray (Capstone) ────────────────
const REF_CPP_CAPSTONE = `#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct Node { ll total, pref, suf, best; };

Node makeLeaf(ll v) {
    ll m = max(0LL, v);
    return {v, m, m, m};
}

// Merge two adjacent nodes (same as Problem 2)
Node merge(Node L, Node R) {
    Node res;
    res.total = L.total + R.total;
    res.pref  = max(L.pref,  L.total + R.pref);
    res.suf   = max(R.suf,   R.total + L.suf);
    res.best  = max({L.best, R.best, L.suf + R.pref});
    return res;
}

// Apply a range-add of delta to a node covering (len) elements
Node applyAdd(Node nd, ll delta, int len) {
    nd.total += delta * len;
    nd.pref  += delta * len; // entire prefix could extend to full range
    nd.suf   += delta * len;
    nd.best  += delta * len;
    // Clamp at 0 because empty subarray is allowed
    nd.pref  = max(0LL, nd.pref);
    nd.suf   = max(0LL, nd.suf);
    nd.best  = max(0LL, nd.best);
    return nd;
}

struct SegTree {
    int n;
    vector<Node> tree;
    vector<ll> lazy;

    SegTree(int n) : n(n), tree(4*n), lazy(4*n, 0) {}

    void build(vector<ll>& a, int v, int s, int e) {
        if (s==e) { tree[v]=makeLeaf(a[s]); return; }
        int m=(s+e)/2;
        build(a,2*v,s,m); build(a,2*v+1,m+1,e);
        tree[v]=merge(tree[2*v],tree[2*v+1]);
    }

    void push(int v, int s, int e) {
        if (lazy[v]==0) return;
        int m=(s+e)/2;
        tree[2*v]  =applyAdd(tree[2*v],  lazy[v], m-s+1); lazy[2*v]  +=lazy[v];
        tree[2*v+1]=applyAdd(tree[2*v+1],lazy[v], e-m);   lazy[2*v+1]+=lazy[v];
        lazy[v]=0;
    }

    void update(int v, int s, int e, int l, int r, ll val) {
        if (r<s||e<l) return;
        if (l<=s&&e<=r) { tree[v]=applyAdd(tree[v],val,e-s+1); lazy[v]+=val; return; }
        push(v,s,e); int m=(s+e)/2;
        update(2*v,s,m,l,r,val); update(2*v+1,m+1,e,l,r,val);
        tree[v]=merge(tree[2*v],tree[2*v+1]);
    }
};

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n,q; cin>>n>>q;
    vector<ll> a(n); for (auto& x:a) cin>>x;
    SegTree st(n); st.build(a,1,0,n-1);
    cout<<st.tree[1].best<<"\\n";
    while (q--) {
        int l,r; ll v; cin>>l>>r>>v;
        st.update(1,0,n-1,l,r,v);
        cout<<st.tree[1].best<<"\\n";
    }
}`;

const REF_PYTHON_CAPSTONE = `import sys

def main():
    data=sys.stdin.read().split(); ptr=0
    n,q=int(data[ptr]),int(data[ptr+1]); ptr+=2
    a=[int(data[ptr+i]) for i in range(n)]; ptr+=n

    # Node: (total, pref, suf, best)
    def make_leaf(v): m=max(0,v); return (v,m,m,m)

    def merge(L,R):
        return (
            L[0]+R[0],
            max(L[1],L[0]+R[1]),
            max(R[2],R[0]+L[2]),
            max(L[3],R[3],L[2]+R[1])
        )

    def apply_add(nd, delta, length):
        tot=nd[0]+delta*length
        pref=max(0,nd[1]+delta*length)
        suf=max(0,nd[2]+delta*length)
        best=max(0,nd[3]+delta*length)
        return (tot,pref,suf,best)

    tree=[(0,0,0,0)]*(4*n); lazy=[0]*(4*n)

    def build(v,s,e):
        if s==e: tree[v]=make_leaf(a[s]); return
        m=(s+e)//2; build(2*v,s,m); build(2*v+1,m+1,e)
        tree[v]=merge(tree[2*v],tree[2*v+1])

    def push(v,s,e):
        if lazy[v]==0: return
        m=(s+e)//2
        tree[2*v]=apply_add(tree[2*v],lazy[v],m-s+1); lazy[2*v]+=lazy[v]
        tree[2*v+1]=apply_add(tree[2*v+1],lazy[v],e-m); lazy[2*v+1]+=lazy[v]
        lazy[v]=0

    def update(v,s,e,l,r,val):
        if r<s or e<l: return
        if l<=s and e<=r: tree[v]=apply_add(tree[v],val,e-s+1); lazy[v]+=val; return
        push(v,s,e); m=(s+e)//2
        update(2*v,s,m,l,r,val); update(2*v+1,m+1,e,l,r,val)
        tree[v]=merge(tree[2*v],tree[2*v+1])

    build(1,0,n-1)
    out=[str(tree[1][3])]
    for _ in range(q):
        l,r,v=int(data[ptr]),int(data[ptr+1]),int(data[ptr+2]); ptr+=3
        update(1,0,n-1,l,r,v)
        out.append(str(tree[1][3]))
    print("\\n".join(out))

if __name__ == "__main__":
    main()`;

// ── The Problem Group ─────────────────────────────────────────────────────────

export const LAZY_PROPAGATION_PROBLEM: ProblemGroup = {
  partLabel: "Problem 3: Lazy Propagation",

  lessons: [
    // ── Lesson 5: Motivation ───────────────────────────────────────────────────
    {
      id: "p3-motivation",
      title: "5. Why Point Updates Aren't Enough",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "When range updates are frequent, doing them element-by-element makes each update O(N) — and that's TLE territory. Lazy propagation defers work so both range updates and range queries stay O(log N).",
          blocks: [
            {
              kind: "text",
              text: "You can already do **point updates** in O(log N). But what if the problem says: **add 5 to every element from index 3 to index 9**? Doing that naively means 7 separate point updates — O(N) in the worst case.",
            },
            {
              kind: "diagram",
              diagram: `**Array:   [ 1  1  1  1  1  2  2  2  2 ]**
\`Query: Add +10 to [0..4]\`

Naive:   \`update(0) → update(1) → ... → update(4)\`  _5 calls to the bottom_
              ↑ _Fine for one query, but 10⁵ queries will TLE_

\`N = 100,000\` elements,  \`Q = 100,000\` range-add queries
Naive cost:  \`Q × N = 10¹⁰\` operations  →  **[TLE]**`,
              caption: "Naive range update cost explodes as N and Q grow",
            },
            {
              kind: "callout",
              variant: "insight",
              title: "The lazy idea in one sentence",
              body: "Instead of immediately pushing an update all the way down to every leaf, mark the node as 'pending' and stop. Push it down only when you actually need to visit the children.",
            },
            {
              kind: "text",
              text: "This is **lazy propagation** — arguably the most important segment tree technique. It turns range updates from O(N) into O(log N) by deferring work until it's actually needed.",
            },
            {
              kind: "diagram",
              diagram: `**Query:** \`Add +10 to [0..4]\`

**Before Lazy Update:**
                 \`[0..8]\` sum=13
                /             \\
      \`[0..4]\` sum=5           \`[5..8]\` sum=8
      _(5 elements)_            _(4 elements)_

**After Lazy Update:**
                 \`[0..8]\` sum=63   _← (13 + 50)_
                /             \\
      \`[0..4]\` sum=55          \`[5..8]\` sum=8 
      **[LAZY = +10]**         **[LAZY = 0]**
      _← (5 + 50)_

_The lazy tag (+10) on [0..4] is a post-it note:_
_"I owe all my descendants +10. I'll pass it down later if anyone visits them."_`,
              caption: "Instead of walking down to 5 leaves, we stop at [0..4] and leave a tag.",
            },
          ],
        },
      },
    },

    // ── Lesson 6: The Lazy Idea ────────────────────────────────────────────────
    {
      id: "p3-lazy-idea",
      title: "6. The Lazy Array",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "The lazy[] array is a parallel structure to tree[]. It holds deferred updates per node. A non-zero lazy[v] means 'this subtree hasn't been told about a pending change yet'.",
          blocks: [
            {
              kind: "text",
              text: "Every node `v` in the tree now has two values: **`tree[v]`** (the precomputed aggregate for its range) and **`lazy[v]`** (a pending update that has been applied to `tree[v]` but NOT yet propagated to its children).",
            },
            {
              kind: "diagram",
              diagram: `**Parallel arrays (1-based indexing):**

  \`tree[]\`  =  \`[ 0,  13,   5,   8, ... ]\`
  \`lazy[]\`  =  \`[ 0,   0,   0,   0, ... ]\`
                    ↑ _Initially all lazy values are 0 (no pending work)_

**After "Add +10 to [0..4]":**

  \`tree[]\`  =  \`[ 0,  63,  55,   8, ... ]\`
  \`lazy[]\`  =  \`[ 0,   0, +10,   0, ... ]\`
                         ↑ _lazy[2] = +10: Node 2 owes its descendants +10_`,
              caption: "tree[] stores current aggregates, lazy[] stores pending debts",
            },
            {
              kind: "text",
              text: "The key invariant: **`tree[v]` is always correct** for the range it covers. The `lazy[v]` tag is the amount we've promised to tell the children — the parent has already updated itself, but not passed the news down.",
            },
            {
              kind: "callout",
              variant: "rule",
              title: "The Three Lazy Rules",
              body: "1. A node's tree[] value is always correct (already reflects all updates). 2. lazy[v] is what the node still owes its children. 3. Before recursing into children for ANY reason, push the lazy tag down first.",
            },
            {
              kind: "code",
              language: "Pseudocode",
              code: `lazy[v] = 0        // no pending work initially

// When a range update fully covers node v's range:
tree[v]  += delta * (range_length)   // update v immediately
lazy[v]  += delta                    // mark debt for children (don't recurse yet)
RETURN                               // stop here — work deferred!

// When we need to recurse into children:
PUSH_DOWN(v)   // pay the debt before going deeper`,
            },
          ],
        },
      },
    },

    // ── Lesson 7: Push Down ────────────────────────────────────────────────────
    {
      id: "p3-pushdown",
      title: "7. The Push Down Mechanism",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "pushDown(v) takes whatever lazy[v] owes, applies it to both children (updating their tree[] and lazy[]), then clears lazy[v]. It must be called before recursing into either child.",
          blocks: [
            {
              kind: "text",
              text: "**Push down** (also called `propagate`) is the moment a node pays off its debt. It transfers its `lazy[v]` to both children and clears itself. Let's trace through it step by step.",
            },
            {
              kind: "diagram",
              diagram: `Before push_down(v):  (v covers [2..5], lazy[v] = +3)

        v: tree=40, lazy=+3
       /                   \\
  left: [2..3]            right: [4..5]
  tree=14, lazy=0          tree=23, lazy=0
  (NOT yet told about +3)  (NOT yet told about +3)

After push_down(v):  (v now owes nothing)

        v: tree=40, lazy=0     ← lazy cleared
       /                   \\
  left: [2..3]            right: [4..5]
  tree=20, lazy=+3          tree=29, lazy=+3
  (tree updated: 14+3×2)    (tree updated: 23+3×2)
  (lazy set: children now
   owe THEIR children +3)`,
              caption: "push_down propagates the lazy tag to children and clears itself",
            },
            {
              kind: "code",
              language: "C++",
              code: `void push(int v, int s, int e) {
    if (lazy[v] == 0) return;   // nothing to push
    int m = (s + e) / 2;

    // Left child covers [s..m], length = m - s + 1
    tree[2*v]   += lazy[v] * (m - s + 1);
    lazy[2*v]   += lazy[v];

    // Right child covers [m+1..e], length = e - m
    tree[2*v+1] += lazy[v] * (e - m);
    lazy[2*v+1] += lazy[v];

    lazy[v] = 0;   // debt paid
}`,
            },
            {
              kind: "callout",
              variant: "warning",
              title: "When exactly do you call push_down?",
              body: "Every time you need to recurse into children — in BOTH update() and query(). Forgetting this in query() is the #1 lazy propagation bug. A node might have a stale tree[] if you forgot to push its parent first.",
            },
            {
              kind: "diagram",
              diagram: `**Update / Query call sequence:**

\`update(v, ...)\` or \`query(v, ...)\`:
    **if out-of-range:**  \`return\`
    **if fully-covered:** apply directly + \`return\`
    ──────────────────────────────────────────
    **\`push_down(v)\`   ← ALWAYS here before recursing!**
    ──────────────────────────────────────────
    _recurse left child_
    _recurse right child_
    **merge children** → \`tree[v]\``,
              caption: "push_down fires exactly once per node per operation — O(log N) total",
            },
          ],
        },
      },
    },

    // ── Checkpoint: Lazy vs Eager MCQ ─────────────────────────────────────────
    {
      id: "p3-mcq",
      title: "Checkpoint: Lazy vs Eager",
      content: {
        type: "mcq",
        data: {
          title: "Checkpoint: Lazy vs Eager",
          questions: [
            {
              id: "lz-q1",
              question:
                "You have N = 200,000 elements and Q = 200,000 queries, each either a range-add or a range-sum. Without lazy propagation, what is the worst-case time complexity?",
              options: [
                { text: "O(N log N)" },
                { text: "O(Q log N)" },
                { text: "O(N × Q)  →  ~4 × 10¹⁰ ops  →  TLE" },
                { text: "O(N + Q)" },
              ],
              answerIndex: 2,
              explanation:
                "Without lazy, each range-add requires updating every leaf in the range — up to O(N) per update. With Q such updates, you get O(N × Q) total, which is far beyond the ~10⁸ ops/sec threshold.",
            },
            {
              id: "lz-q2",
              question:
                "When does push_down(v) need to fire?",
              options: [
                { text: "Only during range updates, never during queries" },
                { text: "Only when lazy[v] is zero" },
                { text: "Before recursing into either child, in both update AND query" },
                { text: "Only when visiting leaf nodes" },
              ],
              answerIndex: 2,
              explanation:
                "push_down must fire before ANY recursion into children — both in update() and query(). Forgetting it in query() is the most common bug: you'd read a stale tree[] value from a child that hasn't been told about a pending lazy tag yet.",
            },
            {
              id: "lz-q3",
              question:
                "A node covers the range [10..19] (length 10) and has lazy[v] = +7. What do you add to tree[v] for this pending update?",
              options: [
                { text: "+7 (just the delta)" },
                { text: "+70 (delta × length = 7 × 10)" },
                { text: "+7 / 10" },
                { text: "Nothing — tree[v] was already updated when the tag was set" },
              ],
              answerIndex: 3,
              explanation:
                "Correct! When you set lazy[v] = +7, you already applied the update to tree[v] at that moment (tree[v] += 7 × 10). The lazy tag is only the debt owed to children. push_down updates the children's tree[] and lazy[], not v's own tree[] again.",
            },
          ],
        },
      },
    },

    // ── Lesson 8: Range Add + Range Sum ───────────────────────────────────────
    {
      id: "p3-range-add-sum-concept",
      title: "8. Range Add + Range Sum",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "For additive lazy tags, push_down adds lazy[v] × child_length to the child's tree[] and accumulates the tag in the child's lazy[]. Tags stack: two additions of +3 and +4 = +7.",
          blocks: [
            {
              kind: "text",
              text: "The **range-add / range-sum** problem is the canonical lazy propagation example. Let's see exactly what changes from a standard sum segment tree.",
            },
            {
              kind: "diagram",
              diagram: `Standard sum seg tree:          Lazy sum seg tree:
  tree[] only                       tree[] + lazy[] (parallel)
  Point update: O(log N)            Range update: O(log N)  ← new!
  Range query:  O(log N)            Range query:  O(log N)  (unchanged)`,
              caption: "The only structural change is adding the lazy[] array",
            },
            {
              kind: "text",
              text: "The update function now has **three cases** instead of two. When the node's range is fully inside the update range `[l..r]`, apply directly and tag it. Only recurse (after pushing) on partial overlap.",
            },
            {
              kind: "code",
              language: "C++",
              code: `// Range add: add val to every element in [l, r]
void update(int v, int s, int e, int l, int r, ll val) {
    if (r < s || e < l) return;   // case 1: no overlap — skip
    if (l <= s && e <= r) {        // case 2: full overlap — apply & tag
        tree[v] += val * (e - s + 1);
        lazy[v] += val;
        return;
    }
    push(v, s, e);                 // case 3: partial — push first!
    int m = (s + e) / 2;
    update(2*v,   s,   m, l, r, val);
    update(2*v+1, m+1, e, l, r, val);
    tree[v] = tree[2*v] + tree[2*v+1];   // re-merge
}`,
            },
            {
              kind: "callout",
              variant: "insight",
              title: "Why multiply delta by (e - s + 1)?",
              body: "tree[v] stores the SUM of all elements in [s..e]. Adding val to each of the (e - s + 1) elements means the sum increases by val × length. The lazy tag itself is just val (the per-element delta), not val × length.",
            },
            {
              kind: "callout",
              variant: "rule",
              title: "Additive tags stack — just +=",
              body: "If a node already has lazy[v] = +3 and you add another +4, the new tag is +7. Additive tags combine by simple addition: lazy[v] += delta. This is why the push_down function does lazy[child] += lazy[v], not lazy[child] = lazy[v].",
            },
          ],
        },
      },
    },

    // ── Challenge 3: Range Add / Range Sum ────────────────────────────────────
    {
      id: "p3-challenge-range-add-sum",
      title: "9. Code It: Range Add / Range Sum",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given an array A of N integers and Q queries:\n\n**Type 1 — Range add:** `1 l r v` — add v to every element A[l..r] (0-indexed)\n**Type 2 — Range sum:** `2 l r` — print the sum of A[l..r] (0-indexed, inclusive)\n\nWrite a complete solution with lazy propagation.",
          inputFormat:
            "First line: N Q\nSecond line: N space-separated integers (the initial array)\nNext Q lines: each is `1 l r v` or `2 l r`",
          outputFormat: "For each type-2 query, print the sum on its own line.",
          sampleInput: "5 4\n1 2 3 4 5\n1 1 3 10\n2 0 4\n2 1 2\n1 0 4 1",
          sampleOutput: "45\n22",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "-10⁹ ≤ A[i], v ≤ 10⁹",
            "0 ≤ l ≤ r ≤ N-1 for all queries",
          ],
          hints: [
            {
              title: "Hint 1 — What changes from a standard sum tree?",
              body: "Add a lazy[] array of the same size as tree[]. When a range update fully covers a node, update tree[v] += delta × (e - s + 1) and set lazy[v] += delta. Don't recurse further.",
            },
            {
              title: "Hint 2 — push_down before any recursion",
              body: "In BOTH update() and query(), before recursing into children, call push_down(v). push_down applies lazy[v] to both children's tree[] and lazy[], then resets lazy[v] = 0.",
            },
            {
              title: "Hint 3 — What does push_down apply to children?",
              body: "Left child covers [s..m] (length m-s+1), right covers [m+1..e] (length e-m). Apply: tree[left] += lazy[v] × (m-s+1), lazy[left] += lazy[v]. Same for right with its length. Then lazy[v] = 0.",
            },
          ],
          backendChallengeId: "lazy_range_add_sum",
          sampleTestCases: [
            {
              label: "Basic range add then query",
              input: "5 4\n1 2 3 4 5\n1 1 3 10\n2 0 4\n2 1 2\n1 0 4 1",
              expected: "45\n25",
            },
            {
              label: "All elements same, large range add",
              input: "4 3\n0 0 0 0\n1 0 3 5\n2 0 3\n2 1 2",
              expected: "20\n10",
            },
            {
              label: "Overlapping updates",
              input: "3 4\n1 1 1\n1 0 2 2\n1 1 2 3\n2 0 2\n2 1 1",
              expected: "15\n6",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: {
            cpp: REF_CPP_RANGE_ADD_SUM,
            python: REF_PYTHON_RANGE_ADD_SUM,
          },
        },
      },
    },

    // ── Lesson 9: Range Assign vs Range Add ───────────────────────────────────
    {
      id: "p3-assign-vs-add",
      title: "10. Range Assign vs Range Add",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "Assign tags overwrite; add tags stack. An assign must replace any pending add tag. The rule is: if an assign arrives at a node, it wipes out whatever lazy was there before, because 'set to X' supersedes 'add Y'.",
          blocks: [
            {
              kind: "text",
              text: "Range-add lazy tags **stack** (you just add them together). But **range-assign** (set every element in [l..r] to value X) is fundamentally different — it **overwrites** rather than accumulates.",
            },
            {
              kind: "diagram",
              diagram: `Scenario: node v has lazy = +5 (pending add of 5)
Now a range-assign of 7 arrives covering v's entire range.

Option A (wrong): lazy = +5 then assign 7  →  result: 5+7=12? No!
Option B (correct): assign wipes the previous tag  →  result: 7

Rule: assign_tag(val) = "set everything to val, discarding any prior pending add"
      new lazy = ASSIGN(val)    (not ADD(5) then ASSIGN(7))`,
              caption: "An assign tag invalidates any pending add tag — it's a full overwrite",
            },
            {
              kind: "callout",
              variant: "gotcha",
              title: "The Sentinel Pattern",
              body: "Use a sentinel value (e.g. LLONG_MIN or a boolean `has_assign`) to distinguish 'no pending assignment' from 'assign to 0'. Never use 0 as the sentinel for assign-lazy if 0 is a valid assignment value.",
            },
            {
              kind: "code",
              language: "C++",
              code: `const ll NO_ASSIGN = LLONG_MIN;  // sentinel = "no pending assign"

void push(int v, int s, int e) {
    if (lazy[v] == NO_ASSIGN) return;   // nothing to push
    int m = (s + e) / 2;
    // Assign overwrites: set child tree and tag
    tree[2*v]   = lazy[v] * (m - s + 1);
    lazy[2*v]   = lazy[v];              // ← overwrite, not +=

    tree[2*v+1] = lazy[v] * (e - m);
    lazy[2*v+1] = lazy[v];

    lazy[v] = NO_ASSIGN;
}

void assign(int v, int s, int e, int l, int r, ll val) {
    if (r < s || e < l) return;
    if (l <= s && e <= r) {
        tree[v] = val * (e - s + 1);
        lazy[v] = val;                   // ← overwrites any old tag
        return;
    }
    push(v, s, e);
    int m = (s + e) / 2;
    assign(2*v, s, m, l, r, val);
    assign(2*v+1, m+1, e, l, r, val);
    tree[v] = tree[2*v] + tree[2*v+1];
}`,
            },
            {
              kind: "callout",
              variant: "insight",
              title: "Mixing add and assign tags (advanced)",
              body: "If you need BOTH range-add and range-assign in the same tree, priority rules apply: a new assign always overrides a pending add. Typically you use a struct for the lazy tag and track which operation is pending, flushing it correctly on push_down.",
            },
          ],
        },
      },
    },

    // ── Challenge 4: Range Assign / Range Sum ─────────────────────────────────
    {
      id: "p3-challenge-range-assign",
      title: "11. Code It: Range Assign / Range Sum",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given an array A of N integers and Q queries:\n\n**Type 1 — Range assign:** `1 l r v` — set every element A[l..r] = v (0-indexed)\n**Type 2 — Range sum:** `2 l r` — print the sum of A[l..r] (0-indexed, inclusive)\n\nWrite a complete solution with lazy propagation.",
          inputFormat:
            "First line: N Q\nSecond line: N space-separated integers (the initial array)\nNext Q lines: each is `1 l r v` or `2 l r`",
          outputFormat: "For each type-2 query, print the sum on its own line.",
          sampleInput: "5 4\n1 2 3 4 5\n1 1 3 0\n2 0 4\n1 0 4 10\n2 0 4",
          sampleOutput: "6\n50",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "-10⁹ ≤ A[i], v ≤ 10⁹",
            "0 ≤ l ≤ r ≤ N-1 for all queries",
          ],
          hints: [
            {
              title: "Hint 1 — Sentinel for 'no pending assign'",
              body: "You need to distinguish 'no pending assignment' from 'assign to 0' (which is valid). Use LLONG_MIN or -2×10⁹-1 as your sentinel. Initialize all lazy[] to this value.",
            },
            {
              title: "Hint 2 — push_down for assign overwrites, not adds",
              body: "Unlike additive lazy, here child.lazy = parent.lazy (not +=). The child's tree[] becomes val × child_range_length. And the parent's lazy resets to the sentinel.",
            },
            {
              title: "Hint 3 — Query is unchanged from standard",
              body: "The query function is identical to a standard sum tree, except you add push_down before recursing. The sentinel check in push_down ensures no-ops are fast.",
            },
          ],
          backendChallengeId: "lazy_range_assign_sum",
          sampleTestCases: [
            {
              label: "Basic assign then sum",
              input: "5 4\n1 2 3 4 5\n1 1 3 0\n2 0 4\n1 0 4 10\n2 0 4",
              expected: "6\n50",
            },
            {
              label: "Assign 0 (must work, 0 is valid)",
              input: "3 3\n9 9 9\n1 0 2 0\n2 0 2\n1 1 1 5",
              expected: "0",
            },
            {
              label: "Multiple overlapping assigns",
              input: "4 4\n1 1 1 1\n1 0 3 5\n1 2 3 2\n2 0 3\n2 0 1",
              expected: "14\n10",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: {
            cpp: REF_CPP_RANGE_ASSIGN_SUM,
            python: REF_PYTHON_RANGE_ASSIGN_SUM,
          },
          editorial: `**The Concept: Overwriting vs. Accumulating**
In a standard lazy segment tree designed for range addition, pending updates are accumulated. If you add 5 to a range, and later add 3 to that same range, the pending lazy value simply becomes 8.

Range Assignment is fundamentally different: it is absolute. If you assign 5 to a range, and later assign 3 to that same range, the 5 is completely destroyed. The new pending value is just 3. Because of this, when pushing lazy values down to children, we do not add to their existing values; we completely overwrite their tree sums and their lazy tags.

**The Sentinel Trap**
The most common bug in this problem is setting the default empty state of the lazy array to 0. If the problem constraints allow setting array values to 0 (which they do: \\(v \\ge -10^9\\)), the tree cannot distinguish between "no update is pending" and "a pending update wants to set this range to 0."

To solve this, we use a sentinel value. A sentinel is a value so far outside the bounds of possible inputs that it cannot possibly be a real query. Since \\(v \\ge -10^9\\), we can safely use \`LLONG_MIN\` (which is roughly \\(-9 \\times 10^{18}\\)) to represent a completely blank, inactive lazy tag.

**The Push Down Mechanism**
When a node needs to pass an assignment down to its children:
1. We check if \`lazy[node] != LLONG_MIN\`. If it's the sentinel, we do nothing.
2. If there is a valid assignment, we update the left child's sum to be the pending value multiplied by the length of the left segment.
3. We overwrite the left child's lazy tag with the new value. (We do not use \`+=\`).
4. We repeat this for the right child.
5. Finally, we reset the current node's lazy tag back to \`LLONG_MIN\`.

**C++ Solution (Accepted)**
\`\`\`cpp
#include <iostream>
#include <vector>
#include <climits>

using namespace std;

const int MAXN = 100005;
const long long NO_OP = LLONG_MIN; // Sentinel value

long long tree[4 * MAXN];
long long lazy[4 * MAXN];
long long A[MAXN];

// Build the initial segment tree
void build(int node, int start, int end) {
    lazy[node] = NO_OP; // Initialize all lazy tags to the sentinel
    if (start == end) {
        tree[node] = A[start];
        return;
    }
    int mid = start + (end - start) / 2;
    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
}

// Push down pending absolute assignments to the children
void push_down(int node, int start, int end) {
    if (lazy[node] != NO_OP) {
        int mid = start + (end - start) / 2;
        long long val = lazy[node];
        
        // Overwrite left child
        tree[2 * node] = val * (mid - start + 1);
        lazy[2 * node] = val; // Absolute assignment, NOT +=
        
        // Overwrite right child
        tree[2 * node + 1] = val * (end - mid);
        lazy[2 * node + 1] = val; // Absolute assignment, NOT +=
        
        // Clear the lazy tag for the current node using the sentinel
        lazy[node] = NO_OP;
    }
}

// Range Update: Assign 'val' to all elements in A[l..r]
void update_range(int node, int start, int end, int l, int r, long long val) {
    if (start > end || start > r || end < l) {
        return;
    }
    
    // Completely inside the range
    if (start >= l && end <= r) {
        tree[node] = val * (end - start + 1);
        lazy[node] = val;
        return;
    }
    
    // Push down before branching
    push_down(node, start, end);
    
    int mid = start + (end - start) / 2;
    update_range(2 * node, start, mid, l, r, val);
    update_range(2 * node + 1, mid + 1, end, l, r, val);
    
    tree[node] = tree[2 * node] + tree[2 * node + 1];
}

// Range Query: Get the sum of elements in A[l..r]
long long query_range(int node, int start, int end, int l, int r) {
    if (start > end || start > r || end < l) {
        return 0;
    }
    
    if (start >= l && end <= r) {
        return tree[node];
    }
    
    // Push down before reading children
    push_down(node, start, end);
    
    int mid = start + (end - start) / 2;
    long long p1 = query_range(2 * node, start, mid, l, r);
    long long p2 = query_range(2 * node + 1, mid + 1, end, l, r);
    
    return p1 + p2;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, q;
    cin >> n >> q;
    
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
            cout << query_range(1, 0, n - 1, l, r) << "\\n";
        }
    }
    
    return 0;
}
\`\`\``,
        },
      },
    },

    // ── Lesson 10: Lazy with Min/Max ──────────────────────────────────────────
    {
      id: "p3-lazy-minmax",
      title: "12. Lazy Propagation with Min / Max",
      content: {
        type: "conceptual",
        data: {
          narrations: [],
          takeaway:
            "Lazy propagation for min/max works the same way as for sum — the only difference is the merge function (use min/max instead of +) and the identity element for out-of-range queries. Additive lazy is trivially correct because adding a constant shifts the min/max by the same amount.",
          blocks: [
            {
              kind: "text",
              text: "You've seen lazy propagation for **sum** trees. The exact same technique works for **min** and **max** trees. The `push_down` structure doesn't change — only what's stored in `tree[v]` and how you merge.",
            },
            {
              kind: "diagram",
              diagram: `Sum tree merge:   tree[v] = tree[left] + tree[right]
Min tree merge:   tree[v] = min(tree[left], tree[right])
Max tree merge:   tree[v] = max(tree[left], tree[right])

Applying lazy add +delta to a node:
  Sum tree:   tree[v] += delta × length     ← scales with range length
  Min tree:   tree[v] += delta              ← just shifts the minimum!
  Max tree:   tree[v] += delta              ← just shifts the maximum!

push_down for Min tree (range-add lazy):
  tree[child] += lazy[v]         ← no × length!
  lazy[child] += lazy[v]
  lazy[v] = 0`,
              caption: "For min/max, adding a constant shifts the entire range — no length scaling needed",
            },
            {
              kind: "callout",
              variant: "insight",
              title: "Why no length scaling for min/max?",
              body: "Adding delta to all elements shifts every element up by delta. The minimum of the range also shifts by exactly delta — regardless of how many elements there are. Contrast with sum, where adding delta to N elements increases the sum by delta × N.",
            },
            {
              kind: "code",
              language: "C++",
              code: `// Min tree with range-add lazy — push_down is simpler!
void push(int v) {
    if (lazy[v] == 0) return;
    // No length needed — just propagate the shift
    tree[2*v]   += lazy[v];   lazy[2*v]   += lazy[v];
    tree[2*v+1] += lazy[v];   lazy[2*v+1] += lazy[v];
    lazy[v] = 0;
}

void update(int v, int s, int e, int l, int r, ll val) {
    if (r < s || e < l) return;
    if (l <= s && e <= r) {
        tree[v] += val;    // shift minimum directly — no × length
        lazy[v] += val;
        return;
    }
    push(v);   // push before recursing
    int m = (s + e) / 2;
    update(2*v, s, m, l, r, val);
    update(2*v+1, m+1, e, l, r, val);
    tree[v] = min(tree[2*v], tree[2*v+1]);   // re-merge
}`,
            },
            {
              kind: "callout",
              variant: "warning",
              title: "Range-assign lazy for min/max still needs care",
              body: "If you use a range-assign tag with a min/max tree, the same sentinel pattern from Lesson 9 applies. An assign tag overwrites any prior add tag. The push_down does tree[child] = lazy[v] and lazy[child] = lazy[v] (overwrite, not +=).",
            },
          ],
        },
      },
    },

    // ── Challenge 5: Range Add / Range Min ────────────────────────────────────
    {
      id: "p3-challenge-lazy-min",
      title: "13. Code It: Range Add / Range Minimum",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given an array A of N integers and Q queries:\n\n**Type 1 — Range add:** `1 l r v` — add v to every element A[l..r] (0-indexed)\n**Type 2 — Range min:** `2 l r` — print the minimum value in A[l..r] (0-indexed, inclusive)\n\nWrite a complete solution with lazy propagation.",
          inputFormat:
            "First line: N Q\nSecond line: N space-separated integers (the initial array)\nNext Q lines: each is `1 l r v` or `2 l r`",
          outputFormat: "For each type-2 query, print the minimum on its own line.",
          sampleInput: "5 5\n3 1 4 1 5\n2 0 4\n1 1 3 10\n2 0 4\n2 1 3\n1 0 4 -100",
          sampleOutput: "1\n3\n11",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "-10⁹ ≤ A[i], v ≤ 10⁹",
            "0 ≤ l ≤ r ≤ N-1 for all queries",
          ],
          hints: [
            {
              title: "Hint 1 — What changes from a min tree?",
              body: "Add a lazy[] array. The merge function stays as min(left, right). But now updates use the lazy mechanism: on full overlap, tree[v] += delta and lazy[v] += delta. Don't forget to push before recursing.",
            },
            {
              title: "Hint 2 — push_down does NOT multiply by length",
              body: "Unlike the sum tree, here you just do tree[child] += lazy[v] (no × length). Adding a constant to all elements shifts the minimum by exactly that constant.",
            },
            {
              title: "Hint 3 — Identity for out-of-range queries",
              body: "When the node's range is completely outside the query range, return LLONG_MAX (or float('inf') in Python). This loses every min comparison so it can't corrupt a real result.",
            },
          ],
          backendChallengeId: "lazy_range_add_min",
          sampleTestCases: [
            {
              label: "Basic range add then min query",
              input: "5 5\n3 1 4 1 5\n2 0 4\n1 1 3 10\n2 0 4\n2 1 3\n1 0 4 -100",
              expected: "1\n3\n11",
            },
            {
              label: "Negative adds",
              input: "4 3\n10 10 10 10\n1 0 3 -5\n2 0 3\n2 1 2",
              expected: "5\n5",
            },
            {
              label: "Large range overwrite direction",
              input: "3 4\n5 3 8\n2 0 2\n1 0 2 2\n2 0 2\n2 1 1",
              expected: "3\n5\n5",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: {
            cpp: REF_CPP_RANGE_ADD_MIN,
            python: REF_PYTHON_RANGE_ADD_MIN,
          },
          editorial: `**The Concept**
When adapting Lazy Propagation from a Range Sum tree to a Range Minimum tree, the core structural mechanics remain identical, but the mathematical transition functions change.

The fundamental rule for this problem is: Adding a constant value \\(V\\) to all elements in a set shifts the minimum value of that set by exactly \\(V\\). For instance, if the minimum element in a segment is 3, and we add 10 to every single element in that segment, the new minimum element is guaranteed to be 3 + 10 = 13. Because this relationship is independent of how many elements are in the segment, we do not multiply the lazy value by the length of the node's range.

**The Identity Element**
For a Range Sum tree, the identity element for an out-of-bounds query is 0 (since adding 0 does not change a sum). However, for a Range Minimum tree, our identity element must be infinity (\`LLONG_MAX\` in C++). If an out-of-bounds query returns 0, it could corrupt our calculations if the actual elements in our target range are all greater than 0 (e.g., \`min(5, 0) = 0\`, which is wrong). Returning \`LLONG_MAX\` ensures that the valid ranges always win the \`min()\` comparison.

**The Push Down Mechanism**
When a node clears its lazy debt and pushes updates down to its left and right children:
1. We check if \`lazy[node] != 0\`.
2. We add \`lazy[node]\` directly to the tree values of both children (without multiplying by segment length).
3. We accumulate \`lazy[node]\` into the lazy tags of both children using \`+=\`.
4. We reset \`lazy[node] = 0\`.

**C++ Solution (Accepted)**
\`\`\`cpp
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
    cin >> n >> q;
    
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
            cout << query_range(1, 0, n - 1, l, r) << "\\n";
        }
    }
    
    return 0;
}
\`\`\``,
        },
      },
    },

    // ── Challenge 6: Capstone — Range Assign + Max Subarray ───────────────────
    {
      id: "p3-challenge-capstone",
      title: "14. Capstone: Range Assign + Max Subarray",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given an array A of N integers and Q range-assign updates. After building the tree and after every query, print the maximum contiguous subarray sum of the entire array.\n\n**Empty subarray is allowed**, so the answer is always ≥ 0.\n\n**Range assign:** `l r v` — set every element in A[l..r] to v (0-indexed)",
          inputFormat:
            "First line: N Q\nSecond line: N space-separated integers (the initial array)\nNext Q lines: each is `l r v` — a range assignment",
          outputFormat:
            "Q+1 lines: the maximum subarray sum before any updates, then after each update.",
          sampleInput: "5 3\n-2 1 -3 4 -1\n0 4 1\n2 4 3\n0 2 -10",
          sampleOutput: "4\n5\n11\n6",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "-10⁹ ≤ A[i], v ≤ 10⁹",
            "0 ≤ l ≤ r ≤ N-1 for all updates",
          ],
          hints: [
            {
              title: "Hint 1 — The Node Transitions",
              body: "When merging a left child and right child, the logic is identical to a standard point-update maximum subarray tree: sum = l.sum + r.sum, pref = max(l.pref, l.sum + r.pref), suf = max(r.suf, r.sum + l.suf), best = max({l.best, r.best, l.suf + r.pref}).",
            },
            {
              title: "Hint 2 — The Lazy Application",
              body: "When a node is completely covered by an assignment of value V, every single element in its range becomes V. The total sum becomes V * length. For the optimal prefix, suffix, and overall subarray: if V is positive, we take the whole segment (V * length). If V is negative, we take the empty subarray (0).",
            },
            {
              title: "Hint 3 — The Sentinel",
              body: "Because an assignment of 0 is a completely valid operation, we cannot check if an update is pending using `if (lazy[node] != 0)`. We must initialize and reset our lazy array using a sentinel value, such as `LLONG_MIN`.",
            },
          ],
          backendChallengeId: "lazy_range_assign_max_sub",
          sampleTestCases: [
            {
              label: "Basic: range assign shifts answer",
              input: "5 3\n-2 1 -3 4 -1\n0 4 1\n2 4 3\n0 2 -10",
              expected: "4\n5\n11\n6",
            },
            {
              label: "All negative — empty subarray stays 0",
              input: "3 2\n-5 -3 -8\n0 2 -1\n0 2 100",
              expected: "0\n0\n300",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: {
            cpp: `// Reference implementation is available in the editorial after your first submission.`,
            python: `# Reference implementation is available in the editorial after your first submission.`,
          },
          editorial: [
            {
              kind: "callout",
              variant: "insight",
              title: "The Concept",
              body: "This problem is the ultimate test of Segment Tree mastery. It requires combining a multi-variable node state (tracking sum, pref, suf, and best) with absolute Lazy Propagation (Range Assignments).",
            },
            {
              kind: "text",
              text: "**The Node Transitions (Merge)**\nWhen merging a left child and right child, the logic is identical to a standard point-update maximum subarray tree:\n\n`sum = left.sum + right.sum`\n`pref = max(left.pref, left.sum + right.pref)`\n`suf = max(right.suf, right.sum + left.suf)`\n`best = max({left.best, right.best, left.suf + right.pref})`",
            },
            {
              kind: "text",
              text: "**The Lazy Application (The Secret Sauce)**\nWhen a node is completely covered by an assignment of value `V`, every single element in its range becomes `V`. This makes calculating its new state incredibly simple:\n- The total sum becomes `V * length`.\n- For the optimal prefix, suffix, and overall subarray: if `V` is positive, we take the whole segment (`V * length`). If `V` is negative, we take the empty subarray (`0`).\n\nWe define a helper function `applyAssign(node, val, len)` that instantly overwrites the node's 4 variables and updates its lazy tag.",
            },
            {
              kind: "callout",
              variant: "gotcha",
              title: "The Sentinel",
              body: "Because an assignment of 0 is a completely valid operation, we cannot check if an update is pending using `if (lazy[node] != 0)`. We must initialize and reset our lazy array using a sentinel value, such as `LLONG_MIN`.",
            },
            {
              kind: "text",
              text: "**C++ Solution (Accepted)**"
            },
            {
              kind: "code",
              language: "cpp",
              code: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <climits>\n\nusing namespace std;\n\nconst long long NO_OP = LLONG_MIN; // The vital sentinel\n\nstruct Node {\n    long long sum, pref, suf, best;\n};\n\nconst int MAXN = 100005;\nNode tree[4 * MAXN];\nlong long lazy[4 * MAXN];\nlong long A[MAXN];\n\nNode combine(Node l, Node r) {\n    return {\n        l.sum + r.sum,\n        max(l.pref, l.sum + r.pref),\n        max(r.suf, r.sum + l.suf),\n        max({l.best, r.best, l.suf + r.pref})\n    };\n}\n\nvoid applyAssign(int node, long long val, int len) {\n    tree[node].sum = val * len;\n    long long max_val = max(0LL, val * len);\n    tree[node].pref = max_val;\n    tree[node].suf = max_val;\n    tree[node].best = max_val;\n    lazy[node] = val;\n}\n\nvoid build(int node, int s, int e) {\n    lazy[node] = NO_OP;\n    if (s == e) {\n        long long v = A[s];\n        tree[node] = {v, max(0LL, v), max(0LL, v), max(0LL, v)};\n        return;\n    }\n    int m = s + (e - s) / 2;\n    build(2 * node, s, m);\n    build(2 * node + 1, m + 1, e);\n    tree[node] = combine(tree[2 * node], tree[2 * node + 1]);\n}\n\nvoid push_down(int node, int s, int e) {\n    if (lazy[node] != NO_OP) {\n        int m = s + (e - s) / 2;\n        applyAssign(2 * node, lazy[node], m - s + 1);\n        applyAssign(2 * node + 1, lazy[node], e - m);\n        lazy[node] = NO_OP;\n    }\n}\n\nvoid update(int node, int s, int e, int l, int r, long long v) {\n    if (r < s || e < l) return;\n    if (l <= s && e <= r) {\n        applyAssign(node, v, e - s + 1);\n        return;\n    }\n    push_down(node, s, e);\n    int m = s + (e - s) / 2;\n    update(2 * node, s, m, l, r, v);\n    update(2 * node + 1, m + 1, e, l, r, v);\n    tree[node] = combine(tree[2 * node], tree[2 * node + 1]);\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n\n    int n, q;\n    if (!(cin >> n >> q)) return 0;\n    \n    for (int i = 0; i < n; i++) cin >> A[i];\n    \n    build(1, 0, n - 1);\n    cout << tree[1].best << "\\n";\n    \n    while (q--) {\n        int l, r;\n        long long v;\n        cin >> l >> r >> v;\n        update(1, 0, n - 1, l, r, v);\n        cout << tree[1].best << "\\n";\n    }\n    \n    return 0;\n}`
            }
          ],
        },
      },
    },
  ],
};
