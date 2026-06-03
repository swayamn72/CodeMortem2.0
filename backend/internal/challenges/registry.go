// Package challenges provides a modular, pluggable registry of learning-path
// coding challenges. Each challenge defines:
//   - A Python generator that produces varied test inputs given a numeric seed.
//   - A C++ reference solution that computes the correct output.
//   - A Python checker that validates user output (token-by-token by default,
//     or custom logic for problems with multiple valid answers).
//
// Adding a new challenge requires only creating a new Go file that calls
// Register() during package init — no database migrations, no route changes.
package challenges

import "fmt"

// Challenge describes a single coding challenge in the learning path.
type Challenge struct {
	// ID is the stable identifier used in API requests (e.g. "sum_segment_tree").
	ID string

	// Name is the human-readable title shown in the UI.
	Name string

	// CourseSlug groups challenges into a course (e.g. "segment-tree").
	CourseSlug string

	// GeneratorPy is Python 3 source code.
	// It reads a single integer seed from sys.argv[1] and prints the test input
	// to stdout. The seed ranges from 0 to NumTests-1.
	GeneratorPy string

	// ReferenceCpp is a correct C++ solution (compiled once at first use).
	// It reads from stdin (the generated input) and writes the expected output
	// to stdout.
	ReferenceCpp string

	// CheckerPy is Python 3 source code that validates the user's output.
	// It receives three arguments via stdin, separated by "---SECTION---\n":
	//   Section 1: the generated input
	//   Section 2: the expected output (from reference solution)
	//   Section 3: the user's actual output
	// Exit codes: 0 = Accepted, 1 = Wrong Answer, 2 = Presentation Error.
	// stdout of the checker is used as the verdict message shown to the user.
	CheckerPy string

	// NumTests is the number of random tests generated per submission.
	NumTests int

	// TimeLimitMs is the per-test execution time limit for the user's solution.
	TimeLimitMs int

	// MemLimitKB is the memory limit for the user's solution in kilobytes.
	MemLimitKB int
}

var registry = map[string]*Challenge{}

// Register adds a challenge to the global registry.
// Panics if a challenge with the same ID is registered twice (programming error).
func Register(c *Challenge) {
	if c.NumTests <= 0 {
		c.NumTests = 10
	}
	if c.TimeLimitMs <= 0 {
		c.TimeLimitMs = 2000
	}
	if c.MemLimitKB <= 0 {
		c.MemLimitKB = 262144 // 256 MB
	}
	if _, exists := registry[c.ID]; exists {
		panic(fmt.Sprintf("challenges: duplicate challenge ID %q", c.ID))
	}
	registry[c.ID] = c
}

// Get retrieves a challenge by ID. Returns nil, false if not found.
func Get(id string) (*Challenge, bool) {
	c, ok := registry[id]
	return c, ok
}

// All returns all registered challenges, keyed by ID.
func All() map[string]*Challenge {
	out := make(map[string]*Challenge, len(registry))
	for k, v := range registry {
		out[k] = v
	}
	return out
}
