// Package segment_tree registers all learning-path challenges for the
// Segment Tree course. Import this package (blank import or named) in main.go
// to activate all challenges.
//
// Test breakdown for each challenge (20 tests):
//   Tests 0-4:   Small   (N ≤ 10,    Q ≤ 10)    — basic correctness
//   Tests 5-14:  Medium  (N ≤ 1000,  Q ≤ 1000)  — logic & edge cases
//   Tests 15-19: Large   (N = 100k,  Q = 100k)   — performance / TLE detection
//
// Time limit is 1000ms. An O(N log N) segment tree on N=Q=100k runs in ~50ms.
// An O(N²) brute force on the large tier (~10s) will reliably receive TLE.
package segment_tree

import "codemortem/internal/challenges"

func init() {
	registerSumSegmentTree()
	registerMaxSegmentTree()
	registerMinSegmentTree()
	registerEscapeRoute()
}

// ── Shared generator (sum/max/min challenges, 0-indexed) ─────────────────────
const sharedGeneratorTemplate = `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

# test-size tiers (20 tests: 0-4 small, 5-14 medium, 15-19 large)
if seed < 5:
    n = rng.randint(2, 10)
    q = rng.randint(1, 10)
    lo, hi = -100, 100
elif seed < 15:
    n = rng.randint(100, 1000)
    q = rng.randint(100, 1000)
    lo, hi = -10**6, 10**6
else:
    n = 100000
    q = 100000
    lo, hi = -10**9, 10**9

a = [rng.randint(lo, hi) for _ in range(n)]
print(n, q)
print(*a)
for _ in range(q):
    t = rng.randint(1, 2)
    if t == 1:
        idx = rng.randint(0, n - 1)
        val = rng.randint(lo, hi)
        print(1, idx, val)
    else:
        l = rng.randint(0, n - 1)
        r = rng.randint(l, n - 1)
        print(2, l, r)
`

