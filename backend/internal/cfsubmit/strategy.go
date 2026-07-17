package cfsubmit

import (
	"errors"
)

// SubmitRequest holds the data needed to submit a solution to Codeforces.
type SubmitRequest struct {
	ContestID int
	Index     string
	Language  string
	Code      string
}

// SubmitOutcome describes the result of a submit attempt.
type SubmitOutcome struct {
	Handoff string // "manual" or "extension-bridge"
	Message string
}

// SubmitStrategy defines how a CF submission is performed.
// There is exactly one implementation per deployment mode; the factory
// NewStrategy returns the right one based on the feature flag.
type SubmitStrategy interface {
	Submit(req SubmitRequest) (SubmitOutcome, error)
	Name() string
}

// ── ManualStrategy ───────────────────────────────────────────────────────────
// The default strategy: the user submits on codeforces.com themselves, and the
// backend CF poller (session.go → startCFVerificationPoller) detects the AC.

// ManualStrategy is the no-op strategy that tells the user to submit on CF.
type ManualStrategy struct{}

func (ManualStrategy) Submit(_ SubmitRequest) (SubmitOutcome, error) {
	return SubmitOutcome{
		Handoff: "manual",
		Message: "open problem on codeforces.com; CF poller detects AC",
	}, nil
}

func (ManualStrategy) Name() string { return "manual" }

// ── ExtensionBridgeStrategy ──────────────────────────────────────────────────
// Placeholder for the future companion browser-extension approach. The extension
// would use the user's own already-logged-in CF session to prefill and POST the
// submit form — no CF credentials are ever stored on the CodeMortem server.
//
// The bridge handshake is via window.postMessage:
//   frontend → extension: { type: "cm-cf-submit", contestId, index, language, code }
//   extension → frontend: { type: "cm-cf-submit-ack", status, submissionId? }
//
// This strategy returns an error until the extension is implemented.

// ExtensionBridgeStrategy is the placeholder for direct CF submission via a browser extension.
type ExtensionBridgeStrategy struct{}

func (ExtensionBridgeStrategy) Submit(_ SubmitRequest) (SubmitOutcome, error) {
	return SubmitOutcome{}, errors.New("cf direct submit via extension bridge not implemented")
}

func (ExtensionBridgeStrategy) Name() string { return "extension-bridge" }

// ── Factory ──────────────────────────────────────────────────────────────────

// NewStrategy returns the appropriate SubmitStrategy based on the feature flag.
// When directEnabled is false (the default), ManualStrategy is returned.
// This is the single future flip point for enabling direct CF submission.
func NewStrategy(directEnabled bool) SubmitStrategy {
	if directEnabled {
		return ExtensionBridgeStrategy{}
	}
	return ManualStrategy{}
}
