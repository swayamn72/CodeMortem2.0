import type { ProblemGroup } from "./types";

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

// ── Reference: HLD with sum Segment Tree + point update ──────────────────────
const REFERENCE_CPP = `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int MAXN = 100005;
vector<int> adj[MAXN];
int dep[MAXN], par[MAXN], sz[MAXN], heavy[MAXN];
int pos_arr[MAXN], head_arr[MAXN];
int timer_val = 0;

// ── Segment Tree (sum, iterative) ─────────────────────────────────────────────
struct SegTree {
    int n;
    vector<ll> t;
    SegTree() {}
    SegTree(int n) : n(n), t(2 * n, 0LL) {}
    void update(int i, ll val) {
        for (t[i += n] = val; i > 1; i >>= 1)
            t[i >> 1] = t[i] + t[i ^ 1];
    }
    ll query(int l, int r) { // [l, r]
        ll res = 0;
        for (l += n, r += n + 1; l < r; l >>= 1, r >>= 1) {
            if (l & 1) res += t[l++];
            if (r & 1) res += t[--r];
        }
        return res;
    }
} st;

int dfs1(int u, int p, int d) {
    dep[u]=d; par[u]=p; sz[u]=1; heavy[u]=-1;
    int mx=0;
    for (int v : adj[u]) {
        if (v==p) continue;
        sz[u] += dfs1(v,u,d+1);
        if (sz[v]>mx){mx=sz[v]; heavy[u]=v;}
    }
    return sz[u];
}

void dfs2(int u, int p, int h) {
    head_arr[u]=h; pos_arr[u]=timer_val++;
    if (heavy[u]!=-1) dfs2(heavy[u],u,h);
    for (int v : adj[u]) {
        if (v==p||v==heavy[u]) continue;
        dfs2(v,u,v);
    }
}

ll pathSum(int u, int v) {
    ll res = 0;
    while (head_arr[u] != head_arr[v]) {
        if (dep[head_arr[u]] < dep[head_arr[v]]) swap(u,v);
        res += st.query(pos_arr[head_arr[u]], pos_arr[u]);
        u = par[head_arr[u]];
    }
    if (dep[u] > dep[v]) swap(u,v);
    res += st.query(pos_arr[u], pos_arr[v]);
    return res;
}

int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    vector<ll> val(n+1);
    for (int i=1;i<=n;i++) cin>>val[i];
    for (int i=0;i<n-1;i++) {
        int u,v; cin>>u>>v;
        adj[u].push_back(v); adj[v].push_back(u);
    }
    dfs1(1,0,0); dfs2(1,0,1);
    st = SegTree(n);
    for (int u=1;u<=n;u++) st.update(pos_arr[u], val[u]);
    int q; cin>>q;
    while (q--) {
        char t; cin>>t;
        if (t=='U') {
            int u; ll x; cin>>u>>x;
            st.update(pos_arr[u], x); // point update
        } else {
            int u,v; cin>>u>>v;
            cout << pathSum(u,v) << "\\n";
        }
    }
    return 0;
}`;

const REFERENCE_PYTHON = `import sys

def main():
    data = sys.stdin.buffer.read().split()
    ptr = 0
    def rd(): nonlocal ptr; v=data[ptr]; ptr+=1; return int(v)

    n = rd()
    val = [0]+[rd() for _ in range(n)]
    adj = [[] for _ in range(n+1)]
    for _ in range(n-1):
        u,v = rd(),rd()
        adj[u].append(v); adj[v].append(u)

    dep=[0]*(n+1); par=[0]*(n+1); sz=[1]*(n+1); heavy=[-1]*(n+1)
    pos_a=[0]*(n+1); head_a=[0]*(n+1)

    order=[]; stk=[(1,0,0)]; seen=[False]*(n+1)
    while stk:
        u,p,d=stk.pop()
        if seen[u]: continue
        seen[u]=True; dep[u]=d; par[u]=p; order.append(u)
        for v in adj[u]:
            if not seen[v]: stk.append((v,u,d+1))
    for u in reversed(order):
        best=0
        for v in adj[u]:
            if v==par[u]: continue
            sz[u]+=sz[v]
            if sz[v]>best: best=sz[v]; heavy[u]=v

    timer=0; stk=[(1,0,1)]
    while stk:
        u,p,h=stk.pop()
        head_a[u]=h; pos_a[u]=timer; timer+=1
        lights=[]
        for v in adj[u]:
            if v==p or v==heavy[u]: continue
            lights.append(v)
        for v in reversed(lights): stk.append((v,u,v))
        if heavy[u]!=-1: stk.append((heavy[u],u,h))

    # Sum segment tree
    seg=[0]*(2*n)
    def upd(i,x):
        i+=n; seg[i]=x
        while i>1: i>>=1; seg[i]=seg[2*i]+seg[2*i+1]
    def qry(l,r):
        res=0; l+=n; r+=n+1
        while l<r:
            if l&1: res+=seg[l]; l+=1
            if r&1: r-=1; res+=seg[r]
            l>>=1; r>>=1
        return res

    for u in range(1,n+1): upd(pos_a[u],val[u])

    def path_sum(u,v):
        res=0
        while head_a[u]!=head_a[v]:
            if dep[head_a[u]]<dep[head_a[v]]: u,v=v,u
            res+=qry(pos_a[head_a[u]],pos_a[u])
            u=par[head_a[u]]
        if dep[u]>dep[v]: u,v=v,u
        return res+qry(pos_a[u],pos_a[v])

    q=rd(); out=[]
    for _ in range(q):
        t=data[ptr].decode(); ptr+=1
        if t=='U':
            u,x=rd(),rd(); upd(pos_a[u],x)
        else:
            u,v=rd(),rd(); out.append(str(path_sum(u,v)))
    print("\\n".join(out))

if __name__=="__main__":
    main()`;

