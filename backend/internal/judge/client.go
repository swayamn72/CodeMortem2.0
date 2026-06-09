package judge

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"codemortem/internal/config"
)

// Language maps language names to Judge0 language IDs.
var Language = map[string]int{
	"cpp":        54, // C++ (GCC 9.2.0)
	"c":          50, // C (GCC 9.2.0)
	"python":     71, // Python 3
	"java":       62, // Java (OpenJDK 13)
	"go":         60, // Go (1.13.5)
	"rust":       73, // Rust (1.40.0)
	"javascript": 63, // JavaScript (Node.js 12.14.0)
}

// SubmissionRequest is the payload sent to Judge0.
type SubmissionRequest struct {
	SourceCode     string  `json:"source_code"`
	LanguageID     int     `json:"language_id"`
	Stdin          string  `json:"stdin,omitempty"`
	ExpectedOutput string  `json:"expected_output,omitempty"`
	CPUTimeLimit   float64 `json:"cpu_time_limit,omitempty"`
	WallTimeLimit  float64 `json:"wall_time_limit,omitempty"`
	MemoryLimit    int     `json:"memory_limit,omitempty"` // KB
}

// SubmissionResponse is the response from Judge0.
type SubmissionResponse struct {
	Token         string   `json:"token"`
	Stdout        *string  `json:"stdout"`
	Stderr        *string  `json:"stderr"`
	CompileOutput *string  `json:"compile_output"`
	Message       *string  `json:"message"`
	Status        Status   `json:"status"`
	Time          *string  `json:"time"`
	Memory        *float64 `json:"memory"` // KB
}

// Status represents the Judge0 submission status.
type Status struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

// Judge0 status IDs
const (
	StatusInQueue    = 1
	StatusProcessing = 2
	StatusAccepted   = 3
	StatusWA         = 4
	StatusTLE        = 5
	StatusCE         = 6
	StatusRE1        = 7  // SIGSEGV
	StatusRE2        = 8  // SIGXFSZ
	StatusRE3        = 9  // SIGFPE
	StatusRE4        = 10 // SIGABRT
	StatusRE5        = 11 // NZEC
	StatusRE6        = 12 // Other
	StatusIE         = 13 // Internal Error
	StatusMLE        = 14 // Exec Format Error (used as MLE in some versions)
)

// Client is the Judge0 API client.
type Client struct {
	baseURL    string
	httpClient *http.Client
	cfg        *config.Judge0Config
}

// NewClient creates a new Judge0 API client.
func NewClient(cfg *config.Judge0Config) *Client {
	return &Client{
		baseURL: cfg.BaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		cfg: cfg,
	}
}

