.PHONY: build run dev clean test migrate

# Build the API server
build:
	go build -o bin/api.exe ./cmd/api/

# Run the API server
run: build
	./bin/api.exe

# Run in dev mode with auto-reload (requires air)
dev:
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Install air: go install github.com/air-verse/air@latest"; \
		go run ./cmd/api/; \
	fi

# Run tests
test:
	go test ./... -v -count=1

# Clean build artifacts
clean:
	rm -rf bin/

# Tidy dependencies
tidy:
	go mod tidy

# Docker: start infrastructure
infra-up:
	docker-compose up -d postgres redis

# Docker: start everything including judge0
all-up:
	docker-compose up -d

# Docker: stop everything
down:
	docker-compose down

# Run database migration
migrate:
	@echo "Run: psql -U codemortem -d codemortem -f migrations/001_initial.up.sql"
