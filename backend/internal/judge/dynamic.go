package judge

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"codemortem/internal/challenges"
)

// DynamicTestResult holds the outcome of a single dynamically-generated test.
type DynamicTestResult struct {
	TestIndex     int     `json:"testIndex"`
	Verdict       string  `json:"verdict"`        // "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compilation_error"
	VerdictMsg    string  `json:"verdictMsg"`     // human-readable detail from checker
	Input         string  `json:"input"`          // truncated for display
	ExpectedOutput string `json:"expectedOutput"` // from reference solution (truncated)
	ActualOutput  string  `json:"actualOutput"`   // from user's solution (truncated)
	ExecutionMs   int64   `json:"executionMs"`
}

// refBinaryCache caches compiled reference solution binaries by challenge ID.
// Compiled once per server lifetime; safe for concurrent access.
var (
	refBinaryCache   = map[string]string{} // challengeID → path to compiled binary
	refBinaryCacheMu sync.RWMutex
)

// DynamicJudge generates NumTests random inputs via the challenge's generator,
// runs the reference solution to get expected outputs, runs the user's code,
// and then uses the checker to evaluate each test case.
func (c *Client) DynamicJudge(ctx context.Context, langID int, sourceCode string, challenge *challenges.Challenge) ([]DynamicTestResult, error) {
	// ── 1. Compile the user's code (for C++) ──────────────────────────────────
	userBinaryPath, compileErr, err := c.compileUserCode(ctx, langID, sourceCode)
	if err != nil {
		return nil, fmt.Errorf("compile user code: %w", err)
	}
	if compileErr != nil {
		// Return a single compilation error result
		return []DynamicTestResult{{
			TestIndex:  0,
			Verdict:    "compilation_error",
			VerdictMsg: *compileErr,
		}}, nil
	}
	if userBinaryPath != "" {
		defer os.RemoveAll(filepath.Dir(userBinaryPath))
	}

	// ── 2. Compile (or retrieve cached) reference solution ────────────────────
	refBinaryPath, err := c.getOrCompileReference(ctx, challenge)
	if err != nil {
		return nil, fmt.Errorf("compile reference solution: %w", err)
	}

	// ── 3. Write generator and checker to temp files ──────────────────────────
	tmpDir, err := os.MkdirTemp("", "cm_dyn_")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tmpDir)

	genPath := filepath.Join(tmpDir, "generator.py")
	if err := os.WriteFile(genPath, []byte(challenge.GeneratorPy), 0644); err != nil {
		return nil, err
	}
	checkerPath := filepath.Join(tmpDir, "checker.py")
	if err := os.WriteFile(checkerPath, []byte(challenge.CheckerPy), 0644); err != nil {
		return nil, err
	}

	// ── 4. Run all tests concurrently (with semaphore to avoid CPU overload) ──
	type workResult struct {
		idx int
		res DynamicTestResult
		err error
	}

	sem := make(chan struct{}, 4) // at most 4 concurrent tests
	resultCh := make(chan workResult, challenge.NumTests)

	for i := 0; i < challenge.NumTests; i++ {
		i := i
		go func() {
			sem <- struct{}{}
			defer func() { <-sem }()

			res, runErr := c.runSingleDynamicTest(ctx, i, genPath, refBinaryPath, checkerPath, langID, sourceCode, userBinaryPath, challenge)
			resultCh <- workResult{idx: i, res: res, err: runErr}
		}()
	}

	results := make([]DynamicTestResult, challenge.NumTests)
	for range results {
		wr := <-resultCh
		if wr.err != nil {
			results[wr.idx] = DynamicTestResult{
				TestIndex:  wr.idx,
				Verdict:    "runtime_error",
				VerdictMsg: wr.err.Error(),
			}
		} else {
			results[wr.idx] = wr.res
		}
	}

	return results, nil
}