// ═════════════════════════════════════════════════════════════════════════════
export const PART3_DYNAMIC: ProblemGroup = {
  partLabel: "Part 3: Dynamic Operations",

  lessons: [
    // ── Lesson 3-1: Conceptual ────────────────────────────────────────────────
    {
      id: "hld-l3-dynamic",
      title: "7. Dynamic Path Updates",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "So far, node values have been static. Now we add point updates: 'Change the value of node u to X.' This barely changes the HLD at all — that's the beauty of good modular design.",
            "A point update on node u is simply a Segment Tree point update at index pos[u]. The HLD arrays (depth, par, sz, heavy, pos, head) don't change when values change — only the Segment Tree's internal state changes.",
            "The query (path sum instead of path max this time) uses the exact same routing loop: jump chains, accumulate, final query. The only difference is the Segment Tree stores sums instead of maxima.",
            "This illustrates a critical design principle: keep your Segment Tree struct completely separate from your HLD routing logic. The HLD code never needs to know whether the Seg Tree is computing max, min, sum, GCD, or anything else — it just calls st.query(l, r) and st.update(i, val).",
            "The combined complexity: O(N log N) preprocessing + O(log^2 N) per query/update. For N = Q = 10^5, that's about 17^2 ≈ 289 Segment Tree operations per query — extremely fast.",
          ],
          takeaway:
            "Point updates are trivial: just call st.update(pos[u], newVal). The HLD routing logic never changes, regardless of what the Segment Tree computes. Strict modularity is the key to writing clean HLD code.",
        },
      },
    },

    // ── Challenge 3-2: Dynamic Path Sum ──────────────────────────────────────
    {
      id: "hld-c3-dynamic-sum",
      title: "Code: Dynamic Path Sum",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given a tree of N nodes with initial values, support two types of operations:\n\n- **U u x**: Update node u's value to x.\n- **Q u v**: Query the **sum of values** on the simple path from u to v.\n\nImplement the full HLD with a sum Segment Tree supporting both operations.",
          inputFormat:
            "First line: N.\nSecond line: N integers — initial values val[1..N].\nNext N-1 lines: edges.\nNext line: Q (number of operations).\nNext Q lines: either `U u x` or `Q u v`.",
          outputFormat: "For each Q query, print one integer: the path sum.",
          sampleInput:
            "5\n1 2 3 4 5\n1 2\n1 3\n2 4\n2 5\n4\nQ 4 3\nU 2 10\nQ 4 3\nQ 1 5",
          sampleOutput: "10\n18\n16",
          constraints: [
            "1 ≤ N, Q ≤ 10^5",
            "1 ≤ val[u], x ≤ 10^9",
            "Valid tree, 1-indexed, rooted at 1",
          ],
          hints: [
            {
              title: "Hint 1 — Segment Tree type",
              body: "Use a sum Segment Tree (not max). The merge operation is addition. Initialize leaves with val[u] at position pos[u].",
            },
            {
              title: "Hint 2 — Update operation",
              body: "For 'U u x': simply call st.update(pos[u], x). The HLD structure doesn't change — only the Segment Tree leaf value changes.",
            },
            {
              title: "Hint 3 — Use long long",
              body: "Path sums can be large: N = 10^5 nodes each with value 10^9 gives up to 10^14. Use long long (ll) for the Segment Tree and all sums.",
            },
          ],
          backendChallengeId: "hld_dynamic_path_sum",
          sampleTestCases: [
            {
              label: "Sample",
              input:
                "5\n1 2 3 4 5\n1 2\n1 3\n2 4\n2 5\n4\nQ 4 3\nU 2 10\nQ 4 3\nQ 1 5",
              expected: "10\n18\n16",
            },
            {
              label: "Single node path",
              input: "3\n10 20 30\n1 2\n1 3\n2\nQ 1 1\nQ 2 2",
              expected: "10\n20",
            },
            {
              label: "Update then query",
              input: "2\n5 7\n1 2\n3\nQ 1 2\nU 1 100\nQ 1 2",
              expected: "12\n107",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
        },
      },
    },
  ],
};
