// Package bit_manipulation registers all learning-path challenges for the
// Bit Manipulation Easy course. Import this package (blank import) in main.go
// to activate all challenges.
//
// Test breakdown for each challenge (20 tests):
//   Tests 0-4:   Small  — basic correctness, sample-case equivalents
//   Tests 5-14:  Medium — edge cases, logic stress
//   Tests 15-19: Large  — N up to constraint max, TLE detection
//
// Time limits are tight enough that O(N²) or O(N log N) solutions TLE on
// the large tests while O(N) / O(log N) solutions pass comfortably.
package bit_manipulation

import "codemortem/internal/challenges"

func init() {
	registerOddEven()
	registerPowerOfTwo()
	registerFlipBitsRange()
	registerSingleNumber()
	registerMissingNumber()
	registerSignalCalibration()
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
		ID:          "odd_even",
		Name:        "Odd or Even",
		CourseSlug:  "bit-manipulation",
		NumTests:    20,
		TimeLimitMs: 1000,

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
		ID:          "power_of_two",
		Name:        "Power of Two",
		CourseSlug:  "bit-manipulation",
		NumTests:    20,
		TimeLimitMs: 1000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

special = [0, 1, 2, 4, 8, 16, 32, 64, 128, 1073741824]
if seed < 5:
    n = rng.choice(special)
elif seed < 10:
    exp = rng.randint(0, 30)
    n = 1 << exp
elif seed < 15:
    n = rng.randint(3, 10**6)
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
		ID:          "flip_bits_range",
		Name:        "Flip Bits in a Range",
		CourseSlug:  "bit-manipulation",
		NumTests:    20,
		TimeLimitMs: 1000,

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
// O(N) XOR solution expected. O(N²) brute force (search for non-duplicate by
// comparing each element to all others) will TLE on the large tests (N~100000).

func registerSingleNumber() {
	challenges.Register(&challenges.Challenge{
		ID:          "single_number",
		Name:        "Single Number",
		CourseSlug:  "bit-manipulation",
		NumTests:    20,
		TimeLimitMs: 1000, // tight: O(N²) at N=100000 ≈ 10^10 ops → TLE

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    k = rng.randint(1, 5)
    max_val = 100
elif seed < 15:
    k = rng.randint(100, 5000)
    max_val = 10**6
else:
    # Large: N = 2*k+1 ≈ 100001; O(N²) will TLE at 1000ms
    k = rng.randint(49000, 50000)
    max_val = 10**9

pool = random.sample(range(1, max_val + 1), k + 1)
unique = pool[-1]
pairs  = pool[:-1]
arr = pairs * 2 + [unique]
rng.shuffle(arr)

print(len(arr))
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

// ── Challenge 5: Missing Number ───────────────────────────────────────────────
// O(N) XOR solution expected. O(N²) approaches (nested loop search) TLE on
// the large tests (N up to 100000).

func registerMissingNumber() {
	challenges.Register(&challenges.Challenge{
		ID:          "missing_number",
		Name:        "Missing Number",
		CourseSlug:  "bit-manipulation",
		NumTests:    20,
		TimeLimitMs: 1000, // tight: O(N²) at N=100000 TLEs easily

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    # Small: easy correctness
    n = rng.randint(2, 10)
elif seed < 10:
    # Edge cases: missing = 1, missing = N
    n = rng.randint(10, 200)
elif seed < 15:
    # Medium
    n = rng.randint(200, 5000)
else:
    # Large: N up to 100000 — O(N²) will TLE
    n = rng.randint(80000, 100000)

arr = list(range(1, n + 1))
missing = rng.choice(arr)
arr.remove(missing)
rng.shuffle(arr)

print(n)
print(*arr)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    long long xorAll = 0;
    for(int i = 1; i <= n; i++) xorAll ^= i;
    for(int i = 0; i < n - 1; i++){
        long long x; cin >> x;
        xorAll ^= x;
    }
    cout << xorAll << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}

// ── Challenge 6: Signal Calibration ──────────────────────────────────────────
// O(log S) greedy expected (two passes over 31 bits = 62 ops, effectively O(1)).
// No brute-force approach is meaningful here given the constraints (K ≤ 30,
// S ≤ 10^9), but the time limit is still tight to reject solutions with
// unnecessary O(2^K) enumeration.

func registerSignalCalibration() {
	challenges.Register(&challenges.Challenge{
		ID:          "signal_calibration",
		Name:        "Signal Calibration",
		CourseSlug:  "bit-manipulation",
		NumTests:    20,
		TimeLimitMs: 1000,

		GeneratorPy: `
import sys, random

seed = int(sys.argv[1])
rng = random.Random(seed)

if seed < 5:
    # Small S, edge cases
    pairs = [
        (3, 2),   # exact match
        (12, 1),  # fewer bits
        (1, 2),   # more bits
        (7, 3),   # exact match (all 3 bits)
        (15, 1),  # only one bit allowed
    ]
    S, K = pairs[seed]
elif seed < 10:
    # S with popcount < K (extra bits needed)
    S = rng.randint(1, 1000)
    pop = bin(S).count('1')
    K = rng.randint(pop + 1, min(pop + 10, 30))
elif seed < 15:
    # S with popcount > K (must drop bits)
    S = rng.randint(100, 10**6)
    pop = bin(S).count('1')
    K = rng.randint(1, max(1, pop - 1))
else:
    # Large S, varied K
    S = rng.randint(10**8, 10**9)
    K = rng.randint(1, 30)

print(S, K)
`,

		ReferenceCpp: `
#include <bits/stdc++.h>
using namespace std;
int main(){
    long long S, K;
    cin >> S >> K;

    long long X = 0;

    // Phase 1: Match set bits of S from MSB to LSB
    for(int bit = 30; bit >= 0 && K > 0; bit--){
        if((S >> bit) & 1){
            X |= (1LL << bit);
            K--;
        }
    }

    // Phase 2: Fill remaining budget into lowest unset bits
    for(int bit = 0; bit <= 30 && K > 0; bit++){
        if(!((X >> bit) & 1)){
            X |= (1LL << bit);
            K--;
        }
    }

    cout << X << "\n";
}
`,

		CheckerPy: tokenCheckerPy,
	})
}
