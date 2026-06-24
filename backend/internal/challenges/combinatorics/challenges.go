// Package combinatorics registers all learning-path challenges for the
// Combinatorics Beginner course. Import this package (blank import) in main.go
// to activate all challenges.
//
// Test breakdown for each challenge (20 tests):
//   Tests 0-4:   Small  — basic correctness, sample-case equivalents
//   Tests 5-14:  Medium — edge cases, moderate constraints
//   Tests 15-19: Large  — N/Q up to constraint max, TLE detection
//
// MOD = 10^9 + 7 throughout.
package combinatorics

import "codemortem/internal/challenges"

const MOD = 1_000_000_007

func init() {
	registerSafeProduct()
	registerFastPower()
	registerModDivision()
	registerTaskLineup()
	registerTeamSmall()
	registerPrefixFactorials()
	registerInverseArray()
	registerMassiveQueries()
	registerRobotGrid()
	registerCandyDist()
	registerDnaSequences()
	registerSubarrayDiv()
	registerCoprimeCount()
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

// ── Challenge 1: Safe Product ─────────────────────────────────────────────────

func registerSafeProduct() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_safe_product",
		Name:        "Safe Product",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)
MOD = 10**9 + 7

if seed < 5:
    n = rng.randint(1, 10)
    vals = [rng.randint(1, 100) for _ in range(n)]
elif seed < 15:
    n = rng.randint(100, 1000)
    vals = [rng.randint(1, 10**9) for _ in range(n)]
else:
    n = rng.randint(80000, 100000)
    vals = [rng.randint(1, 10**9) for _ in range(n)]

print(n)
print(*vals)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1e9 + 7;
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    long long prod = 1;
    for(int i = 0; i < n; i++){
        long long x; cin >> x;
        prod = (prod * (x % MOD)) % MOD;
    }
    cout << prod << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 2: Fast Power ───────────────────────────────────────────────────

func registerFastPower() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_fast_power",
		Name:        "Fast Power",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    t = rng.randint(1, 5)
    cases = [(rng.randint(0, 100), rng.randint(0, 20), rng.randint(2, 100)) for _ in range(t)]
elif seed < 15:
    t = rng.randint(50, 1000)
    cases = [(rng.randint(0, 10**9), rng.randint(0, 10**18), rng.randint(2, 10**9)) for _ in range(t)]
else:
    t = rng.randint(80000, 100000)
    cases = [(rng.randint(0, 10**9), rng.randint(0, 10**18), rng.randint(2, 10**9)) for _ in range(t)]

print(t)
for x, y, p in cases:
    print(x, y, p)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef __int128 lll;

ll power(ll base, ll exp, ll mod){
    ll result = 1;
    base %= mod;
    while(exp > 0){
        if(exp & 1) result = (lll)result * base % mod;
        base = (lll)base * base % mod;
        exp >>= 1;
    }
    return result;
}

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int t; cin >> t;
    while(t--){
        ll x, y, p; cin >> x >> y >> p;
        cout << power(x, y, p) << "\n";
    }
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 3: Modulo Division ──────────────────────────────────────────────

func registerModDivision() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_mod_division",
		Name:        "Modulo Division",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)
MOD = 10**9 + 7

# Generate B that is coprime with MOD (MOD is prime, so B != 0 mod MOD)
def rand_B(rng):
    while True:
        b = rng.randint(1, MOD - 1)
        return b

if seed < 5:
    q = rng.randint(1, 5)
    cases = [(rng.randint(1, 100) * rand_B(rng) % MOD, rand_B(rng)) for _ in range(q)]
elif seed < 15:
    q = rng.randint(100, 5000)
    cases = [(rng.randint(1, 10**9), rand_B(rng)) for _ in range(q)]
else:
    q = rng.randint(80000, 100000)
    cases = [(rng.randint(1, 10**9), rand_B(rng)) for _ in range(q)]

print(q)
for a, b in cases:
    print(a, b)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;

