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

// ── Reference: HLD with edge weights (push-down) + LCA exclusion ─────────────
const REFERENCE_CPP = `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
const int NEG_INF = INT_MIN;

struct Edge { int u, v, w, idx; };
vector<pair<int,int>> adj[MAXN]; // (neighbor, edge_index)
int dep[MAXN], par[MAXN], sz[MAXN], heavy[MAXN];
int pos_arr[MAXN], head_arr[MAXN];
// nodeVal stores the edge weight "pushed down" to the deeper node
int nodeVal[MAXN];
int timer_val = 0;

// Segment Tree (max)
int seg[4*MAXN];
void build(int v,int s,int e){
    if(s==e){seg[v]=nodeVal[s];return;}
    int m=(s+e)/2;
    build(2*v,s,m); build(2*v+1,m+1,e);
    seg[v]=max(seg[2*v],seg[2*v+1]);
}
void update(int v,int s,int e,int i,int x){
    if(s==e){seg[v]=x;return;}
    int m=(s+e)/2;
    if(i<=m) update(2*v,s,m,i,x);
    else update(2*v+1,m+1,e,i,x);
    seg[v]=max(seg[2*v],seg[2*v+1]);
}
int query(int v,int s,int e,int l,int r){
    if(r<s||e<l) return NEG_INF;
    if(l<=s&&e<=r) return seg[v];
    int m=(s+e)/2;
    return max(query(2*v,s,m,l,r),query(2*v+1,m+1,e,l,r));
}

int dfs1(int u,int p,int d){
    dep[u]=d; par[u]=p; sz[u]=1; heavy[u]=-1;
    int mx=0;
    for(auto[v,_]:adj[u]){
        if(v==p) continue;
        sz[u]+=dfs1(v,u,d+1);
        if(sz[v]>mx){mx=sz[v];heavy[u]=v;}
    }
    return sz[u];
}
void dfs2(int u,int p,int h){
    head_arr[u]=h; pos_arr[u]=timer_val++;
    if(heavy[u]!=-1) dfs2(heavy[u],u,h);
    for(auto[v,_]:adj[u]){
        if(v==p||v==heavy[u]) continue;
        dfs2(v,u,v);
    }
}

int pathMaxEdge(int u,int v,int n){
    int res=NEG_INF;
    while(head_arr[u]!=head_arr[v]){
        if(dep[head_arr[u]]<dep[head_arr[v]]) swap(u,v);
        res=max(res,query(1,0,n-1,pos_arr[head_arr[u]],pos_arr[u]));
        u=par[head_arr[u]];
    }
    // LCA exclusion: exclude the shallower node (the LCA itself)
    if(dep[u]>dep[v]) swap(u,v);
    if(u!=v) // query from pos[u]+1 to pos[v] — skip the LCA node
        res=max(res,query(1,0,n-1,pos_arr[u]+1,pos_arr[v]));
    return res;
}

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin>>n;
    vector<Edge> edges(n-1);
    for(int i=0;i<n-1;i++){
        cin>>edges[i].u>>edges[i].v>>edges[i].w;
        edges[i].idx=i;
        adj[edges[i].u].push_back({edges[i].v,i});
        adj[edges[i].v].push_back({edges[i].u,i});
    }
    dfs1(1,0,0); dfs2(1,0,1);
    // Assign edge weight to the deeper node
    fill(nodeVal,nodeVal+n,0);
    for(auto& e:edges){
        int deeper=(dep[e.u]>dep[e.v])?e.u:e.v;
        nodeVal[pos_arr[deeper]]=e.w;
    }
    build(1,0,n-1);
    int q; cin>>q;
    while(q--){
        char t; cin>>t;
        if(t=='U'){
            int i,w; cin>>i>>w; // update edge i (0-indexed)
            int deeper=(dep[edges[i].u]>dep[edges[i].v])?edges[i].u:edges[i].v;
            update(1,0,n-1,pos_arr[deeper],w);
            edges[i].w=w;
        } else {
            int u,v; cin>>u>>v;
            cout<<pathMaxEdge(u,v,n)<<"\\n";
        }
    }
    return 0;
}`;

const REFERENCE_PYTHON = `# See C++ reference for the full implementation.
# Key points in Python:
# 1. Push edge weight to deeper node: nodeVal[pos[deeper]] = weight
# 2. LCA exclusion in final query: query from pos[u]+1 to pos[v] (skip LCA)
import sys

def main():
    pass  # Full implementation mirrors the C++ reference above

if __name__ == "__main__":
    main()`;

