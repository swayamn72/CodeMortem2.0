package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

// ────── Solution Explanation ──────

// SolutionExplanation is the structured AI explanation of a problem solution.
type SolutionExplanation struct {
	Approach        string   `json:"approach"`
	TimeComplexity  string   `json:"timeComplexity"`
	SpaceComplexity string   `json:"spaceComplexity"`
	KeyInsight      string   `json:"keyInsight"`
	Pseudocode      string   `json:"pseudocode"`
	CommonPitfalls  []string `json:"commonPitfalls"`
	CodeFeedback    string   `json:"codeFeedback,omitempty"` // feedback on player's code
}

// ExplainRequest contains the info needed to explain a problem solution.
type ExplainRequest struct {
	ProblemTitle     string
	ProblemStatement string
	Constraints      string
	Tags             []string
	Difficulty       int
	PlayerCode       string // the player's submitted code (optional)
	PlayerVerdict    string // accepted, wrong_answer, TLE, etc.
}

// SolutionExplainer generates AI explanations of problem solutions.
type SolutionExplainer struct {
	client *Client
}

// NewSolutionExplainer creates a new solution explainer.
func NewSolutionExplainer(client *Client) *SolutionExplainer {
	return &SolutionExplainer{client: client}
}

// Explain generates a detailed explanation of the optimal approach for a problem.
func (e *SolutionExplainer) Explain(ctx context.Context, req *ExplainRequest) (*SolutionExplanation, error) {
	prompt := buildExplainPrompt(req)

	log.Printf("[ai-explain] generating explanation for '%s'...", req.ProblemTitle)

	response, err := e.client.Complete(ctx, &CompletionRequest{
		Messages: []Message{
			{Role: "system", Content: explainSystemPrompt()},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.5,
		MaxTokens:   2048,
		JSONMode:    true,
	})
	if err != nil {
		return nil, fmt.Errorf("explanation generation failed: %w", err)
	}

	var explanation SolutionExplanation
	cleaned := cleanJSON(response)
	if err := json.Unmarshal([]byte(cleaned), &explanation); err != nil {
		return nil, fmt.Errorf("failed to parse explanation: %w (raw: %.200s)", err, response)
	}

	log.Printf("[ai-explain] ✅ generated explanation for '%s'", req.ProblemTitle)
	return &explanation, nil
}

// ────── Post-Match Performance Analysis ──────

// PerformanceReport is the AI-generated match analysis.
type PerformanceReport struct {
	OverallGrade    string            `json:"overallGrade"`    // A, B, C, D, F
	Summary         string            `json:"summary"`         // 2-3 sentence overview
	Strengths       []string          `json:"strengths"`       // what the player did well
	Weaknesses      []string          `json:"weaknesses"`      // areas for improvement
	ProblemGrades   []ProblemGrade    `json:"problemGrades"`   // per-problem analysis
	Recommendations []StudyRecommend  `json:"recommendations"` // topics to study
}

// ProblemGrade is the analysis of performance on a single problem.
type ProblemGrade struct {
	QuestionIndex int    `json:"questionIndex"`
	Grade         string `json:"grade"`    // A, B, C, D, F
	Solved        bool   `json:"solved"`
	Commentary    string `json:"commentary"` // brief analysis
}

// StudyRecommend is a study recommendation.
type StudyRecommend struct {
	Topic       string `json:"topic"`
	Priority    string `json:"priority"`  // high, medium, low
	Description string `json:"description"`
}

// MatchSummary contains all the info needed for post-match analysis.
type MatchSummary struct {
	PlayerUsername string
	PlayerRating   int
	IsSolo         bool
	TotalScore     int
	ProblemsAttempted int
	ProblemsSolved    int
	MatchDuration     int // seconds
	Problems          []ProblemAttempt
}

// ProblemAttempt represents the player's interaction with a single problem.
type ProblemAttempt struct {
	Index         int
	Title         string
	Difficulty    int
	Tags          []string
	Solved        bool
	Attempts      int
	LastVerdict   string
	HintsUsed     int
	PointsEarned  int
}

// PerformanceAnalyzer generates post-match AI analysis.
type PerformanceAnalyzer struct {
	client *Client
}

// NewPerformanceAnalyzer creates a new performance analyzer.
func NewPerformanceAnalyzer(client *Client) *PerformanceAnalyzer {
	return &PerformanceAnalyzer{client: client}
}

// Analyze generates a comprehensive post-match performance report.
func (a *PerformanceAnalyzer) Analyze(ctx context.Context, summary *MatchSummary) (*PerformanceReport, error) {
	prompt := buildAnalysisPrompt(summary)

	log.Printf("[ai-analysis] generating performance report for %s...", summary.PlayerUsername)

	response, err := a.client.Complete(ctx, &CompletionRequest{
		Messages: []Message{
			{Role: "system", Content: analysisSystemPrompt()},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.6,
		MaxTokens:   3072,
		JSONMode:    true,
	})
	if err != nil {
		return nil, fmt.Errorf("performance analysis failed: %w", err)
	}

	var report PerformanceReport
	cleaned := cleanJSON(response)
	if err := json.Unmarshal([]byte(cleaned), &report); err != nil {
		return nil, fmt.Errorf("failed to parse report: %w (raw: %.200s)", err, response)
	}

	log.Printf("[ai-analysis] ✅ generated report for %s (grade: %s)", summary.PlayerUsername, report.OverallGrade)
	return &report, nil
}

// ────── Prompt Templates ──────

func explainSystemPrompt() string {
	return `You are an expert competitive programming instructor. After a student finishes
a problem, you explain the optimal solution approach in a clear, educational manner.

You MUST respond with a JSON object containing:
{
  "approach": "2-3 sentence description of the optimal approach",
  "timeComplexity": "O(...) with brief explanation",
  "spaceComplexity": "O(...) with brief explanation",
  "keyInsight": "The single most important insight for solving this problem",
  "pseudocode": "Step-by-step pseudocode (numbered, 5-10 steps)",
  "commonPitfalls": ["pitfall 1", "pitfall 2", ...],
  "codeFeedback": "If player code was provided, give specific feedback on their approach vs optimal. Otherwise, leave empty."
}

Be concise but educational. Focus on building understanding, not just showing the answer.`
}

func buildExplainPrompt(req *ExplainRequest) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("PROBLEM: %s\n\n", req.ProblemTitle))
	sb.WriteString(fmt.Sprintf("STATEMENT:\n%s\n\n", req.ProblemStatement))
	sb.WriteString(fmt.Sprintf("CONSTRAINTS:\n%s\n\n", req.Constraints))
	sb.WriteString(fmt.Sprintf("TAGS: %s\n", strings.Join(req.Tags, ", ")))
	sb.WriteString(fmt.Sprintf("DIFFICULTY: ~%d\n\n", req.Difficulty))

	if req.PlayerCode != "" {
		code := req.PlayerCode
		if len(code) > 2000 {
			code = code[:2000] + "\n... (truncated)"
		}
		sb.WriteString(fmt.Sprintf("PLAYER'S SUBMITTED CODE (verdict: %s):\n```\n%s\n```\n\n", req.PlayerVerdict, code))
		sb.WriteString("Please include feedback on their code in the 'codeFeedback' field.\n")
	}

	sb.WriteString("Generate a JSON explanation object as specified.")
	return sb.String()
}

