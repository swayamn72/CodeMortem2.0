package matchmaking

import (
	"context"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"codemortem/internal/config"

	"github.com/redis/go-redis/v9"
)

// QueueEntry represents a player waiting in the matchmaking queue.
type QueueEntry struct {
	UserID    string    `json:"userId"`
	Username  string    `json:"username"`
	Rating    float64   `json:"rating"`
	JoinedAt  time.Time `json:"joinedAt"`
}

// MatchResult represents two matched players.
type MatchResult struct {
	Player1 *QueueEntry
	Player2 *QueueEntry
}

// Queue manages the matchmaking queue using Redis sorted sets.
type Queue struct {
	rdb         *redis.Client
	cfg         *config.MatchConfig
	subscribers map[string]chan *MatchResult // userID → channel
	mu          sync.RWMutex
	queueKey    string
	metaPrefix  string
}

// NewQueue creates a new matchmaking queue.
func NewQueue(rdb *redis.Client, cfg *config.MatchConfig) *Queue {
	return &Queue{
		rdb:         rdb,
		cfg:         cfg,
		subscribers: make(map[string]chan *MatchResult),
		queueKey:    "matchmaking:queue",
		metaPrefix:  "matchmaking:meta:",
	}
}

// Join adds a player to the matchmaking queue.
func (q *Queue) Join(ctx context.Context, entry *QueueEntry) error {
	// Add to sorted set (score = rating)
	err := q.rdb.ZAdd(ctx, q.queueKey, redis.Z{
		Score:  entry.Rating,
		Member: entry.UserID,
	}).Err()
	if err != nil {
		return fmt.Errorf("queue join zadd: %w", err)
	}

	// Store metadata
	err = q.rdb.HSet(ctx, q.metaPrefix+entry.UserID, map[string]interface{}{
		"username": entry.Username,
		"rating":   entry.Rating,
		"joinedAt": entry.JoinedAt.Unix(),
	}).Err()
	if err != nil {
		return fmt.Errorf("queue join meta: %w", err)
	}

	// Set expiry on metadata (auto-cleanup if something goes wrong)
	q.rdb.Expire(ctx, q.metaPrefix+entry.UserID, 5*time.Minute)

	return nil
}

// Leave removes a player from the matchmaking queue.
func (q *Queue) Leave(ctx context.Context, userID string) error {
	pipe := q.rdb.Pipeline()
	pipe.ZRem(ctx, q.queueKey, userID)
	pipe.Del(ctx, q.metaPrefix+userID)
	_, err := pipe.Exec(ctx)
	return err
}

// Subscribe registers a channel to receive match notifications for a user.
func (q *Queue) Subscribe(userID string) chan *MatchResult {
	q.mu.Lock()
	defer q.mu.Unlock()

	ch := make(chan *MatchResult, 1)
	q.subscribers[userID] = ch
	return ch
}

// Unsubscribe removes a user's match notification channel.
func (q *Queue) Unsubscribe(userID string) {
	q.mu.Lock()
	defer q.mu.Unlock()

	if ch, ok := q.subscribers[userID]; ok {
		close(ch)
		delete(q.subscribers, userID)
	}
}

// notify sends a match result to both players.
func (q *Queue) notify(p1ID, p2ID string, result *MatchResult) {
	q.mu.RLock()
	defer q.mu.RUnlock()

	if ch, ok := q.subscribers[p1ID]; ok {
		select {
		case ch <- result:
		default:
		}
	}
	if ch, ok := q.subscribers[p2ID]; ok {
		select {
		case ch <- result:
		default:
		}
	}
}

// QueueSize returns the current number of players in queue.
func (q *Queue) QueueSize(ctx context.Context) (int64, error) {
	return q.rdb.ZCard(ctx, q.queueKey).Result()
}

// StartMatcher starts the background goroutine that continuously matches players.
func (q *Queue) StartMatcher(ctx context.Context) {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	log.Println("[matchmaker] started matching loop (every 500ms)")

	for {
		select {
		case <-ctx.Done():
			log.Println("[matchmaker] stopping...")
			return
		case <-ticker.C:
			q.tryMatch(ctx)
		}
	}
}

// tryMatch attempts to find and create matches from the queue.
func (q *Queue) tryMatch(ctx context.Context) {
	// Get all players in queue sorted by rating
	members, err := q.rdb.ZRangeWithScores(ctx, q.queueKey, 0, -1).Result()
	if err != nil || len(members) < 2 {
		return
	}

	matched := make(map[string]bool)

	for i := 0; i < len(members); i++ {
		p1ID := members[i].Member.(string)
		if matched[p1ID] {
			continue
		}

		p1Rating := members[i].Score
		p1JoinedAt := q.getJoinedAt(ctx, p1ID)
		waitDuration := time.Since(p1JoinedAt)

		// Calculate expanded range based on wait time
		expandSteps := int(waitDuration.Seconds()) / int(q.cfg.ExpandInterval.Seconds())
		maxRange := float64(q.cfg.RatingRange + expandSteps*q.cfg.RatingExpand)
		if maxRange > float64(q.cfg.MaxRatingRange) {
			maxRange = float64(q.cfg.MaxRatingRange)
		}

		// Find closest opponent within range
		bestMatch := -1
		bestDiff := math.MaxFloat64

		for j := 0; j < len(members); j++ {
			if i == j {
				continue
			}
			p2ID := members[j].Member.(string)
			if matched[p2ID] {
				continue
			}

			diff := math.Abs(p1Rating - members[j].Score)
			if diff <= maxRange && diff < bestDiff {
				bestDiff = diff
				bestMatch = j
			}
		}

		if bestMatch < 0 {
			continue
		}

		p2ID := members[bestMatch].Member.(string)
		p2Rating := members[bestMatch].Score

		// Match found!
		matched[p1ID] = true
		matched[p2ID] = true

		p1Meta := q.getMeta(ctx, p1ID)
		p2Meta := q.getMeta(ctx, p2ID)

		result := &MatchResult{
			Player1: &QueueEntry{
				UserID:   p1ID,
				Username: p1Meta["username"],
				Rating:   p1Rating,
			},
			Player2: &QueueEntry{
				UserID:   p2ID,
				Username: p2Meta["username"],
				Rating:   p2Rating,
			},
		}

		// Remove both from queue
		pipe := q.rdb.Pipeline()
		pipe.ZRem(ctx, q.queueKey, p1ID, p2ID)
		pipe.Del(ctx, q.metaPrefix+p1ID)
		pipe.Del(ctx, q.metaPrefix+p2ID)
		pipe.Exec(ctx)

		// Notify subscribers
		q.notify(p1ID, p2ID, result)

		log.Printf("[matchmaker] matched: %s (%.0f) vs %s (%.0f) | diff: %.0f",
			p1Meta["username"], p1Rating, p2Meta["username"], p2Rating, bestDiff)
	}
}

// getJoinedAt retrieves the join time for a player from Redis metadata.
func (q *Queue) getJoinedAt(ctx context.Context, userID string) time.Time {
	val, err := q.rdb.HGet(ctx, q.metaPrefix+userID, "joinedAt").Int64()
	if err != nil {
		return time.Now()
	}
	return time.Unix(val, 0)
}

// getMeta retrieves metadata for a player from Redis.
func (q *Queue) getMeta(ctx context.Context, userID string) map[string]string {
	result, err := q.rdb.HGetAll(ctx, q.metaPrefix+userID).Result()
	if err != nil {
		return map[string]string{}
	}
	return result
}
