import type { MCQQuestion, SampleCase, BitPattern, WalkthroughLine } from "./types";

// ─── MCQ Part 1 ───────────────────────────────────────────────────────────────
// Tests: two's complement, operator truth tables, shift edge cases

export const MCQ_PART_1: MCQQuestion[] = [
  {
    id: 1,
    question: "What is the two's complement representation of -13 in 8-bit binary?",
    options: [
      "10001101",
      "11110011",
      "11110010",
      "10001100",
    ],
    answer: 1,
    explanation:
      "13 in binary is 00001101. To get -13: flip all bits → 11110010, then add 1 → 11110011.",
  },
  {
    id: 2,
    question: "What is the result of 0b01011 & 0b10110?",
    options: ["0b00010", "0b11111", "0b01010", "0b10001"],
    answer: 0,
    explanation:
      "AND only produces 1 where BOTH bits are 1. Comparing bit-by-bit: only position 1 has two 1s, giving 00010 = 2.",
  },
  {
    id: 3,
    question: "What is the result of 0b01011 | 0b10110?",
    options: ["0b00001", "0b11111", "0b01010", "0b11100"],
    answer: 1,
    explanation:
      "OR produces 1 wherever EITHER bit is 1. Every position has at least one 1, giving 11111 = 31.",
  },
  {
    id: 4,
    question: "What is the result of 1 << 31 on a 32-bit signed integer?",
    options: [
      "2147483648 (positive)",
      "-2147483648 (INT_MIN)",
      "0",
      "Undefined behaviour in C++",
    ],
    answer: 3,
    explanation:
      "In C++, left-shifting into the sign bit of a signed integer is undefined behaviour. Use unsigned types (1u << 31) to safely get 2147483648.",
  },
  {
    id: 5,
    question: "For a positive integer n, what does n >> k compute?",
    options: [
      "n multiplied by 2^k",
      "n divided by 2^k (floor division)",
      "n XOR 2^k",
      "n modulo 2^k",
    ],
    answer: 1,
    explanation:
      "Right-shifting by k is equivalent to dividing by 2^k and discarding the remainder (floor division), as long as n is non-negative.",
  },
];

// ─── MCQ Part 2 ───────────────────────────────────────────────────────────────
// Tests: masking idioms, XOR cancellation, popcount, submask enumeration

export const MCQ_PART_2: MCQQuestion[] = [
  {
    id: 6,
    question: "Which expression correctly sets bit k in an integer n?",
    options: ["n &= (1 << k)", "n |= (1 << k)", "n ^= (1 << k)", "n >>= k"],
    answer: 1,
    explanation:
      "ORing with a mask that has only bit k set forces that bit to 1 without affecting any other bits.",
  },
  {
    id: 7,
    question: "You XOR all elements in [3, 5, 3, 7, 5]. What is the result?",
    options: ["3", "7", "5", "0"],
    answer: 1,
    explanation:
      "3^3 = 0, 5^5 = 0, leaving only 7. XOR is commutative and associative, and a^a = 0 always.",
  },
  {
    id: 8,
    question: "What is the time complexity of Kernighan's popcount algorithm on an integer n?",
    options: ["O(log n)", "O(number of set bits in n)", "O(32)", "O(1)"],
    answer: 1,
    explanation:
      "Each iteration of the loop clears exactly one set bit (using n & (n-1)), so it runs exactly as many times as there are set bits.",
  },
  {
    id: 9,
    question: "Given mask = 0b10110, the classic submask enumeration loop `for(int s = mask; s > 0; s = (s-1) & mask)` produces how many values of s (including mask itself)?",
    options: ["4", "8", "3", "5"],
    answer: 0,
    explanation:
      "mask = 10110 has 3 set bits, so it has 2^3 = 8 submasks total. Excluding the empty submask (0), the loop produces 4 non-zero submasks: 10110, 10100, 00110, 00100.",
  },
  {
    id: 10,
    question: "n & (n-1) has what effect on the binary representation of n?",
    options: [
      "Sets the lowest set bit",
      "Clears the lowest set bit",
      "Isolates the lowest set bit",
      "Flips all bits below the lowest set bit",
    ],
    answer: 1,
    explanation:
      "Subtracting 1 from n flips the lowest set bit and all bits below it. ANDing with n preserves everything above and clears the flipped region, effectively removing the lowest set bit.",
  },
];

