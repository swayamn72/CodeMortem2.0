package user

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"codemortem/internal/auth"
	"codemortem/internal/models"

	"github.com/gofiber/fiber/v2"
)

// Handler handles user-related HTTP endpoints.
type Handler struct {
	repo *Repository
}

// NewHandler creates a new user handler.
func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// RegisterRoutes registers user routes on the given Fiber router group.
func (h *Handler) RegisterRoutes(r fiber.Router, authMw fiber.Handler) {
	users := r.Group("/users")
	users.Get("/me", authMw, h.GetMe)
	users.Get("/profile/:username", h.GetProfile)
	users.Get("/:username/history", h.GetPublicRatingHistory)
	users.Get("/leaderboard", h.GetLeaderboard)
	users.Get("/search", h.SearchUsers)
	users.Get("/me/history", authMw, h.GetMatchHistory)
	users.Get("/me/rating-history", authMw, h.GetRatingHistory)
	users.Get("/me/progress", authMw, h.GetProgress)
	users.Post("/me/progress", authMw, h.SaveProgress)
	users.Post("/me/cf-link", authMw, h.StartCFLink)
	users.Post("/me/cf-verify", authMw, h.VerifyCFLink)
	users.Get("/:username/practice-sessions", h.GetPracticeSessions)
	users.Post("/practice-sessions/:id/end", authMw, h.EndPracticeSession)
}

// GetMe returns the authenticated user's full profile.
func (h *Handler) GetMe(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	user, err := h.repo.GetByID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}
	return c.JSON(user.ToPublic())
}

// GetProfile returns a public user profile by username.
func (h *Handler) GetProfile(c *fiber.Ctx) error {
	username := c.Params("username")
	user, err := h.repo.GetByUsername(c.Context(), username)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}
	return c.JSON(user.ToPublic())
}

// GetLeaderboard returns the top users by rating.
func (h *Handler) GetLeaderboard(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 50)
	offset := c.QueryInt("offset", 0)
	if limit > 100 {
		limit = 100
	}

	users, err := h.repo.GetLeaderboard(c.Context(), limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch leaderboard"})
	}

	// Convert to public profiles
	profiles := make([]*models.UserPublic, len(users))
	for i, u := range users {
		profiles[i] = u.ToPublic()
	}

	return c.JSON(fiber.Map{
		"users":  profiles,
		"limit":  limit,
		"offset": offset,
	})
}

// SearchUsers searches users by username prefix.
func (h *Handler) SearchUsers(c *fiber.Ctx) error {
	query := c.Query("q")
	if len(query) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "query must be at least 2 characters"})
	}

	users, err := h.repo.SearchUsers(c.Context(), query, 20)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "search failed"})
	}

	profiles := make([]*models.UserPublic, len(users))
	for i, u := range users {
		profiles[i] = u.ToPublic()
	}

	return c.JSON(profiles)
}

