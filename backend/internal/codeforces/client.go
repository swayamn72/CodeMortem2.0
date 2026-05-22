package codeforces

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
)

// Client is the Codeforces public API client with in-memory problem caching.
type Client struct {
	httpClient *http.Client

	// Cached problems
	problems      []CFProblem
	problemStats  map[ProblemKey]int // key → solvedCount
	ratedProblems map[int][]CFProblem // rating → problems with that rating
	cacheMu       sync.RWMutex
	lastFetch     time.Time
	cacheTTL      time.Duration
}

// NewClient creates a new Codeforces API client.
func NewClient() *Client {
	c := &Client{
		httpClient: &http.Client{Timeout: 15 * time.Second},
		problemStats:  make(map[ProblemKey]int),
		ratedProblems: make(map[int][]CFProblem),
		cacheTTL:      1 * time.Hour,
	}
	return c
}

// Init fetches the initial problem set. Call this on startup.
func (c *Client) Init() error {
	return c.refreshCache()
}

// refreshCache fetches all problems from the CF API and rebuilds the cache.
func (c *Client) refreshCache() error {
	log.Println("[codeforces] fetching problem set from Codeforces API...")

	resp, err := c.httpClient.Get("https://codeforces.com/api/problemset.problems")
	if err != nil {
		return fmt.Errorf("cf api request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read cf response: %w", err)
	}

	var result CFProblemsResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("parse cf response: %w", err)
	}

	if result.Status != "OK" {
		return fmt.Errorf("cf api returned status: %s", result.Status)
	}

	c.cacheMu.Lock()
	defer c.cacheMu.Unlock()

	// Filter: only keep problems with a rating and from real contests (contestId > 0)
	c.problems = nil
	c.ratedProblems = make(map[int][]CFProblem)
	c.problemStats = make(map[ProblemKey]int)

	for _, p := range result.Result.Problems {
		if p.Rating > 0 && p.ContestID > 0 {
			c.problems = append(c.problems, p)
			c.ratedProblems[p.Rating] = append(c.ratedProblems[p.Rating], p)
		}
	}

	for _, s := range result.Result.ProblemStatistics {
		key := ProblemKey{ContestID: s.ContestID, Index: s.Index}
		c.problemStats[key] = s.SolvedCount
	}

	c.lastFetch = time.Now()
	log.Printf("[codeforces] cached %d rated problems across %d rating levels", len(c.problems), len(c.ratedProblems))

	return nil
}

// ensureCache refreshes the cache if it's stale.
func (c *Client) ensureCache() error {
	c.cacheMu.RLock()
	stale := time.Since(c.lastFetch) > c.cacheTTL || len(c.problems) == 0
	c.cacheMu.RUnlock()

	if stale {
		return c.refreshCache()
	}
	return nil
}

// GetUserSolvedProblems returns the set of problem keys the user has solved on CF.
func (c *Client) GetUserSolvedProblems(cfHandle string) (map[ProblemKey]bool, error) {
	url := fmt.Sprintf("https://codeforces.com/api/user.status?handle=%s&from=1&count=10000", cfHandle)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("cf user.status request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var result CFUserStatusResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	if result.Status != "OK" {
		return nil, fmt.Errorf("cf api status: %s", result.Status)
	}

	solved := make(map[ProblemKey]bool)
	for _, sub := range result.Result {
		if sub.Verdict == "OK" {
			solved[sub.Problem.Key()] = true
		}
	}

	return solved, nil
}

