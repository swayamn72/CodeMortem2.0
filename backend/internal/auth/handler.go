package auth

import (
	"github.com/gofiber/fiber/v2"
)

// Handler handles auth-related HTTP endpoints.
type Handler struct {
	svc *Service
}

// NewHandler creates a new auth handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes registers auth routes on the given Fiber router group.
func (h *Handler) RegisterRoutes(r fiber.Router) {
	auth := r.Group("/auth")
	auth.Post("/send-otp", h.SendOTP)
	auth.Post("/register", h.Register)
	auth.Post("/login", h.Login)
	auth.Post("/refresh", h.Refresh)
	auth.Post("/google", h.GoogleLogin)
}

// RegisterRoutesWithGroup registers auth routes on the given Fiber router group.
func (h *Handler) RegisterRoutesWithGroup(auth fiber.Router) {
	auth.Post("/send-otp", h.SendOTP)
	auth.Post("/register", h.Register)
	auth.Post("/login", h.Login)
	auth.Post("/refresh", h.Refresh)
	auth.Post("/google", h.GoogleLogin)
}

// SendOTP handles POST /api/auth/send-otp
func (h *Handler) SendOTP(c *fiber.Ctx) error {
	var req SendOTPRequest
	if err := c.BodyParser(&req); err != nil || req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "email is required",
		})
	}

	if err := h.svc.SendOTP(c.Context(), &req); err != nil {
		switch err {
		case ErrOTPCooldown:
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "please wait 60 seconds before requesting a new code",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to send verification code",
			})
		}
	}

	return c.JSON(fiber.Map{"message": "verification code sent"})
}

// Register handles POST /api/auth/register
func (h *Handler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Basic validation
	if len(req.Username) < 3 || len(req.Username) > 30 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "username must be 3-30 characters",
		})
	}
	if len(req.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "password must be at least 8 characters",
		})
	}
	if len(req.OTP) != 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "verification code must be 6 digits",
		})
	}

	resp, err := h.svc.Register(c.Context(), &req)
	if err != nil {
		switch err {
		case ErrInvalidOTP:
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid or expired verification code"})
		case ErrEmailTaken:
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "email already registered"})
		case ErrUsernameTaken:
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "username already taken"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}

// Login handles POST /api/auth/login
func (h *Handler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	resp, err := h.svc.Login(c.Context(), &req)
	if err != nil {
		if err == ErrInvalidCredentials {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid email or password"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return c.JSON(resp)
}

// Refresh handles POST /api/auth/refresh
func (h *Handler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.BodyParser(&body); err != nil || body.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "refresh token required",
		})
	}

	tokens, err := h.svc.RefreshTokens(c.Context(), body.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid refresh token"})
	}

	return c.JSON(tokens)
}

// GoogleLogin handles POST /api/auth/google
func (h *Handler) GoogleLogin(c *fiber.Ctx) error {
	var req GoogleAuthRequest
	if err := c.BodyParser(&req); err != nil || req.IDToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "idToken is required",
		})
	}

	resp, err := h.svc.GoogleLogin(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(resp)
}
