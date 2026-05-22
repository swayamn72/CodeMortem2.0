package ai

import (
	"context"
	"fmt"
	"log"
	"strings"
)

// ────── Hint System ──────

// HintLevel defines the specificity of a hint.
type HintLevel int

const (
	HintLevelNudge     HintLevel = 1 // High-level approach direction
	HintLevelTechnique HintLevel = 2 // Names the algorithmic technique
	HintLevelSkeleton  HintLevel = 3 // Pseudocode skeleton
)

// HintCost returns the point penalty for requesting a hint at the given level.
// Returns 0 for solo mode (hints are free in practice).
func HintCost(level HintLevel, isSolo bool) int {
	if isSolo {
		return 0
	}
	switch level {
	case HintLevelNudge:
		return 50
	case HintLevelTechnique:
		return 100
	case HintLevelSkeleton:
		return 150
	default:
		return 0
	}
}

// HintRequest contains the info needed to generate a hint.
type HintRequest struct {
	ProblemTitle     string
	ProblemStatement string
	Constraints      string
	Tags             []string
	Difficulty       int
	HintLevel        HintLevel
	PlayerCode       string // optional: current code the player has written
	PreviousHints    []string // hints already given (for context)
}

// HintResponse is the generated hint.
type HintResponse struct {
	HintText      string    `json:"hintText"`
	HintLevel     HintLevel `json:"hintLevel"`
	PointsDeducted int      `json:"pointsDeducted"`
}

// HintGenerator generates progressive hints using AI.
type HintGenerator struct {
	client *Client
}

// NewHintGenerator creates a new hint generator.
func NewHintGenerator(client *Client) *HintGenerator {
	return &HintGenerator{client: client}
}

// GenerateHint generates a hint for the given problem at the specified level.
func (h *HintGenerator) GenerateHint(ctx context.Context, req *HintRequest) (*HintResponse, error) {
	prompt := buildHintPrompt(req)

	log.Printf("[ai-hint] generating level %d hint for '%s'...", req.HintLevel, req.ProblemTitle)

	response, err := h.client.Complete(ctx, &CompletionRequest{
		Messages: []Message{
			{Role: "system", Content: hintSystemPrompt()},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.7,
		MaxTokens:   1024,
		JSONMode:    false,
	})
	if err != nil {
		return nil, fmt.Errorf("hint generation failed: %w", err)
	}

	hintText := strings.TrimSpace(response)
	log.Printf("[ai-hint] ✅ generated level %d hint for '%s' (%d chars)", req.HintLevel, req.ProblemTitle, len(hintText))

	return &HintResponse{
		HintText:  hintText,
		HintLevel: req.HintLevel,
	}, nil
}

// ────── Prompt Templates ──────

func hintSystemPrompt() string {
	return `You are an expert competitive programming tutor. Your role is to help players 
learn by providing carefully calibrated hints — NOT by giving away solutions.

RULES:
1. NEVER provide complete working code
2. NEVER reveal the full solution approach in one hint
3. Be pedagogically useful — guide thinking, don't replace it
4. Tailor hint specificity to the requested level
5. Be concise — players are under time pressure (30 min match)
6. Use clear formatting with markdown-like emphasis where helpful

HINT LEVELS:
- Level 1 (Nudge): A gentle directional push. Mention what TYPE of thinking is useful.
  Example: "Think about what happens when you process elements in sorted order..."
  
- Level 2 (Technique): Name the specific technique/algorithm/data structure needed.
  Example: "This problem can be solved using a sliding window approach with a hash map to track frequencies."
  
- Level 3 (Skeleton): Provide a pseudocode outline of the approach WITHOUT implementation details.
  Example: "1. Sort the array. 2. Use two pointers from both ends. 3. For each pair..."
  
Keep responses CONCISE (2-4 sentences for Level 1, 3-5 for Level 2, a numbered pseudocode list for Level 3).
Do NOT add preamble like "Here's a hint:" — just give the hint directly.`
}

func buildHintPrompt(req *HintRequest) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("PROBLEM: %s\n\n", req.ProblemTitle))
	sb.WriteString(fmt.Sprintf("STATEMENT:\n%s\n\n", req.ProblemStatement))
	sb.WriteString(fmt.Sprintf("CONSTRAINTS:\n%s\n\n", req.Constraints))

	if len(req.Tags) > 0 {
		sb.WriteString(fmt.Sprintf("TOPIC TAGS: %s\n\n", strings.Join(req.Tags, ", ")))
	}

	sb.WriteString(fmt.Sprintf("DIFFICULTY: ~%d (Codeforces equivalent)\n\n", req.Difficulty))

	sb.WriteString(fmt.Sprintf("REQUESTED HINT LEVEL: %d\n", req.HintLevel))

	switch req.HintLevel {
	case HintLevelNudge:
		sb.WriteString("Provide a GENTLE NUDGE — suggest what direction of thinking would be useful. Do NOT name specific algorithms.\n")
	case HintLevelTechnique:
		sb.WriteString("Name the SPECIFIC TECHNIQUE or ALGORITHM needed. Explain briefly why it applies. Do NOT give pseudocode.\n")
	case HintLevelSkeleton:
		sb.WriteString("Provide a PSEUDOCODE SKELETON of the solution approach. Use numbered steps. Do NOT give actual code.\n")
	}

	if req.PlayerCode != "" && len(req.PlayerCode) > 20 {
		// Truncate very long code to save tokens
		code := req.PlayerCode
		if len(code) > 1500 {
			code = code[:1500] + "\n... (truncated)"
		}
		sb.WriteString(fmt.Sprintf("\nPLAYER'S CURRENT CODE (for context — help them from where they are):\n```\n%s\n```\n", code))
	}

	if len(req.PreviousHints) > 0 {
		sb.WriteString("\nPREVIOUS HINTS GIVEN (do not repeat, build upon them):\n")
		for i, h := range req.PreviousHints {
			sb.WriteString(fmt.Sprintf("- Level %d: %s\n", i+1, h))
		}
	}

	return sb.String()
}