// CheckRecentSubmission checks if a user submitted an accepted solution for a specific
// problem after the given timestamp. Returns the submission ID if found, 0 otherwise.
func (c *Client) CheckRecentSubmission(cfHandle string, contestID int, index string, afterTimestamp int64) (int64, error) {
	url := fmt.Sprintf("https://codeforces.com/api/user.status?handle=%s&from=1&count=30", cfHandle)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return 0, fmt.Errorf("cf user.status request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("read response: %w", err)
	}

	var result CFUserStatusResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return 0, fmt.Errorf("parse response: %w", err)
	}

	if result.Status != "OK" {
		return 0, fmt.Errorf("cf api status: %s", result.Status)
	}

	for _, sub := range result.Result {
		if sub.Verdict == "OK" &&
			sub.ContestID == contestID &&
			strings.EqualFold(sub.Problem.Index, index) &&
			sub.CreationTimeSeconds >= afterTimestamp {
			return sub.ID, nil
		}
	}

	return 0, nil
}

// SelectProblemsForRating selects 5 CF problems spanning a difficulty range
// appropriate for the given average rating.
// Tries to avoid problems in the excludeSolved sets (already solved by either player).
func (c *Client) SelectProblemsForRating(avgRating int, excludeSolved1, excludeSolved2 map[ProblemKey]bool) ([]*SelectedProblem, error) {
	if err := c.ensureCache(); err != nil {
		return nil, fmt.Errorf("ensure cache: %w", err)
	}

	c.cacheMu.RLock()
	defer c.cacheMu.RUnlock()

	// 5 difficulty tiers relative to the avg rating
	// Q1: avgRating - 400 (easy warm-up)
	// Q2: avgRating - 200
	// Q3: avgRating (on-level)
	// Q4: avgRating + 200
	// Q5: avgRating + 400 (stretch/hard)
	targetRatings := []int{
		clampRating(avgRating - 400),
		clampRating(avgRating - 200),
		clampRating(avgRating),
		clampRating(avgRating + 200),
		clampRating(avgRating + 400),
	}

	// Round to nearest 100 (CF ratings are multiples of 100)
	for i, r := range targetRatings {
		targetRatings[i] = roundToNearest100(r)
	}

	selected := make([]*SelectedProblem, 0, 5)
	usedKeys := make(map[ProblemKey]bool)

	for qIdx, targetRating := range targetRatings {
		problem := c.pickProblem(targetRating, usedKeys, excludeSolved1, excludeSolved2)
		if problem == nil {
			// Try adjacent ratings (±100)
			problem = c.pickProblem(targetRating-100, usedKeys, excludeSolved1, excludeSolved2)
		}
		if problem == nil {
			problem = c.pickProblem(targetRating+100, usedKeys, excludeSolved1, excludeSolved2)
		}
		if problem == nil {
			// Fallback: pick any problem near the target without exclusion filtering
			problem = c.pickProblemFallback(targetRating, usedKeys)
		}
		if problem == nil {
			return nil, fmt.Errorf("could not find problem for tier %d (target rating %d)", qIdx+1, targetRating)
		}

		usedKeys[problem.Key()] = true

		sp := &SelectedProblem{
			ContestID: problem.ContestID,
			Index:     problem.Index,
			Name:      problem.Name,
			Rating:    problem.Rating,
			Tags:      problem.Tags,
			URL:       fmt.Sprintf("https://codeforces.com/problemset/problem/%d/%s", problem.ContestID, problem.Index),
		}
		if sc, ok := c.problemStats[problem.Key()]; ok {
			sp.SolvedCount = sc
		}
		selected = append(selected, sp)
	}

	// Sort by rating ascending
	sort.Slice(selected, func(i, j int) bool {
		return selected[i].Rating < selected[j].Rating
	})

	return selected, nil
}

// pickProblem picks a random problem at the exact rating, excluding used and solved problems.
func (c *Client) pickProblem(rating int, used, solved1, solved2 map[ProblemKey]bool) *CFProblem {
	candidates := c.ratedProblems[rating]
	if len(candidates) == 0 {
		return nil
	}

	// Shuffle candidates
	shuffled := make([]CFProblem, len(candidates))
	copy(shuffled, candidates)
	rand.Shuffle(len(shuffled), func(i, j int) { shuffled[i], shuffled[j] = shuffled[j], shuffled[i] })

	for i := range shuffled {
		key := shuffled[i].Key()
		if used[key] {
			continue
		}
		if solved1 != nil && solved1[key] {
			continue
		}
		if solved2 != nil && solved2[key] {
			continue
		}
		return &shuffled[i]
	}

	return nil
}

