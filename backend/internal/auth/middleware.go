package auth

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Middleware returns a Fiber middleware that validates JWT access tokens.
func Middleware(jwtMgr *JWTManager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization format, expected: Bearer <token>",
			})
		}

		claims, err := jwtMgr.ValidateAccessToken(parts[1])
		if err != nil {
			if err == ErrTokenExpired {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "token expired",
					"code":  "TOKEN_EXPIRED",
				})
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token",
			})
		}

		// Store user info in context for downstream handlers
		c.Locals("userId", claims.UserID)
		c.Locals("username", claims.Username)

		return c.Next()
	}
}

// GetUserID extracts the authenticated user ID from the Fiber context.
func GetUserID(c *fiber.Ctx) string {
	if id, ok := c.Locals("userId").(string); ok {
		return id
	}
	return ""
}

// GetUsername extracts the authenticated username from the Fiber context.
func GetUsername(c *fiber.Ctx) string {
	if u, ok := c.Locals("username").(string); ok {
		return u
	}
	return ""
}
