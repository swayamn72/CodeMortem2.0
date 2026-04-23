package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the application.
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Judge0   Judge0Config
	AI       AIConfig
	Match    MatchConfig
}

type ServerConfig struct {
	Port         string
	Host         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	Environment  string // "development", "production"
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxConns int
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type JWTConfig struct {
	AccessSecret  string
	RefreshSecret string
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
}

type Judge0Config struct {
	BaseURL       string
	CallbackURL   string
	CPUTimeLimit  float64
	WallTimeLimit float64
	MemoryLimit   int // KB
}

type AIConfig struct {
	Provider string // "openai" or "gemini"
	APIKey   string
	Model    string
}

type MatchConfig struct {
	Duration         time.Duration
	QuestionCount    int
	MatchmakeTimeout time.Duration
	RatingRange      int // initial ±range for matchmaking
	RatingExpand     int // expand range by this every interval
	ExpandInterval   time.Duration
	MaxRatingRange   int
}

// Load reads configuration from environment variables.
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			ReadTimeout:  getDurationEnv("SERVER_READ_TIMEOUT", 10*time.Second),
			WriteTimeout: getDurationEnv("SERVER_WRITE_TIMEOUT", 10*time.Second),
			Environment:  getEnv("ENVIRONMENT", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getIntEnv("DB_PORT", 5432),
			User:     getEnv("DB_USER", "codemortem"),
			Password: getEnv("DB_PASSWORD", "codemortem"),
			DBName:   getEnv("DB_NAME", "codemortem"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			MaxConns: getIntEnv("DB_MAX_CONNS", 25),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getIntEnv("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getIntEnv("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			AccessSecret:  getEnv("JWT_ACCESS_SECRET", "codemortem-access-secret-change-me"),
			RefreshSecret: getEnv("JWT_REFRESH_SECRET", "codemortem-refresh-secret-change-me"),
			AccessExpiry:  getDurationEnv("JWT_ACCESS_EXPIRY", 15*time.Minute),
			RefreshExpiry: getDurationEnv("JWT_REFRESH_EXPIRY", 7*24*time.Hour),
		},
		Judge0: Judge0Config{
			BaseURL:       getEnv("JUDGE0_URL", "http://localhost:2358"),
			CallbackURL:   getEnv("JUDGE0_CALLBACK_URL", ""),
			CPUTimeLimit:  2.0,
			WallTimeLimit: 5.0,
			MemoryLimit:   262144, // 256 MB
		},
		AI: AIConfig{
			Provider: getEnv("AI_PROVIDER", "openai"),
			APIKey:   getEnv("AI_API_KEY", ""),
			Model:    getEnv("AI_MODEL", "gpt-4o"),
		},
		Match: MatchConfig{
			Duration:         30 * time.Minute,
			QuestionCount:    7,
			MatchmakeTimeout: 3 * time.Minute,
			RatingRange:      200,
			RatingExpand:     50,
			ExpandInterval:   10 * time.Second,
			MaxRatingRange:   500,
		},
	}
}

// DSN returns the PostgreSQL connection string.
func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode,
	)
}

// Addr returns the Redis address.
func (c *RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// helpers
func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getIntEnv(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	if val := os.Getenv(key); val != "" {
		if d, err := time.ParseDuration(val); err == nil {
			return d
		}
	}
	return fallback
}
