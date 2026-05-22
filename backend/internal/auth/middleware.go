package auth

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Middleware returns a Fiber middleware that validates JWT access tokens.
func Middleware(jwtMgr *JWTManager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var tokenStr string
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenStr = parts[1]
			}
		}

		if tokenStr == "" {
			// Fallback to query parameter for WebSockets
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization token",
			})
		}

		claims, err := jwtMgr.ValidateAccessToken(tokenStr)
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
