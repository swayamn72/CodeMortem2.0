import type { MCQQuestion, SampleCase } from "./types";

// ─── MCQ Part 1 — Modular Arithmetic ─────────────────────────────────────────

export const MCQ_PART_1: MCQQuestion[] = [
  {
    id: 1,
    question: "Why do competitive programming problems use modulo 10^9^+7 as their modulus?",
    options: [
      "It is the smallest prime number",
      "It is a large prime, fits in a 32-bit integer, and its square fits in a 64-bit integer without overflow",
      "It makes addition faster",
      "It is exactly 10^9^",
    ],
    answer: 1,
    explanation:
      "10^9^+7 is prime (Fermat's Little Theorem requires this), fits in an int32 (< 2³¹), and (10^9^+7)² ≈ 10^18^ fits in a 64-bit long long. This combination makes it the standard choice in competitive programming.",
  },
  {
    id: 2,
    question: "What is the time complexity of computing A^B mod P using Binary Exponentiation?",
    options: ["O(B)", "O(√B)", "O(log B)", "O(1)"],
    answer: 2,
    explanation:
      "Binary Exponentiation repeatedly squares the base and halves the exponent, making it O(log B) — exponentially faster than the naive O(B) loop, which would TLE for B up to 10^18^.",
  },
  {
    id: 3,
    question: "Fermat's Little Theorem states that for prime P and integer A not divisible by P: A^(P-1) ≡ 1 (mod P). What is the modular inverse of A?",
    options: ["A^P mod P", "A^(P-2) mod P", "A^(-1) mod P (computed directly)", "1/A"],
    answer: 1,
    explanation:
      "From A^(P-1) ≡ 1 (mod P), dividing both sides by A gives A^(P-2) ≡ A⁻¹ (mod P). So the modular inverse of A is A^(P-2) mod P, computable in O(log P) using binary exponentiation.",
  },
  {
    id: 4,
    question: "You need to compute (A / B) mod (10^9^+7). B = 3 and 10^9^+7 is prime. What do you compute?",
    options: [
      "A * 3 mod (10^9^+7)",
      "A * power(3, 10^9^+5, 10^9^+7) mod (10^9^+7)",
      "A / 3 directly",
      "floor(A / 3)",
    ],
    answer: 1,
    explanation:
      "The modular inverse of B=3 is 3^(P-2) = 3^(10^9^+5) mod P. So A/B mod P = A * 3^(10^9^+5) mod P. Regular division is impossible under modular arithmetic because remainders don't form a division ring — only multiplication by the inverse works.",
  },
  {
    id: 5,
    question: "What is the result of (10^9^ × 10^9^) mod (10^9^+7) if computed naively as a 32-bit integer multiplication?",
    options: [
      "The correct answer",
      "0 due to unsigned overflow",
      "Undefined/garbage due to signed 32-bit overflow",
      "A negative number",
    ],
    answer: 2,
    explanation:
      "10^9^ × 10^9^ = 10^18^, which exceeds INT_MAX (≈ 2.1 × 10^9^). In C++, signed 32-bit overflow is undefined behaviour. Always cast to `long long` before multiplying: `(long long)a * b % MOD`.",
  },
];

// ─── MCQ Part 2 — Counting Models ────────────────────────────────────────────

export const MCQ_PART_2: MCQQuestion[] = [
  {
    id: 6,
    question: "A robot on a 5×4 grid must reach the bottom-right corner from the top-left, moving only right or down. How many unique paths exist?",
    options: ["C(9, 4) = 126", "5 × 4 = 20", "C(5, 4) = 5", "5! + 4! = 144"],
    answer: 0,
    explanation:
      "The robot makes exactly (5-1)=4 moves right and (4-1)=3 moves down, for a total of 7 moves. It needs to choose which 3 of those 7 are 'down': C(7, 3) = 35. More generally, for an X×Y grid: C(X+Y-2, X-1).",
  },
  {
    id: 7,
    question: "You have 10 identical chocolates to distribute among 4 children, where any child can get 0 chocolates. How many ways are there?",
    options: ["C(10, 4) = 210", "C(13, 3) = 286", "4¹⁰", "C(10, 3) = 120"],
    answer: 1,
    explanation:
      "Stars and Bars: distributing N identical items into K bins (with zero allowed) = C(N + K - 1, K - 1) = C(10 + 4 - 1, 4 - 1) = C(13, 3) = 286.",
  },
  {
    id: 8,
    question: "How many distinct strings can be formed from the letters in 'AABBC'?",
    options: ["5! = 120", "5! / (2! × 2!) = 30", "5! / 2! = 60", "3! = 6"],
    answer: 1,
    explanation:
      "AABBC has 5 letters with A appearing 2 times and B appearing 2 times. The formula for permutations with repetition is N! / (f₁! × f₂! × ...) = 5! / (2! × 2!) = 120 / 4 = 30.",
  },
  {
    id: 9,
    question: "Why does precomputing an invFact[] array improve query time from O(log P) to O(1)?",
    options: [
      "Because modular inverses don't need to be computed for factorials",
      "Because we store (i!)⁻¹ mod P for each i, so nCr(n,k) is just 3 lookups multiplied together",
      "Because the modulus becomes 1",
      "Because factorials don't overflow",
    ],
    answer: 1,
    explanation:
      "nCr(n, k) = fact[n] × invFact[k] × invFact[n-k] mod P — just 3 array lookups and 2 multiplications, giving O(1) per query. Without precomputation, each query would require O(log P) binary exponentiation.",
  },
  {
    id: 10,
    question: "If we precompute invFact[N] using power(fact[N], P-2, P), how do we then fill invFact[N-1] through invFact[0] efficiently in O(N) total (not O(N log P))?",
    options: [
      "Run binary exponentiation for each index",
      "invFact[i] = invFact[i+1] × (i+1) mod P",
      "invFact[i] = invFact[i-1] / i mod P",
      "It is impossible to do better than O(N log P)",
    ],
    answer: 1,
    explanation:
      "From the identity (i!)⁻¹ = ((i+1)!)⁻¹ × (i+1), we get invFact[i] = invFact[i+1] × (i+1) mod P. This lets us fill the entire array in a single O(N) reverse loop after computing just one modular inverse at position N.",
  },
];

