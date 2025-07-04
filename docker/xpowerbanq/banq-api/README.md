# XPowerBanq API

A minimal, secure, and efficient Go-based API server providing read-only access
to XPowerBanq utilization rates and price quotes stored in SQLite databases.

## Overview

This lightweight service provides HTTP endpoints for querying:

- **Utilization rates** - Daily average utilization from Rate Index databases
- **Price quotes** - Daily OHLC (Open-High-Low-Close) data from Rate Tracker
  databases

**Key Features:**

- Minimal memory footprint (~5-10MB at idle)
- Chi router for fast HTTP routing with radix tree optimization
- Hardcoded SQL queries prevent injection attacks
- Read-only database access
- Input validation on all parameters
- CORS support via Chi CORS middleware
- Comprehensive test coverage (52.2%)

## Quick Start

### Using Docker (Recommended)

See [Docker.md](./Docker.md) for detailed Docker deployment instructions.

```sh
# Build the Docker image
./docker/xpowerbanq/banq-api/build.sh

# Run the container
docker run -d --name banq-api \
  --cpus=0.5 --memory=500m --memory-swap=500m \
  -v /var/lib/banq:/var/lib/banq:ro \
  -v /srv/db:/srv/db:ro \
  -p 8001:8001 \
  xpowerbanq/banq-api

# Test the API
curl http://localhost:8001/health
```

### Building from Source

From the banq-api directory:

```sh
go build -o banq-api ./source/
```

## Configuration

The API can be configured via command-line arguments. All arguments are optional
and have sensible defaults.

### Command-Line Arguments

| Short | Long             | Default   | Description                                |
| ----- | ---------------- | --------- | ------------------------------------------ |
| `-h`  | `--help`         | -         | Show help message and exit                 |
| `-R`  | `--max-rows`     | `90`      | Maximum number of rows to return per query |
| `-P`  | `--db-path`      | `/srv/db` | Path to the database directory             |
| `-p`  | `--port`         | `8001`    | HTTP server listen port                    |
| `-O`  | `--cors-origins` | See below | CORS allowed origins as JSON array         |

**Default CORS Origins:**

```json
[
  "https://www.xpowermine.com",
  "https://www.xpowerbanq.com",
  "http://localhost:5173"
]
```

### Usage Examples

```sh
# Use default settings
./banq-api

# Custom port
./banq-api -p 9000
./banq-api --port 9000

# Custom database path
./banq-api -P /var/lib/banq/db
./banq-api --db-path /var/lib/banq/db

# Custom max rows
./banq-api -R 50
./banq-api --max-rows 50

# Custom CORS origins
./banq-api -O '["https://example.com","http://localhost:3000"]'
./banq-api --cors-origins '["https://api.example.com"]'

# Combined options
./banq-api -p 9000 -P /data/db -R 100 -O '["https://api.example.com"]'

# Show help
./banq-api -h
./banq-api --help
```

## Development

### Project Structure

```
banq-api/
├── source/              # Source code and tests
│   ├── args.go         # Command-line argument parsing
│   ├── config.go       # Configuration defaults and SQL queries
│   ├── database.go     # Database operations
│   ├── handlers.go     # HTTP endpoint handlers and Chi routing
│   ├── main.go         # Application entry point with Chi router
│   ├── parameters.go   # Request parameter parsing
│   ├── scanners.go     # Result scanners for database queries
│   ├── types.go        # Type definitions
│   └── *_test.go       # Test files
├── Makefile            # Build automation
├── Dockerfile          # Container image definition
└── Docker.md           # Docker deployment guide
```

**Dependencies:**

- `github.com/go-chi/chi/v5` - Lightweight HTTP router with radix tree
- `github.com/go-chi/cors` - CORS middleware for Chi
- `github.com/mattn/go-sqlite3` - SQLite database driver

### Running Tests

```sh
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run tests with verbose output
make test-verbose

# Run specific test
make test-run TEST=SQLInjection

# Generate HTML coverage report
make coverage
```

Or run tests directly:

```sh
cd source && go test -v
```

### Test Suite

The test suite includes comprehensive test coverage across multiple files:

- **args_test.go** - Command-line argument parsing tests
- **config_test.go** - Route configuration tests
- **database_test.go** - Database operations and connection tests
- **handlers_test.go** - HTTP endpoint handler and routing tests
- **main_test.go** - Test setup and configuration (TestMain)
- **parameters_test.go** - Parameter parsing and validation tests
- **scanners_test.go** - Database row scanner tests
- **security_test.go** - Security vulnerability prevention tests (SQL injection,
  path traversal, XSS, CORS, etc.)

## API Endpoints

### GET /health

Health check endpoint. Returns `{"status": "ok"}`.

### GET /{dbName}/daily_average

Returns daily average utilization rates from Rate Index databases.

**Parameters:**

- `dbName` - Database name (e.g., `ri_apow_supply_0`)
- `lhs` - Start date (YYYY-MM-DD)
- `rhs` - End date (YYYY-MM-DD)

### GET /{dbName}/daily_ohlc

Returns daily OHLC price quotes from Rate Tracker databases.

**Parameters:**

- `dbName` - Database name (e.g., `rt_apow_xpow_0`)
- `lhs` - Start date (YYYY-MM-DD)
- `rhs` - End date (YYYY-MM-DD)

See [Docker.md](./Docker.md) for complete API documentation and examples.

## Security

- **SQL Injection Prevention** - Hardcoded queries with parameterized values
  only
- **Path Traversal Prevention** - Database name validation and prefix
  enforcement
- **XSS Prevention** - Proper content-type headers
- **Read-Only Access** - Databases opened in read-only and immutable mode
- **Input Validation** - Date format validation using regex
- **Row Limits** - Configurable maximum rows (default: 90) to prevent resource
  exhaustion
- **CORS Security** - Chi CORS middleware with strict origin validation
- **Non-Root Execution** - Runs as user `banq` (UID 1000) in containers

All security features are validated by comprehensive tests in
`source/security_test.go`.

## License

Apache-2.0 - See project repository for details.
