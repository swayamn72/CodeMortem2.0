# Development Dockerfile for CodeMortem Backend
FROM golang:1.26-alpine

WORKDIR /app

# Install git, g++ (for local C++ execution bypass), and python3
RUN apk add --no-cache git build-base python3

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Install air for hot-reloading (optional, but good for dev)
RUN go install github.com/air-verse/air@latest

# Expose the API port
EXPOSE 8080

# Command to run the application
# Using go run for simplicity in dev, or air if you want auto-reload
CMD ["go", "run", "./cmd/api/"]
