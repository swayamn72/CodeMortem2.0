# Multi-stage Dockerfile for CodeMortem Backend
# Stage 1: Builder — compiles the Go binary (thrown away after build)
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git build-base

WORKDIR /app

# Cache dependency layer separately
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build a static binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /codemortem ./cmd/api/

# Stage 2: Runtime — tiny image, no compiler, no dev tools
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy only the compiled binary
COPY --from=builder /codemortem .

EXPOSE 8080

CMD ["/app/codemortem"]
