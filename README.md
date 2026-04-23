# CodeMortem

> *Code or be Coded.*

A real-time 1v1 competitive programming arena where players queue, get matched by Glicko-2 rating, and race to solve 7 AI-generated algorithmic problems in 30 minutes.

## Tech Stack

- **Backend**: Go (Fiber + gorilla/websocket + sqlx)
- **Frontend**: Next.js 15, TypeScript, Monaco Editor, Zustand
- **Database**: PostgreSQL 16, Redis 7
- **Code Execution**: Judge0 (self-hosted, Docker)
- **AI**: OpenAI GPT-4o / Google Gemini

## Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL & Redis (or use Docker)

### 1. Start Infrastructure
```bash
docker-compose up -d postgres redis
```

### 2. Run Database Migration
```bash
psql -U codemortem -d codemortem -f backend/migrations/001_initial.up.sql
```

### 3. Start Backend
```bash
cd backend
cp .env.example .env
go run ./cmd/api/
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open Browser
Navigate to `http://localhost:3000`

## Project Structure

```
CodeMortem2.0/
├── backend/                 # Go API server
│   ├── cmd/api/            # Main entry point
│   ├── internal/           # Internal packages
│   │   ├── auth/           # JWT + auth middleware
│   │   ├── config/         # Configuration
│   │   ├── database/       # PostgreSQL + Redis
│   │   ├── game/           # WebSocket hub + sessions
│   │   ├── judge/          # Judge0 client
│   │   ├── matchmaking/    # Rating-based queue
│   │   ├── models/         # Data models
│   │   ├── rating/         # Glicko-2 engine
│   │   └── user/           # User CRUD + handlers
│   └── migrations/         # SQL migrations
├── frontend/               # Next.js web app
│   ├── app/                # Pages (App Router)
│   ├── components/         # React components
│   ├── stores/             # Zustand state stores
│   └── lib/                # API client utilities
└── docker-compose.yml      # Dev infrastructure
```

## License

MIT
