import type { ChallengeConfig } from "@/components/course/types";

export const BM_PREMIUM_CHALLENGES: Record<string, ChallengeConfig> = {
  "practice-bm-1": {
    id: "practice-bm-1",
    backendId: "practice-bm-1",
    title: "Count Set Bits from 1 to N",
    difficulty: "Easy",
    diffColor: "#00ff88",
    statement: `Given an integer N, return the total number of set bits (1s) in the binary representations of all integers from 1 to N (inclusive).

Example: numbers 1 to 5:
  1 = 1   → 1 set bit
  2 = 10  → 1 set bit
  3 = 11  → 2 set bits
  4 = 100 → 1 set bit
  5 = 101 → 2 set bits
Total = 7`,
    inputFormat: "A single integer N (1 ≤ N ≤ 10^9).",
    outputFormat: "A single integer — the total count of set bits from 1 to N.",
    constraints: "1 ≤ N ≤ 10^9\nTime limit: O(log N)",
    sampleCases: [
      { input: "5", expected: "7", label: "Example 1" },
      { input: "7", expected: "12", label: "Example 2" },
    ],
    hints: [
      "Think about each bit position independently.",
      "For bit position k, how many numbers from 1..N have bit k set? It follows a pattern of 2^k.",
      "Count per bit: (N+1) / (2^(k+1)) full cycles plus min(N mod 2^(k+1), 2^k) remainder.",
    ],
    editorial: `**Approach: Bit-by-bit contribution**

For each bit position k, count how many numbers from 1 to N have that bit set. In every block of 2^(k+1) consecutive integers, exactly 2^k have bit k set.

- Full cycles: (N+1) / 2^(k+1), each contributing 2^k set bits
- Remainder: max(0, (N+1) mod 2^(k+1) - 2^k)

Sum over all k from 0 to 30.

**Time:** O(log N)

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
long long countBits(long long n) {
    long long count = 0;
    for (long long bit = 1; bit <= n; bit <<= 1) {
        long long full = (n + 1) / (bit << 1);
        long long rem  = max(0LL, (n + 1) % (bit << 1) - bit);
        count += full * bit + rem;
    }
    return count;
}
int main() {
    long long n; cin >> n;
    cout << countBits(n) << endl;
}
\`\`\`

\`\`\`python
def count_bits(n):
    count = 0
    bit = 1
    while bit <= n:
        full = (n + 1) // (bit * 2)
        rem  = max(0, (n + 1) % (bit * 2) - bit)
        count += full * bit + rem
        bit <<= 1
    return count

n = int(input())
print(count_bits(n))
\`\`\``,
    nextLesson: "practice-bm-2",
    nextLabel: "Next: Swap Without Temp →",
  },

  "practice-bm-2": {
    id: "practice-bm-2",
    backendId: "practice-bm-2",
    title: "Swap Without Temp Variable",
    difficulty: "Easy",
    diffColor: "#00ff88",
    statement: `Given two integers A and B, swap their values using only bitwise XOR — no temporary variable or arithmetic operations.

Print the swapped values on a single line separated by a space.`,
    inputFormat: "Two integers A and B on a single line.",
    outputFormat: "Two integers B A (swapped) on a single line.",
    constraints: "-10^9 ≤ A, B ≤ 10^9",
    sampleCases: [
      { input: "3 5", expected: "5 3" },
      { input: "-7 12", expected: "12 -7" },
    ],
    hints: [
      "XOR has the property: X ^ X = 0 and X ^ 0 = X.",
      "Try: A = A ^ B, then B = A ^ B, then A = A ^ B.",
      "Trace through with A=3, B=5 to verify.",
    ],
    editorial: `**The XOR swap trick**

1. A = A ^ B     → A now holds A⊕B
2. B = A ^ B     → B = (A⊕B) ⊕ B = A
3. A = A ^ B     → A = (A⊕B) ⊕ A = B

Warning: fails if A and B reference the same memory location (self-XOR → 0).

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int a, b; cin >> a >> b;
    a ^= b; b ^= a; a ^= b;
    cout << a << " " << b << endl;
}
\`\`\`

\`\`\`python
a, b = map(int, input().split())
a ^= b; b ^= a; a ^= b
print(a, b)
\`\`\``,
    nextLesson: "practice-bm-3",
    nextLabel: "Next: Reverse Bits →",
  },

  "practice-bm-3": {
    id: "practice-bm-3",
    backendId: "practice-bm-3",
    title: "Reverse Bits of a 32-bit Integer",
    difficulty: "Medium",
    diffColor: "#ffd700",
    statement: `Reverse the bits of a given 32-bit unsigned integer and return the result as an unsigned decimal integer.

43261596 in binary is 00000010100101000001111010011100.
Reversed: 00111001011110000010100101000000 = 964176192.`,
    inputFormat: "A single non-negative integer N (0 ≤ N < 2^32).",
    outputFormat: "A single integer — the reversed-bits interpretation.",
    constraints: "0 ≤ N < 2^32",
    sampleCases: [
      { input: "43261596", expected: "964176192" },
    ],
    hints: [
      "Process each of the 32 bits one at a time from LSB.",
      "Shift result left and OR in the current LSB of N.",
      "Then shift N right to move to the next bit.",
    ],
    editorial: `**Shift and OR 32 times**

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    unsigned int n; cin >> n;
    unsigned int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);
        n >>= 1;
    }
    cout << result << endl;
}
\`\`\`

\`\`\`python
n = int(input())
result = 0
for _ in range(32):
    result = (result << 1) | (n & 1)
    n >>= 1
print(result)
\`\`\``,
    nextLesson: "practice-bm-4",
    nextLabel: "Next: Max XOR →",
  },

  "practice-bm-4": {
    id: "practice-bm-4",
    backendId: "practice-bm-4",
    title: "Maximum XOR of Two Numbers",
    difficulty: "Medium",
    diffColor: "#ffd700",
    statement: `Given an array of non-negative integers, find the maximum XOR value obtainable from any two elements in the array.

Solve it in O(N × 32) time.`,
    inputFormat: "First line: N (1 ≤ N ≤ 10^5)\nSecond line: N space-separated integers (0 ≤ a[i] ≤ 10^9).",
    outputFormat: "A single integer — the maximum XOR.",
    constraints: "1 ≤ N ≤ 10^5\n0 ≤ a[i] ≤ 10^9",
    sampleCases: [
      { input: "4\n3 10 5 25", expected: "28", explanation: "25 XOR 5 = 28" },
      { input: "2\n0 0", expected: "0" },
    ],
    hints: [
      "Build the answer bit by bit from the MSB (bit 31) down.",
      "At bit k, greedily try to set it to 1 in the answer.",
      "Use a hash set of k-bit prefixes. Check if any two prefixes XOR to the candidate answer.",
    ],
    editorial: `**Greedy bit-by-bit with hash set**

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    int ans = 0, mask = 0;
    for (int i = 31; i >= 0; i--) {
        mask |= (1 << i);
        unordered_set<int> s;
        for (int x : a) s.insert(x & mask);
        int cand = ans | (1 << i);
        for (int p : s)
            if (s.count(p ^ cand)) { ans = cand; break; }
    }
    cout << ans << endl;
}
\`\`\`

\`\`\`python
n = int(input())
a = list(map(int, input().split()))
ans = mask = 0
for i in range(31, -1, -1):
    mask |= (1 << i)
    prefixes = {x & mask for x in a}
    cand = ans | (1 << i)
    if any((p ^ cand) in prefixes for p in prefixes):
        ans = cand
print(ans)
\`\`\``,
    nextLesson: "practice-bm-5",
    nextLabel: "Next: Longest Consecutive 1s →",
  },

  "practice-bm-5": {
    id: "practice-bm-5",
    backendId: "practice-bm-5",
    title: "Longest Consecutive 1s",
    difficulty: "Easy",
    diffColor: "#00ff88",
    statement: `Given a non-negative integer N, find the length of the longest consecutive sequence of 1-bits in its binary representation.

13 = 1101₂ — longest run is 2 (the top two bits).`,
    inputFormat: "A single non-negative integer N (0 ≤ N ≤ 10^18).",
    outputFormat: "A single integer — the length of the longest run of 1s.",
    constraints: "0 ≤ N ≤ 10^18",
    sampleCases: [
      { input: "13", expected: "2" },
      { input: "255", expected: "8" },
      { input: "0", expected: "0" },
    ],
    hints: [
      "Repeatedly compute N = N & (N >> 1).",
      "Each iteration removes the rightmost 1 from every consecutive run.",
      "Count iterations until N = 0.",
    ],
    editorial: `**N & (N >> 1) trick**

Each step shortens every run of 1s by one. Count steps until N becomes 0.

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    long long n; cin >> n;
    int count = 0;
    while (n) { n &= (n >> 1); count++; }
    cout << count << endl;
}
\`\`\`

\`\`\`python
n = int(input())
count = 0
while n:
    n &= (n >> 1)
    count += 1
print(count)
\`\`\``,
    nextLesson: "practice-bm-6",
    nextLabel: "Next: Power Set →",
  },

  "practice-bm-6": {
    id: "practice-bm-6",
    backendId: "practice-bm-6",
    title: "Power Set via Bitmask",
    difficulty: "Medium",
    diffColor: "#ffd700",
    statement: `Given a set of N distinct integers, print all 2^N subsets. Each subset should be printed on a separate line, elements space-separated. Print an empty line for the empty subset.

N ≤ 20 so 2^20 ≈ 1M subsets is acceptable.`,
    inputFormat: "First line: N\nSecond line: N distinct space-separated integers.",
    outputFormat: "2^N lines (empty line for empty subset).",
    constraints: "1 ≤ N ≤ 20",
    sampleCases: [
      {
        input: "2\n1 2",
        expected: "\n1\n2\n1 2",
        label: "Subsets of {1,2}",
      },
    ],
    hints: [
      "Iterate mask from 0 to 2^N - 1.",
      "For each mask, bit i set means element i is included.",
      "Print elements whose corresponding bit is 1.",
    ],
    editorial: `**Enumerate all 2^N masks**

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool first = true;
        for (int i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                if (!first) cout << " ";
                cout << a[i];
                first = false;
            }
        }
        cout << "\\n";
    }
}
\`\`\`

\`\`\`python
n = int(input())
a = list(map(int, input().split()))
for mask in range(1 << n):
    print(*[a[i] for i in range(n) if mask & (1 << i)])
\`\`\``,
    nextLesson: "practice-bm-1",
    nextLabel: "Back to start",
  },
};

export const BM_PREMIUM_CHALLENGE_LIST = Object.values(BM_PREMIUM_CHALLENGES);