// GetMatchHistory returns the authenticated user's match history.
func (h *Handler) GetMatchHistory(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	if limit > 50 {
		limit = 50
	}

	matches, err := h.repo.GetMatchHistory(c.Context(), userID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch history"})
	}

	return c.JSON(fiber.Map{
		"matches": matches,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetRatingHistory returns the authenticated user's rating history.
func (h *Handler) GetRatingHistory(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	limit := c.QueryInt("limit", 50)
	if limit > 100 {
		limit = 100
	}

	history, err := h.repo.GetRatingHistory(c.Context(), userID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch rating history"})
	}

	return c.JSON(fiber.Map{"history": history})
}

// GetProgress returns the authenticated user's module progress.
func (h *Handler) GetProgress(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	progress, err := h.repo.GetUserProgress(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch progress"})
	}

	// Format into a map for easier frontend consumption: { moduleId: ["lesson1", "lesson2"] }
	progressMap := make(map[string][]string)
	for _, p := range progress {
		progressMap[p.ModuleID] = p.CompletedLessons
	}

	return c.JSON(progressMap)
}

// SaveProgress updates the authenticated user's progress for a specific module.
func (h *Handler) SaveProgress(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	var body struct {
		ModuleID         string   `json:"moduleId"`
		CompletedLessons []string `json:"completedLessons"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if body.ModuleID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "moduleId is required"})
	}

	if body.CompletedLessons == nil {
		body.CompletedLessons = []string{}
	}

	err := h.repo.SaveUserProgress(c.Context(), userID, body.ModuleID, body.CompletedLessons)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save progress"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// GetPracticeSessions returns the practice sessions of a user by username.
func (h *Handler) GetPracticeSessions(c *fiber.Ctx) error {
	username := c.Params("username")
	user, err := h.repo.GetByUsername(c.Context(), username)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	limit := c.QueryInt("limit", 20)
	if limit > 50 {
		limit = 50
	}

	sessions, err := h.repo.GetPracticeSessions(c.Context(), user.ID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch practice sessions"})
	}

	return c.JSON(fiber.Map{"sessions": sessions})
}

// EndPracticeSession ends an ongoing practice session.
func (h *Handler) EndPracticeSession(c *fiber.Ctx) error {
	sessionID := c.Params("id")
	if sessionID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "session ID required"})
	}

	var body struct {
		ProblemsSolved int `json:"problemsSolved"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	err := h.repo.EndPracticeSession(c.Context(), sessionID, body.ProblemsSolved)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to end session"})
	}

	return c.JSON(fiber.Map{"success": true})
}

// GetPublicRatingHistory returns a user's rating history by username (public).
func (h *Handler) GetPublicRatingHistory(c *fiber.Ctx) error {
	username := c.Params("username")
	limit := c.QueryInt("limit", 50)
	if limit > 100 {
		limit = 100
	}

	user, err := h.repo.GetByUsername(c.Context(), username)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	history, err := h.repo.GetRatingHistory(c.Context(), user.ID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch rating history"})
	}

	return c.JSON(fiber.Map{"history": history})
}

// StartCFLink initiates the Codeforces account linking process.
func (h *Handler) StartCFLink(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)

	var body struct {
		CFHandle string `json:"cfHandle"`
	}
	if err := c.BodyParser(&body); err != nil || body.CFHandle == "" {
		return c.Status(400).JSON(fiber.Map{"error": "cfHandle is required"})
	}

	// Generate random verify token
	tokenBytes := make([]byte, 16)
	rand.Read(tokenBytes)
	token := "CM_VERIFY_" + hex.EncodeToString(tokenBytes)[:12]

	err := h.repo.UpdateCFLink(c.Context(), userID, body.CFHandle, token)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to start linking"})
	}

	return c.JSON(fiber.Map{
		"verifyToken": token,
		"cfHandle":    body.CFHandle,
		"message":     "Add this token to your CF profile bio, then call /cf-verify",
	})
}

// VerifyCFLink verifies the CF account ownership by checking the public API.
func (h *Handler) VerifyCFLink(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)

	var body struct {
		CFHandle string `json:"cfHandle"`
	}
	if err := c.BodyParser(&body); err != nil || body.CFHandle == "" {
		return c.Status(400).JSON(fiber.Map{"error": "cfHandle is required"})
	}

	// Get the stored verify token
	user, err := h.repo.GetByID(c.Context(), userID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	if user.CFVerifyToken == nil || *user.CFVerifyToken == "" {
		return c.Status(400).JSON(fiber.Map{"error": "no pending verification — call /cf-link first"})
	}

	// Fetch CF user info from public API and check for token
	cfInfo, err := fetchCFUserInfo(body.CFHandle)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("could not reach Codeforces: %v", err)})
	}

	// Check the token appears in the First Name field
	expectedToken := *user.CFVerifyToken
	if cfInfo.FirstName != expectedToken {
		return c.Status(400).JSON(fiber.Map{
			"error": fmt.Sprintf(
				"Token not found in CF profile. Expected '%s' in the First Name field of https://codeforces.com/settings/social — found: '%s'",
				expectedToken, cfInfo.FirstName,
			),
		})
	}

	// Calibrate CM rating based on CF rating (linear mapping with floor)
	cmRating := float64(cfInfo.Rating)
	if cmRating < 800 {
		cmRating = 800
	}

	err = h.repo.VerifyCF(c.Context(), userID, cfInfo.Rating, cmRating)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to verify"})
	}

	return c.JSON(fiber.Map{
		"verified": true,
		"cfRating": cfInfo.Rating,
		"cmRating": cmRating,
		"message":  "Codeforces account verified and rating calibrated!",
	})
}

// cfUserInfo holds the relevant fields from CF API for a user.
type cfUserInfo struct {
	Rating    int
	FirstName string
}

// fetchCFUserInfo fetches a user's current info from the Codeforces API.
func fetchCFUserInfo(handle string) (*cfUserInfo, error) {
	resp, err := http.Get(fmt.Sprintf("https://codeforces.com/api/user.info?handles=%s", handle))
	if err != nil {
		return nil, fmt.Errorf("cf api request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read cf response: %w", err)
	}

	var result struct {
		Status string `json:"status"`
		Result []struct {
			Handle    string `json:"handle"`
			Rating    int    `json:"rating"`
			FirstName string `json:"firstName"`
		} `json:"result"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse cf response: %w", err)
	}

	if result.Status != "OK" || len(result.Result) == 0 {
		return nil, fmt.Errorf("codeforces handle not found: %s", handle)
	}

	return &cfUserInfo{
		Rating:    result.Result[0].Rating,
		FirstName: result.Result[0].FirstName,
	}, nil
}