// ─── Sample Test Cases ────────────────────────────────────────────────────────

export const SAMPLE_TEST_CASES: Record<string, SampleCase[]> = {
  challenge1: [
    { input: "3\n2 3 4",        expected: "24",         label: "[2,3,4] → 24" },
    { input: "1\n1000000000",   expected: "1000000000", label: "Single large value" },
    { input: "4\n1000000000 1000000000 1000000000 1000000000", expected: "2401", label: "4 × 10^9^ — overflow test, needs modulo" },
  ],
  challenge2: [
    { input: "3\n2 10 1000000007\n3 3 7\n0 100 13", expected: "1024\n6\n0", label: "Three queries" },
    { input: "1\n2 62 1000000007", expected: "145586002", label: "2^62^ mod 10^9^+7" },
  ],
  challenge3: [
    { input: "3\n10 2\n15 3\n100 4", expected: "5\n5\n25", label: "Three division queries" },
  ],
  challenge4: [
    { input: "0",  expected: "1",          label: "0! = 1" },
    { input: "5",  expected: "120",        label: "5! = 120" },
    { input: "10", expected: "3628800",    label: "10! = 3628800" },
  ],
  challenge5: [
    { input: "5 2",  expected: "10", label: "C(5,2) = 10" },
    { input: "20 10",expected: "184756", label: "C(20,10) = 184756" },
    { input: "0 0",  expected: "1",   label: "C(0,0) = 1" },
  ],
  challenge6: [
    { input: "3\n0\n5\n10", expected: "1\n120\n3628800", label: "0!, 5!, 10!" },
  ],
  challenge7: [
    { input: "10 3\n1\n5\n10", expected: "1\n808333339\n283194722", label: "invFact queries" },
  ],
  challenge8: [
    { input: "3\n5 2\n10 3\n1000000 500000", expected: "10\n120\n996692777", label: "Three nCr queries" },
  ],
  challenge9: [
    { input: "0 0", expected: "1",  label: "1×1 grid = 1 path" },
    { input: "2 2", expected: "6",  label: "3×3 grid = C(4,2) = 6" },
    { input: "3 7", expected: "120",label: "4×8 grid = C(10,3) = 120" },
  ],
  challenge10: [
    { input: "2\n3 3 0 0\n4 4 2 2", expected: "20\n36", label: "Relay Station Paths" },
  ],
  challenge11: [
    { input: "5 3", expected: "21",  label: "C(5+3-1, 3-1) = C(7,2) = 21" },
    { input: "0 4", expected: "1",   label: "0 candies → 1 way (give nothing)" },
    { input: "10 1",expected: "1",   label: "1 child gets all 10 → 1 way" },
  ],
  challenge12: [
    { input: "AACCG",  expected: "30",  label: "5!/(2!×2!) = 30" },
    { input: "AAAA",   expected: "1",   label: "All same → 1 arrangement" },
    { input: "ACGT",   expected: "24",  label: "All distinct → 4! = 24" },
  ],

  challenge14: [
    { input: "30",  expected: "22", label: "x=30: count divisible by 2,3, or 5" },
    { input: "1",   expected: "0",  label: "x=1: none divisible" },
    { input: "100", expected: "74", label: "x=100" },
  ],
  challenge15: [
    { input: "5 5 2\n2 2\n4 4", expected: "72", label: "Valid path through all firewalls" },
    { input: "5 5 2\n3 1\n1 3", expected: "0", label: "Impossible backwards traversal" },
  ],
};

// ─── Challenge Definitions ────────────────────────────────────────────────────

export interface ChallengeData {
  id: string;
  backendId: string;
  title: string;
  difficulty: string;
  diffColor: string;
  statement: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  hints: string[];
  editorial: string;
}