// Standard whitespace-insensitive token checker (fits sum/max/min).
const tokenCheckerPy = `
import sys

sections = sys.stdin.read().split("---SECTION---\n")
# sections[0] = input, sections[1] = expected, sections[2] = actual
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

// ── Sum Segment Tree ──────────────────────────────────────────────────────────

func registerSumSegmentTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "sum_segment_tree",
		Name:       "Range Sum Query",
		CourseSlug: "segment-tree",

		GeneratorPy: sharedGeneratorTemplate,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
struct ST {
    int n; vector<long long> t;
    ST(int n): n(n), t(4*n,0){}
    void build(vector<long long>&a,int v,int s,int e){
        if(s==e){t[v]=a[s];return;}
        int m=(s+e)/2;
        build(a,2*v,s,m); build(a,2*v+1,m+1,e);
        t[v]=t[2*v]+t[2*v+1];
    }
    void upd(int v,int s,int e,int i,long long x){
        if(s==e){t[v]=x;return;}
        int m=(s+e)/2;
        if(i<=m)upd(2*v,s,m,i,x);
        else upd(2*v+1,m+1,e,i,x);
        t[v]=t[2*v]+t[2*v+1];
    }
    long long qry(int v,int s,int e,int l,int r){
        if(r<s||e<l)return 0;
        if(l<=s&&e<=r)return t[v];
        int m=(s+e)/2;
        return qry(2*v,s,m,l,r)+qry(2*v+1,m+1,e,l,r);
    }
};
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n,q; cin>>n>>q;
    vector<long long>a(n); for(auto&x:a)cin>>x;
    ST st(n); st.build(a,1,0,n-1);
    while(q--){
        int t; cin>>t;
        if(t==1){int i;long long v;cin>>i>>v;st.upd(1,0,n-1,i,v);}
        else{int l,r;cin>>l>>r;cout<<st.qry(1,0,n-1,l,r)<<"\n";}
    }
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  262144,
	})
}

// ── Max Segment Tree ──────────────────────────────────────────────────────────

func registerMaxSegmentTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "max_segment_tree",
		Name:       "Range Maximum Query",
		CourseSlug: "segment-tree",

		GeneratorPy: sharedGeneratorTemplate,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
struct ST {
    int n; vector<long long> t;
    ST(int n): n(n), t(4*n, LLONG_MIN){}
    void build(vector<long long>&a,int v,int s,int e){
        if(s==e){t[v]=a[s];return;}
        int m=(s+e)/2;
        build(a,2*v,s,m); build(a,2*v+1,m+1,e);
        t[v]=max(t[2*v],t[2*v+1]);
    }
    void upd(int v,int s,int e,int i,long long x){
        if(s==e){t[v]=x;return;}
        int m=(s+e)/2;
        if(i<=m)upd(2*v,s,m,i,x);
        else upd(2*v+1,m+1,e,i,x);
        t[v]=max(t[2*v],t[2*v+1]);
    }
    long long qry(int v,int s,int e,int l,int r){
        if(r<s||e<l)return LLONG_MIN;
        if(l<=s&&e<=r)return t[v];
        int m=(s+e)/2;
        return max(qry(2*v,s,m,l,r),qry(2*v+1,m+1,e,l,r));
    }
};
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n,q; cin>>n>>q;
    vector<long long>a(n); for(auto&x:a)cin>>x;
    ST st(n); st.build(a,1,0,n-1);
    while(q--){
        int t; cin>>t;
        if(t==1){int i;long long v;cin>>i>>v;st.upd(1,0,n-1,i,v);}
        else{int l,r;cin>>l>>r;cout<<st.qry(1,0,n-1,l,r)<<"\n";}
    }
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  262144,
	})
}

// ── Min Segment Tree ──────────────────────────────────────────────────────────

func registerMinSegmentTree() {
	challenges.Register(&challenges.Challenge{
		ID:         "min_segment_tree",
		Name:       "Range Minimum Query",
		CourseSlug: "segment-tree",

		GeneratorPy: sharedGeneratorTemplate,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
struct ST {
    int n; vector<long long> t;
    ST(int n): n(n), t(4*n, LLONG_MAX){}
    void build(vector<long long>&a,int v,int s,int e){
        if(s==e){t[v]=a[s];return;}
        int m=(s+e)/2;
        build(a,2*v,s,m); build(a,2*v+1,m+1,e);
        t[v]=min(t[2*v],t[2*v+1]);
    }
    void upd(int v,int s,int e,int i,long long x){
        if(s==e){t[v]=x;return;}
        int m=(s+e)/2;
        if(i<=m)upd(2*v,s,m,i,x);
        else upd(2*v+1,m+1,e,i,x);
        t[v]=min(t[2*v],t[2*v+1]);
    }
    long long qry(int v,int s,int e,int l,int r){
        if(r<s||e<l)return LLONG_MAX;
        if(l<=s&&e<=r)return t[v];
        int m=(s+e)/2;
        return min(qry(2*v,s,m,l,r),qry(2*v+1,m+1,e,l,r));
    }
};
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n,q; cin>>n>>q;
    vector<long long>a(n); for(auto&x:a)cin>>x;
    ST st(n); st.build(a,1,0,n-1);
    while(q--){
        int t; cin>>t;
        if(t==1){int i;long long v;cin>>i>>v;st.upd(1,0,n-1,i,v);}
        else{int l,r;cin>>l>>r;cout<<st.qry(1,0,n-1,l,r)<<"\n";}
    }
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  262144,
	})
}

// ── Escape Route (1000 - max(discount[l..r])) ─────────────────────────────────
// Input format:  N Q on first line, then N discounts (0-999), then Q queries.
// Query types (1-indexed):
//   1 i v  → update discount of city i to v
//   2 l r  → print 1000 - max(discount[l..r])

func registerEscapeRoute() {
	challenges.Register(&challenges.Challenge{
		ID:         "escape_route",
		Name:       "Cheapest Escape Route",
		CourseSlug: "segment-tree",

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

# test-size tiers (20 tests: 0-4 small, 5-14 medium, 15-19 large)
if seed < 5:
    n = rng.randint(1, 10)
    q = rng.randint(1, 10)
elif seed < 15:
    n = rng.randint(100, 1000)
    q = rng.randint(100, 1000)
else:
    n = 100000
    q = 100000

discounts = [rng.randint(0, 999) for _ in range(n)]
print(n, q)
print(*discounts)
for _ in range(q):
    t = rng.randint(1, 2)
    if t == 1:
        i = rng.randint(1, n)
        v = rng.randint(0, 999)
        print(1, i, v)
    else:
        l = rng.randint(1, n)
        r = rng.randint(l, n)
        print(2, l, r)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
struct ST {
    int n; vector<int> t;
    ST(int n): n(n), t(4*n,0){}
    void build(vector<int>&a,int v,int s,int e){
        if(s==e){t[v]=a[s-1];return;}
        int m=(s+e)/2;
        build(a,2*v,s,m); build(a,2*v+1,m+1,e);
        t[v]=max(t[2*v],t[2*v+1]);
    }
    void upd(int v,int s,int e,int i,int x){
        if(s==e){t[v]=x;return;}
        int m=(s+e)/2;
        if(i<=m)upd(2*v,s,m,i,x);
        else upd(2*v+1,m+1,e,i,x);
        t[v]=max(t[2*v],t[2*v+1]);
    }
    int qry(int v,int s,int e,int l,int r){
        if(r<s||e<l)return 0;
        if(l<=s&&e<=r)return t[v];
        int m=(s+e)/2;
        return max(qry(2*v,s,m,l,r),qry(2*v+1,m+1,e,l,r));
    }
};
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n,q; cin>>n>>q;
    vector<int>a(n); for(auto&x:a)cin>>x;
    ST st(n); st.build(a,1,1,n);
    while(q--){
        int t; cin>>t;
        if(t==1){int i,v;cin>>i>>v;st.upd(1,1,n,i,v);}
        else{int l,r;cin>>l>>r;cout<<1000-st.qry(1,1,n,l,r)<<"\n";}
    }
}
`,

		CheckerPy:   tokenCheckerPy,
		NumTests:    20,
		TimeLimitMs: 1000,
		MemLimitKB:  262144,
	})
}