// runSingleDynamicTest runs one test case end-to-end.
func (c *Client) runSingleDynamicTest(
	ctx context.Context,
	seed int,
	genPath, refBinaryPath, checkerPath string,
	langID int,
	sourceCode, userBinaryPath string,
	challenge *challenges.Challenge,
) (DynamicTestResult, error) {
	result := DynamicTestResult{TestIndex: seed}

	// Step A: Generate input
	genCtx, genCancel := context.WithTimeout(ctx, 10*time.Second)
	defer genCancel()
	genCmd := exec.CommandContext(genCtx, "python3", genPath, fmt.Sprint(seed))
	genOut, err := genCmd.Output()
	if err != nil {
		// Try python as fallback (Windows)
		genCmd = exec.CommandContext(genCtx, "python", genPath, fmt.Sprint(seed))
		genOut, err = genCmd.Output()
		if err != nil {
			return result, fmt.Errorf("generator failed (seed %d): %w", seed, err)
		}
	}
	inputStr := string(genOut)
	result.Input = truncate(inputStr, 500)

	// Step B: Run reference solution to get expected output
	refCtx, refCancel := context.WithTimeout(ctx, 10*time.Second)
	defer refCancel()
	refCmd := exec.CommandContext(refCtx, refBinaryPath)
	refCmd.Stdin = strings.NewReader(inputStr)
	refOut, err := refCmd.Output()
	if err != nil {
		return result, fmt.Errorf("reference solution failed (seed %d): %w", seed, err)
	}
	expectedStr := string(refOut)
	result.ExpectedOutput = truncate(expectedStr, 500)

	// Step C: Run user solution
	timeLimitDur := time.Duration(challenge.TimeLimitMs) * time.Millisecond
	userCtx, userCancel := context.WithTimeout(ctx, timeLimitDur+500*time.Millisecond)
	defer userCancel()

	start := time.Now()
	var userOut string
	var userErr error

	if langID == 54 { // C++
		// Use precompiled binary
		userCmd := exec.CommandContext(userCtx, userBinaryPath)
		userCmd.Stdin = strings.NewReader(inputStr)
		var outBuf, errBuf bytes.Buffer
		userCmd.Stdout = &outBuf
		userCmd.Stderr = &errBuf
		userErr = userCmd.Run()
		userOut = outBuf.String()
		result.ExecutionMs = time.Since(start).Milliseconds()

		if userCtx.Err() == context.DeadlineExceeded || result.ExecutionMs > int64(challenge.TimeLimitMs) {
			result.Verdict = "time_limit"
			result.VerdictMsg = fmt.Sprintf("Time limit exceeded (%dms)", result.ExecutionMs)
			return result, nil
		}
		if userErr != nil {
			result.Verdict = "runtime_error"
			result.VerdictMsg = errBuf.String()
			result.ActualOutput = truncate(userOut, 500)
			return result, nil
		}
	} else if langID == 71 { // Python
		userResp, runErr := c.runLocalPython(ctx, &SubmissionRequest{
			SourceCode: sourceCode,
			LanguageID: langID,
			Stdin:      inputStr,
		})
		result.ExecutionMs = time.Since(start).Milliseconds()
		if runErr != nil {
			result.Verdict = "runtime_error"
			result.VerdictMsg = runErr.Error()
			return result, nil
		}
		if userResp.Status.ID == StatusTLE {
			result.Verdict = "time_limit"
			result.VerdictMsg = "Time limit exceeded"
			return result, nil
		}
		if userResp.Status.ID != StatusAccepted && userResp.Stdout == nil {
			stderr := ""
			if userResp.Stderr != nil {
				stderr = *userResp.Stderr
			}
			result.Verdict = "runtime_error"
			result.VerdictMsg = stderr
			return result, nil
		}
		if userResp.Stdout != nil {
			userOut = *userResp.Stdout
		}
	} else {
		return result, fmt.Errorf("language %d not supported for dynamic judging", langID)
	}

	result.ActualOutput = truncate(userOut, 500)

	// Step D: Run checker
	checkerInput := inputStr + "---SECTION---\n" + expectedStr + "---SECTION---\n" + userOut
	checkerCtx, checkerCancel := context.WithTimeout(ctx, 10*time.Second)
	defer checkerCancel()

	checkerCmd := exec.CommandContext(checkerCtx, "python3", checkerPath)
	checkerCmd.Stdin = strings.NewReader(checkerInput)
	var checkerOut bytes.Buffer
	checkerCmd.Stdout = &checkerOut
	checkerErr := checkerCmd.Run()

	checkerMsg := strings.TrimSpace(checkerOut.String())
	if checkerMsg == "" {
		checkerMsg = "No checker output"
	}

	if checkerErr != nil {
		// Exit code 1 = WA, exit code 2 = PE
		if exitErr, ok := checkerErr.(*exec.ExitError); ok {
			switch exitErr.ExitCode() {
			case 1:
				result.Verdict = "wrong_answer"
				result.VerdictMsg = checkerMsg
			case 2:
				result.Verdict = "wrong_answer"
				result.VerdictMsg = "Presentation Error: " + checkerMsg
			default:
				result.Verdict = "runtime_error"
				result.VerdictMsg = "Checker error: " + checkerMsg
			}
		} else {
			result.Verdict = "runtime_error"
			result.VerdictMsg = "Checker crashed"
		}
		return result, nil
	}

	// Try python (Windows fallback) if python3 not found
	if checkerCtx.Err() != nil {
		checkerCmd2 := exec.CommandContext(ctx, "python", checkerPath)
		checkerCmd2.Stdin = strings.NewReader(checkerInput)
		var checkerOut2 bytes.Buffer
		checkerCmd2.Stdout = &checkerOut2
		checkerErr2 := checkerCmd2.Run()
		checkerMsg = strings.TrimSpace(checkerOut2.String())
		if checkerErr2 != nil {
			result.Verdict = "wrong_answer"
			result.VerdictMsg = checkerMsg
			return result, nil
		}
	}

	result.Verdict = "accepted"
	result.VerdictMsg = "Accepted"
	return result, nil
}

