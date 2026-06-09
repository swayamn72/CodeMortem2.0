package subscription

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"codemortem/internal/auth"
	"codemortem/internal/config"

	"github.com/gofiber/fiber/v2"
)

// Plans defines available subscription plans.
var Plans = map[string]struct {
	Name         string
	AmountPaise  int
	DurationMonths int
	Description  string
}{
	"monthly":   {Name: "Monthly", AmountPaise: 50000, DurationMonths: 1, Description: "₹500 per month"},
	"quarterly": {Name: "Quarterly", AmountPaise: 120000, DurationMonths: 3, Description: "₹1200 for 3 months (save ₹300)"},
}

// Handler handles subscription HTTP endpoints.
type Handler struct {
	repo    *Repository
	rzpCfg  *config.RazorpayConfig
	httpClient *http.Client
}

// NewHandler creates a new subscription handler.
func NewHandler(repo *Repository, rzpCfg *config.RazorpayConfig) *Handler {
	return &Handler{
		repo:   repo,
		rzpCfg: rzpCfg,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// RegisterRoutes registers subscription routes.
func (h *Handler) RegisterRoutes(r fiber.Router, authMw fiber.Handler) {
	sub := r.Group("/subscription")
	sub.Get("/plans", h.GetPlans)
	sub.Get("/status", authMw, h.GetStatus)
	sub.Post("/create-order", authMw, h.CreateOrder)
	sub.Post("/verify", authMw, h.VerifyPayment)
	sub.Post("/webhook", h.Webhook)
}

// GetPlans returns available subscription plans.
func (h *Handler) GetPlans(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"plans": []fiber.Map{
			{
				"id":             "monthly",
				"name":           "Monthly",
				"amountPaise":    50000,
				"amountDisplay":  "₹500",
				"duration":       "1 month",
				"perMonth":       "₹500/month",
				"savings":        nil,
				"bestValue":      false,
			},
			{
				"id":             "quarterly",
				"name":           "Quarterly",
				"amountPaise":    120000,
				"amountDisplay":  "₹1,200",
				"duration":       "3 months",
				"perMonth":       "₹400/month",
				"savings":        "Save ₹300",
				"bestValue":      true,
			},
		},
	})
}

// GetStatus returns the authenticated user's premium status.
func (h *Handler) GetStatus(c *fiber.Ctx) error {
	userID := auth.GetUserID(c)
	isActive, expiresAt, plan, err := h.repo.GetPremiumStatus(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get status"})
	}
	return c.JSON(fiber.Map{
		"isPremium":        isActive,
		"premiumExpiresAt": expiresAt,
		"premiumPlan":      plan,
	})
}

// razorpayOrderResponse is the Razorpay Create Order API response.
type razorpayOrderResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

// CreateOrder creates a Razorpay order for the given plan.
func (h *Handler) CreateOrder(c *fiber.Ctx) error {
	var req struct {
		Plan string `json:"plan"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	plan, ok := Plans[req.Plan]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid plan"})
	}

	// If Razorpay not configured, return mock order for development
	if h.rzpCfg.KeyID == "" {
		return c.JSON(fiber.Map{
			"orderId":     "order_mock_" + randomHex(8),
			"amount":      plan.AmountPaise,
			"currency":    "INR",
			"plan":        req.Plan,
			"keyId":       "rzp_test_placeholder",
		})
	}

	// Create Razorpay order
	payload := map[string]interface{}{
		"amount":   plan.AmountPaise,
		"currency": "INR",
		"notes":    map[string]string{"plan": req.Plan},
	}

	body, _ := json.Marshal(payload)
	httpReq, _ := http.NewRequest("POST", "https://api.razorpay.com/v1/orders", bytes.NewReader(body))
	httpReq.SetBasicAuth(h.rzpCfg.KeyID, h.rzpCfg.KeySecret)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(httpReq)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "payment gateway unavailable"})
	}
	defer resp.Body.Close()

	var rzpOrder razorpayOrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&rzpOrder); err != nil || rzpOrder.ID == "" {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "invalid payment gateway response"})
	}

	userID := auth.GetUserID(c)
	if _, err := h.repo.CreateOrder(c.Context(), userID, rzpOrder.ID, req.Plan, plan.AmountPaise); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create order record"})
	}

	return c.JSON(fiber.Map{
		"orderId":  rzpOrder.ID,
		"amount":   plan.AmountPaise,
		"currency": "INR",
		"plan":     req.Plan,
		"keyId":    h.rzpCfg.KeyID,
	})
}

// VerifyPayment verifies Razorpay payment signature and activates premium.
func (h *Handler) VerifyPayment(c *fiber.Ctx) error {
	var req struct {
		RazorpayOrderID   string `json:"razorpayOrderId"`
		RazorpayPaymentID string `json:"razorpayPaymentId"`
		RazorpaySignature string `json:"razorpaySignature"`
		Plan              string `json:"plan"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	plan, ok := Plans[req.Plan]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid plan"})
	}

	// Verify HMAC signature (skip in dev mode)
	if h.rzpCfg.KeySecret != "" {
		message := req.RazorpayOrderID + "|" + req.RazorpayPaymentID
		mac := hmac.New(sha256.New, []byte(h.rzpCfg.KeySecret))
		mac.Write([]byte(message))
		expectedSig := hex.EncodeToString(mac.Sum(nil))
		if !hmac.Equal([]byte(expectedSig), []byte(req.RazorpaySignature)) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "payment verification failed"})
		}
	}

	if err := h.repo.ActivatePremium(c.Context(), req.RazorpayOrderID, req.RazorpayPaymentID, req.Plan, plan.DurationMonths); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to activate premium"})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": fmt.Sprintf("Premium activated for %d month(s)!", plan.DurationMonths),
		"plan":    req.Plan,
	})
}

// Webhook handles Razorpay payment webhooks.
func (h *Handler) Webhook(c *fiber.Ctx) error {
	// Verify webhook signature
	if h.rzpCfg.WebhookSecret != "" {
		sig := c.Get("X-Razorpay-Signature")
		mac := hmac.New(sha256.New, []byte(h.rzpCfg.WebhookSecret))
		mac.Write(c.Body())
		expected := hex.EncodeToString(mac.Sum(nil))
		if !hmac.Equal([]byte(expected), []byte(sig)) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid signature"})
		}
	}

	var event struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					ID      string `json:"id"`
					OrderID string `json:"order_id"`
					Notes   struct {
						Plan string `json:"plan"`
					} `json:"notes"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}

	if err := json.Unmarshal(c.Body(), &event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}

	if event.Event == "payment.captured" {
		entity := event.Payload.Payment.Entity
		plan, ok := Plans[entity.Notes.Plan]
		if ok {
			_ = h.repo.ActivatePremium(c.Context(), entity.OrderID, entity.ID, entity.Notes.Plan, plan.DurationMonths)
		}
	}

	return c.SendStatus(fiber.StatusOK)
}

func randomHex(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}
