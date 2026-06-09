package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

// ────── Difficulty Tiers for a 7-Question Match ──────

// DifficultyTier defines a question's position in the match.
type DifficultyTier struct {
	Index       int
	Label       string
	Difficulty  int    // approximate Codeforces rating
	Topics      []string
	Points      int
	Description string
}

// GetTiersForRating returns 7 difficulty tiers calibrated for the match rating.
func GetTiersForRating(avgRating int) [7]DifficultyTier {
	// Scale difficulty based on average player rating
	base := avgRating - 400
	if base < 800 {
		base = 800
	}

	return [7]DifficultyTier{
		{1, "Warm-up", base, []string{"implementation", "math", "basics"}, 100,
			"Very simple implementation problem. Should take <3 minutes for the target audience."},
		{2, "Easy", base + 200, []string{"greedy", "math", "strings"}, 200,
			"Standard easy problem. One key observation needed."},
		{3, "Easy-Medium", base + 400, []string{"sorting", "two-pointers", "prefix-sums", "binary-search"}, 300,
			"Requires a known technique but straightforward application."},
		{4, "Medium", base + 600, []string{"binary-search", "bfs", "dfs", "dp-easy"}, 400,
			"Requires combining at most 2 techniques. Some thought needed."},
		{5, "Medium-Hard", base + 800, []string{"dp", "graphs", "trees", "segment-trees"}, 500,
			"Non-trivial. Requires careful implementation of a well-known algorithm."},
		{6, "Hard", base + 1000, []string{"advanced-dp", "segment-trees", "lazy-propagation", "flows"}, 600,
			"Challenging. Requires deep algorithmic knowledge or clever insight."},
		{7, "Expert", base + 1200, []string{"combinatorics", "number-theory", "advanced-graphs", "string-algorithms"}, 700,
			"Very hard. Requires advanced techniques and creative problem-solving."},
	}
}

// ────── AI-Generated Question Structure ──────

// GeneratedQuestion is the structured output from the AI.
type GeneratedQuestion struct {
	Title        string               `json:"title"`
	Statement    string               `json:"statement"`
	InputFormat  string               `json:"input_format"`
	OutputFormat string               `json:"output_format"`
	Constraints  string               `json:"constraints"`
	Examples     []GeneratedExample   `json:"examples"`
	TestCases    []GeneratedTestCase  `json:"test_cases"`
	Tags         []string             `json:"tags"`
	Difficulty   int                  `json:"difficulty"`
	Solution     string               `json:"solution_code"`
	SolutionLang string               `json:"solution_language"`
	Explanation  string               `json:"explanation"`
}

// GeneratedExample is an example I/O pair for the problem statement.
type GeneratedExample struct {
	Input       string `json:"input"`
	Output      string `json:"output"`
	Explanation string `json:"explanation"`
}

// GeneratedTestCase is an individual test case.
type GeneratedTestCase struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	IsSample       bool   `json:"is_sample"`
	IsEdgeCase     bool   `json:"is_edge_case"`
}

// ────── Question Generator ──────

// QuestionGenerator generates competitive programming questions using AI.
type QuestionGenerator struct {
	client *Client
}

// NewQuestionGenerator creates a new generator.
func NewQuestionGenerator(client *Client) *QuestionGenerator {
	return &QuestionGenerator{client: client}
}

