package app

import (
	"codemortem/internal/ai"
	"codemortem/internal/codeforces"
	"codemortem/internal/config"
	"codemortem/internal/game"
	"codemortem/internal/judge"
	"codemortem/internal/matchmaking"
	"codemortem/internal/question"
	"codemortem/internal/user"
)

// Container holds all service dependencies, replacing the 16-parameter god function.
type Container struct {
	SessionMgr        *game.SessionManager
	Hub               *game.Hub
	JudgeClient       *judge.Client
	QRepo             *question.Repository
	QSeeder           *question.BankSeeder
	UserRepo          *user.Repository
	MMQueue           *matchmaking.Queue
	SubmissionLimiter *game.SubmissionRateLimiter
	HintGen           *ai.HintGenerator
	Explainer         *ai.SolutionExplainer
	Analyzer          *ai.PerformanceAnalyzer
	AICfg             *config.AIConfig
	CFClient          *codeforces.Client
}
