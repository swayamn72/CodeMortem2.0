# CF Direct-Submit — Feasibility & Architecture Document

## Problem

Users currently submit code on `codeforces.com` manually from the arena, and the CodeMortem backend CF poller (`internal/game/session.go → startCFVerificationPoller`) auto-detects an Accepted verdict by polling the CF API. Can we skip the manual step and submit directly from CodeMortem?

---

## Finding: Codeforces Has No Official Submit API

All Codeforces `api/*` endpoints are **read-only** (standings, submissions, user info, problem list). There is no official endpoint for:
- Creating a new submission
- Uploading source code on behalf of a user

Any direct HTTP POST to the CF submit form from a CodeMortem server would require:
1. The user's CF session cookies (impossible to obtain safely)
2. A CSRF token tied to that session (changes per request)

Storing CF credentials on CodeMortem is an explicit **non-goal** — it would be a serious security liability.

---

## The cph-submit Model (Companion Browser Extension)

The Competitive Programming Helper (`cph-submit`) project demonstrates the only viable approach: a **companion browser extension** that:

1. Runs with `host_permissions` for `codeforces.com/*`
2. Uses the user's **own already-logged-in CF session** in the browser — no passwords or cookies ever leave the user's browser
3. Can programmatically POST to `codeforces.com/contest/<id>/submit` with the correct CSRF token, because it operates inside the user's browser session

### Why a plain web page can't do it

The CodeMortem arena runs on a different origin (`codemortem.dev`). The browser enforces:
- **Same-origin policy**: a page can't read another origin's cookies
- **CORS**: `codeforces.com` does not include `Access-Control-Allow-Origin: codemortem.dev`
- **CSP**: even with a proxy, this would require storing the user's CF credentials server-side

**Only a browser extension with `host_permissions` for `codeforces.com` can bridge this gap**, because extensions run in the user's browser context, not on a remote server.

---

## Planned Architecture

### Current flow (ManualStrategy)
```
User clicks "Submit on CF"
  → arena opens CF problem URL in new tab
  → user manually submits their code
  → CF poller detects AC (within ~10s)
  → cf_solved event sent to both players
```

### Future flow (ExtensionBridgeStrategy, when flag enabled)
```
User clicks "Submit on CF"
  → arena sends postMessage to companion extension:
      { type: "cm-cf-submit", contestId, index, language, code }
  → extension POSTs to codeforces.com/contest/<id>/submit
      (using user's own browser session + CSRF token)
  → extension sends ack back to arena:
      { type: "cm-cf-submit-ack", status: "submitted", submissionId }
  → CF poller detects AC (same as today)
  → cf_solved event sent to both players
```

### Backend seam

`internal/cfsubmit/strategy.go` defines the `SubmitStrategy` interface:

```go
type SubmitStrategy interface {
    Submit(req SubmitRequest) (SubmitOutcome, error)
    Name() string
}
```

- **`ManualStrategy`** — current default, instructs the user to submit on CF manually
- **`ExtensionBridgeStrategy`** — placeholder, returns `errors.New("not implemented")`
- **`NewStrategy(directEnabled bool)`** — factory; flip point when extension is ready

The feature flag is `CF_DIRECT_SUBMIT_ENABLED` (env var, default `false`), wired into `config.FeatureConfig.CFDirectSubmit`.

> **The seam is intentionally not wired into any handler today.** The backend has no server-side submit path. When the companion extension is built, a developer adds the `window.postMessage` listener in the frontend arena and flips the flag — no other backend code changes are needed.

---

## Explicit Non-Goals / Safety

| Non-goal | Reason |
|----------|--------|
| Store CF passwords | Never — major security liability |
| Store CF session cookies server-side | Never — GDPR + security risk |
| Proxy submit via CodeMortem backend | Requires user credentials; blocked by CORS anyway |
| OAuth with Codeforces | CF does not offer OAuth for submission |
| Screen-scraping CF | Brittle, ToS violation |

---

## Status

- `CF_DIRECT_SUBMIT_ENABLED=false` (default) — ships with `ManualStrategy`, identical to current behaviour
- `internal/cfsubmit` package is compile-checked and tested but **not wired into any handler**
- To enable: build the companion extension → implement the `postMessage` bridge in the frontend → flip the env var
