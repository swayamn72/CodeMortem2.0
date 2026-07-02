// Package hld registers all learning-path challenges for the HLD course.
package hld

import "codemortem/internal/challenges"

func init() {
	registerTreeMetrics()
	registerChainFormation()
}

// Standard whitespace-insensitive token checker.
const tokenCheckerPy = `
import sys

sections = sys.stdin.read().split("---SECTION---\n")
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

const treeMetricsGeneratorPy = `
import sys, random

def generate_random_tree(n):
    edges = []
    for i in range(2, n + 1):
        parent = random.randint(1, i - 1)
        edges.append((parent, i))
    return edges

def generate_line_graph(n):
    edges = []
    for i in range(1, n):
        edges.append((i, i + 1))
    return edges

def generate_star_graph(n):
    edges = []
    for i in range(2, n + 1):
        edges.append((1, i))
    return edges

def main():
    seed = int(sys.argv[1])
    random.seed(seed)
    
    if seed < 3:
        graph_type, n = "random", 10
    elif seed == 3:
        graph_type, n = "line", 5
    elif seed == 4:
        graph_type, n = "star", 8
    elif seed < 10:
        graph_type, n = "random", 1000
    elif seed < 15:
        graph_type, n = "random", 100000
    elif seed < 18:
        graph_type, n = "line", 100000
    else:
        graph_type, n = "star", 100000

    if graph_type == "random":
        edges = generate_random_tree(n)
    elif graph_type == "line":
        edges = generate_line_graph(n)
    elif graph_type == "star":
        edges = generate_star_graph(n)

    random.shuffle(edges)
    final_edges = []
    for u, v in edges:
        if random.choice([True, False]):
            final_edges.append((u, v))
        else:
            final_edges.append((v, u))

    print(n)
    for u, v in final_edges:
        print(f"{u} {v}")

if __name__ == "__main__":
    main()
`

const treeMetricsRef = `
#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];
int depth[MAXN];
int parentNode[MAXN];
int subtreeSize[MAXN];
int heavyChild[MAXN];

void dfs(int u, int p, int d) {
    depth[u] = d;
    parentNode[u] = p;
    subtreeSize[u] = 1;
    
    int maxSubSize = 0;
    int bestHeavy = -1;

    for (int v : adj[u]) {
        if (v != p) {
            dfs(v, u, d + 1);
            subtreeSize[u] += subtreeSize[v];

            if (subtreeSize[v] > maxSubSize) {
                maxSubSize = subtreeSize[v];
                bestHeavy = v;
            } else if (subtreeSize[v] == maxSubSize) {
                if (bestHeavy == -1 || v < bestHeavy) {
                    bestHeavy = v;
                }
            }
        }
    }
    heavyChild[u] = bestHeavy;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    for (int i = 0; i < n - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    dfs(1, 0, 0);

    for (int i = 1; i <= n; ++i) {
        cout << depth[i] << " " << parentNode[i] << " " 
             << subtreeSize[i] << " " << heavyChild[i] << "\n";
    }

    return 0;
} 
`

func registerTreeMetrics() {
	challenges.Register(&challenges.Challenge{
		ID:         "hld_tree_metrics",
		Name:       "Code: Tree Metrics",
		CourseSlug: "hld",

		GeneratorPy:  treeMetricsGeneratorPy,
		ReferenceCpp: treeMetricsRef,
		CheckerPy:    tokenCheckerPy,

		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  262144, // 256MB
	})
}

const chainFormationRef = `
#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 100005;
vector<int> adj[MAXN];

int depth[MAXN], parent_node[MAXN], sz[MAXN], heavy_child[MAXN];
int head[MAXN], pos[MAXN];
int current_pos = 0;

void dfs_sz(int u, int p, int d) {
    sz[u] = 1;
    parent_node[u] = p;
    depth[u] = d;
    heavy_child[u] = -1;

    int max_sub = 0;
    for (int v : adj[u]) {
        if (v != p) {
            dfs_sz(v, u, d + 1);
            sz[u] += sz[v];
            if (sz[v] > max_sub) {
                max_sub = sz[v];
                heavy_child[u] = v;
            } else if (sz[v] == max_sub) {
                if (heavy_child[u] == -1 || v < heavy_child[u]) {
                    heavy_child[u] = v;
                }
            }
        }
    }
}

void dfs_hld(int u, int p, int current_head) {
    head[u] = current_head;
    pos[u] = current_pos++;

    if (heavy_child[u] != -1) {
        dfs_hld(heavy_child[u], u, current_head);
    }

    for (int v : adj[u]) {
        if (v != p && v != heavy_child[u]) {
            dfs_hld(v, u, v);
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    dfs_sz(1, 0, 0);
    dfs_hld(1, 0, 1);

    for (int i = 1; i <= n; i++) {
        cout << pos[i] << " " << head[i] << "\n";
    }

    return 0;
}
`

func registerChainFormation() {
	challenges.Register(&challenges.Challenge{
		ID:         "hld_chain_formation",
		Name:       "Code: Chain Formation",
		CourseSlug: "hld",

		GeneratorPy:  treeMetricsGeneratorPy,
		ReferenceCpp: chainFormationRef,
		CheckerPy:    tokenCheckerPy,

		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  262144, // 256MB
	})
}

