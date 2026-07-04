# CodeMortem 2.0

CodeMortem is the ultimate 1v1 competitive programming arena. Queue up, get matched, and race to solve algorithmic challenges. Features real-time duels, Glicko-2 rated matchmaking, and interactive learning modules.

## Architecture

- **Backend:** Go, Fiber, PostgreSQL, Redis
- **Frontend:** Next.js (App Router), React, Zustand
- **Code Execution:** Judge0 (Dockerized)
- **Real-time:** WebSockets for arena matchmaking and live matches

## Requirements

- Docker & Docker Compose
- Go 1.21+
- Node.js 18+

## Setup

1. Copy `.env` to `.env.local` for frontend, and `.env` for backend.
2. Spin up services:
   ```bash
   docker-compose up -d
   ```
3. Run migrations (requires golang-migrate):
   ```bash
   migrate -path backend/migrations -database "postgres://codemortem:codemortem_dev_2026@localhost:5432/codemortem?sslmode=disable" up
   ```
4. Start backend:
   ```bash
   cd backend
   go run cmd/api/main.go
   ```
5. Start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```