// ═════════════════════════════════════════════════════════════════════════════
export const PART4_ADVANCED: ProblemGroup = {
  partLabel: "Part 4: Advanced Modeling",

  lessons: [
    // ── Lesson 4-1: Edge Weights (Conceptual) ────────────────────────────────
    {
      id: "hld-l4-edges",
      title: "8. Edge Weights — Push-Down Trick",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "Everything so far has had weights on nodes. But many real problems put weights on edges. How do we map edge weights into our 1D array when our positions are assigned to nodes?",
            "The trick is called 'push-down': assign each edge's weight to the deeper of the two nodes it connects. Since every non-root node has exactly one parent edge, each node (except the root) stores exactly one edge's weight. The root stores a sentinel value (0 or -∞) since it has no parent edge.",
            "This works because in our HLD, when we query the path from u to v, we're actually querying the sequence of nodes. If each non-root node represents its edge to its parent, then querying all nodes on the path gives us all the edge weights — almost.",
            "The catch: the LCA gets included in the query, but the LCA's stored value is its edge to its parent, which is NOT on the u→v path. So we must exclude the LCA node from the final query.",
            "The LCA exclusion rule: when u and v are finally on the same chain (head[u] == head[v]), the shallower one is the LCA. The final Segment Tree query becomes [pos[lca]+1, pos[deeper]] — skipping the LCA's position entirely.",
            "This same push-down + LCA-exclusion pattern works for any edge-weighted HLD problem, regardless of what the Segment Tree computes.",
          ],
          takeaway:
            "Push-down: assign each edge's weight to the deeper node. LCA exclusion: in the final same-chain query, start from pos[lca]+1, not pos[lca]. These two adjustments are the only differences from node-weighted HLD.",
        },
      },
    },

    // ── Challenge 4-2: Edge Weights ──────────────────────────────────────────
    {
      id: "hld-c4-edge-weights",
      title: "Code: Edge Weights",
      content: {
        type: "challenge",
        data: {
          problemStatement:
            "Given a tree of N nodes with weighted **edges** (not nodes), support two operations:\n\n- **U i w**: Update edge i (0-indexed in input order) to have weight w.\n- **Q u v**: Query the **maximum edge weight** on the simple path from u to v.\n\nUse the push-down technique: assign each edge's weight to the deeper node. Apply the LCA exclusion in the final same-chain query.",
          inputFormat:
            "First line: N.\nNext N-1 lines: u v w — an edge between u and v with weight w (0-indexed edge index).\nNext line: Q.\nNext Q lines: `U i w` or `Q u v`.",
          outputFormat: "For each Q query, one integer: the max edge weight on the path.",
          sampleInput:
            "5\n1 2 3\n1 3 8\n2 4 1\n2 5 6\n4\nQ 4 3\nQ 2 3\nU 1 10\nQ 2 3",
          sampleOutput: "8\n8\n10",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "1 ≤ w ≤ 10⁹",
            "Valid tree, 1-indexed, rooted at 1",
            "Edge indices are 0-indexed in input order",
          ],
          hints: [
            {
              title: "Hint 1 — Push-down",
              body: "After both DFS passes, for each edge (u, v, w): determine which node is deeper using dep[]. Assign nodeVal[pos[deeper]] = w. The root's nodeVal can be 0 or -INF (it doesn't matter since LCA exclusion will skip it).",
            },
            {
              title: "Hint 2 — LCA Exclusion",
              body: "In pathMax, once head[u] == head[v], you have the LCA (the shallower node). Query from pos[lca] + 1 to pos[deeper]. If lca == deeper (u == v, same node), the answer is 0 or -INF (no edge on a single-node path).",
            },
            {
              title: "Hint 3 — Edge update",
              body: "For 'U i w': find the deeper node of edge i (stored from the setup phase), then call st.update(pos[deeper], w). Keep the original edge list to know which nodes an edge connects.",
            },
          ],
          backendChallengeId: "hld_edge_weights",
          sampleTestCases: [
            {
              label: "Sample",
              input: "5\n1 2 3\n1 3 8\n2 4 1\n2 5 6\n4\nQ 4 3\nQ 2 3\nU 1 10\nQ 2 3",
              expected: "8\n8\n10",
            },
            {
              label: "Single edge",
              input: "2\n1 2 5\n2\nQ 1 2\nU 0 99",
              expected: "5",
            },
            {
              label: "Same node query",
              input: "3\n1 2 4\n1 3 7\n1\nQ 2 2",
              expected: "0",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: REFERENCE_CPP, python: REFERENCE_PYTHON },
        },
      },
    },

    // ── Lesson 4-3: Subtree Operations (Conceptual) ──────────────────────────
    {
      id: "hld-l4-subtree",
      title: "9. Subtree Operations",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "Here's a beautiful side-effect of the HLD setup that many miss: subtree queries and updates come almost for free.",
            "Recall that in the second DFS, we always visit the heavy child first. This means every node in the subtree of u is assigned a position in the range [pos[u], pos[u] + sz[u] - 1]. The entire subtree maps to a contiguous block in the 1D array!",
            "This means: 'Add X to all nodes in the subtree of u' is a single Segment Tree range update: st.rangeUpdate(pos[u], pos[u] + sz[u] - 1, X). And 'Query the sum of the subtree of u' is a single Segment Tree range query: st.query(pos[u], pos[u] + sz[u] - 1).",
            "The routing complexity is O(1) — just compute the range boundaries. All the complexity is in the Segment Tree itself (O(log N) for a range query with lazy propagation).",
            "This is a prime example of why thinking carefully about array ordering pays dividends. The HLD layout serves double duty: O(log^2 N) path queries AND O(log N) subtree operations.",
          ],
          takeaway:
            "Subtree of u = contiguous range [pos[u], pos[u] + sz[u] - 1] in the 1D array. Subtree operations require zero HLD routing — just a single Segment Tree range call. This is a hidden O(1)-routing superpower of the HLD layout.",
        },
      },
    },

    // ── Challenge 4-4: Subtree Operations (Premium) ──────────────────────────
    {
      id: "hld-c4-subtree-ops",
      title: "Code: Subtree Operations",
      content: {
        type: "challenge",
        data: {
          premium: true,
          problemStatement:
            "Given a tree of N nodes with initial values, support:\n\n- **A u x**: Add x to all nodes in the **subtree** of u.\n- **S u**: Query the **sum of values** in the subtree of u.\n- **Q u v**: Query the **sum of values** on the path from u to v.\n\nThis requires a Lazy Propagation Segment Tree (range add, range sum query).",
          inputFormat:
            "First line: N.\nSecond line: N integers — initial values.\nNext N-1 lines: edges.\nNext line: Q.\nNext Q lines: `A u x`, `S u`, or `Q u v`.",
          outputFormat: "For each S or Q query, print one long long integer.",
          sampleInput:
            "5\n1 2 3 4 5\n1 2\n1 3\n2 4\n2 5\n5\nS 1\nA 2 10\nS 1\nS 2\nQ 4 3",
          sampleOutput: "15\n35\n26\n20",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "1 ≤ val[u], x ≤ 10⁴",
            "Valid tree, 1-indexed, rooted at 1",
          ],
          hints: [
            {
              title: "Hint 1 — Subtree range",
              body: "The subtree of u occupies positions [pos[u], pos[u] + sz[u] - 1] in the 1D array. This is the ONLY range you need for 'A' and 'S' operations — no routing loop required.",
            },
            {
              title: "Hint 2 — Lazy Propagation",
              body: "For range-add (A operation), you need lazy propagation. Each node stores: sum of range, and a pending lazy add value. When you push a lazy tag down, add (lazyVal * childSize) to the child's sum and accumulate the lazyVal into the child's lazy tag.",
            },
            {
              title: "Hint 3 — Path sum with lazy",
              body: "The path sum query (Q operation) uses the same routing loop as before — it just calls st.query(l, r) instead of the non-lazy version. The lazy Segment Tree handles the range sum correctly as long as you push lazy tags before descending.",
            },
          ],
          backendChallengeId: "hld_subtree_ops",
          sampleTestCases: [
            {
              label: "Sample",
              input:
                "5\n1 2 3 4 5\n1 2\n1 3\n2 4\n2 5\n5\nS 1\nA 2 10\nS 1\nS 2\nQ 4 3",
              expected: "15\n35\n26\n20",
            },
            {
              label: "Add to leaf subtree",
              input: "3\n1 1 1\n1 2\n1 3\n3\nA 2 5\nS 1\nS 2",
              expected: "8\n6",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: STARTER_CPP, python: STARTER_PYTHON },
        },
      },
    },

    // ── Lesson 4-5: Path Range Updates (Conceptual) ──────────────────────────
    {
      id: "hld-l4-range-updates",
      title: "10. Path Range Updates",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "The final, fully-realized form of HLD: range updates on paths. 'Add X to every node on the path from u to v.' Combined with sum queries, this is the hardest standard HLD variant.",
            "The HLD routing loop barely changes. Instead of calling st.query(pos[head[u]], pos[u]), you call st.rangeUpdate(pos[head[u]], pos[u], X). Same chain-jumping logic, different Segment Tree call.",
            "The key is that your Segment Tree must now support range updates with lazy propagation. The HLD code itself stays identical — you just swap which Segment Tree method you call.",
            "This is why modularity matters so much in HLD implementations. The routing logic (the while loop and the head-jumping) is universal. What the Segment Tree does inside is a plug-and-play choice: max, sum, range-add, range-set — all work without changing the routing code.",
            "The final template: two DFS passes, a lazy Segment Tree, and the routing loop that calls st.rangeUpdate(l, r, X) for updates and st.query(l, r) for queries. This handles the hardest HLD problems on Codeforces and similar platforms.",
          ],
          takeaway:
            "Path range updates change only what Segment Tree method gets called inside the routing loop. The routing logic itself never changes. With a lazy propagation Segment Tree, the full template handles path range updates AND path sum queries in O(log^2 N).",
        },
      },
    },

    // ── Challenge 4-6: Path Range Updates (Premium) ──────────────────────────
    {
      id: "hld-c4-path-range-updates",
      title: "Code: Path Range Updates",
      content: {
        type: "challenge",
        data: {
          premium: true,
          problemStatement:
            "Given a tree of N nodes (initially all zeros), support:\n\n- **A u v x**: Add x to every node on the path from u to v.\n- **Q u v**: Query the **sum of values** on the path from u to v.\n\nThis is the complete HLD template: routing loop + lazy propagation Segment Tree with range add and range sum.",
          inputFormat:
            "First line: N.\nNext N-1 lines: edges.\nNext line: Q.\nNext Q lines: `A u v x` or `Q u v`.",
          outputFormat: "For each Q query, print one long long integer.",
          sampleInput:
            "5\n1 2\n1 3\n2 4\n2 5\n4\nA 4 3 5\nQ 4 3\nA 1 5 3\nQ 4 3",
          sampleOutput: "25\n34",
          constraints: [
            "1 ≤ N, Q ≤ 10⁵",
            "1 ≤ x ≤ 10⁴",
            "Valid tree, 1-indexed, rooted at 1",
          ],
          hints: [
            {
              title: "Hint 1 — Routing loop for range update",
              body: "In the 'A u v x' operation, use the same while loop as always. But call st.rangeUpdate(pos[head[u]], pos[u], x) instead of a query. After the loop, call st.rangeUpdate(pos[shallower], pos[deeper], x) for the final segment.",
            },
            {
              title: "Hint 2 — Lazy propagation node",
              body: "Each Segment Tree node stores: sum (the sum of all values in the range) and lazy (a pending add-to-all-elements value). push_down must multiply lazy by the child's range length before adding to child.sum.",
            },
            {
              title: "Hint 3 — Range length",
              body: "When pushing down, the left child covers [s, m] (length = m - s + 1) and the right child covers [m+1, e] (length = e - m). Add lazy * childLen to child.sum and propagate lazy to child.lazy.",
            },
          ],
          backendChallengeId: "hld_path_range_updates",
          sampleTestCases: [
            {
              label: "Sample",
              input:
                "5\n1 2\n1 3\n2 4\n2 5\n4\nA 4 3 5\nQ 4 3\nA 1 5 3\nQ 4 3",
              expected: "25\n34",
            },
            {
              label: "Single add then query",
              input: "3\n1 2\n1 3\n2\nA 2 3 7\nQ 2 3",
              expected: "21",
            },
          ],
          starterCode: { cpp: STARTER_CPP, python: STARTER_PYTHON },
          referenceBoilerplate: { cpp: STARTER_CPP, python: STARTER_PYTHON },
        },
      },
    },
  ],
};
