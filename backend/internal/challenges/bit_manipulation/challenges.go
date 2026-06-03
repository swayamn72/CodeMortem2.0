// Package bit_manipulation registers all learning-path challenges for the
// Bit Manipulation Easy course. Import this package (blank import) in main.go
// to activate all challenges.
//
// Test breakdown for each challenge (20 tests):
//   Tests 0-4:   Small  — basic correctness
//   Tests 5-14:  Medium — logic & edge cases
//   Tests 15-19: Large  — performance / TLE detection (where applicable)
//
// Time limit is 2000ms for all challenges except max_xor_pair (3000ms).
package bit_manipulation

import "codemortem/internal/challenges"

func init() {
	registerOddEven()
	registerPowerOfTwo()
	registerFlipBitsRange()
	registerSingleNumber()
	registerMaxXorPair()
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

// ── Challenge 1: Odd or Even ──────────────────────────────────────────────────

func registerOddEven() {
	challenges.Register(&challenges.Challenge{
		ID:         "odd_even",
		Name:       "Odd or Even",
		CourseSlug: "bit-manipulation",
		NumTests:   20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(-100, 100)
elif seed < 15:
    n = rng.randint(-10**6, 10**6)
else:
    n = rng.randint(-10**9, 10**9)

print(n)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
int main(){
    long long n; cin >> n;
    // Use bitwise AND — no modulo or division
    if((n & 1) == 1) cout << "odd\n";
    else             cout << "even\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 2: Power of Two ─────────────────────────────────────────────────

func registerPowerOfTwo() {
	challenges.Register(&challenges.Challenge{
		ID:         "power_of_two",
		Name:       "Power of Two",
		CourseSlug: "bit-manipulation",
		NumTests:   20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

# Mix of powers of 2, edge cases, and random numbers
special = [0, 1, 2, 4, 8, 16, 32, 64, 128, 1073741824]
if seed < 5:
    n = rng.choice(special)
elif seed < 10:
    # Definitely a power of two
    exp = rng.randint(0, 30)
    n = 1 << exp
elif seed < 15:
    # Definitely NOT a power of two
    n = rng.randint(3, 10**6)
    # Remove if happens to be power of 2
    while n > 0 and (n & (n - 1)) == 0:
        n = rng.randint(3, 10**6)
else:
    n = rng.randint(0, 10**9)

print(n)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
int main(){
    long long n; cin >> n;
    if(n > 0 && (n & (n - 1)) == 0) cout << "yes\n";
    else                              cout << "no\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 3: Flip Bits in a Range ────────────────────────────────────────

func registerFlipBitsRange() {
	challenges.Register(&challenges.Challenge{
		ID:         "flip_bits_range",
		Name:       "Flip Bits in a Range",
		CourseSlug: "bit-manipulation",
		NumTests:   20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(0, 255)
    l = rng.randint(0, 6)
    r = rng.randint(l, 7)
elif seed < 15:
    n = rng.randint(0, 10**6)
    l = rng.randint(0, 20)
    r = rng.randint(l, 20)
else:
    n = rng.randint(0, 10**9)
    l = rng.randint(0, 28)
    r = rng.randint(l, 30)

print(n, l, r)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
int main(){
    long long n, l, r;
    cin >> n >> l >> r;
    long long mask = ((1LL << (r - l + 1)) - 1) << l;
    cout << (n ^ mask) << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 4: Single Number ────────────────────────────────────────────────

func registerSingleNumber() {
	challenges.Register(&challenges.Challenge{
		ID:         "single_number",
		Name:       "Single Number",
		CourseSlug: "bit-manipulation",
		NumTests:   20,
		TimeLimitMs: 2000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    k = rng.randint(1, 5)   # k pairs + 1 unique
    vals = rng.randint(1, 100)
elif seed < 15:
    k = rng.randint(100, 1000)
    vals = rng.randint(1, 10**6)
else:
    k = rng.randint(40000, 50000)
    vals = rng.randint(1, 10**9)

unique = rng.randint(1, 10**9)
arr = []
pool = list(range(1, vals + 1))
rng.shuffle(pool)
pairs = pool[:k]
for p in pairs:
    arr.append(p)
    arr.append(p)
arr.append(unique)
# Ensure unique is not in pairs
while unique in pairs:
    unique = rng.randint(1, 10**9)
# Rebuild with correct unique
arr[-1] = unique
rng.shuffle(arr)

n = len(arr)
print(n)
print(*arr)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n; cin >> n;
    long long xorSum = 0;
    for(int i = 0; i < n; i++){
        long long x; cin >> x;
        xorSum ^= x;
    }
    cout << xorSum << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 5: Maximum XOR Pair ────────────────────────────────────────────

func registerMaxXorPair() {
	challenges.Register(&challenges.Challenge{
		ID:         "max_xor_pair",
		Name:       "Maximum XOR Pair",
		CourseSlug: "bit-manipulation",
		NumTests:   20,
		TimeLimitMs: 3000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    n = rng.randint(2, 10)
    vals = [rng.randint(0, 15) for _ in range(n)]
elif seed < 15:
    n = rng.randint(100, 1000)
    vals = [rng.randint(0, 2**31 - 1) for _ in range(n)]
else:
    n = rng.randint(50000, 100000)
    vals = [rng.randint(0, 2**31 - 1) for _ in range(n)]

print(n)
print(*vals)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    vector<long long> a(n);
    for(auto& x : a) cin >> x;

    long long ans = 0;
    for(int bit = 30; bit >= 0; bit--){
        long long candidate = ans | (1LL << bit);
        long long mask = (1LL << (bit + 1)) - 1;
        set<long long> prefixes;
        for(long long x : a) prefixes.insert(x & mask);
        bool found = false;
        for(long long p : prefixes){
            if(prefixes.count(p ^ candidate)){
                found = true;
                break;
            }
        }
        if(found) ans = candidate;
    }
    cout << ans << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}
