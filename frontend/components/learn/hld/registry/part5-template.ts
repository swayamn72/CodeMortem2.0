import type { ProblemGroup } from "./types";
import type { WalkthroughLine } from "@/components/shared/LineExplainer";

export const TEMPLATE_LINES: WalkthroughLine[] = [
  {
    lineNum: 1,
    code: "struct HLD{",
    type: "keyword",
    explanation: "We encapsulate the entire Heavy-Light Decomposition inside a struct. This ensures all arrays and logic are self-contained and avoids polluting the global scope, which is especially useful if multiple trees are needed.",
  },
  {
    lineNum: 2,
    code: "    ll n, timer;",
    type: "default",
    explanation: "'n' stores the number of nodes. 'timer' is the shared counter used to assign contiguous 1D positions to nodes during the second DFS.",
  },
  {
    lineNum: 3,
    code: "    vi depth, size, parent, heavy, head, pos;",
    type: "default",
    explanation: "Vectors to store the tree metrics and HLD structures. Using vectors inside the struct allows dynamic sizing rather than hardcoded global arrays of size MAXN.",
  },
  {
    lineNum: 4,
    code: "    SegTree st;",
    type: "default",
    explanation: "The Segment Tree instance. Notice how the HLD struct doesn't care how the Segment Tree is implemented — it just delegates to it.",
  },
  {
    lineNum: 6,
    code: "    HLD(ll n, vector<vector<ll>>& adj){",
    type: "keyword",
    explanation: "Constructor takes the number of nodes 'n' and the adjacency list 'adj'. This is all that's needed to build the complete decomposition.",
  },
  {
    lineNum: 7,
    code: "        this->n = n;",
    type: "default",
  },
  {
    lineNum: 8,
    code: "        timer = 0;",
    type: "default",
    explanation: "Initialize the timer to 0. This will increment from 0 to n-1 as nodes are assigned their 1D Segment Tree positions.",
  },
  {
    lineNum: 9,
    code: "        depth.resize(n, 0); size.resize(n, 0); parent.resize(n, -1);",
    type: "default",
  },
  {
    lineNum: 10,
    code: "        heavy.resize(n, -1); head.resize(n, 0); pos.resize(n, 0);",
    type: "default",
    explanation: "Initialize all arrays. Note that 'heavy' and 'parent' default to -1 to signify lack of heavy child or parent.",
  },
  {
    lineNum: 12,
    code: "        st = SegTree(n);",
    type: "default",
    explanation: "Initialize the segment tree with size 'n'. It will handle ranges from 0 to n-1.",
  },
  {
    lineNum: 13,
    code: "        dfs1(0, -1, 0, adj);",
    type: "highlight",
    explanation: "First DFS pass: computes depth, size, parent, and heavy child. Started at root=0, parent=-1, depth=0.",
  },
  {
    lineNum: 14,
    code: "        dfs2(0, -1, 0, adj);",
    type: "highlight",
    explanation: "Second DFS pass: builds the chains and assigns positions. Started at root=0, parent=-1, chainHead=0.",
  },
  {
    lineNum: 15,
    code: "    }",
    type: "default",
  },
  {
    lineNum: 17,
    code: "    void dfs1(ll u, ll p, ll d, vector<vector<ll>> &adj){",
    type: "keyword",
    explanation: "The first DFS computes tree metrics. It takes node 'u', parent 'p', and depth 'd'.",
  },
  {
    lineNum: 18,
    code: "        parent[u] = p;",
    type: "default",
  },
  {
    lineNum: 19,
    code: "        depth[u] = d;",
    type: "default",
  },
  {
    lineNum: 20,
    code: "        size[u] = 1;",
    type: "default",
    explanation: "Subtree size starts at 1 (the node itself).",
  },
  {
    lineNum: 21,
    code: "        ll maxsub = 0;",
    type: "default",
    explanation: "Used to track the largest child subtree found so far to determine the heavy child.",
  },
  {
    lineNum: 22,
    code: "        for(auto v : adj[u]){",
    type: "keyword",
  },
  {
    lineNum: 23,
    code: "            if(v == p) continue;",
    type: "keyword",
  },
  {
    lineNum: 24,
    code: "            dfs1(v, u, d+1, adj);",
    type: "default",
  },
  {
    lineNum: 25,
    code: "            size[u] += size[v];",
    type: "default",
    explanation: "Add the child's subtree size to the current node's subtree size.",
  },
  {
    lineNum: 26,
    code: "            if(size[v] > maxsub){",
    type: "keyword",
    explanation: "If this child's subtree is the largest seen so far, it becomes the new heavy child.",
  },
  {
    lineNum: 27,
    code: "                maxsub = size[v];",
    type: "default",
  },
  {
    lineNum: 28,
    code: "                heavy[u] = v;",
    type: "highlight",
    explanation: "Update the heavy child.",
  },
  {
    lineNum: 29,
    code: "            }",
    type: "default",
  },
  {
    lineNum: 30,
    code: "        }",
    type: "default",
  },
  {
    lineNum: 31,
    code: "    }",
    type: "default",
  },
  {
    lineNum: 33,
    code: "    void dfs2(ll u, ll p, ll h, vector<vector<ll>>& adj){",
    type: "keyword",
    explanation: "The second DFS flattens the tree into a 1D array. It takes node 'u', parent 'p', and chain head 'h'.",
  },
  {
    lineNum: 34,
    code: "        head[u] = h;",
    type: "default",
    explanation: "Record the head of the heavy chain that 'u' belongs to.",
  },
  {
    lineNum: 35,
    code: "        pos[u] = timer++;",
    type: "highlight",
    explanation: "Assign the current 1D position to 'u' and increment the timer. This guarantees contiguous segments.",
  },
  {
    lineNum: 36,
    code: "        if(heavy[u] != -1) dfs2(heavy[u], u, h, adj);",
    type: "highlight",
    explanation: "CRUCIAL: Visit the heavy child FIRST. We pass the SAME chain head 'h'. This is why nodes in the same chain get contiguous 1D positions.",
  },
  {
    lineNum: 37,
    code: "        for(auto v : adj[u]){",
    type: "keyword",
  },
  {
    lineNum: 38,
    code: "            if(v == p || v == heavy[u]) continue;",
    type: "keyword",
    explanation: "Skip the parent and the heavy child (which we already visited).",
  },
  {
    lineNum: 39,
    code: "            dfs2(v, u, v, adj);",
    type: "default",
    explanation: "Visit all light children. Note that we pass 'v' as the new chain head, because a light child ALWAYS starts a new heavy chain.",
  },
  {
    lineNum: 40,
    code: "        }",
    type: "default",
  },
  {
    lineNum: 41,
    code: "    }",
    type: "default",
  },
  {
    lineNum: 43,
    code: "    void updatepath(ll u, ll v, ll val){",
    type: "keyword",
    explanation: "Updates all nodes (or edges) on the path from u to v. Works identically to path queries by jumping chains.",
  },
  {
    lineNum: 44,
    code: "        while(head[u] != head[v]){",
    type: "keyword",
    explanation: "While u and v are on different chains, we must jump the node that is lower in the tree up to the next chain.",
  },
  {
    lineNum: 45,
    code: "            if(depth[head[u]] < depth[head[v]]) swap(u, v);",
    type: "highlight",
    explanation: "Ensure 'u' is the node whose chain head is deeper. We ALWAYS jump the deeper chain to avoid skipping over the LCA.",
  },
  {
    lineNum: 46,
    code: "            st.updateadd(1, 0, n-1, pos[head[u]], pos[u], val);",
    type: "default",
    explanation: "Update the segment tree for the part of the chain from the head to 'u'. Note: the Segment Tree is expected to support range updates here.",
  },
  {
    lineNum: 47,
    code: "            u = parent[head[u]];",
    type: "highlight",
    explanation: "Jump 'u' up to the parent of its chain head. This moves 'u' to a new chain.",
  },
  {
    lineNum: 48,
    code: "        }",
    type: "default",
  },
  {
    lineNum: 49,
    code: "        if(depth[u] > depth[v]) swap(u, v);",
    type: "default",
    explanation: "Now u and v are on the SAME chain. Swap them so 'u' is the higher node (lower depth).",
  },
  {
    lineNum: 51,
    code: "        // Edge update note: if updating edges, use pos[u]+1 below",
    type: "comment",
    explanation: "Crucial trick for edges: map each edge to its deeper node. Thus, the highest node in the path (u) is NOT included in the range.",
  },
  {
    lineNum: 52,
    code: "        st.updateadd(1, 0, n-1, pos[u], pos[v], val);",
    type: "default",
    explanation: "Update the final segment between u and v.",
  },
  {
    lineNum: 53,
    code: "    }",
    type: "default",
  },
  {
    lineNum: 55,
    code: "    ll querypath(ll u, ll v){",
    type: "keyword",
    explanation: "Queries an aggregate (sum, max, etc) on the path from u to v. Follows the exact same logic as updatepath.",
  },
  {
    lineNum: 56,
    code: "        ll res = 0;",
    type: "default",
  },
  {
    lineNum: 57,
    code: "        while(head[u] != head[v]){",
    type: "keyword",
  },
  {
    lineNum: 58,
    code: "            if(depth[head[u]] < depth[head[v]]) swap(u, v);",
    type: "default",
  },
  {
    lineNum: 59,
    code: "            res += st.query(1, 0, n-1, pos[head[u]], pos[u]);",
    type: "highlight",
    explanation: "Accumulate the answer for the partial chain from head to 'u'.",
  },
  {
    lineNum: 60,
    code: "            u = parent[head[u]];",
    type: "default",
  },
  {
    lineNum: 61,
    code: "        }",
    type: "default",
  },
  {
    lineNum: 62,
    code: "        if(depth[u] > depth[v]) swap(u, v);",
    type: "default",
  },
  {
    lineNum: 64,
    code: "        // Edge query note: if querying edges, use pos[u]+1 below",
    type: "comment",
    explanation: "Same logic as edge updates — skip the LCA since it represents the edge *above* it.",
  },
  {
    lineNum: 65,
    code: "        res += st.query(1, 0, n-1, pos[u], pos[v]);",
    type: "default",
    explanation: "Accumulate the final segment and return.",
  },
  {
    lineNum: 66,
    code: "        return res;",
    type: "keyword",
  },
  {
    lineNum: 67,
    code: "    }",
    type: "default",
  },
  {
    lineNum: 68,
    code: "};",
    type: "default",
  },
];

export const PART5_TEMPLATE: ProblemGroup = {
  partLabel: "Part 5: Complete Template",
  lessons: [
    {
      id: "hld-l5-template",
      title: "17. HLD Complete Template Walkthrough",
      content: {
        type: "conceptual",
        data: {
          narrations: [
            "We have covered everything from tree metrics to dynamic path updates. To wrap up, here is a complete, modular C++ implementation of Heavy-Light Decomposition wrapped in a clean struct.",
            "Click on any line of the code below to see a detailed explanation of what that specific line does. This template is designed to be easily copy-pasted and adapted for your competitions.",
          ],
          takeaway: "Encapsulating HLD logic inside a struct and decoupling it from the Segment Tree ensures your code remains clean, modular, and easy to debug.",
        },
      },
    },
  ],
};