// pickProblemFallback picks a random problem at the given rating without exclusion filtering (except used).
func (c *Client) pickProblemFallback(rating int, used map[ProblemKey]bool) *CFProblem {
	candidates := c.ratedProblems[rating]
	if len(candidates) == 0 {
		// Try ±100
		candidates = c.ratedProblems[rating-100]
		if len(candidates) == 0 {
			candidates = c.ratedProblems[rating+100]
		}
	}
	if len(candidates) == 0 {
		return nil
	}

	shuffled := make([]CFProblem, len(candidates))
	copy(shuffled, candidates)
	rand.Shuffle(len(shuffled), func(i, j int) { shuffled[i], shuffled[j] = shuffled[j], shuffled[i] })

	for i := range shuffled {
		if !used[shuffled[i].Key()] {
			return &shuffled[i]
		}
	}
	return nil
}

func clampRating(r int) int {
	if r < 800 {
		return 800
	}
	if r > 3500 {
		return 3500
	}
	return r
}

func roundToNearest100(r int) int {
	return ((r + 50) / 100) * 100
}

// FetchProblemStatement scrapes the problem statement HTML from Codeforces.
// Returns the statement text (simplified) for display in our UI.
func (c *Client) FetchProblemStatement(contestID int, index string) (statement, inputFormat, outputFormat, constraints string, examples []map[string]string, err error) {
	url := fmt.Sprintf("https://codeforces.com/problemset/problem/%d/%s", contestID, index)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", "", "", "", nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", "CodeMortem/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", "", "", nil, fmt.Errorf("fetch problem page: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", "", "", "", nil, fmt.Errorf("cf returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", "", "", nil, fmt.Errorf("read body: %w", err)
	}

	html := string(body)

	// Parse problem statement from HTML
	statement = extractSection(html, `<div class="problem-statement">`, `<div class="input-specification">`)
	if statement == "" {
		// Fallback: just get everything in problem-statement div
		statement = extractSection(html, `<div class="problem-statement">`, `</div>`)
	}

	// Clean HTML tags for a text-based display
	statement = cleanHTML(statement)
	if statement == "" {
		statement = "Problem statement could not be parsed. Please view on Codeforces."
	}

	inputFormat = cleanHTML(extractSection(html, `<div class="input-specification">`, `<div class="output-specification">`))
	outputFormat = cleanHTML(extractSection(html, `<div class="output-specification">`, `<div class="sample-tests">`))

	// Strip the section title line ("Input", "Output") that CF includes as the first line
	inputFormat = stripSectionTitle(inputFormat)
	outputFormat = stripSectionTitle(outputFormat)

	// Extract sample tests
	examples = extractExamples(html)

	// Constraints are usually within the statement
	constraints = "See problem statement for constraints."

	return statement, inputFormat, outputFormat, constraints, examples, nil
}

// extractSection extracts text between two HTML markers.
func extractSection(html, startMarker, endMarker string) string {
	startIdx := strings.Index(html, startMarker)
	if startIdx == -1 {
		return ""
	}
	startIdx += len(startMarker)

	endIdx := strings.Index(html[startIdx:], endMarker)
	if endIdx == -1 {
		// Take up to 5000 chars
		if len(html[startIdx:]) > 5000 {
			return html[startIdx : startIdx+5000]
		}
		return html[startIdx:]
	}

	return html[startIdx : startIdx+endIdx]
}

// stripSectionTitle removes the CF-generated section title ("Input", "Output", "stdin", "stdout")
// that appears as the first line of extracted input/output format text.
func stripSectionTitle(text string) string {
	if text == "" {
		return ""
	}
	lines := strings.SplitN(text, "\n", 2)
	if len(lines) == 0 {
		return text
	}
	firstLine := strings.TrimSpace(lines[0])
	switch strings.ToLower(firstLine) {
	case "input", "output", "stdin", "stdout", "input format", "output format":
		if len(lines) > 1 {
			return strings.TrimSpace(lines[1])
		}
		return ""
	}
	return text
}

// cleanHTML strips HTML tags and cleans up whitespace for display.
func cleanHTML(html string) string {
	if html == "" {
		return ""
	}

	// Replace common HTML entities (order matters — &amp; last)
	result := html
	result = strings.ReplaceAll(result, "&quot;", "\"")
	result = strings.ReplaceAll(result, "&apos;", "'")
	result = strings.ReplaceAll(result, "&#39;", "'")
	result = strings.ReplaceAll(result, "&lt;", "<")
	result = strings.ReplaceAll(result, "&gt;", ">")
	result = strings.ReplaceAll(result, "&le;", "≤")
	result = strings.ReplaceAll(result, "&ge;", "≥")
	result = strings.ReplaceAll(result, "&#8804;", "≤")
	result = strings.ReplaceAll(result, "&#8805;", "≥")
	result = strings.ReplaceAll(result, "&minus;", "−")
	result = strings.ReplaceAll(result, "&nbsp;", " ")
	result = strings.ReplaceAll(result, "&amp;", "&")

	// Replace Codeforces MathJax delimiters with inline code backticks
	result = strings.ReplaceAll(result, "$$$", "`")

	// Replace block elements with newlines
	result = strings.ReplaceAll(result, "<br>", "\n")
	result = strings.ReplaceAll(result, "<br/>", "\n")
	result = strings.ReplaceAll(result, "<br />", "\n")
	result = strings.ReplaceAll(result, "</p>", "\n\n")
	result = strings.ReplaceAll(result, "</div>", "\n")
	result = strings.ReplaceAll(result, "</li>", "\n")

	// Strip remaining tags
	var out strings.Builder
	inTag := false
	for _, ch := range result {
		if ch == '<' {
			inTag = true
			continue
		}
		if ch == '>' {
			inTag = false
			continue
		}
		if !inTag {
			out.WriteRune(ch)
		}
	}

	// Clean up excessive whitespace
	text := out.String()
	lines := strings.Split(text, "\n")
	var cleaned []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}

	return strings.Join(cleaned, "\n")
}