func analysisSystemPrompt() string {
	return `You are an expert competitive programming coach analyzing a student's match performance.

Based on the match data, produce a comprehensive performance report as JSON:
{
  "overallGrade": "A/B/C/D/F",
  "summary": "2-3 sentence overview of the performance",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "problemGrades": [
    {"questionIndex": 1, "grade": "A", "solved": true, "commentary": "Brief analysis"},
    ...
  ],
  "recommendations": [
    {"topic": "Dynamic Programming", "priority": "high", "description": "Focus on interval DP and knapsack variants"},
    ...
  ]
}

GRADING CRITERIA:
- A: Solved efficiently without hints
- B: Solved with minimal hints (1)
- C: Solved with significant help (2+ hints) OR not solved but good attempt
- D: Not solved, some progress made
- F: Not attempted or no meaningful progress

OVERALL GRADE: Based on the distribution of problem grades, weighted by difficulty.
For example: solving all easy problems but failing hard ones = B/C.

Be encouraging but honest. Identify specific, actionable areas for improvement.
Keep recommendations to 3-5 items with clear priorities.`
}

func buildAnalysisPrompt(summary *MatchSummary) string {
	var sb strings.Builder

	mode := "Ranked 1v1"
	if summary.IsSolo {
		mode = "Solo Practice"
	}

	sb.WriteString(fmt.Sprintf("PLAYER: %s (Rating: %d)\n", summary.PlayerUsername, summary.PlayerRating))
	sb.WriteString(fmt.Sprintf("MODE: %s\n", mode))
	sb.WriteString(fmt.Sprintf("SCORE: %d | SOLVED: %d/7 | ATTEMPTED: %d/7\n\n",
		summary.TotalScore, summary.ProblemsSolved, summary.ProblemsAttempted))

	sb.WriteString("PROBLEM-BY-PROBLEM BREAKDOWN:\n")
	for _, p := range summary.Problems {
		status := "❌ Not Solved"
		if p.Solved {
			status = "✅ Solved"
		}
		sb.WriteString(fmt.Sprintf("  Q%d: %s (Difficulty: %d, Tags: %s)\n",
			p.Index, p.Title, p.Difficulty, strings.Join(p.Tags, ", ")))
		sb.WriteString(fmt.Sprintf("      Status: %s | Attempts: %d | Hints Used: %d | Points: %d",
			status, p.Attempts, p.HintsUsed, p.PointsEarned))
		if p.LastVerdict != "" && p.LastVerdict != "accepted" {
			sb.WriteString(fmt.Sprintf(" | Last Verdict: %s", p.LastVerdict))
		}
		sb.WriteString("\n\n")
	}

	sb.WriteString("Generate a comprehensive JSON performance report.")
	return sb.String()
}
