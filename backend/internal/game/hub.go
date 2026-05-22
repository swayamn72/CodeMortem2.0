package game

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
)

// ClientMessage represents a message from the client.
type ClientMessage struct {
	Type          string `json:"type"`
	MatchID       string `json:"matchId,omitempty"`
	QuestionIndex int    `json:"questionIndex,omitempty"`
	Language      string `json:"language,omitempty"`
	Code          string `json:"code,omitempty"`
	CustomInput   string `json:"customInput,omitempty"`
	HintLevel     int    `json:"hintLevel,omitempty"`     // 1-3 for hint requests
}

// ServerMessage represents a message to the client.
type ServerMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data,omitempty"`
}

// Client represents a connected WebSocket client.
type Client struct {
	ID       string
	Username string
	Conn     *websocket.Conn
	Hub      *Hub
	Send     chan []byte
	MatchID  string
	mu       sync.Mutex
}

// Hub manages all active WebSocket connections and match rooms.
type Hub struct {
	// Registered clients by user ID
	clients map[string]*Client

	// Match rooms (matchID → set of client IDs)
	rooms map[string]map[string]bool

	// Channels for registration/unregistration
	register   chan *Client
	unregister chan *Client
	broadcast  chan *RoomMessage

	mu sync.RWMutex
}

// RoomMessage is a message targeted to a specific match room.
type RoomMessage struct {
	MatchID string
	UserID  string // sender (empty = broadcast to all in room)
	Data    []byte
}

// NewHub creates a new WebSocket hub.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		rooms:      make(map[string]map[string]bool),
		register:   make(chan *Client, 256),
		unregister: make(chan *Client, 256),
		broadcast:  make(chan *RoomMessage, 256),
	}
}

// Run starts the hub's main event loop.
func (h *Hub) Run() {
	log.Println("[ws-hub] started")
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			log.Printf("[ws-hub] client registered: %s (%s)", client.Username, client.ID)
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)

				// Remove from match room
				if client.MatchID != "" {
					if room, ok := h.rooms[client.MatchID]; ok {
						delete(room, client.ID)
						if len(room) == 0 {
							delete(h.rooms, client.MatchID)
						}
					}
				}
				log.Printf("[ws-hub] client unregistered: %s (%s)", client.Username, client.ID)
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			if room, ok := h.rooms[msg.MatchID]; ok {
				for clientID := range room {
					if msg.UserID != "" && clientID == msg.UserID {
						continue // skip sender if specified for opponent-only messages
					}
					if client, ok := h.clients[clientID]; ok {
						select {
						case client.Send <- msg.Data:
						default:
							// Client send buffer full, skip
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// JoinRoom adds a client to a match room.
func (h *Hub) JoinRoom(matchID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	client.MatchID = matchID

	if _, ok := h.rooms[matchID]; !ok {
		h.rooms[matchID] = make(map[string]bool)
	}
	h.rooms[matchID][client.ID] = true

	log.Printf("[ws-hub] %s joined room %s", client.Username, matchID)
}

// BroadcastToRoom sends a message to all clients in a match room.
func (h *Hub) BroadcastToRoom(matchID string, msg *ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.broadcast <- &RoomMessage{
		MatchID: matchID,
		Data:    data,
	}
}

// SendToUser sends a message to a specific user.
func (h *Hub) SendToUser(userID string, msg *ServerMessage) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()

	if !ok {
		return
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	select {
	case client.Send <- data:
	default:
	}
}

// SendToOpponent sends a message to the opponent in a match room.
func (h *Hub) SendToOpponent(matchID, senderID string, msg *ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.broadcast <- &RoomMessage{
		MatchID: matchID,
		UserID:  senderID, // will be skipped (sends to everyone else)
		Data:    data,
	}
}

// Register sends a client to the hub for registration.
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// GetClient returns a client by user ID.
func (h *Hub) GetClient(userID string) (*Client, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	c, ok := h.clients[userID]
	return c, ok
}

// WritePump pumps messages from the hub to the WebSocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ReadPump pumps messages from the WebSocket connection to the hub.
func (c *Client) ReadPump(handler func(*Client, *ClientMessage)) {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(65536) // 64KB max message
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var msg ClientMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		handler(c, &msg)
	}
}