// ─── Sample Test Cases ────────────────────────────────────────────────────────

export const SAMPLE_TEST_CASES: Record<string, SampleCase[]> = {
  challenge1: [
    { input: "7",  expected: "odd",  label: "N = 7" },
    { input: "4",  expected: "even", label: "N = 4" },
    { input: "0",  expected: "even", label: "N = 0" },
    { input: "-3", expected: "odd",  label: "N = -3" },
    { input: "1000000000", expected: "even", label: "N = 10^9" },
  ],
  challenge2: [
    { input: "8",  expected: "yes", label: "N = 8" },
    { input: "6",  expected: "no",  label: "N = 6" },
    { input: "0",  expected: "no",  label: "N = 0 (edge case)" },
    { input: "1",  expected: "yes", label: "N = 1 = 2^0" },
    { input: "1073741824", expected: "yes", label: "N = 2^30" },
  ],
  challenge3: [
    { input: "29 1 3", expected: "19",  label: "N=29, L=1, R=3" },
    { input: "0 0 7",  expected: "255", label: "Flip all 8 bits" },
    { input: "255 0 7", expected: "0",  label: "Flip 255 back to 0" },
    { input: "1 0 0",   expected: "0",  label: "Flip only bit 0" },
    { input: "100 2 5", expected: "92", label: "N=100, L=2, R=5" },
  ],
  challenge4: [
    { input: "5\n4 1 2 1 2", expected: "4", label: "[4,1,2,1,2] → 4" },
    { input: "1\n99",         expected: "99", label: "Single element" },
    { input: "7\n1 2 3 4 3 2 1", expected: "4", label: "7 elements" },
    { input: "3\n1000000000 1 1000000000", expected: "1", label: "Large values" },
  ],
  challenge5: [
    { input: "6\n3 10 5 25 2 8",    expected: "28", label: "25 XOR 5 = 28" },
    { input: "2\n0 0",               expected: "0",  label: "All zeros" },
    { input: "2\n1 2",               expected: "3",  label: "1 XOR 2 = 3" },
    { input: "3\n7 7 7",             expected: "0",  label: "All same" },
    { input: "4\n14 70 53 9",        expected: "79", label: "14 XOR 70 isn't max" },
    { input: "2\n255 0",             expected: "255", label: "255 XOR 0 = 255" },
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

export const BIT_CHALLENGES: ChallengeData[] = [
  {
    id: "challenge1",
    backendId: "odd_even",
    title: "Odd or Even",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement:
      "Given an integer N, print \"odd\" if N is odd, or \"even\" if N is even. You may not use the modulo (%) or division (/) operator.",
    constraints: "-10^9 ≤ N ≤ 10^9",
    inputFormat: "A single integer N.",
    outputFormat: "Print \"odd\" or \"even\" (without quotes).",
    hints: [
      "Think about what the last (least significant) bit of any integer tells you.",
      "AND the number with 1. What does the result mean?",
      "If (N & 1) equals 1, the number is odd. If it equals 0, it's even.",
    ],
    editorial:
      "The least significant bit of any integer is 1 if the number is odd and 0 if even. This follows directly from binary place values: 2^0 = 1, and all higher powers of 2 are even. So (N & 1) gives the parity in a single CPU instruction — no division or modulo needed.",
  },
  {
    id: "challenge2",
    backendId: "power_of_two",
    title: "Power of Two",
    difficulty: "Easy",
    diffColor: "var(--cm-green)",
    statement:
      "Given a non-negative integer N, determine if it is a power of two. Print \"yes\" or \"no\".",
    constraints: "0 ≤ N ≤ 10^9",
    inputFormat: "A single integer N.",
    outputFormat: "Print \"yes\" or \"no\" (without quotes).",
    hints: [
      "Think about what powers of two look like in binary: 1 (1), 2 (10), 4 (100), 8 (1000)...",
      "A power of two has exactly one bit set. What happens when you subtract 1 from it?",
      "If N > 0 and (N & (N-1)) == 0, then N is a power of two. Subtracting 1 from a power-of-two flips that single bit and sets all lower bits, so AND gives zero.",
    ],
    editorial:
      "Powers of two have exactly one bit set in their binary representation. Subtracting 1 from such a number flips that bit to 0 and sets all lower bits to 1, so ANDing the original with (N-1) gives zero. The N > 0 guard is necessary because 0 satisfies the expression but is not a power of two.",
  },
  {
    id: "challenge3",
    backendId: "flip_bits_range",
    title: "Flip Bits in a Range",
    difficulty: "Easy-Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "Given an integer N and two 0-indexed bit positions L and R (0 = rightmost bit), flip all bits in N from position L to position R inclusive. Print the resulting integer.",
    constraints: "0 ≤ N ≤ 10^9, 0 ≤ L ≤ R ≤ 30",
    inputFormat: "A single line containing three integers: N L R.",
    outputFormat: "Print the resulting integer after flipping bits L through R.",
    hints: [
      "To flip a bit you use XOR. To flip a range of bits you need a mask that has 1s exactly from position L to R.",
      "Build the mask with ((1 << (R - L + 1)) - 1) << L. This creates R-L+1 ones starting at position L.",
      "XOR N with the mask: N ^ mask. XOR with 1 toggles a bit; XOR with 0 leaves it unchanged.",
    ],
    editorial:
      "Construct a mask with 1s in positions L through R using ((1LL << (R-L+1)) - 1) << L. The inner expression ((1<<(R-L+1))-1) creates a number with R-L+1 consecutive 1s starting at bit 0. Shifting left by L positions them at bits L through R. XORing N with this mask flips exactly those bits. Use long long to avoid overflow for large L and R values.",
  },
  {
    id: "challenge4",
    backendId: "single_number",
    title: "Single Number",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "Given an array of N integers where every element appears exactly twice except for one element which appears exactly once, find and print the element that appears only once.",
    constraints: "1 ≤ N ≤ 10^5, N is always odd, 1 ≤ values ≤ 10^9",
    inputFormat: "First line: N. Second line: N space-separated integers.",
    outputFormat: "Print the single non-duplicate element.",
    hints: [
      "Think about what XOR does when you apply it to two identical numbers.",
      "Since a ^ a = 0 and a ^ 0 = a, what happens if you XOR every number in the array together?",
      "All pairs cancel out to 0. The only number left is the one that appeared once. XOR all elements together and that is your answer.",
    ],
    editorial:
      "XOR is commutative and associative, and a ^ a = 0 for any integer a. XORing the entire array together causes every duplicate pair to cancel out, leaving only the single non-duplicate element. This solution runs in O(N) time with O(1) extra space — far better than sorting (O(N log N)) or a hash map (O(N) space).",
  },
  {
    id: "challenge5",
    backendId: "max_xor_pair",
    title: "Maximum XOR Pair",
    difficulty: "Medium",
    diffColor: "var(--cm-yellow)",
    statement:
      "Given an array of N integers, find the maximum XOR value obtainable from any two elements in the array. (You may use the same element twice only if N = 1.)",
    constraints: "1 ≤ N ≤ 10^5, 0 ≤ values < 2^31",
    inputFormat: "First line: N. Second line: N space-separated integers.",
    outputFormat: "Print the maximum XOR value.",
    hints: [
      "A brute force O(N^2) check of all pairs is correct but too slow for N = 10^5. Think about building the answer one bit at a time, from the most significant bit down.",
      "At each bit position, ask: can this bit be 1 in the final answer? To check, look at the prefixes of all numbers up to this bit.",
      "Use a set of prefixes. For each prefix p in the set, check if p XOR candidate also exists in the set. If any such pair exists, this bit can be set in the answer. Commit the bit and move to the next.",
    ],
    editorial:
      "Build the answer greedily from bit 30 down to bit 0. At each step, tentatively set this bit in the answer (candidate = ans | (1 << bit)). Extract the prefix of every number at the current bit width using a mask, store them in a set, and check whether any two prefixes XOR to the candidate. If yes, commit this bit. This greedy works because if high bits can be 1, there is no reason to leave them as 0. Time complexity is O(N · 31) with O(N) space.",
  },
];

// ─── Bit Patterns (Lesson 8) ──────────────────────────────────────────────────

export const BIT_PATTERNS: BitPattern[] = [
  {
    id: "power2_check",
    title: "Power-of-two check",
    expression: "n > 0 && !(n & (n - 1))",
    example: "n=8 (1000): (1000 & 0111) = 0 → yes. n=6 (0110): (0110 & 0101) = 0100 ≠ 0 → no.",
    explanation: "Subtracting 1 from a power of 2 flips its single set bit and all lower bits. ANDing gives zero. The n > 0 guard excludes 0.",
  },
  {
    id: "lowest_set",
    title: "Isolate lowest set bit",
    expression: "n & (-n)",
    example: "n=12 (1100): -12 in two's complement = 0100. 1100 & 0100 = 0100 (value 4).",
    explanation: "-n in two's complement flips all bits and adds 1, which propagates carry up to the lowest set bit. ANDing isolates just that bit.",
  },
  {
    id: "clear_lowest",
    title: "Clear lowest set bit",
    expression: "n & (n - 1)",
    example: "n=12 (1100): n-1 = 1011. 1100 & 1011 = 1000.",
    explanation: "Subtracting 1 flips the lowest set bit and all bits below it. ANDing with the original clears those positions.",
  },
  {
    id: "round_up_pow2",
    title: "Round up to next power of 2",
    expression: "if(n && !(n&(n-1))) return n; // already power of 2\n--n; n|=n>>1; n|=n>>2; n|=n>>4; n|=n>>8; n|=n>>16; return ++n;",
    example: "n=5: after OR-shifts → 0111 (7), then +1 → 8.",
    explanation: "First handle the exact power-of-2 case. Otherwise, OR with right-shifted versions sets all bits below the highest, giving 2^k - 1. Adding 1 carries all the way to give 2^k.",
  },
  {
    id: "sign_extract",
    title: "Extract sign bit",
    expression: "(n >> 31) & 1",
    example: "n = -5: binary starts with 1 (MSB). Shift right 31 → all 1s (arithmetic shift). AND with 1 → 1.",
    explanation: "Arithmetic right-shift replicates the sign bit. Shifting by 31 fills all positions with the sign bit; ANDing with 1 extracts just the sign.",
  },
  {
    id: "branchless_abs",
    title: "Branchless absolute value",
    expression: "int mask = n >> 31; (n + mask) ^ mask",
    example: "n=-5: mask=0xFFFFFFFF (-1). (-5 + -1) ^ -1 = -6 ^ -1 = 5.",
    explanation: "For negative n, mask = -1 (all 1s). (n - 1) XOR -1 flips all bits of (n-1), which equals -n. For positive n, mask = 0, so the expression returns n unchanged.",
  },
  {
    id: "branchless_min",
    title: "Branchless min",
    expression: "b ^ ((a ^ b) & -(a < b))",
    example: "a=3, b=7: a<b is 1, -(1)=0xFF...FF. (3^7) & 0xFF...FF = 4. 7 ^ 4 = 3.",
    explanation: "-(a < b) evaluates to all-1s if a < b, else all-0s. ANDing with (a^b) either keeps or zeroes the XOR. XORing with b then gives either a or b.",
  },
  {
    id: "count_set_bits",
    title: "Count set bits (Kernighan)",
    expression: "int cnt = 0; while(n) { n &= (n-1); cnt++; }",
    example: "n=12 (1100): step 1 → 1000, step 2 → 0000. cnt = 2.",
    explanation: "Each iteration removes exactly the lowest set bit using n & (n-1). Counting iterations gives the total number of set bits. Time complexity is O(set bits).",
  },
  {
    id: "swap_no_temp",
    title: "Swap without a temp variable",
    expression: "a ^= b; b ^= a; a ^= b;",
    example: "a=5 (101), b=3 (011): a=110(6), b=011^110=101(5), a=110^101=011(3). Swapped.",
    explanation: "Uses the XOR property a ^ b ^ b = a. After three steps a and b hold each other's original values. Note: this fails if a and b alias the same memory location.",
  },
  {
    id: "toggle_case",
    title: "Toggle ASCII letter case",
    expression: "c ^= 32",
    example: "'A' (65) ^ 32 = 97 ('a'). 'a' (97) ^ 32 = 65 ('A').",
    explanation: "Bit 5 (value 32) is the only difference between uppercase and lowercase ASCII letters. XORing with 32 flips exactly that bit, toggling the case.",
  },
  {
    id: "check_bit",
    title: "Check if bit k is set",
    expression: "(n >> k) & 1",
    example: "n=12 (1100), k=3: 1100 >> 3 = 0001. 0001 & 1 = 1 (set).",
    explanation: "Shifting n right by k moves bit k into position 0. ANDing with 1 extracts just that bit. Result is 1 if set, 0 if cleared.",
  },
  {
    id: "bit_reversal",
    title: "Reverse bits (32-bit)",
    expression: "uint32_t rev(uint32_t n) { uint32_t r=0; for(int i=0;i<32;i++) { r=(r<<1)|(n&1); n>>=1; } return r; }",
    example: "n=0b...00000001 → r = 0b10000000...0 (MSB becomes LSB).",
    explanation: "Each iteration extracts the LSB of n and appends it to r. After 32 iterations, r holds the fully reversed bit pattern.",
  },
];

// ─── Walkthrough Lines (Lesson 9 — Maximum XOR Pair solution) ────────────────

export const WALKTHROUGH_LINES_CPP: WalkthroughLine[] = [
  { lineNum: 1, code: "#pragma GCC target(\"popcnt\")", explanation: "Enables hardware popcount instruction. Good habit for bit manipulation submissions in competitive programming.", type: "comment" },
  { lineNum: 2, code: "#include <bits/stdc++.h>", explanation: "Includes all standard C++ headers. Contains set, vector, and all bit utility functions.", type: "keyword" },
  { lineNum: 3, code: "using namespace std;", explanation: "Avoids prefixing every standard library call with std::.", type: "normal" },
  { lineNum: 4, code: "int main() {", explanation: "Entry point of the program.", type: "keyword" },
  { lineNum: 5, code: "    ios_base::sync_with_stdio(false); cin.tie(NULL);", explanation: "Disables sync between C-style and C++-style I/O for faster input. Essential for large inputs.", type: "highlight" },
  { lineNum: 6, code: "    int n; cin >> n;", explanation: "Read the array size N.", type: "normal" },
  { lineNum: 7, code: "    vector<long long> a(n);", explanation: "Use long long to safely hold values up to 2^31 - 1 without overflow.", type: "highlight" },
  { lineNum: 8, code: "    for (auto& x : a) cin >> x;", explanation: "Read all N elements into the array.", type: "normal" },
  { lineNum: 9, code: "    long long ans = 0;", explanation: "Will accumulate the maximum XOR bit by bit, starting from 0.", type: "highlight" },
  { lineNum: 10, code: "    for (int bit = 30; bit >= 0; bit--) {", explanation: "Iterate from the most significant bit (2^30 ≈ 10^9) down to bit 0. We try to set each bit greedily.", type: "keyword" },
  { lineNum: 11, code: "        long long candidate = ans | (1LL << bit);", explanation: "Tentatively set this bit in the answer. We will check if it is achievable.", type: "highlight" },
  { lineNum: 12, code: "        long long mask = (1LL << (bit + 1)) - 1;", explanation: "Create a mask covering bits 0 through 'bit'. This extracts the prefix of each number at the current resolution.", type: "highlight" },
  { lineNum: 13, code: "        set<long long> prefixes;", explanation: "Store the masked prefix of every number. Using a set enables O(log N) lookup.", type: "normal" },
  { lineNum: 14, code: "        for (long long x : a) prefixes.insert(x & mask);", explanation: "Extract and store the prefix of each number at the current bit level.", type: "normal" },
  { lineNum: 15, code: "        bool found = false;", explanation: "Flag: can two prefixes XOR to the candidate?", type: "normal" },
  { lineNum: 16, code: "        for (long long p : prefixes) {", explanation: "For each prefix p, check if a complement prefix exists in the set.", type: "keyword" },
  { lineNum: 17, code: "            if (prefixes.count(p ^ candidate)) {", explanation: "If p ^ candidate is also a prefix, then p XOR (p ^ candidate) = candidate is achievable. The bit can be set.", type: "highlight" },
  { lineNum: 18, code: "                found = true; break;", explanation: "We found a valid pair. No need to check further.", type: "normal" },
  { lineNum: 19, code: "            }", explanation: "End of inner if.", type: "normal" },
  { lineNum: 20, code: "        }", explanation: "End of prefix loop.", type: "normal" },
  { lineNum: 21, code: "        if (found) ans = candidate;", explanation: "Commit the bit to the answer. Greedy: if a higher bit can be 1, it is always better to set it.", type: "highlight" },
  { lineNum: 22, code: "    }", explanation: "Move to the next lower bit.", type: "normal" },
  { lineNum: 23, code: "    cout << ans << \"\\n\";", explanation: "Print the maximum XOR value.", type: "normal" },
  { lineNum: 24, code: "}", explanation: "End of main.", type: "keyword" },
];

export const WALKTHROUGH_LINES_PYTHON: WalkthroughLine[] = [
  { lineNum: 1, code: "import sys", explanation: "Import sys for faster stdin reading.", type: "keyword" },
  { lineNum: 2, code: "input = sys.stdin.readline", explanation: "Override the built-in input() with readline for speed — crucial in Python competitive programming.", type: "highlight" },
  { lineNum: 3, code: "n = int(input())", explanation: "Read array size N.", type: "normal" },
  { lineNum: 4, code: "a = list(map(int, input().split()))", explanation: "Read all N numbers from the second line.", type: "normal" },
  { lineNum: 5, code: "ans = 0", explanation: "Accumulate the maximum XOR bit by bit.", type: "highlight" },
  { lineNum: 6, code: "for bit in range(30, -1, -1):", explanation: "Iterate from bit 30 down to bit 0, greedily setting each bit.", type: "keyword" },
  { lineNum: 7, code: "    candidate = ans | (1 << bit)", explanation: "Tentatively set this bit in our answer.", type: "highlight" },
  { lineNum: 8, code: "    mask = (1 << (bit + 1)) - 1", explanation: "Mask to extract the relevant prefix of each number at this bit width.", type: "highlight" },
  { lineNum: 9, code: "    prefixes = {x & mask for x in a}", explanation: "Compute the set of all prefixes. Set comprehension runs in O(N).", type: "highlight" },
  { lineNum: 10, code: "    if any(p ^ candidate in prefixes for p in prefixes):", explanation: "Check if any two prefixes XOR to the candidate. Python's 'any' short-circuits on the first match.", type: "highlight" },
  { lineNum: 11, code: "        ans = candidate", explanation: "Commit this bit — it is achievable.", type: "normal" },
  { lineNum: 12, code: "print(ans)", explanation: "Output the maximum XOR value.", type: "normal" },
];