// Submit submits code to Judge0 and waits for the result.
func (c *Client) Submit(ctx context.Context, req *SubmissionRequest) (*SubmissionResponse, error) {
	// LOCAL BYPASS: run C++ and Python directly on the API container
	// (Judge0 docker isolate fails on WSL2 due to cgroup v2 issues)
	if req.LanguageID == 54 {
		return c.runLocalCpp(ctx, req)
	}
	if req.LanguageID == 71 {
		return c.runLocalPython(ctx, req)
	}

	if req.CPUTimeLimit == 0 {
		req.CPUTimeLimit = c.cfg.CPUTimeLimit
	}
	if req.WallTimeLimit == 0 {
		req.WallTimeLimit = c.cfg.WallTimeLimit
	}
	if req.MemoryLimit == 0 {
		req.MemoryLimit = c.cfg.MemoryLimit
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	// Submit with wait=true (synchronous)
	url := fmt.Sprintf("%s/submissions?base64_encoded=false&wait=true", c.baseURL)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("judge0 error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var result SubmissionResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	return &result, nil
}

func (c *Client) runLocalCpp(ctx context.Context, req *SubmissionRequest) (*SubmissionResponse, error) {
	tmpDir, err := os.MkdirTemp("", "cm_judge")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tmpDir)

	srcPath := filepath.Join(tmpDir, "main.cpp")
	if err := os.WriteFile(srcPath, []byte(req.SourceCode), 0644); err != nil {
		return nil, err
	}

	exePath := filepath.Join(tmpDir, "main.exe")

	cmd := exec.CommandContext(ctx, "g++", "-O2", srcPath, "-o", exePath)
	compileOut, err := cmd.CombinedOutput()
	if err != nil {
		outStr := string(compileOut)
		return &SubmissionResponse{
			Token:         "local-123",
			CompileOutput: &outStr,
			Status:        Status{ID: StatusCE, Description: "Compilation Error"},
		}, nil
	}

	// Determine wall-clock limit: use CPUTimeLimit from request, fall back to 5 s
	walllimit := req.CPUTimeLimit
	if walllimit <= 0 {
		walllimit = 5.0
	}
	runCtx, cancel := context.WithTimeout(ctx, time.Duration(walllimit*float64(time.Second)))
	defer cancel()

	runCmd := exec.CommandContext(runCtx, exePath)
	if req.Stdin != "" {
		runCmd.Stdin = strings.NewReader(req.Stdin)
	}

	var stdoutBuf, stderrBuf bytes.Buffer
	runCmd.Stdout = &stdoutBuf
	runCmd.Stderr = &stderrBuf

	start := time.Now()
	err = runCmd.Run()
	elapsed := time.Since(start).Seconds()

	stdoutStr := stdoutBuf.String()
	stderrStr := stderrBuf.String()
	timeStr := fmt.Sprintf("%.3f", elapsed)

	// Timed out?
	if runCtx.Err() == context.DeadlineExceeded {
		return &SubmissionResponse{
			Token:  "local-123",
			Stdout: &stdoutStr,
			Time:   &timeStr,
			Status: Status{ID: StatusTLE, Description: "Time Limit Exceeded"},
		}, nil
	}

	if err != nil {
		errStr := "Execution failed: " + err.Error() + "\n" + stderrStr
		return &SubmissionResponse{
			Token:  "local-123",
			Stdout: &stdoutStr,
			Stderr: &errStr,
			Time:   &timeStr,
			Status: Status{ID: StatusRE6, Description: "Runtime Error"},
		}, nil
	}

	if req.ExpectedOutput != "" {
		expected := strings.TrimSpace(req.ExpectedOutput)
		actual := strings.TrimSpace(stdoutStr)
		if expected != actual {
			return &SubmissionResponse{
				Token:  "local-123",
				Stdout: &stdoutStr,
				Time:   &timeStr,
				Status: Status{ID: StatusWA, Description: "Wrong Answer"},
			}, nil
		}
	}

	return &SubmissionResponse{
		Token:  "local-123",
		Stdout: &stdoutStr,
		Time:   &timeStr,
		Status: Status{ID: StatusAccepted, Description: "Accepted"},
	}, nil
}

func (c *Client) runLocalPython(ctx context.Context, req *SubmissionRequest) (*SubmissionResponse, error) {
	tmpDir, err := os.MkdirTemp("", "cm_py_judge")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tmpDir)

	srcPath := filepath.Join(tmpDir, "main.py")
	if err := os.WriteFile(srcPath, []byte(req.SourceCode), 0644); err != nil {
		return nil, err
	}

	// Determine wall-clock limit: use CPUTimeLimit from request, fall back to 5 s
	walllimit := req.CPUTimeLimit
	if walllimit <= 0 {
		walllimit = 5.0
	}
	runCtx, cancel := context.WithTimeout(ctx, time.Duration(walllimit*float64(time.Second)))
	defer cancel()

	runCmd := exec.CommandContext(runCtx, "python3", srcPath)
	if req.Stdin != "" {
		runCmd.Stdin = strings.NewReader(req.Stdin)
	}

	var stdoutBuf, stderrBuf bytes.Buffer
	runCmd.Stdout = &stdoutBuf
	runCmd.Stderr = &stderrBuf

	start := time.Now()
	err = runCmd.Run()
	elapsed := time.Since(start).Seconds()

	stdoutStr := stdoutBuf.String()
	stderrStr := stderrBuf.String()
	timeStr := fmt.Sprintf("%.3f", elapsed)

	// Timed out?
	if runCtx.Err() == context.DeadlineExceeded {
		return &SubmissionResponse{
			Token:  "local-py-123",
			Stdout: &stdoutStr,
			Time:   &timeStr,
			Status: Status{ID: StatusTLE, Description: "Time Limit Exceeded"},
		}, nil
	}

	if err != nil {
		// Python errors go to stderr, not compile_output
		return &SubmissionResponse{
			Token:  "local-py-123",
			Stdout: &stdoutStr,
			Stderr: &stderrStr,
			Time:   &timeStr,
			Status: Status{ID: StatusRE6, Description: "Runtime Error"},
		}, nil
	}

	if req.ExpectedOutput != "" {
		expected := strings.TrimSpace(req.ExpectedOutput)
		actual := strings.TrimSpace(stdoutStr)
		if expected != actual {
			return &SubmissionResponse{
				Token:  "local-py-123",
				Stdout: &stdoutStr,
				Time:   &timeStr,
				Status: Status{ID: StatusWA, Description: "Wrong Answer"},
			}, nil
		}
	}

	return &SubmissionResponse{
		Token:  "local-py-123",
		Stdout: &stdoutStr,
		Time:   &timeStr,
		Status: Status{ID: StatusAccepted, Description: "Accepted"},
	}, nil
}

