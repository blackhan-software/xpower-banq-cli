# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache gcc musl-dev sqlite-dev

# Set working directory
WORKDIR /build

# Copy go mod files
COPY docker/xpowerbanq/banq-api/go.mod docker/xpowerbanq/banq-api/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY docker/xpowerbanq/banq-api/source/*.go ./

# Build static binary
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o banq-api .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies (minimal)
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 banq && \
    adduser -D -u 1000 -G banq banq

# Create directories
RUN mkdir -p /srv/db && \
    chown -R banq:banq /srv/db

# Copy binary from build stage
COPY --from=builder /build/banq-api /usr/local/bin/banq-api

# Switch to non-root user
USER banq

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8001/health || exit 1

# Run the service
CMD ["/usr/local/bin/banq-api"]