// GenerateQuestion generates a single question for a given difficulty tier.
func (g *QuestionGenerator) GenerateQuestion(ctx context.Context, tier DifficultyTier, existingTitles []string) (*GeneratedQuestion, error) {
	prompt := buildQuestionPrompt(tier, existingTitles)
	
	log.Printf("[ai-gen] generating Q%d (%s, difficulty ~%d)...", tier.Index, tier.Label, tier.Difficulty)

	response, err := g.client.Complete(ctx, &CompletionRequest{
		Messages: []Message{
			{Role: "system", Content: systemPrompt()},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.8,
		MaxTokens:   8192,
		JSONMode:    true,
	})
	if err != nil {
		return nil, fmt.Errorf("AI completion failed: %w", err)
	}

	// Parse the JSON response
	var question GeneratedQuestion
	cleaned := cleanJSON(response)
	if err := json.Unmarshal([]byte(cleaned), &question); err != nil {
		return nil, fmt.Errorf("failed to parse generated question: %w (raw: %.200s)", err, response)
	}

	// Validate
	if err := validateQuestion(&question, tier); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	question.Difficulty = tier.Difficulty
	log.Printf("[ai-gen] ✓ generated: %s (Q%d, %d test cases)", question.Title, tier.Index, len(question.TestCases))

	return &question, nil
}

// GenerateMatchSet generates all 7 questions for a match.
func (g *QuestionGenerator) GenerateMatchSet(ctx context.Context, avgRating int) ([7]*GeneratedQuestion, error) {
	tiers := GetTiersForRating(avgRating)
	var questions [7]*GeneratedQuestion
	var existingTitles []string

	for i, tier := range tiers {
		q, err := g.GenerateQuestion(ctx, tier, existingTitles)
		if err != nil {
			// Retry once
			log.Printf("[ai-gen] ⚠️ Q%d failed, retrying: %v", tier.Index, err)
			q, err = g.GenerateQuestion(ctx, tier, existingTitles)
			if err != nil {
				return questions, fmt.Errorf("Q%d generation failed after retry: %w", tier.Index, err)
			}
		}
		questions[i] = q
		existingTitles = append(existingTitles, q.Title)
	}

	return questions, nil
}

// ────── Prompt Engineering ──────

func systemPrompt() string {
	return `You are an expert competitive programming problem setter with experience creating problems for Codeforces, AtCoder, and ICPC contests.

You create ORIGINAL problems that:
- Are mathematically rigorous with a single correct answer for each input
- Have clear, unambiguous statements
- Include complete input/output format specifications with constraints
- Come with comprehensive test cases covering edge cases
- Have elegant, verified solutions

RULES:
1. Problems must be ORIGINAL — never copy existing well-known problems
2. Input/output must be through stdin/stdout
3. Constraints must be explicitly stated with ranges
4. Test cases must cover: basic cases, edge cases (min/max values), and stress cases
5. The expected output must be deterministic — no floating point comparison issues
6. Time limit consideration: solutions should run in O(optimal) within 2 seconds for C++
7. Memory limit: 256 MB

OUTPUT FORMAT: Return a single JSON object (no markdown, no code fences).`
}

func buildQuestionPrompt(tier DifficultyTier, existingTitles []string) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf(`Generate a competitive programming problem with these specifications:

DIFFICULTY LEVEL: %s (approximately %d Codeforces rating)
DESCRIPTION: %s

PREFERRED TOPICS (pick 1-2):
`, tier.Label, tier.Difficulty, tier.Description))

	for _, t := range tier.Topics {
		sb.WriteString(fmt.Sprintf("- %s\n", t))
	}

	if len(existingTitles) > 0 {
		sb.WriteString(fmt.Sprintf("\nAVOID OVERLAP with these previously generated problems in this match:\n"))
		for _, t := range existingTitles {
			sb.WriteString(fmt.Sprintf("- %s\n", t))
		}
	}

	sb.WriteString(`
Required JSON output structure:
{
  "title": "Problem Title (creative, themed)",
  "statement": "Full problem statement with story/context. Use newlines for paragraphs.",
  "input_format": "Detailed input format description",
  "output_format": "Detailed output format description",
  "constraints": "All constraints like 1 <= n <= 10^5, etc. One per line.",
  "examples": [
    {
      "input": "sample input 1",
      "output": "sample output 1",
      "explanation": "step by step explanation"
    },
    {
      "input": "sample input 2",
      "output": "sample output 2",
      "explanation": "explanation"
    }
  ],
  "test_cases": [
    {"input": "...", "expected_output": "...", "is_sample": true, "is_edge_case": false},
    {"input": "...", "expected_output": "...", "is_sample": true, "is_edge_case": false},
    {"input": "...", "expected_output": "...", "is_sample": false, "is_edge_case": true},
    ... (generate 8-15 test cases total, including samples and edge cases)
  ],
  "tags": ["tag1", "tag2"],
  "difficulty": ` + fmt.Sprintf("%d", tier.Difficulty) + `,
  "solution_code": "Complete working C++ solution code",
  "solution_language": "cpp",
  "explanation": "Brief explanation of the solution approach and time complexity"
}

IMPORTANT:
- Generate at least 8 test cases (including the 2 sample examples)
- Include edge cases: minimum input, maximum input (within reasonable size for JSON), tricky cases
- The solution code must be complete and correct
- Examples in the statement must match the first entries in test_cases with is_sample=true`)

	return sb.String()
}

// ────── Helpers ──────

func validateQuestion(q *GeneratedQuestion, tier DifficultyTier) error {
	if q.Title == "" {
		return fmt.Errorf("empty title")
	}
	if len(q.Statement) < 50 {
		return fmt.Errorf("statement too short (%d chars)", len(q.Statement))
	}
	if q.InputFormat == "" {
		return fmt.Errorf("empty input format")
	}
	if q.OutputFormat == "" {
		return fmt.Errorf("empty output format")
	}
	if q.Constraints == "" {
		return fmt.Errorf("empty constraints")
	}
	if len(q.Examples) < 1 {
		return fmt.Errorf("need at least 1 example")
	}
	if len(q.TestCases) < 5 {
		return fmt.Errorf("need at least 5 test cases, got %d", len(q.TestCases))
	}
	if q.Solution == "" {
		return fmt.Errorf("empty solution code")
	}
	return nil
}

// cleanJSON strips markdown code fences and leading/trailing whitespace from AI responses.
func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	// Remove ```json ... ``` wrapping
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
		s = strings.TrimSuffix(s, "```")
		s = strings.TrimSpace(s)
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
		s = strings.TrimSuffix(s, "```")
		s = strings.TrimSpace(s)
	}
	return s
}