// Run executes code with custom input (for the "Run" button, no judging).
// Uses a 5-second wall-clock timeout so infinite loops don't hang the frontend.
func (c *Client) Run(ctx context.Context, languageID int, sourceCode, stdin string) (*SubmissionResponse, error) {
	return c.Submit(ctx, &SubmissionRequest{
		SourceCode:   sourceCode,
		LanguageID:   languageID,
		Stdin:        stdin,
		CPUTimeLimit: 5.0, // 5 s hard limit for Run; Submit uses challenge.TimeLimitMs
	})
}

// Judge runs code against a test case and checks the output.
func (c *Client) Judge(ctx context.Context, languageID int, sourceCode, input, expectedOutput string) (*SubmissionResponse, error) {
	return c.Submit(ctx, &SubmissionRequest{
		SourceCode:     sourceCode,
		LanguageID:     languageID,
		Stdin:          input,
		ExpectedOutput: expectedOutput,
	})
}

// BatchJudge runs code against multiple test cases concurrently.
// Returns results in order.
func (c *Client) BatchJudge(ctx context.Context, languageID int, sourceCode string, inputs, expectedOutputs []string) ([]*SubmissionResponse, error) {
	results := make([]*SubmissionResponse, len(inputs))
	errCh := make(chan error, len(inputs))

	for i := range inputs {
		go func(idx int) {
			resp, err := c.Judge(ctx, languageID, sourceCode, inputs[idx], expectedOutputs[idx])
			if err != nil {
				errCh <- fmt.Errorf("test case %d: %w", idx, err)
				return
			}
			results[idx] = resp
			errCh <- nil
		}(i)
	}

	for range inputs {
		if err := <-errCh; err != nil {
			return results, err // return partial results + error
		}
	}

	return results, nil
}

// MapVerdict maps Judge0 status to our Verdict type.
func MapVerdict(statusID int) string {
	switch statusID {
	case StatusAccepted:
		return "accepted"
	case StatusWA:
		return "wrong_answer"
	case StatusTLE:
		return "time_limit"
	case StatusCE:
		return "compilation_error"
	case StatusRE1, StatusRE2, StatusRE3, StatusRE4, StatusRE5, StatusRE6:
		return "runtime_error"
	case StatusMLE:
		return "memory_limit"
	default:
		return "runtime_error"
	}
}

// GetLanguageID returns the Judge0 language ID for a language name.
func GetLanguageID(lang string) (int, bool) {
	id, ok := Language[lang]
	return id, ok
}