ll power(ll base, ll exp, ll mod){
    ll result = 1; base %= mod;
    while(exp > 0){
        if(exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

ll modinv(ll b){ return power(b, MOD - 2, MOD); }

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int q; cin >> q;
    while(q--){
        ll a, b; cin >> a >> b;
        cout << (a % MOD) * modinv(b) % MOD << "\n";
    }
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 4: Task Lineup ──────────────────────────────────────────────────

func registerTaskLineup() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_task_lineup",
		Name:        "Task Lineup",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(0, 10)
elif seed < 15:
    n = rng.randint(10, 100000)
else:
    n = rng.randint(500000, 1000000)

print(n)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    ll n; cin >> n;
    ll ans = 1;
    for(ll i = 2; i <= n; i++) ans = ans * i % MOD;
    cout << ans << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 5: Team Formations (Small Constraints) ─────────────────────────

func registerTeamSmall() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_team_small",
		Name:        "Team Formations",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(0, 5)
    k = rng.randint(0, n)
elif seed < 15:
    n = rng.randint(5, 20)
    k = rng.randint(0, n)
else:
    n = 20
    k = rng.randint(0, 20)

print(n, k)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef __int128 lll;

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    ll n, k; cin >> n >> k;
    if(k > n){ cout << 0 << "\n"; return 0; }
    // C(n,k) = n! / (k! * (n-k)!)
    // n <= 20, so direct computation in 64-bit (max ~1.2*10^17 before division is safe)
    lll num = 1, den = 1;
    for(ll i = 0; i < k; i++){
        num *= (n - i);
        den *= (i + 1);
    }
    cout << (ll)(num / den) << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 6: Prefix Factorials ───────────────────────────────────────────

func registerPrefixFactorials() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_prefix_factorials",
		Name:        "Prefix Factorials",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

MAXN = 1000000

if seed < 5:
    q = rng.randint(1, 10)
    queries = [rng.randint(0, 20) for _ in range(q)]
elif seed < 15:
    q = rng.randint(1000, 10000)
    queries = [rng.randint(0, MAXN) for _ in range(q)]
else:
    q = rng.randint(80000, 100000)
    queries = [rng.randint(0, MAXN) for _ in range(q)]

print(q)
for x in queries:
    print(x)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;
const int MAXN = 1000001;

ll fact[MAXN];

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    fact[0] = 1;
    for(int i = 1; i < MAXN; i++) fact[i] = fact[i-1] * i % MOD;

    int q; cin >> q;
    while(q--){
        int x; cin >> x;
        cout << fact[x] << "\n";
    }
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 7: The Inverse Array ───────────────────────────────────────────

func registerInverseArray() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_inverse_array",
		Name:        "The Inverse Array",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 3000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(1, 10)
elif seed < 15:
    n = rng.randint(100, 10000)
else:
    n = rng.randint(500000, 1000000)

# Ask for q random invFact queries within [0, n]
q = min(n, 20)
queries = sorted(rng.sample(range(0, n+1), q))

print(n, q)
for x in queries:
    print(x)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;
const int MAXN = 1000001;

ll fact[MAXN], inv_fact[MAXN];

ll power(ll base, ll exp, ll mod){
    ll result = 1; base %= mod;
    while(exp > 0){
        if(exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    fact[0] = 1;
    for(int i = 1; i < MAXN; i++) fact[i] = fact[i-1] * i % MOD;
    inv_fact[MAXN-1] = power(fact[MAXN-1], MOD-2, MOD);
    for(int i = MAXN-2; i >= 0; i--) inv_fact[i] = inv_fact[i+1] * (i+1) % MOD;

    int n, q; cin >> n >> q;
    while(q--){
        int x; cin >> x;
        cout << inv_fact[x] << "\n";
    }
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 8: Massive Queries ──────────────────────────────────────────────

func registerMassiveQueries() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_massive_queries",
		Name:        "Massive Queries",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 3000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    q = rng.randint(1, 10)
    cases = [(rng.randint(0, 20), rng.randint(0, 20)) for _ in range(q)]
    cases = [(n, k if k <= n else n) for n, k in cases]
elif seed < 15:
    q = rng.randint(1000, 10000)
    cases = []
    for _ in range(q):
        n = rng.randint(0, 1000000)
        k = rng.randint(0, n)
        cases.append((n, k))
else:
    q = rng.randint(80000, 100000)
    cases = []
    for _ in range(q):
        n = rng.randint(0, 1000000)
        k = rng.randint(0, n)
        cases.append((n, k))

print(q)
for n, k in cases:
    print(n, k)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;
const int MAXN = 1000001;

ll fact[MAXN], inv_fact[MAXN];

ll power(ll b, ll e, ll m){ ll r=1; b%=m; while(e>0){if(e&1)r=r*b%m; b=b*b%m; e>>=1;} return r; }

void precompute(){
    fact[0]=1;
    for(int i=1;i<MAXN;i++) fact[i]=fact[i-1]*i%MOD;
    inv_fact[MAXN-1]=power(fact[MAXN-1],MOD-2,MOD);
    for(int i=MAXN-2;i>=0;i--) inv_fact[i]=inv_fact[i+1]*(i+1)%MOD;
}

ll nCr(int n, int k){
    if(k<0||k>n) return 0;
    return fact[n]*inv_fact[k]%MOD*inv_fact[n-k]%MOD;
}

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    precompute();
    int q; cin >> q;
    while(q--){
        int n, k; cin >> n >> k;
        cout << nCr(n, k) << "\n";
    }
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 9: Robot Grid Navigation ───────────────────────────────────────

func registerRobotGrid() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_robot_grid",
		Name:        "Robot Grid Navigation",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 3000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    x = rng.randint(0, 10)
    y = rng.randint(0, 10)
elif seed < 15:
    x = rng.randint(0, 100000)
    y = rng.randint(0, 100000)
else:
    x = rng.randint(80000, 100000)
    y = rng.randint(80000, 100000)

print(x, y)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;
const int MAXN = 200002;

ll fact[MAXN], inv_fact[MAXN];

ll power(ll b, ll e, ll m){ ll r=1; b%=m; while(e>0){if(e&1)r=r*b%m; b=b*b%m; e>>=1;} return r; }

void precompute(){
    fact[0]=1;
    for(int i=1;i<MAXN;i++) fact[i]=fact[i-1]*i%MOD;
    inv_fact[MAXN-1]=power(fact[MAXN-1],MOD-2,MOD);
    for(int i=MAXN-2;i>=0;i--) inv_fact[i]=inv_fact[i+1]*(i+1)%MOD;
}

ll nCr(int n, int k){
    if(k<0||k>n) return 0;
    return fact[n]*inv_fact[k]%MOD*inv_fact[n-k]%MOD;
}

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    precompute();
    ll x, y; cin >> x >> y;
    cout << nCr(x + y, x) << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 10: Candy Distribution ─────────────────────────────────────────

func registerCandyDist() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_candy_dist",
		Name:        "Candy Distribution",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 3000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(0, 10)
    k = rng.randint(1, 10)
elif seed < 15:
    n = rng.randint(0, 50000)
    k = rng.randint(1, 50000)
else:
    n = rng.randint(80000, 100000)
    k = rng.randint(80000, 100000)

print(n, k)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;
const int MAXN = 200002;

ll fact[MAXN], inv_fact[MAXN];

ll power(ll b, ll e, ll m){ ll r=1; b%=m; while(e>0){if(e&1)r=r*b%m; b=b*b%m; e>>=1;} return r; }

void precompute(){
    fact[0]=1;
    for(int i=1;i<MAXN;i++) fact[i]=fact[i-1]*i%MOD;
    inv_fact[MAXN-1]=power(fact[MAXN-1],MOD-2,MOD);
    for(int i=MAXN-2;i>=0;i--) inv_fact[i]=inv_fact[i+1]*(i+1)%MOD;
}

// Stars and bars: C(n + k - 1, k - 1)
ll nCr(ll n, ll k){
    if(k<0||k>n) return 0;
    return fact[n]*inv_fact[k]%MOD*inv_fact[n-k]%MOD;
}

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    precompute();
    ll n, k; cin >> n >> k;
    cout << nCr(n + k - 1, k - 1) << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 11: DNA Sequences ───────────────────────────────────────────────

func registerDnaSequences() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_dna_sequences",
		Name:        "DNA Sequences",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 3000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

bases = "ACGT"

if seed < 5:
    n = rng.randint(1, 10)
elif seed < 15:
    n = rng.randint(10, 10000)
else:
    n = rng.randint(100000, 200000)

s = "".join(rng.choices(bases, k=n))
print(s)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;
const int MAXN = 200002;

ll fact[MAXN], inv_fact[MAXN];

ll power(ll b, ll e, ll m){ ll r=1; b%=m; while(e>0){if(e&1)r=r*b%m; b=b*b%m; e>>=1;} return r; }

void precompute(){
    fact[0]=1;
    for(int i=1;i<MAXN;i++) fact[i]=fact[i-1]*i%MOD;
    inv_fact[MAXN-1]=power(fact[MAXN-1],MOD-2,MOD);
    for(int i=MAXN-2;i>=0;i--) inv_fact[i]=inv_fact[i+1]*(i+1)%MOD;
}

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    precompute();
    string s; cin >> s;
    int n = s.size();
    map<char,int> freq;
    for(char c : s) freq[c]++;

    ll ans = fact[n];
    for(auto& [c, f] : freq) ans = ans * inv_fact[f] % MOD;
    cout << ans << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 12: Subarray Divisibility ──────────────────────────────────────

func registerSubarrayDiv() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_subarray_div",
		Name:        "Subarray Divisibility",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(1, 10)
    arr = [rng.randint(-100, 100) for _ in range(n)]
elif seed < 15:
    n = rng.randint(100, 5000)
    arr = [rng.randint(-10**9, 10**9) for _ in range(n)]
else:
    n = rng.randint(100000, 200000)
    arr = [rng.randint(-10**9, 10**9) for _ in range(n)]

print(n)
print(*arr)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    vector<ll> a(n);
    for(auto& x : a) cin >> x;

    // Count subarrays whose sum is divisible by n.
    // Use prefix sum mod n. Two indices i < j give sum divisible by n
    // iff prefix[i] == prefix[j] (mod n).
    // The empty prefix (index -1) has prefix sum 0, i.e. value 0 mod n.
    map<ll, ll> cnt;
    cnt[0] = 1;
    ll prefix = 0, ans = 0;
    for(int i = 0; i < n; i++){
        prefix = ((prefix + a[i]) % n + n) % n;
        ans += cnt[prefix];
        cnt[prefix]++;
    }
    cout << ans << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 13: Co-prime Count ─────────────────────────────────────────────

func registerCoprimeCount() {
	challenges.Register(&challenges.Challenge{
		ID:          "comb_coprime_count",
		Name:        "Co-prime Count",
		CourseSlug:  "combinatorics",
		NumTests:    20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    # Small, hand-verifiable
    x = rng.randint(1, 30)
elif seed < 10:
    x = rng.randint(100, 10**6)
elif seed < 15:
    x = rng.randint(10**6, 10**12)
else:
    x = rng.randint(10**15, 10**18)

print(x)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    ll x; cin >> x;

    // Count numbers in [1, x] divisible by 2, 3, or 5
    // using Inclusion-Exclusion:
    // |A u B u C| = |A| + |B| + |C| - |A n B| - |A n C| - |B n C| + |A n B n C|
    ll a   = x / 2;
    ll b   = x / 3;
    ll c   = x / 5;
    ll ab  = x / 6;   // lcm(2,3)
    ll ac  = x / 10;  // lcm(2,5)
    ll bc  = x / 15;  // lcm(3,5)
    ll abc = x / 30;  // lcm(2,3,5)

    cout << a + b + c - ab - ac - bc + abc << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}