// compileUserCode compiles C++ source code and returns (binaryPath, compileErrMsg, error).
// For non-C++ languages, binaryPath is "" and compileErr is nil.
func (c *Client) compileUserCode(ctx context.Context, langID int, sourceCode string) (string, *string, error) {
	if langID != 54 { // only pre-compile C++
		return "", nil, nil
	}

	tmpDir, err := os.MkdirTemp("", "cm_user_")
	if err != nil {
		return "", nil, err
	}

	srcPath := filepath.Join(tmpDir, "main.cpp")
	binPath := filepath.Join(tmpDir, "main")
	if err := os.WriteFile(srcPath, []byte(sourceCode), 0644); err != nil {
		os.RemoveAll(tmpDir)
		return "", nil, err
	}

	compileCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	cmd := exec.CommandContext(compileCtx, "g++", "-O2", "-o", binPath, srcPath)
	out, err := cmd.CombinedOutput()
	if err != nil {
		msg := string(out)
		os.RemoveAll(tmpDir)
		return "", &msg, nil
	}

	return binPath, nil, nil
}

// getOrCompileReference returns the path to the compiled reference binary for a challenge.
// Compiles once and caches the result for the server's lifetime.
func (c *Client) getOrCompileReference(ctx context.Context, challenge *challenges.Challenge) (string, error) {
	refBinaryCacheMu.RLock()
	if path, ok := refBinaryCache[challenge.ID]; ok {
		refBinaryCacheMu.RUnlock()
		return path, nil
	}
	refBinaryCacheMu.RUnlock()

	refBinaryCacheMu.Lock()
	defer refBinaryCacheMu.Unlock()

	// Double-check after acquiring write lock
	if path, ok := refBinaryCache[challenge.ID]; ok {
		return path, nil
	}

	tmpDir, err := os.MkdirTemp("", "cm_ref_"+challenge.ID+"_")
	if err != nil {
		return "", err
	}
	// NOTE: Do NOT defer RemoveAll here — the binary must persist for the server lifetime.

	srcPath := filepath.Join(tmpDir, "ref.cpp")
	binPath := filepath.Join(tmpDir, "ref")
	if err := os.WriteFile(srcPath, []byte(challenge.ReferenceCpp), 0644); err != nil {
		os.RemoveAll(tmpDir)
		return "", err
	}

	compileCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	cmd := exec.CommandContext(compileCtx, "g++", "-O2", "-o", binPath, srcPath)
	out, err := cmd.CombinedOutput()
	if err != nil {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("reference compile failed for %s: %s: %w", challenge.ID, string(out), err)
	}

	refBinaryCache[challenge.ID] = binPath
	return binPath, nil
}

// truncate trims a string to maxLen chars and adds "..." if truncated.
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "...[truncated]"
}
