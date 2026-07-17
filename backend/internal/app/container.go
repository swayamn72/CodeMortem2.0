package app

import (
	"codemortem/internal/codeforces"
	"codemortem/internal/game"
	"codemortem/internal/judge"
	"codemortem/internal/matchmaking"
	"codemortem/internal/user"
)

// Container holds all service dependencies, replacing the 16-parameter god function.
type Container struct {
	SessionMgr        *game.SessionManager
	Hub               *game.Hub
	JudgeClient       *judge.Client
	UserRepo          *user.Repository
	MMQueue           *matchmaking.Queue
	SubmissionLimiter *game.SubmissionRateLimiter
	CFClient          *codeforces.Client
}