export const COMB_CHALLENGES: ChallengeData[] = [
  {
    id: "challenge1",
    backendId: "comb_safe_product",
    title: "Safe Product",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement:
      "Given an array of N integers, find the product of all elements modulo 10^9^+7. Direct multiplication will overflow a 64-bit integer — you must apply the modulo at each step.",
    constraints: "1 ≤ N ≤ 10^5^\n1 ≤ Aᵢ ≤ 10^9^",
    inputFormat: "First line: N. Second line: N space-separated integers.",
    outputFormat: "A single integer: the product of all elements mod 10^9^+7.",
    hints: [
      "If you multiply all numbers first and then mod, you will get integer overflow. What if you apply % after each multiplication instead?",
    ],
    editorial:
      "Apply modular arithmetic after each multiplication. The key identity is: (A × B) mod M = ((A mod M) × (B mod M)) mod M.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\nconst long long MOD = 1e9 + 7;\nint main(){\n    int n; cin >> n;\n    long long prod = 1;\n    for(int i = 0; i < n; i++){\n        long long x; cin >> x;\n        prod = (prod * (x % MOD)) % MOD;\n    }\n    cout << prod << \"\\n\";\n}\n```",
  },
  {
    id: "challenge2",
    backendId: "comb_fast_power",
    title: "Fast Power",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement:
      "Given T test cases, each containing X, Y, and P, compute `X^Y^` mod P. Y can be up to 10^18^, so a naive loop will TLE. You must use Binary Exponentiation.",
    constraints: "1 ≤ T ≤ 10^5^\n0 ≤ X ≤ 10^9^\n0 ≤ Y ≤ 10^18^\n2 ≤ P ≤ 10^9^",
    inputFormat: "First line: T. Next T lines: three integers X Y P.",
    outputFormat: "T lines, one answer per query.",
    hints: [
      "A loop from 1 to Y is O(Y) which is O(10^18^) — impossible. Think about how to break the problem in half each step.",
      "If Y is even: X^Y^ = (X^2^)^(Y/2)^. If Y is odd: X^Y^ = X × X^(Y-1)^. This halves Y each step → O(log Y).",
      "Use the iterative version: while exp > 0, if exp is odd multiply result by base, then square base and halve exp.",
    ],
    editorial:
      "Binary Exponentiation: X^Y^ = (X^2^)^(Y/2)^ for even Y, and X × X^(Y-1)^ for odd Y. This yields O(log Y) time.\n\nIMPORTANT: P can be non-prime and non-standard, so use __int128 or careful multiplication to avoid overflow when computing base × base mod P.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\ntypedef long long ll; typedef __int128 lll;\nll power(ll base, ll exp, ll mod){\n    ll result = 1; base %= mod;\n    while(exp > 0){\n        if(exp & 1) result = (lll)result * base % mod;\n        base = (lll)base * base % mod;\n        exp >>= 1;\n    }\n    return result;\n}\nint main(){\n    int t; cin >> t;\n    while(t--){ ll x,y,p; cin>>x>>y>>p; cout<<power(x,y,p)<<\"\\n\"; }\n}\n```",
  },
  {
    id: "challenge3",
    backendId: "comb_mod_division",
    title: "Modulo Division",
    difficulty: "Easy-Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "Given Q queries, each with integers A and B, output A/B mod (10^9^+7). Since 10^9^+7 is prime, you can use Fermat's Little Theorem: A/B ≡ A × B^(P-2) (mod P).",
    constraints: "1 ≤ Q ≤ 10^5^\n1 ≤ A, B < 10^9^+7\nB is guaranteed to not be divisible by 10^9^+7",
    inputFormat: "First line: Q. Next Q lines: two integers A B.",
    outputFormat: "Q lines, one result per query.",
    hints: [
      "You can't do floor(A/B) here — this is division under modular arithmetic. You need the modular inverse of B.",
      "Fermat's Little Theorem: for prime P, B^(P-1) ≡ 1 (mod P). So B × B^(P-2) ≡ 1 (mod P), meaning B^(P-2) is the inverse of B.",
      "Answer = (A mod P) * power(B, P-2, P) mod P. Call your binary exponentiation function with exp = 10^9^+5.",
    ],
    editorial:
      "Since P = 10^9^+7 is prime and B is not divisible by P, Fermat's Little Theorem guarantees B^(P-1) ≡ 1 (mod P). Therefore B^(P-2) is the modular inverse of B.\n\nA/B mod P = A × B^(P-2) mod P.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\ntypedef long long ll;\nconst ll MOD = 1e9 + 7;\nll power(ll b, ll e, ll m){ ll r=1; b%=m; while(e>0){if(e&1)r=r*b%m;b=b*b%m;e>>=1;} return r; }\nint main(){\n    int q; cin>>q;\n    while(q--){ ll a,b; cin>>a>>b; cout<<(a%MOD)*power(b,MOD-2,MOD)%MOD<<\"\\n\"; }\n}\n```",
  },
  {
    id: "challenge4",
    backendId: "comb_task_lineup",
    title: "Task Lineup",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement:
      "You have N distinct tasks that must all be completed in some order. Count the total number of unique sequences (permutations) to complete all tasks modulo 10^9^+7. The answer is simply N!.",
    constraints: "0 ≤ N ≤ 10^6^",
    inputFormat: "A single integer N.",
    outputFormat: "A single integer: N! mod 10^9^+7.",
    hints: [
      "There are N choices for the first task, then N-1 for the second, and so on. This gives N × (N-1) × ... × 1 = N!.",
      "A loop from 1 to N multiplying and taking mod at each step is perfectly fast enough here.",
      "Be careful: 0! = 1 by mathematical convention. Handle this edge case.",
    ],
    editorial:
      "N! is just the product 1 × 2 × ... × N, applied modulo 10^9^+7 at each step.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\nconst long long MOD = 1e9 + 7;\nint main(){\n    long long n; cin >> n;\n    long long ans = 1;\n    for(long long i = 2; i <= n; i++) ans = ans * i % MOD;\n    cout << ans << \"\\n\";\n}\n```",
  },
  {
    id: "challenge5",
    backendId: "comb_team_small",
    title: "Team Formations (Small)",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement:
      "Given N people and K spots, count the number of ways to choose a team of K people from the group (order doesn't matter). Output C(N, K) = N! / (K! × (N-K)!) as an exact integer. Constraints are small enough for direct computation without modular inverse.",
    constraints: "0 ≤ K ≤ N ≤ 20",
    inputFormat: "Two integers N and K on a single line.",
    outputFormat: "A single integer: C(N, K).",
    hints: [
      "C(N, K) = N! / (K! × (N-K)!). With N ≤ 20, the max value is C(20, 10) = 184,756. This fits in a 64-bit integer.",
      "Compute the numerator N × (N-1) × ... × (N-K+1) and denominator K! in a loop. Then divide exactly — no remainder will exist.",
      "Use __int128 or carefully order multiplication and division to avoid intermediate overflow.",
    ],
    editorial:
      "Direct computation: numerator = N × (N-1) × ... × (N-K+1), denominator = K!. Since K ≤ 20, the final value fits in long long.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\ntypedef __int128 lll;\nint main(){\n    long long n, k; cin >> n >> k;\n    if(k > n){ cout << 0; return 0; }\n    lll num = 1, den = 1;\n    for(long long i = 0; i < k; i++){ num *= (n - i); den *= (i + 1); }\n    cout << (long long)(num / den) << \"\\n\";\n}\n```",
  },
  {
    id: "challenge6",
    backendId: "comb_prefix_factorials",
    title: "Prefix Factorials",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement:
      "Answer Q queries. Each query asks: what is X! mod (10^9^+7)? X can be up to 10^6^, and Q can be up to 10^5^. Precompute a fact[] array once in O(N) time, then answer each query in O(1).",
    constraints: "1 ≤ Q ≤ 10^5^\n0 ≤ X ≤ 10^6^",
    inputFormat: "First line: Q. Next Q lines: a single integer X.",
    outputFormat: "Q lines, one factorial value per query.",
    hints: [
      "If you compute X! from scratch for each query, it is O(X × Q) ≈ 10^11^ — too slow. You need to precompute.",
      "Build an array fact[] of size 10^6^+1 where fact[0]=1 and fact[i] = fact[i-1] * i % MOD.",
      "Once the array is built, each query is just cout << fact[X].",
    ],
    editorial:
      "Precompute fact[] in O(MAXN) once, then answer each query in O(1).\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\nconst long long MOD = 1e9+7;\nconst int MAXN = 1000001;\nlong long fact[MAXN];\nint main(){\n    fact[0] = 1;\n    for(int i = 1; i < MAXN; i++) fact[i] = fact[i-1] * i % MOD;\n    int q; cin >> q;\n    while(q--){ int x; cin>>x; cout<<fact[x]<<\"\\n\"; }\n}\n```",
  },
  {
    id: "challenge7",
    backendId: "comb_inverse_array",
    title: "The Inverse Array",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "Precompute an invFact[] array up to N = 10^6^, where invFact[i] = (i!)⁻¹ mod (10^9^+7). Given Q queries asking for invFact[X], answer each in O(1).\n\nKey insight: only one modular exponentiation is needed — compute invFact[N] = power(fact[N], P-2, P), then fill the rest using invFact[i] = invFact[i+1] × (i+1) mod P.",
    constraints: "1 ≤ N ≤ 10^6^\n1 ≤ Q ≤ N",
    inputFormat: "First line: N Q. Next Q lines: a single integer X (0 ≤ X ≤ N).",
    outputFormat: "Q lines, one invFact value per query.",
    hints: [
      "First precompute fact[0..N]. Then compute invFact[N] = power(fact[N], MOD-2, MOD) — that is your one expensive step.",
      "Fill backwards: invFact[i] = invFact[i+1] × (i+1) % MOD. This uses the identity (i!)⁻¹ = ((i+1)!)⁻¹ × (i+1).",
      "Each query is then a simple array lookup.",
    ],
    editorial:
      "Calculating the modular inverse for each factorial individually would take O(N log P) time, which might be too slow. Instead, we use a clever mathematical trick to compute all inverse factorials in just O(N) time.\n\n" +
      "**The Math:**\n" +
      "We know that `i! = (i+1)! / (i+1)`.\n" +
      "If we take the modular inverse of both sides, the division becomes multiplication:\n" +
      "`(i!)⁻¹ = ((i+1)!)⁻¹ × (i+1)`.\n\n" +
      "This means if we know the inverse factorial for `(i+1)`, we can instantly find the inverse factorial for `i` just by multiplying it by `(i+1)`!\n\n" +
      "**The Algorithm:**\n" +
      "1. Calculate normal factorials `fact[]` up to `MAXN`.\n" +
      "2. Calculate the modular inverse for the largest factorial `inv_fact[MAXN-1]` using Binary Exponentiation (this takes O(log P)).\n" +
      "3. Loop backwards from `MAXN-2` down to 0, filling the array: `inv_fact[i] = inv_fact[i+1] × (i+1) % MOD`.\n\n" +
      "C++ Solution:\n" +
      "```cpp\n" +
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n\n" +
      "typedef long long ll;\n" +
      "const ll MOD = 1e9 + 7;\n" +
      "const int MAXN = 1000001;\n\n" +
      "ll fact[MAXN], inv_fact[MAXN];\n\n" +
      "// O(log M) Binary Exponentiation\n" +
      "ll power(ll b, ll e, ll m) {\n" +
      "    ll r = 1;\n" +
      "    b %= m;\n" +
      "    while (e > 0) {\n" +
      "        if (e % 2 == 1) r = (r * b) % m;\n" +
      "        b = (b * b) % m;\n" +
      "        e /= 2;\n" +
      "    }\n" +
      "    return r;\n" +
      "}\n\n" +
      "int main() {\n" +
      "    ios_base::sync_with_stdio(false);\n" +
      "    cin.tie(NULL);\n\n" +
      "    // 1. Calculate factorials\n" +
      "    fact[0] = 1;\n" +
      "    for (int i = 1; i < MAXN; i++) {\n" +
      "        fact[i] = (fact[i - 1] * i) % MOD;\n" +
      "    }\n\n" +
      "    // 2. Calculate modular inverse for the largest factorial\n" +
      "    inv_fact[MAXN - 1] = power(fact[MAXN - 1], MOD - 2, MOD);\n\n" +
      "    // 3. Loop backwards to fill the rest in O(N) time\n" +
      "    for (int i = MAXN - 2; i >= 0; i--) {\n" +
      "        inv_fact[i] = (inv_fact[i + 1] * (i + 1)) % MOD;\n" +
      "    }\n\n" +
      "    // Answer queries in O(1)\n" +
      "    int n, q;\n" +
      "    cin >> n >> q;\n" +
      "    while (q--) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        cout << inv_fact[x] << \"\\n\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}\n" +
      "```",
  },
  {
    id: "challenge8",
    backendId: "comb_massive_queries",
    title: "Massive Queries",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "Given Q queries, each with N and K, output C(N, K) mod (10^9^+7). N can be up to 10^6^ and Q can be up to 10^5^. Using the precomputed fact[] and invFact[] arrays, each query is just 3 lookups: fact[n] × invFact[k] × invFact[n-k] mod P.",
    constraints: "1 ≤ Q ≤ 10^5^\n0 ≤ K ≤ N ≤ 10^6^",
    inputFormat: "First line: Q. Next Q lines: two integers N K.",
    outputFormat: "Q lines, one C(N,K) value per query.",
    hints: [
      "Precompute fact[0..10^6^] and invFact[0..10^6^] before reading queries.",
      "nCr(n, k) = fact[n] * invFact[k] % MOD * invFact[n-k] % MOD.",
      "Edge cases: if K < 0 or K > N, the answer is 0.",
    ],
    editorial:
      "Once you have the `fact[]` and `inv_fact[]` arrays precomputed, any nCr query is just three array lookups and two multiplications. This guarantees pure O(1) performance per query.\n\n" +
      "**The Final Pieces:**\n" +
      "- Put the precomputation in a dedicated `precompute()` function.\n" +
      "- Create an `nCr(n, k)` function that handles edge cases (like `k < 0` or `k > n`).\n" +
      "- Call `precompute()` exactly once at the top of `main()`.\n\n" +
      "C++ Solution:\n" +
      "```cpp\n" +
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n\n" +
      "typedef long long ll;\n" +
      "const ll MOD = 1e9 + 7;\n" +
      "const int MAXN = 1000001;\n\n" +
      "ll fact[MAXN], inv_fact[MAXN];\n\n" +
      "ll power(ll b, ll e, ll m) {\n" +
      "    ll r = 1;\n" +
      "    b %= m;\n" +
      "    while (e > 0) {\n" +
      "        if (e % 2 == 1) r = (r * b) % m;\n" +
      "        b = (b * b) % m;\n" +
      "        e /= 2;\n" +
      "    }\n" +
      "    return r;\n" +
      "}\n\n" +
      "void precompute() {\n" +
      "    fact[0] = 1;\n" +
      "    for (int i = 1; i < MAXN; i++) {\n" +
      "        fact[i] = (fact[i - 1] * i) % MOD;\n" +
      "    }\n\n" +
      "    inv_fact[MAXN - 1] = power(fact[MAXN - 1], MOD - 2, MOD);\n" +
      "    \n" +
      "    for (int i = MAXN - 2; i >= 0; i--) {\n" +
      "        inv_fact[i] = (inv_fact[i + 1] * (i + 1)) % MOD;\n" +
      "    }\n" +
      "}\n\n" +
      "ll nCr(int n, int k) {\n" +
      "    if (k < 0 || k > n) return 0;\n" +
      "    return fact[n] * inv_fact[k] % MOD * inv_fact[n - k] % MOD;\n" +
      "}\n\n" +
      "int main() {\n" +
      "    ios_base::sync_with_stdio(false);\n" +
      "    cin.tie(NULL);\n\n" +
      "    // Must call this ONCE before handling any queries!\n" +
      "    precompute();\n\n" +
      "    int q;\n" +
      "    cin >> q;\n" +
      "    while (q--) {\n" +
      "        int n, k;\n" +
      "        cin >> n >> k;\n" +
      "        cout << nCr(n, k) << \"\\n\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}\n" +
      "```",
  },
  {
    id: "challenge9",
    backendId: "comb_robot_grid",
    title: "Robot Grid Navigation",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "A robot starts at (0,0) and must reach (X, Y) on an infinite grid, moving only right (+1 to column) or down (+1 to row). Count the number of unique paths mod (10^9^+7).",
    constraints: "0 ≤ X, Y ≤ 10^5^",
    inputFormat: "Two integers X Y on a single line.",
    outputFormat: "A single integer: the number of unique paths mod 10^9^+7.",
    hints: [
      "The robot makes exactly X right moves and Y down moves. The total path length is X+Y moves.",
      "You need to choose which X of those X+Y moves are 'right' moves — the rest are automatically 'down' moves.",
      "The answer is C(X+Y, X) = (X+Y)! / (X! × Y!). Use your precomputed fact and invFact arrays.",
    ],
    editorial:
      "Answer = C(X+Y, X). Precompute factorials and inverse factorials up to 2×10^5^.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\n\ntypedef long long ll;\nconst ll MOD = 1e9 + 7;\n// MAXN must cover X + Y (100,000 + 100,000)\nconst int MAXN = 200005;\n\nll fact[MAXN], inv_fact[MAXN];\n\nll power(ll b, ll e, ll m) {\n    ll r = 1;\n    b %= m;\n    while (e > 0) {\n        if (e % 2 == 1) r = (r * b) % m;\n        b = (b * b) % m;\n        e /= 2;\n    }\n    return r;\n}\n\nvoid precompute() {\n    fact[0] = 1;\n    for (int i = 1; i < MAXN; i++) {\n        fact[i] = (fact[i - 1] * i) % MOD;\n    }\n    inv_fact[MAXN - 1] = power(fact[MAXN - 1], MOD - 2, MOD);\n    for (int i = MAXN - 2; i >= 0; i--) {\n        inv_fact[i] = (inv_fact[i + 1] * (i + 1)) % MOD;\n    }\n}\n\nll nCr(int n, int k) {\n    if (k < 0 || k > n) return 0;\n    return fact[n] * inv_fact[k] % MOD * inv_fact[n - k] % MOD;\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n\n    precompute();\n\n    int x, y;\n    cin >> x >> y;\n    cout << nCr(x + y, x) << \"\\n\";\n\n    return 0;\n}\n```",
  },
  {
    id: "challenge10",
    backendId: "comb_relay_station",
    title: "The Relay Station",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "A Mars rover starts at coordinates (0,0) and must reach the main base at (X, Y). The rover can only move Right (+1 to the X-coordinate) or Up (+1 to the Y-coordinate).\n\nHowever, the rover's battery is degraded. It must pass through a specific solar relay station located at (A, B) to recharge before continuing its journey to the main base.\n\nHow many unique valid paths exist from the start to the main base that pass exactly through the relay station? Output it modulo 10^9^+7.",
    constraints: "1 ≤ Q ≤ 10^5^\n0 ≤ A ≤ X ≤ 10^5^\n0 ≤ B ≤ Y ≤ 10^5^",
    inputFormat: "First line: Q. Next Q lines: four integers X, Y, A, B.",
    outputFormat: "Q lines, one integer per query: the total paths mod 10^9^+7.",
    hints: [
      "Do not try to solve the entire grid at once. Break the rover's journey into two completely independent missions: Leg 1 is getting to the station, and Leg 2 is getting from the station to the base.",
      "Leg 1 is standard: paths from (0,0) to (A,B) is simply C(A+B, A). For Leg 2, treat the relay station as a brand new (0,0) starting point! The remaining distance to travel is exactly (X-A) units right and (Y-B) units up.",
      "Once you calculate the total paths for Leg 1 and Leg 2 separately, multiply them using the Rule of Product.",
    ],
    editorial:
      "The \"Aha!\" Moment:\nWhen a problem forces a path to pass through a specific coordinate, it essentially slices the grid into two independent rectangles.\n\nBecause the choice of how you get to the relay station does not restrict how you leave it, these are independent events. We calculate the combinations for each leg separately and multiply them using the Rule of Product.\n\nLeg 1 (Start to Relay):\nTotal moves = A + B.\nPaths = C(A+B, A).\n\nLeg 2 (Relay to Base):\nThe remaining X-distance is X - A.\nThe remaining Y-distance is Y - B.\nPaths = C((X-A) + (Y-B), X-A).\n\nTotal Paths = ( C(A+B, A) × C((X-A) + (Y-B), X-A) ) mod 10^9^+7.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\n\ntypedef long long ll;\nconst ll MOD = 1e9 + 7;\nconst int MAXN = 200005;\n\nll fact[MAXN], inv_fact[MAXN];\n\nll power(ll b, ll e, ll m) {\n    ll r = 1;\n    b %= m;\n    while (e > 0) {\n        if (e % 2 == 1) r = (r * b) % m;\n        b = (b * b) % m;\n        e /= 2;\n    }\n    return r;\n}\n\nvoid precompute() {\n    fact[0] = 1;\n    for (int i = 1; i < MAXN; i++) {\n        fact[i] = (fact[i - 1] * i) % MOD;\n    }\n    inv_fact[MAXN - 1] = power(fact[MAXN - 1], MOD - 2, MOD);\n    for (int i = MAXN - 2; i >= 0; i--) {\n        inv_fact[i] = (inv_fact[i + 1] * (i + 1)) % MOD;\n    }\n}\n\nll nCr(int n, int k) {\n    if (k < 0 || k > n) return 0;\n    return fact[n] * inv_fact[k] % MOD * inv_fact[n - k] % MOD;\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n\n    precompute();\n\n    int q;\n    cin >> q;\n    while (q--) {\n        int x, y, a, b;\n        cin >> x >> y >> a >> b;\n        \n        ll paths_to_relay = nCr(a + b, a);\n        ll paths_to_base = nCr((x - a) + (y - b), x - a);\n        ll total_paths = (paths_to_relay * paths_to_base) % MOD;\n        \n        cout << total_paths << \"\\n\";\n    }\n\n    return 0;\n}\n```",
  },
  {
    id: "challenge11",
    backendId: "comb_candy_dist",
    title: "Candy Distribution",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "You have N identical candies to distribute among K children. Each child can receive 0 or more candies. Count the number of ways to distribute them mod (10^9^+7).",
    constraints: "0 ≤ N ≤ 10^5^\n1 ≤ K ≤ 10^5^",
    inputFormat: "Two integers N K on a single line.",
    outputFormat: "A single integer: the number of ways mod 10^9^+7.",
    hints: [
      "Think of the N candies as stars (★★★★★) and K-1 dividers (|) between groups. How many total symbols are there?",
      "You have N + (K-1) = N+K-1 total positions, and you need to choose K-1 of them to be dividers.",
      "Answer = C(N+K-1, K-1). Your MAXN needs to be at least N+K, which is up to 2×10^5^.",
    ],
    editorial:
      "Stars and Bars: C(N+K-1, K-1). Precompute factorials up to 2×10^5^.\n\nC++ Solution:\n```cpp\n// output nCr(n+k-1, k-1)\n```",
  },
  {
    id: "challenge12",
    backendId: "comb_dna_sequences",
    title: "DNA Sequences",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "Given a DNA string of length N consisting of characters 'A', 'C', 'G', 'T', count the number of distinct strings formed by rearranging its characters, modulo 10^9^+7.",
    constraints: "1 ≤ N ≤ 2×10^5^\nString contains only 'A', 'C', 'G', 'T'",
    inputFormat: "A single string S.",
    outputFormat: "A single integer: the number of distinct rearrangements mod 10^9^+7.",
    hints: [
      "Count the frequency of each of the 4 characters: fA, fC, fG, fT.",
      "The formula for permutations with repetitions is N! / (fA! × fC! × fG! × fT!).",
      "Under modular arithmetic, division becomes multiplication by the modular inverse: fact[N] × invFact[fA] × invFact[fC] × invFact[fG] × invFact[fT] mod P.",
    ],
    editorial:
      "Count character frequencies, then apply the multinomial coefficient formula using precomputed fact and invFact arrays.\n\nC++ Solution:\n```cpp\nstring s; cin>>s; int n=s.size();\nmap<char,int> freq; for(char c:s) freq[c]++;\nll ans = fact[n];\nfor(auto&[c,f]:freq) ans=ans*inv_fact[f]%MOD;\ncout<<ans<<\"\\n\";\n```",
  },
  {
    id: "challenge14",
    backendId: "comb_coprime_count",
    title: "Co-prime Count",
    difficulty: "Hard",
    diffColor: "var(--cm-red)",
    statement:
      "Given an integer X (up to 10^18^), count how many integers in the range [1, X] are divisible by 2, 3, or 5.",
    constraints: "1 ≤ X ≤ 10^18^",
    inputFormat: "A single integer X.",
    outputFormat: "A single integer: count of integers in [1, X] divisible by 2, 3, or 5.",
    hints: [
      "Count of integers in [1, X] divisible by D is simply floor(X / D). Apply this for D = 2, 3, 5, 6, 10, 15, and 30.",
      "By Inclusion-Exclusion: |2∪3∪5| = ⌊X/2⌋ + ⌊X/3⌋ + ⌊X/5⌋ - ⌊X/6⌋ - ⌊X/10⌋ - ⌊X/15⌋ + ⌊X/30⌋.",
      "The lcm of {2,3} = 6, lcm of {2,5} = 10, lcm of {3,5} = 15, lcm of {2,3,5} = 30. That's all you need.",
    ],
    editorial:
      "Pure Inclusion-Exclusion with 7 floor-division operations. No loops needed.\n\nC++ Solution:\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\ntypedef long long ll;\nint main(){\n    ll x; cin>>x;\n    cout << x/2 + x/3 + x/5 - x/6 - x/10 - x/15 + x/30 << \"\\n\";\n}\n```",
  },
  {
    id: "challenge15",
    backendId: "comb_quantum_routing",
    title: "The Quantum Routing Protocol",
    difficulty: "Hard",
    diffColor: "var(--cm-red)",
    premium: true,
    statement:
      "In the year 2142, you are a network architect managing data streams across a massive 2D quantum grid. A critical data packet must be sent from the Source Node located at (0, 0) to the Mainframe Server located at (X, Y).\n\nBecause the grid's connections only flow in specific directions to prevent data backwash, the packet can only move Right (+1 to X) or Up (+1 to Y).\n\nTo ensure the packet is properly encrypted, it must pass through exactly K specific Security Firewalls (waypoints) located at various coordinates on the grid. If the packet misses even one firewall, or if the arrangement of firewalls makes the journey physically impossible, the packet is destroyed.\n\nCalculate the total number of unique valid paths the packet can take, modulo 10^9^+7.",
    constraints: "1 ≤ X, Y ≤ 10^5^\n0 ≤ K ≤ 10^5^\n0 ≤ A_i ≤ 10^5^, 0 ≤ B_i ≤ 10^5^\nNo two firewalls overlap, none start at (0,0)",
    inputFormat: "First line: X Y K. Next K lines: A_i B_i.",
    outputFormat: "A single integer: valid paths mod 10^9^+7.",
    hints: [
      "Break the journey into smaller, independent segments. The total number of valid paths is simply the product of the number of paths between each consecutive pair of required nodes.",
      "In what order must the nodes be visited? A packet can only move right and up. Sort the firewall coordinates primarily by their X-coordinate, and secondarily by their Y-coordinate, to find the mandatory visitation order.",
      "If any firewall requires the packet to move negatively (left or down) from the previous firewall, the answer is instantly 0. To calculate the paths quickly, precompute factorials and their inverses.",
    ],
    editorial:
      "This problem is an advanced variation of the classic \"Grid Paths\" combinatorial problem.\n\n1. The Mathematics of a Single Segment\nTo travel from (X1, Y1) to (X2, Y2), the packet must move horizontal dx = X2 - X1 and vertical dy = Y2 - Y1. Number of paths is C(dx + dy, dx).\n\n2. Handling Multiple Nodes\nAppend the start point (0,0) and target (X,Y) to the list of firewalls, and then sort the entire list by X, then Y.\n\n3. Validation and Multiplication\nIterate through consecutive pairs. If dx < 0 or dy < 0, a backwards movement is required. The path is impossible, output 0.\nOtherwise, calculate C(dx + dy, dx) for that segment and multiply into a running total, taking modulo 10^9^+7.\n\nC++ Solution:\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nconst int MOD = 1e9 + 7;\nconst int MAXN = 200005;\nlong long fact[MAXN], inv_fact[MAXN];\n\nlong long power(long long b, long long e) {\n    long long r = 1;\n    b %= MOD;\n    while (e > 0) {\n        if (e % 2 == 1) r = (r * b) % MOD;\n        b = (b * b) % MOD;\n        e /= 2;\n    }\n    return r;\n}\n\nvoid precompute() {\n    fact[0] = 1;\n    for (int i = 1; i < MAXN; i++) fact[i] = (fact[i - 1] * i) % MOD;\n    inv_fact[MAXN - 1] = power(fact[MAXN - 1], MOD - 2);\n    for (int i = MAXN - 2; i >= 0; i--) inv_fact[i] = (inv_fact[i + 1] * (i + 1)) % MOD;\n}\n\nlong long nCr(int n, int r) {\n    if (r < 0 || r > n) return 0;\n    return fact[n] * inv_fact[r] % MOD * inv_fact[n - r] % MOD;\n}\n\nint main() {\n    ios_base::sync_with_stdio(false); cin.tie(NULL);\n    precompute();\n    int X, Y, K; if (!(cin >> X >> Y >> K)) return 0;\n    \n    vector<pair<int, int>> nodes;\n    for (int i = 0; i < K; i++) {\n        int a, b; cin >> a >> b;\n        nodes.push_back({a, b});\n    }\n    sort(nodes.begin(), nodes.end());\n    \n    vector<pair<int, int>> path;\n    path.push_back({0, 0});\n    for (auto node : nodes) path.push_back(node);\n    path.push_back({X, Y});\n    \n    long long total = 1;\n    for (size_t i = 0; i < path.size() - 1; i++) {\n        int dx = path[i+1].first - path[i].first;\n        int dy = path[i+1].second - path[i].second;\n        if (dx < 0 || dy < 0) { total = 0; break; }\n        total = (total * nCr(dx + dy, dx)) % MOD;\n    }\n    \n    cout << total << \"\\n\";\n    return 0;\n}\n```",
  },
];