// extractExamples extracts sample input/output from the problem page HTML.
func extractExamples(html string) []map[string]string {
	var examples []map[string]string

	sampleSection := extractSection(html, `<div class="sample-tests">`, `<div class="note">`)
	if sampleSection == "" {
		// try without note section
		sampleSection = extractSection(html, `<div class="sample-tests">`, `</div></div></div>`)
	}
	if sampleSection == "" {
		return examples
	}

	// Find all input blocks
	parts := strings.Split(sampleSection, `<div class="input">`)
	for _, part := range parts[1:] { // skip first (before first input)
		// Extract input <pre>...</pre>
		inputText := extractPreContent(part)

		// Find the output div after the input's closing </div>
		outputDivIdx := strings.Index(part, `<div class="output">`)
		var outputText string
		if outputDivIdx != -1 {
			outputPart := part[outputDivIdx+len(`<div class="output">`):]
			outputText = extractPreContent(outputPart)
		}

		if inputText != "" || outputText != "" {
			examples = append(examples, map[string]string{
				"input":  strings.TrimSpace(inputText),
				"output": strings.TrimSpace(outputText),
			})
		}
	}

	return examples
}

// extractPreContent extracts text from the first <pre>...</pre> block in an HTML fragment.
func extractPreContent(fragment string) string {
	start := strings.Index(fragment, "<pre>")
	if start == -1 {
		return ""
	}
	start += len("<pre>")
	end := strings.Index(fragment[start:], "</pre>")
	if end == -1 {
		return ""
	}
	raw := fragment[start : start+end]
	return cleanHTML(raw)
}

